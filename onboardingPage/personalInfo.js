"use strict";

const dynamodb = require("../dynamodb");

//get Profile Icon
module.exports.getProfileIcon = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": "profile",
      ":sk": "pic",
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
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);
  });
};

//post Personal Info
// how to update personal info?
module.exports.createPersonalInfo = async (event, context, callback) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const profileName = await getUserName(userID);
  const gender = data.gender;
  const age = data.age;
  const weight = data.weight;
  const height = data.height;
  const url = data.url;

  const params = {
    TableName: tableName,
    Item: {
      PK: `user_${userID}`,
      SK: `profile_${profileName}`,
      gender: gender,
      age: age,
      weight: weight,
      height: height,
      url: url,
    },
  };

  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }

  const response = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };

  return response;
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
