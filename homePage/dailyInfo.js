"use strict";

const dynamodb = require("../dynamodb");

//getDailyInfo
//daily info based on user's information
//update everytime when user make change on their information
//maximum amount -> the one after slash sign

//to do
//1. get user's personal information based on userID
//2. calculate energy, fat, carb, protein, sugar, sodium
//3. return

module.exports.getDailyInfo = async (event) => {
  const userID = event.pathParameters.id;
  const username = await getUserName(userID);
  const profile = await getUserProfile(userID, username);
  const gender = profile.gender;
  const age = profile.age;
  const weight = profile.weight;
  const height = profile.height;

  let energy = 0;
  let sodium = 0;

  if (gender == "male" || gender == "men") {
    energy = parseInt(1.2 * (66.5 + 13.8 * weight + 5.0 * height - 6.8 * age));
  } else {
    energy = parseInt(1.2 * (655.1 + 9.6 * weight + 1.9 * height - 4.7 * age));
  }

  if (age <= 3) {
    sodium = 1000;
  } else if (age > 3 && age <= 8) {
    sodium = 1200;
  } else if (age > 8 && age <= 50) {
    sodium = 1500;
  } else if (age > 50 && age <= 70) {
    sodium = 1300;
  } else {
    sodium = 1200;
  }

  let fat = parseInt((energy * 0.3) / 9);
  let carb = parseInt(energy * 0.6);
  let protein = parseInt(weight);
  let sugar = parseInt(energy * 0.1 * 0.25);
  let fiber = parseInt((energy * 14) / 1000);

  const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };

  const tableName = process.env.DYNAMODB_TABLE;

  if (userID) {
    let params = {
      TableName: tableName,
      Item: {
        PK: "user_" + userID,
        SK: "daily_" + username,
        energy: energy,
        fat: fat,
        carb: carb,
        protein: protein,
        sugar: sugar,
        sodium: sodium,
        fiber: fiber,
      },
    };

    // Call DynamoDB
    try {
      await dynamodb.put(params).promise();
      console.log("Success");
    } catch (err) {
      console.log("Error", err);
    }

    console.log("Success: Everything executed correctly");
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
  } else {
    console.log("Error: Nothing was written to DDB or SQS");
  }
};

const getUserName = async (userID) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `authen_${userID}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item.username;
};

const getUserProfile = async (userID, userName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `profile_${userName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

// module.exports.getDailyInfo = (event) => {

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
//     ExpressionAttributeValues: {
//       ':pk': 'user_'+ event.pathParameters.id,
//       ':sk': 'daily',
//     },
//   };

//   dynamodb.query(params, (error, result) => {
//     if (error) {
//       console.error(error);
//       callback(null, {
//         statusCode: error.statusCode || 501,
//         headers: { "Content-Type": "application/json" },
//         body: "Couldn't fetch the item.",
//       });
//       return;
//     }

//     // create a response
//     const headers = {
//       "Access-Control-Allow-Origin": "*", // Required for CORS support to work
//       "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
//     }
//     const response = {
//       headers,
//       statusCode: 200,
//       body: JSON.stringify(result.Items),
//     };

//   });
// };

//getUpdateDailyInfo
//daily intake -- based on user's cooked history
// that has to be calculate after each cooked update...
// the one before slash sign

// calculate the percentage of each duay? --> for better ui, easy to catch up

// module.exports.getUpdateDailyInfo = (event, context, callback) => {

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
//     ExpressionAttributeValues: {
//       ':pk': 'user_'+ event.pathParameters.id,
//       ':sk': 'daily',
//     },
//   };

//   dynamodb.query(params, (error, result) => {
//     if (error) {
//       console.error(error);
//       callback(null, {
//         statusCode: error.statusCode || 501,
//         headers: { "Content-Type": "application/json" },
//         body: "Couldn't fetch the item.",
//       });
//       return;
//     }
//     // create a response
//     const headers = {
//       "Access-Control-Allow-Origin": "*", // Required for CORS support to work
//       "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
//     }
//     const response = {
//       headers,
//       statusCode: 200,
//       body: JSON.stringify(result.Items),
//     };
//     callback(null, response);
//   });
// };
