"use strict";

const dynamodb = require("../dynamodb");

//getDailyInfo
module.exports.getDailyInfo = (event, context, callback) => {
 
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'user_'+ event.pathParameters.id,
      ':sk': 'daily',
    },
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { "Content-Type": "application/json" },
        body: "Couldn't fetch the todo item.",
      });
      return;
    }
    // create a response
    const headers = {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    }
    const response = {
      headers,
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);
  });
};



