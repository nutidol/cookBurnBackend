///query cooked menu info
//get nutrition info
//sum up (based on today timestamp)

const dynamodb = require("../dynamodb");
module.exports.getUpdateDailyInfo = async (event) => {
  const userID = event.pathParameters.id;
  //check today timestamp
  const timestamp = event.pathParameters.timestamp;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": `cooked_`,
    },
  };
  let result = {};
  try {
    result = await dynamodb.query(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }

  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;
  let total_fiber = 0;

  for (let i = 0; i < result.Items.length; i++) {
    total_energy += result.Items[i].nutrition.energy;
    total_fat += result.Items[i].nutrition.fat;
    total_carb += result.Items[i].nutrition.carb;
    total_sugar += result.Items[i].nutrition.sugar;
    total_protein += result.Items[i].nutrition.protein;
    total_sodium += result.Items[i].nutrition.sodium;
    total_fiber += result.Items[i].nutrition.fiber;
  }
  let res = {
    energy: parseInt(total_energy),
    carb: parseInt(total_carb),
    sugar: parseInt(total_sugar),
    protein: parseInt(total_protein),
    sodium: parseInt(total_sodium),
    fiber: parseInt(total_fiber),
    fat: parseInt(total_fat),
  };

  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(res),
  };
};
