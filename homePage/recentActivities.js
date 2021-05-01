const dynamodb = require("../dynamodb");
module.exports.getRecentActivities = async (event) => {
  const userID = event.pathParameters.id;
  //const timestamp = event.pathParameters.timestamp;

  const cooked = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": `cooked_`,
    },
  };
  const workout = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": `workout_`,
    },
  };
  let result_cooked = {};
  let result_workout = {};
  try {
    result_cooked = await dynamodb.query(cooked).promise();
    result_workout = await dynamodb.query(workout).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }
  let activities = [];

  for (let i = 0; i < result_cooked.Items.length; i++) {
    let SK = result_cooked.Items[i].SK;
    let name = result_cooked.Items[i].title;
    let url = result_cooked.Items[i].url;
    let energy = result_cooked.Items[i].nutrition.energy;
    activities.push({
      SK: SK,
      name: name,
      url: url,
      energy: energy,
    });

    //sk, menuname, calories,url
  }
  for (let i = 0; i < result_workout.Items.length; i++) {
    //sk, menuname, calories,url
    let SK = result_workout.Items[i].SK;
    let name = result_workout.Items[i].title;
    let modifyName = `Workout for: ${name}`
    let url = result_workout.Items[i].url;
    let energy = result_workout.Items[i].energy;
    activities.push({
      SK: SK,
      name: modifyName,
      url: url,
      energy: energy,
    });
  }

  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(activities),
  };
};
