const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");

module.exports.genMenuUpdate = async (event) => {
  //1) get things from post filter
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const genFor = data.genFor; // get an array of this of this
  const genBy = data.genBy; //get array of this
  const servingSize = data.servingSize;
  let menuEnergy;
  let menuFat;
  let menuCarb;
  let menuSugar;
  let menuProtein;
  let menuSodium;
  let menuFiber;
  let genMenuData = [];

  //2) GENFOR --> calculate limitation (upperbound, lowerbound of this search --> for each constraints: energy, fat, protein, ..., avgTaste, avgCuisine)
  const limit = await getLimit(userID, genFor);
  const userNutrition = limit.daily;
  const userTasteRank = limit.taste;
  const userCuisine = limit.cuisine;

  //3) get user's ingredients --> api search (right now lets do all if bug --> random and take only 5 ingredients?)
  //4) get possible menus (missedIngredientCount = 0 && title.length < 40 &&
  const userIngredientAndPossibleMenus = await getPossibleMenu(userID);
  const possibleMenus = userIngredientAndPossibleMenus.possibleMenus;
  const userIngredient = userIngredientAndPossibleMenus.userIngredient;

  for (let i = 0; i < possibleMenus.length; i++) {
    let menuID = possibleMenus[i].id;
    let menuTitle = possibleMenus[i].title;
    let url = possibleMenus[i].image;
    let duration = possibleMenus[i].readyInMinutes;
    let usedCount = possibleMenus[i].usedIngredientCount;
    let usedIngredients = possibleMenus[i].usedIngredients;
    let menuServing = possibleMenus[i].servings;
    let ingredientData = [];
    let totalLackIngredient = [];
    let hasThai = 0;
    let tasteScore = 0;
    let cuisineScore = 0;



    //4.5) nutrition < user's daily/3)
    for (let s = 0; s < possibleMenus[i].nutrition.nutrients.length; s++) {
      if (possibleMenus[i].nutrition.nutrients[s].name == "Calories") {
        menuEnergy = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Fat") {
        menuFat = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Carbohydrates") {
        menuCarb = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Sugar") {
        menuSugar = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Protein") {
        menuProtein = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Sodium") {
        menuSodium = possibleMenus[i].nutrition.nutrients[s].amount;
      }
      if (possibleMenus[i].nutrition.nutrients[s].name == "Fiber") {
        menuFiber = possibleMenus[i].nutrition.nutrients[s].amount;
      }
    }
    const nutrition = {
      energy: menuEnergy * servingSize,
      fat: menuFat * servingSize,
      carb: menuCarb * servingSize,
      sugar: menuSugar * servingSize,
      protein: menuProtein * servingSize,
      sodium: menuSodium * servingSize,
      fiber: menuFiber * servingSize,
    };
    if (
      nutrition.energy <= userNutrition.energyAvg &&
      nutrition.fat <= userNutrition.fatAvg &&
      nutrition.carb <= userNutrition.carbAvg &&
      nutrition.sugar <= userNutrition.sugarAvg &&
      nutrition.protein <= userNutrition.proteinAvg &&
      nutrition.sodium <= userNutrition.sodiumAvg &&
      nutrition.fiber <= userNutrition.fiberAvg &&
      possibleMenus[i].analyzedInstructions.length != 0
    ) {
      let recipe = possibleMenus[i].analyzedInstructions[0].steps;
      let recipeStep = [];
      let step = 0;
      for (let r = 0; r < recipe.length; r++) {
        // let step = recipe[r].number;
        ++step;
        let instruction = recipe[r].step;
        if (instruction.length == 0 || instruction == "" || instruction == undefined) {
          --step;
          continue;
        }
        let shortInstruction = instruction.substring(
          0,
          instruction.indexOf(".")
        );
        recipeStep.push({
          step: step,
          instruction: shortInstruction,
        });
      }
      //5) score each menus --> lacking(ingredient/serving size -- transform all ingredients object), ranking taste, cuisine
      //ingredients
      for (let k = 0; k < usedCount; k++) {
        let ingredientID = usedIngredients[k].id;
        let ingredientName = usedIngredients[k].name;
        let amount = usedIngredients[k].amount;
        let convertedAmount = servingSize * (amount / menuServing);
        let unit = usedIngredients[k].unit;
        let convertedUnitAmount;

        for (let m = 0; m < userIngredient.length; m++) {
          let userIngredientID = userIngredient[m].id;
          let userIngredientName = userIngredient[m].name;
          let userAmount = userIngredient[m].quantity;
          let userUnit = userIngredient[m].unit;

          if (
            ingredientID == userIngredientID ||
            ingredientName.includes(userIngredientName) ||
            userIngredientName.includes(ingredientName)
          ) {
            ingredientName = userIngredientName;
            if (
              userUnit == unit ||
              unit.includes(userUnit) ||
              userUnit.includes(unit)
            ) {
              if (userAmount < convertedAmount) {
                totalLackIngredient.push(ingredientName);
                //if want to tell how many can calculate here
              }
            } else {
              convertedUnitAmount = await convertAmount(
                ingredientName,
                convertedAmount,
                unit,
                userUnit
              );
              if (userAmount < convertedUnitAmount) {
                totalLackIngredient.push(ingredientName);

                //if want to tell how many can calculate here
              }
            }
          }
        }

        ingredientData.push({
          id: ingredientID,
          name: ingredientName,
          amount: Math.round(convertedAmount * 100) / 100,
          unit: unit,
        });
      }
      //score ingredient
      let actualUsedCount = usedCount - totalLackIngredient.length;
      let ingredientScore =
        Math.round(50 * (actualUsedCount / usedCount) * 100) / 100;
      //score taste
      const menuTaste = await getMenuTaste(menuID);
      const menuTasteRank = await getRanked(menuTaste);

      if (menuTasteRank.one == userTasteRank.one) {
        tasteScore = Math.round((1 / 7) * 25 * 100) / 100;
        if (menuTasteRank.two == userTasteRank.two) {
          tasteScore = Math.round((2 / 7) * 25 * 100) / 100;
          if (menuTasteRank.three == userTasteRank.three) {
            tasteScore = Math.round((3 / 7) * 25 * 100) / 100;
            if (menuTasteRank.four == userTasteRank.four) {
              tasteScore = Math.round((4 / 7) * 25 * 100) / 100;
              if (menuTasteRank.five == userTasteRank.five) {
                tasteScore = Math.round((5 / 7) * 25 * 100) / 100;
                if (menuTasteRank.six == userTasteRank.six) {
                  tasteScore = Math.round((6 / 7) * 25 * 100) / 100;
                  if (menuTasteRank.seven == userTasteRank.seven) {
                    tasteScore = 25;
                  }
                }
              }
            }
          }
        }
      } else {
        tasteScore = 0;
      }
      //score cuisine
      if (possibleMenus[i].cuisines.length == 0) {
        cuisineScore = userCuisine.notThaiAvg * 25;
      } else {
        for (let q = 0; q < possibleMenus[i].cuisines.length; q++) {
          let cuisine = possibleMenus[i].cuisines[q];
          if (cuisine == "thai") {
            hasThai++;
          }
        }
        if (hasThai == 1) {
          cuisineScore = userCuisine.thaiAvg * 25;
        } else {
          cuisineScore = userCuisine.notThaiAvg * 25;
        }
      }

      //6)push to database
      let params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: `user_${userID}`,
          SK: `gen_${timestamp}_${menuID}`,
          id: menuID,
          title: menuTitle,
          duration: duration,
          score: ingredientScore + cuisineScore + tasteScore,
          totalLackIngredient: totalLackIngredient,
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
        console.log(`Success: gen_${timestamp}_${menuID}`);
      } catch (err) {
        console.log("Error", err);
        console.log(params.Item);
      }

      genMenuData.push({
        PK: `user_${userID}`,
        SK: `gen_${timestamp}_${menuID}`,
        menuID: menuID,
        ingredientData: ingredientData,
        menuTitle: menuTitle,
        ingredientScore: ingredientScore,
        tasteScore: tasteScore,
        cuisineScore: cuisineScore,
        score: ingredientScore + cuisineScore + tasteScore,
        duration: duration,
        energy: nutrition.energy,
        fat: nutrition.fat,
        carb: nutrition.carb,
        sugar: nutrition.sugar,
        protein: nutrition.protein,
        sodium: nutrition.sodium,
        fiber: nutrition.fiber,
        recipe: recipeStep,
        timestamp: timestamp + "",
        servingSize: servingSize,
        genFor: genFor,
        genBy: genBy,
        url: url,
      });
    }
  }
  //7)optimise
  let optimizedMenu = await getOptimized(genMenuData, genBy);
  if (optimizedMenu != undefined) {
    let params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK: `user_${userID}`,
        SK: `optimised_${timestamp}`,
        genKey: optimizedMenu,
      },
    };
    try {
      await dynamodb.put(params).promise();
      console.log(`Success: optimsed_${timestamp}`);
    } catch (err) {
      console.log("Error", err);
      console.log(params.Item);
    }
  }

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    statusCode: 200,
    body: JSON.stringify(genMenuData),
  };
};

