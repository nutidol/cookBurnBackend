const dynamodb = require("../dynamodb");

module.exports.getMenuTaste = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": "menu",
      ":sk": "taste",
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

//post
//calculate user taste bud
//ranking each to sum up to 1
// {
// "sweetness": 100,
// "saltiness": 36.25,
// "sourness": 37.27,
// "bitterness": 18.27,
// "savoriness": 31.24,
// "fattiness": 57.3,
// "spiciness": 0
// }
//from menus that user select (combine and divide by no. of menu to get the user's taste pref)

//recieve event as [] and need to looping through 0,1,2,3,... until get all data of each menu that user has selected
//calculate within the loop to get the final taste of that user
// return as what will be in database

module.exports.postMenuTaste = async (event) => {
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
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};
