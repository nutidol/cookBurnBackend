const dynamodb = require("../dynamodb");

module.exports.getMenuCuisine = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": "menu",
      ":sk": "cuisine_",
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

module.exports.postMenuCuisine = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const profileName = await getUserName(userID);
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