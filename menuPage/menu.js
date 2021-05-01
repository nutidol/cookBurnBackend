const dynamodb = require("../dynamodb");

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
  const missingIngredient = cookedMenu.missingIngredient;
  const lackingIngredient = cookedMenu.lackingIngredient;
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

  let params = {
    TableName: tableName,
    Item: {
      PK: `user_${userID}`,
      SK: `cooked_${timestamp}_${menuID}`,
      id: menuID,
      title: menuTitle,
      duration: duration,
      score: score,
      missingIngredient: missingIngredient,
      lackingIngredient: lackingIngredient,
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
