const dynamodb = require("../dynamodb");
module.exports.getMenus = async (event) => {
  const userID = event.pathParameters.id;
  const timestamp = event.pathParameters.timestamp;

  const genMenus = await getGenMenus(userID, timestamp);
  const opMenu = await getOpMenu(userID, timestamp);
  let resultArr = [];

  for (let i = 0; i < genMenus.length; i++) {
    if (genMenus[i].SK == opMenu.genKey) {
      resultArr.push(genMenus[i]);
      genMenus.splice(i, 1);
    }
  }
  genMenus.sort(await compareValues("score"));

  resultArr.push(...genMenus);

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(resultArr),
  };
};

const getGenMenus = async (userID, timestamp) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": `gen_${timestamp}_`,
    },
  };
  const result = await dynamodb.query(params).promise();
  return result.Items;
};

const getOpMenu = async (userID, timestamp) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `optimised_${timestamp}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

async function compareValues(key) {
  return function (a, b) {
    let comparison = 0;
    if (a[key] < b[key]) {
      comparison = 1;
    } else if (a[key] > b[key]) {
      comparison = -1;
    }
    return comparison;
  };
}
