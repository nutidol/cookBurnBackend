"use strict";

const dynamodb = require("../dynamodb");

module.exports.list = (event, context, callback) => {
 
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'user_abcdevfefe-1232132-cofeve',
      ':sk': 'profile',
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

    // fetch all todos from the database

    // dynamodb.scan(params, (error, result) => {
    //   // handle potential errors
    //   if (error) {
    //     console.error(error);
    //     callback(null, {
    //       statusCode: error.statusCode || 501,
    //       headers: { 'Content-Type': 'text/plain' },
    //       body: 'Couldn\'t fetch the todo item.',
    //     });
    //     return;
    //   }

    //GSI (secondary index, another perspective to retrive data)

    // const params = {
    //   TableName: process.env.DYNAMODB_TABLE,
    //   IndexName: 'GSI1-SK-index',
    //   KeyConditionExpression: 'GSI1 = :gsi1 AND begins_with(SK, :sk)',
    //   ExpressionAttributeValues: {
    //     ':gsi1': 'user_abcdevfefe-1232132-cofeve',
    //     ':sk': 'teamMember',
    //   },
    // };



    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);
  });
};
