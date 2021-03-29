const dynamodb = require("../dynamodb");

//get menuFilterFor
module.exports.getMenuFilterFor = (event, context, callback) => {
  const userID = event.pathParameters.id;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": "profile_",
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
    const resArr = [];
    for (let i = 0; i < result.Items.length; i++) {
      let profileNameFull = result.Items[i].SK;
      let profileImage = result.Items[i].url;
      var profileName = profileNameFull.substr(8);
      let data = {
        profile: profileName,
        url: profileImage,
      };
      resArr.push(data);
    }

    const response = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      statusCode: 200,
      body: JSON.stringify(resArr),
    };
    callback(null, response);
  });
};
