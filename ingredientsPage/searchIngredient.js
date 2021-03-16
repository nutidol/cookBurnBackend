"use strict";

const dynamodb = require("../dynamodb");
const fetch = require('node-fetch');


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

module.exports.getSearchIngredient = (event, context, callback) => {
    let ingredient = event.ingredient;
    console.log(ingredient);
    let search_url = `https://api.spoonacular.com/food/ingredients/search?apiKey=e6b34e7165a042a49a19811bc0057118&query=${ingredient}`
    console.log(search_url);

    const headers = {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    }
    const response = {
        headers,
        statusCode: 200,
        body: JSON.stringify(ingredient),
      };

    callback(null, response);
};