const getLimit = async (userID, genFor) => {
  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;
  let total_fiber = 0;
  let total_thai = 0;
  let total_notthai = 0;
  let sumfat = 0;
  let sumspicy = 0;
  let sumsalty = 0;
  let sumbitter = 0;
  let sumsavory = 0;
  let sumsweet = 0;
  let sumsour = 0;

  for (let i = 0; i < genFor.length; i++) {
    const name = genFor[i];
    const profileInfo = await getProfileInfo(userID, name, "daily");
    total_energy += parseInt(profileInfo.energy);
    total_fat += parseInt(profileInfo.fat);
    total_carb += parseInt(profileInfo.carb);
    total_sugar += parseInt(profileInfo.sugar);
    total_protein += parseInt(profileInfo.protein);
    total_sodium += parseInt(profileInfo.sodium);
    total_fiber += parseInt(profileInfo.fiber);
    const cuisineInfo = await getProfileInfo(userID, name, "cuisine");
    total_thai += cuisineInfo.thai;
    total_notthai += cuisineInfo.notthai;
    const tasteInfo = await getProfileInfo(userID, name, "taste");
    sumfat += tasteInfo.fattiness;
    sumspicy += tasteInfo.spiciness;
    sumsalty += tasteInfo.saltiness;
    sumbitter += tasteInfo.bitterness;
    sumsavory += tasteInfo.savoriness;
    sumsweet += tasteInfo.sweetness;
    sumsour += tasteInfo.sourness;
  }
  let dailyAvg = {
    energyAvg: Math.round((total_energy / genFor.length) * 100) / 100,
    fatAvg: Math.round((total_fat / genFor.length) * 100) / 100,
    carbAvg: Math.round((total_carb / genFor.length) * 100) / 100,
    sugarAvg: Math.round((total_sugar / genFor.length) * 100) / 100,
    proteinAvg: Math.round((total_protein / genFor.length) * 100) / 100,
    sodiumAvg: Math.round((total_sodium / genFor.length) * 100) / 100,
    fiberAvg: Math.round((total_fiber / genFor.length) * 100) / 100,
  };
  let cuisineAvg = {
    thaiAvg: total_thai / genFor.length,
    notThaiAvg: total_notthai / genFor.length,
  };
  let tasteAvg = {
    fattiness: sumfat / genFor.length,
    spiciness: sumspicy / genFor.length,
    saltiness: sumsalty / genFor.length,
    bitterness: sumbitter / genFor.length,
    savoriness: sumsavory / genFor.length,
    sweetness: sumsweet / genFor.length,
    sourness: sumsour / genFor.length,
  };

  const userTasteRank = await getRanked(tasteAvg);

  let results = {
    daily: dailyAvg,
    cuisine: cuisineAvg,
    taste: userTasteRank,
  };
  return results;
};

