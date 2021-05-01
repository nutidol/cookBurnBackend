const dynamodb = require("../dynamodb");
module.exports.getUser = async (event) => {
  const userID = event.pathParameters.id;
  const userName = await getUserName(userID);
  const profile = await getUserProfile(userID, userName);
  const url = profile.url;

  const result = {
    userName: userName,
    url: url,
  };
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(result),
  };
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
