"use strict";

const dynamodb = require("../dynamodb");

//get Profile Icon
// module.exports.getProfileIcon = (event, context, callback) => {
//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     Key: {
//       id: event.pathParameters.id,
//     },
//   };

//   // fetch todo from the database
//   dynamodb.get(params, (error, result) => {
//     // handle potential errors
//     if (error) {
//       console.error(error);
//       callback(null, {
//         statusCode: error.statusCode || 501,
//         headers: { 'Content-Type': 'text/plain' },
//         body: 'Couldn\'t fetch the todo item.',
//       });
//       return;
//     }

//     // create a response
//     const response = {
//       statusCode: 200,
//       body: JSON.stringify(result.Item),
//     };
//     callback(null, response);
//   });
// };

//create personal info

module.exports.createPersonalInfo = (event, context, callback) => {
  // const data = JSON.parse(event.body);
  // console.log(data);
  // if (typeof data.username !== 'string') {
  //   console.error('Validation Failed');
  //   callback(null, {
  //     statusCode: 400,
  //     headers: { 'Content-Type': 'text/plain' },
  //     body: 'Couldn\'t create item.',
  //   });
  //   console.log(data.username)
  //   return;
  // }
  console.log(event.username);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      'id': event.userID,
      'username': event.username,
      'profileOf': event.profileOf,
      'gender': event.gender,
      'age': event.age,
      'weight': event.weight,
      'height': event.height,
      'pic': event.pic,
    },
  };

  // write the todo to the database
  dynamodb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        // headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't create item.",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });
};
