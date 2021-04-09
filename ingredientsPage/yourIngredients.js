const dynamodb = require("../dynamodb");
module.exports.postYourIngredients = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const ingredients = data.ingredients;
  const ingredientArr = [];
  let status = 200;

  for (let i = 0; i < ingredients.length; i++) {
    let params = {
      TableName: tableName,
      Item: {
        PK: "user_" + userID,
        SK: "ingredient_" + ingredients[i].name,
        id: ingredients[i].ingredientID,
        quantity: ingredients[i].quantity,
        name: ingredients[i].name,
        unit: ingredients[i].unit,
      },
    };
    ingredientArr.push(params.Item);
    try {
      await dynamodb.put(params).promise();
      console.log("Success");
    } catch (err) {
      console.log("Error", err);
      statusCode = 404;
    }
  }

  console.log("Success: Everything executed correctly");
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: status,
    body: JSON.stringify(ingredientArr),
  };
};

module.exports.getYourIngredients = (event, context, callback) => {
  const userID = event.pathParameters.id;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": "ingredient_",
    },
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        },
        body: "Couldn't fetch the item.",
      });
      return;
    }

    const response = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);
  });
};