const getProfileInfo = async (userID, profileName, topic) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      // SK: `${topic}_${profileName}`,
      SK: topic + "_" + profileName,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};
const getRanked = async (json) => {
  let entries = Object.entries(json);
  let sorted = entries.sort((a, b) => b[1] - a[1]);
  let first = sorted[0][0];
  let second = sorted[1][0];
  let third = sorted[2][0];
  let fourth = sorted[3][0];
  let fifth = sorted[4][0];
  let sixth = sorted[5][0];
  let seventh = sorted[6][0];
  let rank = {
    one: first,
    two: second,
    three: third,
    four: fourth,
    five: fifth,
    six: sixth,
    seven: seventh,
  };
  return rank;
};

const getMenuTaste = async (menuID) => {
  let search_url = `https://api.spoonacular.com/recipes/${menuID}/tasteWidget.json?apiKey=e15593c068d142fa9cf278b7a68e8638`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};

const getUserIngredient = async (userID) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `user_${userID}`,
      ":sk": "ingredient_",
    },
  };
  const result = await dynamodb.query(params).promise();
  return result.Items;
};

const getPossibleMenu = async (userID, nutritionLimit) => {
  const userIngredient = await getUserIngredient(userID);
  const userIngredients = userIngredient;
  let ingredientNameList = "";
  for (let i = 0; i < userIngredients.length; i++) {
    ingredientNameList += userIngredients[i].name + ",";
  }
  let ingredientList = ingredientNameList.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=4631dc8e84774bf39edd76df5679ba38&ingredients=${ingredientList}&ignorePantry=true&ranking=2`;
  let res = await fetch(search_url);
  let json = await res.json();
  if (json.length == 0) {
    search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8&ingredients=${ingredientList}&ignorePantry=true&ranking=2`;
    res = await fetch(search_url);
    json = await res.json();
  }
  //4) get possible menus (missedIngredientCount = 0 && title.length < 40 && nutrition < user's daily/3)
  let menuIDs = "";
  for (let i = 0; i < json.length; i++) {
    // if (json[i].title.length < 41) {
    //   possibleMenus.push(json[i]);
    // }
    if (json[i].missedIngredientCount == 0 && json[i].title.length < 41) {
      menuIDs += json[i].id + ",";
    }
  }
  let menuIDsList = menuIDs.slice(0, -1);
  let search_url1 = `https://api.spoonacular.com/recipes/informationBulk?apiKey=4631dc8e84774bf39edd76df5679ba38&ids=${menuIDsList}&includeNutrition=true`;
  let res1 = await fetch(search_url1);
  let possibleMenus = await res1.json();
  if (possibleMenus.length == 0) {
    search_url1 = `https://api.spoonacular.com/recipes/informationBulk?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8&ids=${menuIDsList}&includeNutrition=true`;
    res1 = await fetch(search_url1);
    possibleMenus = await res1.json();
  }
  let allMenuInfo = [];
  for (let j = 0; j < json.length; j++) {
    let menuID = json[j].id;
    for (let k = 0; k < possibleMenus.length; k++) {
      if (menuID == possibleMenus[k].id) {
        allMenuInfo.push({ ...possibleMenus[k], ...json[j] });
      }
    }
  }
  let result = {
    userIngredient: userIngredients,
    possibleMenus: allMenuInfo,
  };
  return result;
};

