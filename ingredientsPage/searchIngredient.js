"use strict";

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

module.exports.getSearchIngredient = async (event) => {
  let ingredient = event.ingredient;
  let search_url = `https://api.spoonacular.com/food/ingredients/search?apiKey=e6b34e7165a042a49a19811bc0057118&number=1&query=${ingredient}`;
  let json = await getIngredientInfo(search_url);
  let ingredientID = json.results[0].id;
  let ingredientName = json.results[0].name;
  let image = json.results[0].image;
  let image_url = `https://spoonacular.com/cdn/ingredients_100x100/${image}`;
  let search_unit = `https://api.spoonacular.com/food/ingredients/${ingredientID}/information?apiKey=e6b34e7165a042a49a19811bc0057118`;
  let json2 = await getIngredientInfo(search_unit);
  let unit = json2.possibleUnits;
  console.log(unit);

  const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };

  const response = {
    ingredientID: ingredientID,
    name: ingredientName,
    pic: image_url,
    unit: unit,
  };

  return {
    headers,
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

async function getIngredientInfo(search_url) {
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
}
