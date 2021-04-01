const dynamodb = require("../dynamodb");

module.exports.getOtherProfiles = async (event) => {
  const userID = event.pathParameters.id;
  const userName = await getUserName(userID);
  const others = await getOthers(userID, userName);

  const response = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(others),
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

const getOthers = async (userID, userName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": "profile_",
    },
  };

  const result = await dynamodb.query(params).promise();

  const resArr = [];
  for (let i = 0; i < result.Items.length; i++) {
    let profileNameFull = result.Items[i].SK;
    let profileImage = result.Items[i].url;
    var profileName = profileNameFull.substr(8);
    if (profileName != userName) {
      let data = {
        profile: profileName,
        url: profileImage,
      };
      resArr.push(data);
    }
  }
  return resArr;
};

module.exports.createOrUpdateOthersInfo = (event, context, callback) => {
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
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        },
        body: "Could not create the personal information item.",
      });
      return;
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

    callback(null, response);
  });
};

module.exports.postOthersMenuTaste = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const profileName = data.profileOf;
  const menuTaste = data.menuTaste;
  let sumfat = 0;
  let sumspicy = 0;
  let sumsalty = 0;
  let sumbitter = 0;
  let sumsavory = 0;
  let sumsweet = 0;
  let sumsour = 0;

  for (let i = 0; i < menuTaste.length; i++) {
    sumfat += menuTaste[i].tastelevel.fattiness;
    sumspicy += menuTaste[i].tastelevel.spiciness;
    sumsalty += menuTaste[i].tastelevel.saltiness;
    sumbitter += menuTaste[i].tastelevel.bitterness;
    sumsavory += menuTaste[i].tastelevel.savoriness;
    sumsweet += menuTaste[i].tastelevel.sweetness;
    sumsour += menuTaste[i].tastelevel.sourness;
  }

  const fatAvg = parseInt(sumfat / menuTaste.length);
  const spicyAvg = parseInt(sumspicy / menuTaste.length);
  const saltyAvg = parseInt(sumsalty / menuTaste.length);
  const bitterAvg = parseInt(sumbitter / menuTaste.length);
  const savoryAvg = parseInt(sumsavory / menuTaste.length);
  const sweetAvg = parseInt(sumsweet / menuTaste.length);
  const sourAvg = parseInt(sumsour / menuTaste.length);

  let params = {
    TableName: tableName,
    Item: {
      PK: "user_" + userID,
      SK: "taste_" + profileName,
      fattiness: fatAvg,
      spiciness: spicyAvg,
      saltiness: saltyAvg,
      bitterness: bitterAvg,
      savoriness: savoryAvg,
      sweetness: sweetAvg,
      sourness: sourAvg,
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
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};

module.exports.postOthersMenuCuisine = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const profileName = data.profileOf;
  const menuCuisine = data.menuCuisine;
  // const userID = event.userID;
  // const profileName = event.profileOf;
  // const menuCuisine = event.menuCuisine;
  let countThai = 0;
  let countNotThai = 0;
  let cuisineType = "thai";
  let status = 200;

  for (let i = 0; i < menuCuisine.length; i++) {
    if (menuCuisine[i].type == "Thai") {
      countThai++;
    } else {
      countNotThai++;
    }
  }

  const thaiPercent = countThai / menuCuisine.length;
  const thaiRound = Math.round(thaiPercent * 100) / 100;
  const notThaiPercent = countNotThai / menuCuisine.length;
  const notthaiRound = Math.round(notThaiPercent * 100) / 100;

  if (thaiPercent < 0.5) {
    cuisineType = "notthai";
  }

  let params = {
    TableName: tableName,
    Item: {
      PK: "user_" + userID,
      SK: "cuisine_" + profileName,
      thai: thaiRound,
      notthai: notthaiRound,
      type: cuisineType,
    },
  };

  // Call DynamoDB
  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }

  console.log("Success: Everything executed correctly");
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: status,
    body: JSON.stringify(params.Item),
  };
  // return params.Item;
};

module.exports.getOthersFullInfo = async (event) => {
  // const data = JSON.parse(event.body);
  // const userID = data.userID;
  // const profileName = data.profileOf;
  const userID = event.pathParameters.id;
  const profileName = event.pathParameters.profileOf;

  const userProfile = await getUserProfile(userID, profileName);
  const userDailyProfile = await getProfileInfo(userID, profileName);

  //still missing update daily info
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
