const dynamodb = require("../dynamodb");

//get
module.exports.getWorkout = async (event) => {
  const userID = event.pathParameters.id;
  const SK = event.pathParameters.sortKey;
  const result = await getUserCooked(userID, SK);
  const username = await getUserName(userID);
  const profile = await getUserProfile(userID, username);
  const weight = profile.weight;

  let people = result.genFor.length;
  let title = result.title;
  let energy = result.nutrition.energy / people;
  let dbEnergy = 0;
  if (energy < 50 && energy > 0) {
    dbEnergy = 0;
  } else if (energy < 100 && energy >= 50) {
    dbEnergy = 50;
  } else if (energy < 150 && energy >= 100) {
    dbEnergy = 100;
  } else if (energy < 200 && energy >= 150) {
    dbEnergy = 150;
  } else if (energy < 250 && energy >= 200) {
    dbEnergy = 200;
  } else if (energy < 300 && energy >= 250) {
    dbEnergy = 250;
  } else if (energy < 350 && energy >= 300) {
    dbEnergy = 300;
  } else if (energy < 400 && energy >= 350) {
    dbEnergy = 350;
  } else if (energy < 450 && energy >= 400) {
    dbEnergy = 400;
  } else if (energy < 500 && energy >= 450) {
    dbEnergy = 450;
  } else {
    dbEnergy = 500;
  }

  let workoutInfo = await getCookedWorkout(weight, dbEnergy);
  let res = {
    title: title,
    sortKey: SK,
    energy: energy,
    workout: workoutInfo.workout,
  };
  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(res),
  };
};

const getUserCooked = async (userID, SK) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `${SK}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
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

const getCookedWorkout = async (weight, energy) => {
  let dbWeight = 0;
  if (weight < 60) {
    dbWeight = 40;
  } else if (weight < 80 && weight >= 60) {
    dbWeight = 60;
  } else {
    dbWeight = 80;
  }
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `workout_${dbWeight}`,
      SK: `set_${energy}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

//post
//update workout status in cooked!!
module.exports.postWorkout = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const title = data.title;
  const menu = title.replace(/\s/g, "");
  const workout = data.workout;
  const energy = data.energy;
  const sortKey = data.sortKey;

  let params = {
    TableName: tableName,
    Item: {
      PK: `user_${userID}`,
      SK: `workout_${timestamp}_${menu}`,
      title: title,
      energy: energy,
      workout: workout,
    },
  };

  // Call DynamoDB
  try {
    await updateWorkoutStatus(userID, sortKey);
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

const updateWorkoutStatus = async (userID, sortKey) => {
  const getparams = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `${sortKey}`,
    },
  };
  const result = await dynamodb.get(getparams).promise();
  const data = result.Item;

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `user_${userID}`,
      SK: `${sortKey}`,
      id: data.id,
      title: data.title,
      duration: data.duration,
      score: data.score,
      missingIngredient: data.missingIngredient,
      lackingIngredient: data.lackingIngredient,
      ingredientData: data.ingredientData,
      nutrition: data.nutrition,
      recipe: data.recipe,
      timestamp: data.timestamp,
      servingSize: data.servingSize,
      genFor: data.genFor,
      genBy: data.genBy,
      workoutstatus: "true",
    },
  };
  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
  }
};
