"use strict";

const dynamodb = require("../dynamodb");

//get Profile Icon
  module.exports.getProfileIcon = (event, context, callback) => {
 
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'profile',
        ':sk': 'pic',
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
      // create a response
      // const headers = {
      //   "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      //   "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      // }
      const response = {
        // headers,
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  };
  

//post Personal Info
//   module.exports.createPersonalInfo = (event, context, callback) => {

//   console.log(event.username);
//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     Item: {
//       'id': event.userID,
//       'username': event.username,
//       'profileOf': event.profileOf,
//       'gender': event.gender,
//       'age': event.age,
//       'weight': event.weight,
//       'height': event.height,
//       'pic': event.pic,
//     },
//   };

//   // write the todo to the database
//   dynamodb.put(params, (error) => {
//     // handle potential errors
//     if (error) {
//       console.error(error);
//       callback(null, {
//         statusCode: error.statusCode || 501,
//         // headers: { 'Content-Type': 'text/plain' },
//         body: "Couldn't create item.",
//       });
//       return;
//     }

//     // create a response
//     const response = {
//       statusCode: 200,
//       body: JSON.stringify(params.Item),
//     };
//     callback(null, response);
//   });
// };
