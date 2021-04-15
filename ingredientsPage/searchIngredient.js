"use strict";
const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");

//searchIngredient
//user pass queryparameter(just want to try this, actually pass pathparameter is easier)

// 1. get what ingredient user want from search
// 2. fetch api to get ingredient id, name, and image
// 2.5 image --> rewrite to a url link
// 3. find ingredient's type --> no need????????????????????????????????????????
// 4. find possible unit of that ingredient --> from another api fetch

// return {
//    "ingredientID":"1",
//    "name":"pork",
//    "pic":"http://...",
//    "ingredientType":"meat", --> ????????????????????????????????????????????
//    "unit":"g, kg, pieces"
// }

//should be able to search and get possible ingredients instead of 1
module.exports.getSearchIngredient = async (event) => {
  let ingredient = event.ingredient;
  let response = [];
  let PK = "ingredient";
  let SK = "mock_123";
  let search_url = `https://api.spoonacular.com/food/ingredients/search?apiKey=7b9f2b35ba8f4fe697b93357fdc09314&number=1&query=${ingredient}`;
  let json = await getIngredientInfo(search_url);
  let ingredientID = json.results[0].id;
  let ingredientName = json.results[0].name;
  let image = json.results[0].image;
  let image_url = `https://spoonacular.com/cdn/ingredients_100x100/${image}`;
  let search_unit = `https://api.spoonacular.com/food/ingredients/${ingredientID}/information?apiKey=7b9f2b35ba8f4fe697b93357fdc09314`;
  let json2 = await getIngredientInfo(search_unit);
  let possibleUnits = json2.possibleUnits;
  console.log(possibleUnits);
  let units = await cleanUnit(possibleUnits);
  const result = {
    PK: PK,
    SK: SK,
    ingredientID: ingredientID,
    name: ingredientName,
    url: image_url,
    unit: units,
  };
  response.push(result);

  // const headers = {
  //   "Access-Control-Allow-Origin": "*", // Required for CORS support to work
  //   "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  // };

  return response;
};

async function getIngredientInfo(search_url) {
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
}

async function cleanUnit(possibleUnits) {
  let units = [];
  for (let i = 0; i < possibleUnits.length; i++) {
    if (
      possibleUnits[i].includes("gram") ||
      possibleUnits[i].includes("litre")
    ) {
      units.push(possibleUnits[i]);
    } else if (
      possibleUnits[i] == "g" ||
      possibleUnits[i] == "l" ||
      possibleUnits[i] == "kg" ||
      possibleUnits[i] == "mg" ||
      possibleUnits[i] == "ml" ||
      possibleUnits[i] == "lb" ||
      possibleUnits[i] == "oz" ||
      possibleUnits[i] == "qt" ||
      possibleUnits[i] == "pt" ||
      possibleUnits[i] == "c" ||
      possibleUnits[i] == "tbsp" ||
      possibleUnits[i] == "gal" ||
      possibleUnits[i] == "tsp"
    ) {
      units.push(possibleUnits[i]);
    } else if (
      possibleUnits[i] == "pound" ||
      possibleUnits[i] == "ounce" ||
      possibleUnits[i] == "gallon" ||
      possibleUnits[i] == "quart" ||
      possibleUnits[i] == "pint" ||
      possibleUnits[i] == "cup" ||
      possibleUnits[i] == "tablespoon" ||
      possibleUnits[i] == "teaspoon"
    ) {
      units.push(possibleUnits[i]);
    }
    // } else if (
    //   possibleUnits[i].includes("pound") ||
    //   possibleUnits[i].includes("ounce") ||
    //   possibleUnits[i].includes("gallon") ||
    //   possibleUnits[i].includes("quart") ||
    //   possibleUnits[i].includes("pint") ||
    //   possibleUnits[i].includes("cup") ||
    //   possibleUnits[i].includes("tablespoon") ||
    //   possibleUnits[i].includes("teaspoon")
    // ) {
    //   units.push(possibleUnits[i]);
    // }
  }
  return units;
}

///getIngredientLists
//require path parameter as an ingredientType
///ingredientLists
module.exports.getIngredientList = (event, context, callback) => {
  const ingredientType = event.pathParameters.type;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": "ingredient",
      ":sk": `${ingredientType}`,
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