const convertAmount = async (
  ingredientName,
  convertedAmount,
  unit,
  userUnit
) => {
  let amount = convertedAmount;
  let roundAmount = 0;
  ///maybe try your own conversion
  let search_url = `https://api.spoonacular.com/recipes/convert?apiKey=e15593c068d142fa9cf278b7a68e8638&ingredientName=${ingredientName}&sourceAmount=${convertedAmount}&sourceUnit=${unit}&targetUnit=${userUnit}`;
  try {
    let res = await fetch(search_url);
    let json = await res.json();
    amount = json.targetAmount;
    roundAmount = Math.round(amount * 100) / 100;
  } catch (err) {
    console.log(err);
  }
  return roundAmount;
};

const getOptimized = async (menuArr, genBy) => {
  const opDuration = genBy.duration;
  const opEnergy = genBy.energy;
  const opFat = genBy.fat;
  const opCarb = genBy.carb;
  const opSugar = genBy.sugar;
  const opProtein = genBy.protein;
  const opSodium = genBy.sodium;
  const opFiber = genBy.fiber;
  let menuIDs = [];

  let durationObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.duration }),
    {}
  );
  let energyObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.energy }),
    {}
  );
  let fatObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.fat }),
    {}
  );
  let carbObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.carb }),
    {}
  );
  let sugarObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.sugar }),
    {}
  );
  let proteinObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.protein }),
    {}
  );
  let sodiumObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.sodium }),
    {}
  );
  let fiberObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.fiber }),
    {}
  );
  let maxDurationMenu = "";
  let minDurationMenu = "";
  //check duration
  if (opDuration == "max") {
    let menu = await checkMax(durationObj);
    menuIDs.push(menu);
    maxDurationMenu = menu;
  } else {
    let menu = await checkMin(durationObj);
    menuIDs.push(menu);
    minDurationMenu = menu;
  }
  //check energy
  if (opEnergy == "max") {
    let menu = await checkMax(energyObj);
    menuIDs.push(menu);
  } else {
    let menu = await checkMin(energyObj);
    menuIDs.push(menu);
  }
  //check fat
  if (opFat == "max") {
    let menu = await checkMax(fatObj);
    menuIDs.push(menu);
  } else if (opFat == "min") {
    let menu = await checkMin(fatObj);
    menuIDs.push(menu);
  } else if (opFat == "0") {
    let menu = await checkZero(fatObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  //check carb
  if (opCarb == "max") {
    let menu = await checkMax(carbObj);
    menuIDs.push(menu);
  } else if (opCarb == "min") {
    let menu = await checkMin(carbObj);
    menuIDs.push(menu);
  } else if (opCarb == "0") {
    let menu = await checkZero(carbObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  //check sugar
  if (opSugar == "max") {
    let menu = await checkMax(sugarObj);
    menuIDs.push(menu);
  } else if (opSugar == "min") {
    let menu = await checkMin(sugarObj);
    menuIDs.push(menu);
  } else if (opSugar == "0") {
    let menu = await checkZero(sugarObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  //check protein
  if (opProtein == "max") {
    let menu = await checkMax(proteinObj);
    menuIDs.push(menu);
  } else if (opProtein == "min") {
    let menu = await checkMin(proteinObj);
    menuIDs.push(menu);
  } else if (opProtein == "0") {
    let menu = await checkZero(proteinObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  //check sodium
  if (opSodium == "max") {
    let menu = await checkMax(sodiumObj);
    menuIDs.push(menu);
  } else if (opSodium == "min") {
    let menu = await checkMin(sodiumObj);
    menuIDs.push(menu);
  } else if (opSodium == "0") {
    let menu = await checkZero(sodiumObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  //check fiber
  if (opFiber == "max") {
    let menu = await checkMax(fiberObj);
    menuIDs.push(menu);
  } else if (opFiber == "min") {
    let menu = await checkMin(fiberObj);
    menuIDs.push(menu);
  } else if (opFiber == "0") {
    let menu = await checkZero(fiberObj);
    if (menu != 0) {
      menuIDs.push(menu);
    }
  }
  let result = await findUniqueDuplicates(menuIDs);
  if (result.length == 0) {
    if (opDuration == "max") {
      return maxDurationMenu;
    } else {
      return minDurationMenu;
    }
  } else {
    return result[0];
  }
};

const checkMax = async (obj) => {
  return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
};
const checkMin = async (obj) => {
  return Object.keys(obj).reduce((a, b) => (obj[a] < obj[b] ? a : b));
};
const checkZero = async (obj) => {
  let res = Object.keys(obj).find((key) => obj[key] === 0);
  if (res == undefined) {
    return 0;
  } else return res;
};
const findUniqueDuplicates = async (arr) => {
  let res = arr.filter((item, index) => arr.indexOf(item) !== index);
  return [...new Set(res)];
};

//ideal1
//https://api.spoonacular.com/recipes/findByIngredients?apiKey=7b9f2b35ba8f4fe697b93357fdc09314&ignorePantry=true&ingredients=meat,asparagus,%20cheese,pork,chicken,bacon,seasoning,rice&ranking=2

//ideal healthy
//https://api.spoonacular.com/recipes/findByIngredients?apiKey=7b9f2b35ba8f4fe697b93357fdc09314&ignorePantry=true&ingredients=egg,cauliflower,chicken,carrot,broccoli,onion,lettuce,milk,herb,mushroom&ranking=2
