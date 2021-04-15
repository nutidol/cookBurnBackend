const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");

module.exports.genMenu = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const genFor = data.genFor;
  const genBy = data.genBy;
  const servingSize = data.servingSize;
  let genMenuData = [];
  let ingredientData = [];
  let missingIngredient = [];
  let lackingIngredient = [];
  let missedIngredients = [];
  let usedIngredients = [];

  let ingredientNameList = "";
  let menuID_str = "";
  let menuTitle = "";
  let unit = "";
  let userUnit = "";
  let ingredientName = "";
  let url = "";

  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;
  let total_fiber = 0;
  let menuID = 0;
  let missedCount = 0;
  let usedCount = 0;
  let duration = 0;
  let convertedAmount = 0;
  let userAmount = 0;
  let convertedUnitAmount = 0;
  let menuServing = 0;
  let ingredientID = 0;
  let amount = 0;
  let actualUsedCount = 0;
  let ingredientScore = 0;
  let cuisineScore = 0;
  let tasteScore = 0;
  let hasThai = 0;
  let total_thai = 0;
  let total_notthai = 0;
  let sumfat = 0;
  let sumspicy = 0;
  let sumsalty = 0;
  let sumbitter = 0;
  let sumsavory = 0;
  let sumsweet = 0;
  let sumsour = 0;
  let menuEnergy = 0;
  let menuFat = 0;
  let menuCarb = 0;
  let menuSugar = 0;
  let menuProtein = 0;
  let menuSodium = 0;
  let menuFiber = 0;

  //looping through number of genfor --> to calculate
  for (let i = 0; i < genFor.length; i++) {
    const name = genFor[i].profile;
    const profileInfo = await getProfileInfo(userID, name);
    total_energy += parseInt(profileInfo.energy);
    total_fat += parseInt(profileInfo.fat);
    total_carb += parseInt(profileInfo.carb);
    total_sugar += parseInt(profileInfo.sugar);
    total_protein += parseInt(profileInfo.protein);
    total_sodium += parseInt(profileInfo.sodium);
    total_fiber += parseInt(profileInfo.fiber);

    const cuisineInfo = await getUserCuisine(userID, name);
    total_thai += cuisineInfo.thai;
    total_notthai += cuisineInfo.notthai;

    const tasteInfo = await getUserTaste(userID, name);
    sumfat += tasteInfo.fattiness;
    sumspicy += tasteInfo.spiciness;
    sumsalty += tasteInfo.saltiness;
    sumbitter += tasteInfo.bitterness;
    sumsavory += tasteInfo.savoriness;
    sumsweet += tasteInfo.sweetness;
    sumsour += tasteInfo.sourness;
  }
  const thaiAvg = total_thai / genFor.length;
  const notThaiAvg = total_notthai / genFor.length;

  const fattinessAvg = sumfat / genFor.length;
  const spicinessAvg = sumspicy / genFor.length;
  const saltinessAvg = sumsalty / genFor.length;
  const bitternessAvg = sumbitter / genFor.length;
  const savorinessAvg = sumsavory / genFor.length;
  const sweetnessAvg = sumsweet / genFor.length;
  const sournessAvg = sumsour / genFor.length;

  const taste = {
    fattiness: fattinessAvg,
    spiciness: spicinessAvg,
    saltiness: saltinessAvg,
    bitterness: bitternessAvg,
    savoriness: savorinessAvg,
    sweetness: sweetnessAvg,
    sourness: sournessAvg,
  };
  const userTasteRank = await getRanked(taste);
  //user's gen data of ..(genby).. --> nutrition per meal
  const energyAvg = Math.round((total_energy / genFor.length / 3) * 100) / 100;
  const fatAvg = Math.round((total_fat / genFor.length / 3) * 100) / 100;
  const carbAvg = Math.round((total_carb / genFor.length / 3) * 100) / 100;
  const sugarAvg = Math.round((total_sugar / genFor.length / 3) * 100) / 100;
  const proteinAvg =
    Math.round((total_protein / genFor.length / 3) * 100) / 100;
  const sodiumAvg = Math.round((total_sodium / genFor.length / 3) * 100) / 100;
  const fiberAvg = Math.round((total_fiber / genFor.length / 3) * 100) / 100;

  const userIngredient = await getUserIngredient(userID);

  for (let i = 0; i < userIngredient.length; i++) {
    ingredientNameList += userIngredient[i].name + ",";
  }
  const possibleMenus = await getPossibleMenu(ingredientNameList);

  for (let i = 0; i < possibleMenus.length; i++) {
    menuID_str += possibleMenus[i].id + ",";
  }
  const menuInfo = await getMenuInfo(menuID_str);

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(menuInfo),
  };
};

const getProfileInfo = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `daily_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
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

const getPossibleMenu = async (userIngredient) => {
  let ingredientList = userIngredient.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=4631dc8e84774bf39edd76df5679ba38&ingredients=${ingredientList}&ignorePantry=true&ranking=1`;

  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};

const getMenuInfo = async (menuIDs) => {
  let menuIDList = menuIDs.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/informationBulk?apiKey=4631dc8e84774bf39edd76df5679ba38&ids=${menuIDList}&includeNutrition=true`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};

const convertAmount = async (
  ingredientName,
  convertedAmount,
  unit,
  userUnit
) => {
  let amount = convertedAmount;
  let roundAmount = 0;
  let search_url = `https://api.spoonacular.com/recipes/convert?apiKey=4631dc8e84774bf39edd76df5679ba38&ingredientName=${ingredientName}&sourceAmount=${convertedAmount}&sourceUnit=${unit}&targetUnit=${userUnit}`;
  try {
    let res = await fetch(search_url);
    let json = await res.json();
    amount = json.targetAmount;
    roundAmount = Math.round(amount * 100) / 100;
  } catch (err) {
    console.log(err);
  }
  return roundAmount;
};

const getUserCuisine = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `cuisine_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const getUserTaste = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `taste_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const getMenuTaste = async (menuID) => {
  let search_url = `https://api.spoonacular.com/recipes/${menuID}/tasteWidget.json?apiKey=4631dc8e84774bf39edd76df5679ba38`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
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








