const dynamodb = require("../dynamodb");
module.exports.getCardInfo = async (event) => {
  const userID = event.pathParameters.id;
  const SK = event.pathParameters.sortKey;

  let result = {};
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: SK,
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
    statusCode: 200,
    body: JSON.stringify(resultArr),
  };
};

module.exports.postCardInfo = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const selectedInfo = data.selectedInfo[0];
  let params = {};
  let sortKey = "";
  if (selectedInfo.SK.includes("workout")) {
    const title = selectedInfo.title;
    const menu = title.replace(/\s/g, "");
    const workout = selectedInfo.workout;
    const energy = selectedInfo.energy;
    sortKey = selectedInfo.sortKey;
    const url = selectedInfo.url;
    params = {
      TableName: tableName,
      Item: {
        PK: `user_${userID}`,
        SK: `workout_${timestamp}_${menu}`,
        title: title,
        energy: energy,
        url: url,
        workout: workout,
        timestamp: timestamp + "",
      },
    };
  } else {
    const menuID = selectedInfo.id;
    const menuTitle = selectedInfo.title;
    const duration = selectedInfo.duration;
    const score = selectedInfo.score;
    const missingIngredient = selectedInfo.missingIngredient;
    const lackingIngredient = selectedInfo.lackingIngredient;
    const totalLackIngredient = selectedInfo.totalLackIngredient;
    const ingredientData = selectedInfo.ingredientData;
    const nutrition = selectedInfo.nutrition;
    const recipeStep = selectedInfo.recipe;
    const servingSize = selectedInfo.servingSize;
    const genFor = selectedInfo.genFor;
    const genBy = selectedInfo.genBy;
    const url = selectedInfo.url;
    const workoutstatus = "false";
    params = {
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
  }

  // Call DynamoDB
  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
  }

  console.log("Success: Everything executed correctly");
  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};
