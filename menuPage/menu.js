const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");


//get
module.exports.getMenu = async (event) => {
  //SK = gen_1617946739991_159775
  const userID = event.pathParameters.id;
  const sortKey = event.pathParameters.sortKey;
  const statusCode = 200;
  let result = {};
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: sortKey,
    },
  };
  try {
    result = await dynamodb.get(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }
  console.log("Success: Everything executed correctly");
  let resultArr = [];
  resultArr.push(result.Item);
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: statusCode,
    body: JSON.stringify(resultArr),
  };
};

//post

module.exports.postMenu = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const cookedMenu = data.cookedMenu[0];
  const menuID = cookedMenu.id;
  const menuTitle = cookedMenu.title;
  const duration = cookedMenu.duration;
  const score = cookedMenu.score;
  const totalLackIngredient = cookedMenu.totalLackIngredient;
  const ingredientData = cookedMenu.ingredientData;
  const nutrition = cookedMenu.nutrition;
  const timestamp = cookedMenu.timestamp;
  const recipeStep = cookedMenu.recipe;
  const servingSize = cookedMenu.servingSize;
  const genFor = cookedMenu.genFor;
  const genBy = cookedMenu.genBy;
  const url = cookedMenu.url;
  const workoutstatus = "false";

  await updateUserIngredients(userID, ingredientData);

  let params = {
    TableName: tableName,
    Item: {
      PK: `user_${userID}`,
      SK: `cooked_${timestamp}_${menuID}`,
      id: menuID,
      title: menuTitle,
      duration: duration,
      score: score,
      totalLackIngredient: totalLackIngredient,
      ingredientData: ingredientData,
      nutrition: nutrition,
      recipe: recipeStep,
      timestamp: timestamp + "",
      servingSize: servingSize,
      genFor: genFor,
      genBy: genBy,
      url: url,
      workoutstatus: workoutstatus,
    },
  };
  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
  }
  console.log(`Success: Everything executed correctly for menuID : ${menuID}`);

  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};

const updateUserIngredients = async (userID, ingredientData) => {
  //update user's ingredient
  //1. get all user's ingredient
  //2. if ingredient data.id == user's ingredient.data --> change amount and unit to USER's unit
  //3. substract from user's ingredient
  //4. put new ingredient amount to user's ingredient
  let userUpdateAmount = 0;
  for (let i = 0; i < ingredientData.length; i++) {
    let ingredientID = ingredientData[i].id;
    let ingredientName = ingredientData[i].name;
    let ingredientAmount = ingredientData[i].amount;
    let ingredientUnit = ingredientData[i].unit;
    let userIngredient = await ingredientInfo(userID, ingredientName);
    if (userIngredient == undefined) {
      continue;
    }
    let userIngredientName = userIngredient.name;
    let userIngredientQty = userIngredient.quantity;
    let PK = userIngredient.PK;
    let SK = userIngredient.SK;
    let userIngredientID = userIngredient.id;
    let userIngredientUnit = userIngredient.unit;
    let userIngredientUrl = userIngredient.url;

    let userUsedConvertedAmount = await convertAmount(
      ingredientName,
      ingredientAmount,
      ingredientUnit,
      userIngredient.unit
    );
    if (userIngredientQty > userUsedConvertedAmount) {
      userUpdateAmount = userIngredientQty - userUsedConvertedAmount;
    } else {
      userUpdateAmount = 0;
    }
    //put the updated ingredient to database
    let params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK: PK,
        SK: SK,
        id: userIngredientID,
        quantity: userUpdateAmount,
        unit: userIngredientUnit,
        url: userIngredientUrl,
        name: userIngredientName,
      },
    };
    try {
      await dynamodb.put(params).promise();
      console.log(`Updated: ingredient_${userIngredientName}`);
    } catch (err) {
      console.log("Error", err);
      console.log(params.Item);
    }
  }
};

const ingredientInfo = async (userID, ingredientName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `ingredient_${ingredientName}`,
    },
  };
  let result;
  let res;
  try {
    result = await dynamodb.get(params).promise();
    res = result.Item;
  } catch (err) {
    res = undefined;
  }
  return res;
};

const convertAmount = async (
  ingredientName,
  convertedAmount,
  unit,
  userUnit
) => {
  let amount = convertedAmount;
  let roundAmount = 0;
  let search_url = `https://api.spoonacular.com/recipes/convert?apiKey=e6b34e7165a042a49a19811bc0057118&ingredientName=${ingredientName}&sourceAmount=${convertedAmount}&sourceUnit=${unit}&targetUnit=${userUnit}`;
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
