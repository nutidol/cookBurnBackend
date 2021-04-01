const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");

//post menuFilter

//steps
////1. get input from front --> userID, genfor [{},{},...], filter {...}, serving size
////2. get user's ingredient and quantity --> [{ingredient: pork, qty: 10, unit: gram}, {...}, {...}] from database by userID
//3. all ingredients to api link and fetch menu recipes --> keep menu id
//4. from that recipes --> go through --> add menu info to database
//4.1 if missing ingredient == 0 --> check amount of that used ingredient of each menu --> scoring (if some is not enough then count it as missing and add that missing to db)
// go to another api link to check amount ***** reduce ingredient to 1 serving before map --> update ** ingredient qty and nutrition ** according to user's input (servings) --> update attribute cuisine (Thai, notThai)
//4.2 if missing ingredient > 0 --> keep that missing ingredient to database and scoring
//5. get all possible menu list
//6. get nutrition of genfor --> calculate the nutrition per meal of that peep (either user only or user and fam)
//7. get base nutrition (incase user's dont specify it --> use the default value
//8. drop menu nutrition (already update according to servings) that not suit with user's genfor preference from no6 and7 ex) calories over minimum, sodium over minimun

// scoring criteria 1.ingredients score 2.cuisine pref score 3.taste pref score -----> score out of 100

//9. gothrou each menu information update score --> if menu's cuisine == Thai, user's Thai pref score * 25, else notThai*25
//10. go throu each menu check taste if top four is the same --> score1, if same only top3 --> score 0.75, if only top2 --> score 0.5, if only top1 same --> score 0.25, no same at all --> 0
//11 get filter (max, min) using results from #6 and 7 --> use filter to min and max each constraint to it defualt value of that search ex) min duration --> recommend menu will show up first in the row
// from all menu ge max min according to user's input at first place (no matter score it has...)

module.exports.genMenu = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const genFor = data.genFor; // get an array of this of this
  const genBy = data.genBy;
  const servingSize = data.servingSize;
  let ingredientNameList = "";
  let menuID_str = "";
  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;

  for (let i = 0; i < genFor.length; i++) {
    const name = genFor[i].profile;
    const profileInfo = await getProfileInfo(userID, name);
    total_energy += parseInt(profileInfo.energy);
    total_fat += parseInt(profileInfo.fat);
    total_carb += parseInt(profileInfo.carb);
    total_sugar += parseInt(profileInfo.sugar);
    total_protein += parseInt(profileInfo.protein);
    total_sodium += parseInt(profileInfo.sodium);
  }

  //parseInt??
  const energyAvg = total_energy / genFor.length;
  const fatAvg = total_fat / genFor.length;
  const carbAvg = total_carb / genFor.length;
  const sugarAvg = total_sugar / genFor.length;
  const proteinAvg = total_protein / genFor.length;
  const sodiumAvg = total_sodium / genFor.length;

  const nutrition = {
    energy: energyAvg,
    fat: fatAvg,
    carb: carbAvg,
    sugar: sugarAvg,
    protein: proteinAvg,
    sodium: sodiumAvg,
  };

  const userIngredient = await getUserIngredient(userID);

  for (let i = 0; i < userIngredient.length; i++) {
    ingredientNameList += userIngredient[i].name + ",";
  }
  const possibleMenus = await getPossibleMenu(ingredientNameList);

  for (let i = 0; i < possibleMenus.length; i++) {
    menuID_str += possibleMenus[i].id + ",";
  }
  const menuInfo = await getMenuInfo(menuID_str);

  const response = {
    nutrition: nutrition,
    ingredient: userIngredient,
    menu: possibleMenus,
    menuInfo: menuInfo,
  };

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(response),
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
  let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=e6b34e7165a042a49a19811bc0057118&ingredients=${ingredientList}&ignorePantry=true&ranking=1`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};

const getMenuInfo = async (menuIDs) => {
  let menuIDList = menuIDs.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/informationBulk?apiKey=e6b34e7165a042a49a19811bc0057118&ids=${menuIDList}&includeNutrition=true`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};
