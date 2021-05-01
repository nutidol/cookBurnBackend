const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");
const solver = require("../src/solver");

//4) get possible menus (missedIngredientCount = 0 && title.length < 40 && nutrition < user's daily/3)
//5) score each menus --> lacking(ingredient/serving size -- transform all ingredients object), ranking taste, cuisine
//6) generated menus
//6) GENBY --> find the optimized menu

module.exports.genMenuUpdate = async (event) => {
  //1) get things from post filter
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const genFor = data.genFor; // get an array of this of this
  const genBy = data.genBy; //get array of this
  const servingSize = data.servingSize;
  //2) GENFOR --> calculate limitation (upperbound, lowerbound of this search --> for each constraints: energy, fat, protein, ..., avgTaste, avgCuisine)
  const limit = await getLimit(userID, genFor);
  //3) get user's ingredients --> api search (right now lets do all if bug --> random and take only 5 ingredients?)
  //4) get possible menus (missedIngredientCount = 0 && title.length < 40 &&
  //4.5) nutrition < user's daily/3)

  const possibleMenus = await getPossibleMenu(userID);

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(possibleMenus),
  };
};

const getLimit = async (userID, genFor) => {
  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;
  let total_fiber = 0;
  let total_thai = 0;
  let total_notthai = 0;
  let sumfat = 0;
  let sumspicy = 0;
  let sumsalty = 0;
  let sumbitter = 0;
  let sumsavory = 0;
  let sumsweet = 0;
  let sumsour = 0;

  for (let i = 0; i < genFor.length; i++) {
    const name = genFor[i];
    const profileInfo = await getProfileInfo(userID, name, "daily");
    total_energy += parseInt(profileInfo.energy);
    total_fat += parseInt(profileInfo.fat);
    total_carb += parseInt(profileInfo.carb);
    total_sugar += parseInt(profileInfo.sugar);
    total_protein += parseInt(profileInfo.protein);
    total_sodium += parseInt(profileInfo.sodium);
    total_fiber += parseInt(profileInfo.fiber);
    const cuisineInfo = await getProfileInfo(userID, name, "cuisine");
    total_thai += cuisineInfo.thai;
    total_notthai += cuisineInfo.notthai;
    const tasteInfo = await getProfileInfo(userID, name, "taste");
    sumfat += tasteInfo.fattiness;
    sumspicy += tasteInfo.spiciness;
    sumsalty += tasteInfo.saltiness;
    sumbitter += tasteInfo.bitterness;
    sumsavory += tasteInfo.savoriness;
    sumsweet += tasteInfo.sweetness;
    sumsour += tasteInfo.sourness;
  }
  let dailyAvg = {
    energyAvg: Math.round((total_energy / genFor.length) * 100) / 100,
    fatAvg: Math.round((total_fat / genFor.length) * 100) / 100,
    carbAvg: Math.round((total_carb / genFor.length) * 100) / 100,
    sugarAvg: Math.round((total_sugar / genFor.length) * 100) / 100,
    proteinAvg: Math.round((total_protein / genFor.length) * 100) / 100,
    sodiumAvg: Math.round((total_sodium / genFor.length) * 100) / 100,
    fiberAvg: Math.round((total_fiber / genFor.length) * 100) / 100,
  };
  let cuisineAvg = {
    thaiAvg: total_thai / genFor.length,
    notThaiAvg: total_notthai / genFor.length,
  };
  let tasteAvg = {
    fattiness: sumfat / genFor.length,
    spiciness: sumspicy / genFor.length,
    saltiness: sumsalty / genFor.length,
    bitterness: sumbitter / genFor.length,
    savoriness: sumsavory / genFor.length,
    sweetness: sumsweet / genFor.length,
    sourness: sumsour / genFor.length,
  };

  const userTasteRank = await getRanked(tasteAvg);

  let results = {
    daily: dailyAvg,
    cuisine: cuisineAvg,
    taste: userTasteRank,
  };
  return results;
};

const getProfileInfo = async (userID, profileName, topic) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `${topic}_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};
const getRanked = async (json) => {
  let entries = Object.entries(json);
  let sorted = entries.sort((a, b) => b[1] - a[1]);
  let first = sorted[0][0];
  let second = sorted[1][0];
  let third = sorted[2][0];
  let fourth = sorted[3][0];
  let fifth = sorted[4][0];
  let sixth = sorted[5][0];
  let seventh = sorted[6][0];
  let rank = {
    one: first,
    two: second,
    three: third,
    four: fourth,
    five: fifth,
    six: sixth,
    seven: seventh,
  };
  return rank;
};

const getUserIngredient = async (userID) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": "ingredient_",
    },
  };
  const result = await dynamodb.query(params).promise();
  return result.Items;
};

const getPossibleMenu = async (userID) => {
  const userIngredient = await getUserIngredient(userID);
  let ingredientNameList = "";

  if (userIngredient.length > 5) {
    for (let i = 0; i < 5; i++) {
      ingredientNameList += userIngredient[i].name + ",";
    }
  } else {
    for (let i = 0; i < userIngredient.length; i++) {
      ingredientNameList += userIngredient[i].name + ",";
    }
  }
  let ingredientList = ingredientNameList.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=7b9f2b35ba8f4fe697b93357fdc09314&ingredients=${ingredientList}&ignorePantry=true&ranking=2`;
  let res = await fetch(search_url);
  let json = await res.json();
  //4) get possible menus (missedIngredientCount = 0 && title.length < 40 && nutrition < user's daily/3)
  let possibleMenus = [];
  for (let i = 0; i < json.length; i++) {
    if (json[i].title.length < 41) {
      possibleMenus.push(json[i]);
    }
    // if (json[i].missedIngredientCount == 0 && json[i].title < 41) {
    //   possibleMenus.push(json[i]);
    // }
  }

  return possibleMenus;
};
