"use strict";

// module.exports.hello = async (event) => {
//   const data = JSON.parse(event.body);

//   const sweetness = data.sweetness;
//   const sw = sweetness.toString();
//   const saltiness = data.saltiness;
//   const sourness = data.sourness;
//   const bitterness = data.bitterness;
//   const savoriness = data.savoriness;
//   const fattiness = data.fattiness;
//   const spiciness = data.spiciness;

//   const res = `{"sweetness": {"N": "${sweetness}"}, \n"saltiness": {"N": "${saltiness}"}, \n "sourness":{"N": "${sourness}"}, \n"bitterness": {"N": "${bitterness}"}, \n"savoriness": {"N": "${savoriness}"}, \n "fattiness":{"N": "${fattiness}"}, \n "spiciness":{"N": "${spiciness}"}}`;

//   return {
//     statusCode: 200,
//     body: res,
//   };
// };

const dynamodb = require("./dynamodb");
// module.exports.hello = async (event) => {
//   const tableName = process.env.DYNAMODB_TABLE;
//   const data = JSON.parse(event.body);
//   const type = data.type;
//   const ingredients = data.ingredient
  
//   const ingredientArr = [];
//   let status = 200;


//   for (let i = 0; i < ingredients.length; i++) {
//     let params = {
//       TableName: tableName,
//       Item: {
//         PK: "ingredient" ,
//         SK: `${type}_${ingredients[i].ingredientID}`,
//         ingredientID:ingredients[i].ingredientID,
//         name: ingredients[i].name,
//         unit: ingredients[i].unit,
//         url: ingredients[i].url
//       },
//     };
//     ingredientArr.push(params.Item);
//     try {
//       await dynamodb.put(params).promise();
//       console.log("Success");
//     } catch (err) {
//       console.log("Error", err);
//       statusCode = 404;
//     }
//   }

//   console.log("Success: Everything executed correctly");
//   return {
//     headers: {
//       "Access-Control-Allow-Origin": "*", // Required for CORS support to work
//       "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
//     },
//     statusCode: status,
//     body: JSON.stringify(ingredientArr),
//   };
// };

module.exports.hello = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const cookedMenu = data.cookedMenu;
  const menuID = cookedMenu.id;
  const menuTitle = cookedMenu.title;
  const duration = cookedMenu.duration;
  const score = cookedMenu.score;
  const missingIngredient = cookedMenu.missingIngredient;
  const lackingIngredient = cookedMenu.lackingIngredient;
  const ingredientData = cookedMenu.ingredientData;
  const nutrition = cookedMenu.nutrition;
  const timestamp = cookedMenu.timestamp;
  const recipeStep = cookedMenu.recipe;
  const servingSize = cookedMenu.servingSize;
  const genFor = cookedMenu.genFor;
  const genBy = cookedMenu.genBy;
  const url = cookedMenu.url;

  let params = {
    TableName: tableName,
    Item: {
      PK: `user_${userID}`,
      SK: `gen_${timestamp}_${menuID}`,
      id: menuID,
      title: menuTitle,
      duration: duration,
      score: score,
      missingIngredient: missingIngredient,
      lackingIngredient: lackingIngredient,
      ingredientData: ingredientData,
      nutrition: nutrition,
      recipe: recipeStep,
      timestamp: timestamp + "",
      servingSize: servingSize,
      genFor: genFor,
      genBy: genBy,
      url: url,
    },
  };
  try {
    await dynamodb.put(params).promise();
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
  }
  console.log(`Success: Everything executed correctly for menuID : ${menuID}`);

  return {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};
