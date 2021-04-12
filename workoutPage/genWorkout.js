const dynamodb = require("../dynamodb");

module.exports.genWorkout = async (event) => {
  const userID = event.pathParameters.id;
  const userName = await getUserName(userID);
  let result = [];
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "GSI3",
    KeyConditionExpression: "workoutstatus = :pk AND begins_with(PK, :sk)",
    ExpressionAttributeValues: {
      ":pk": "false",
      ":sk": `user_${userID}`,
    },
  };
  try {
    result = await dynamodb.query(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
    statusCode = 404;
  }
  let resArr = [];

  for (let i = 0; i < result.Items.length; i++) {
    let title = result.Items[i].title;
    let people = result.Items[i].genFor.length;
    for (let j = 0; j < people; j++) {
      if (result.Items[i].genFor[j].profile == userName) {
        let energy = result.Items[i].nutrition.energy / people;
        let sortKey = result.Items[i].SK;
        resArr.push({
          sortKey: sortKey,
          title: title,
          energy: energy,
        });
      }
    }
  }
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(resArr),
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
