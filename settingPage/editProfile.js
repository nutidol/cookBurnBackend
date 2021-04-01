const dynamodb = require("../dynamodb");


//missing update daily info
module.exports.getUserFullInfo = async (event) => {
  const userID = event.pathParameters.id;
  const username = await getUserName(userID);
  const userProfile = await getUserProfile(userID, username);
  const userDailyProfile = await getProfileInfo(userID, username);

  const response = {
    personalInfo: userProfile,
    dailyInfo: userDailyProfile,
  };

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(response),
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


//age, weight, height ,...
const getUserProfile = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `profile_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

//daily energy, carb, ...
const getProfileInfo = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `daily_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

