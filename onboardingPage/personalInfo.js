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
        headers: { "Content-Type": "application/json" },
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
module.exports.createPersonalInfo = (event, context, callback) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const profileName = data.profileOf;
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

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "application/json",
        },
        body: "Could not create the personal information item.",
      });
      return;
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };

    callback(null, response);
  });
};
