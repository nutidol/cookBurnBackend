const dynamodb = require("../dynamodb");
const fetch = require("node-fetch");

//post menuFilter
//energy avg devided by three!!!!
module.exports.genMenu = async (event) => {
  const data = JSON.parse(event.body);
  const userID = data.userID;
  const timestamp = data.timestamp;
  const genFor = data.genFor; // get an array of this of this
  const genBy = data.genBy; //get array of this
  const servingSize = data.servingSize;
  let ingredientNameList = "";
  let menuID_str = "";
  let total_energy = 0;
  let total_fat = 0;
  let total_carb = 0;
  let total_sugar = 0;
  let total_protein = 0;
  let total_sodium = 0;
  let total_fiber = 0;
  let menuID = 0;
  let menuTitle = "";
  let genMenuData = [];
  let missedCount = 0;
  let usedCount = 0;
  let duration = 0;
  let convertedAmount = 0;
  let unit = "";
  let ingredientData = [];

  let userUnit = "";
  let userAmount = 0;

  let convertedUnitAmount = 0;
  let menuServing = 0;
  let ingredientID = 0;
  let missingIngredient = [];
  let lackingIngredient = [];
  let totalLackIngredient = [];

  let ingredientName = "";
  let amount = 0;

  let actualUsedCount = 0;
  let ingredientScore = 0;
  let cuisineScore = 0;
  let tasteScore = 0;
  let hasThai = 0;

  let missedIngredients = [];
  let usedIngredients = [];

  let total_thai = 0;
  let total_notthai = 0;
  let sumfat = 0;
  let sumspicy = 0;
  let sumsalty = 0;
  let sumbitter = 0;
  let sumsavory = 0;
  let sumsweet = 0;
  let sumsour = 0;

  let menuEnergy = 0;
  let menuFat = 0;
  let menuCarb = 0;
  let menuSugar = 0;
  let menuProtein = 0;
  let menuSodium = 0;
  let menuFiber = 0;
  let url = "";

  for (let i = 0; i < genFor.length; i++) {
    const name = genFor[i].profile;
    const profileInfo = await getProfileInfo(userID, name);
    total_energy += parseInt(profileInfo.energy);
    total_fat += parseInt(profileInfo.fat);
    total_carb += parseInt(profileInfo.carb);
    total_sugar += parseInt(profileInfo.sugar);
    total_protein += parseInt(profileInfo.protein);
    total_sodium += parseInt(profileInfo.sodium);
    total_fiber += parseInt(profileInfo.fiber);

    const cuisineInfo = await getUserCuisine(userID, name);
    total_thai += cuisineInfo.thai;
    total_notthai += cuisineInfo.notthai;

    const tasteInfo = await getUserTaste(userID, name);
    sumfat += tasteInfo.fattiness;
    sumspicy += tasteInfo.spiciness;
    sumsalty += tasteInfo.saltiness;
    sumbitter += tasteInfo.bitterness;
    sumsavory += tasteInfo.savoriness;
    sumsweet += tasteInfo.sweetness;
    sumsour += tasteInfo.sourness;
  }
  const thaiAvg = total_thai / genFor.length;
  const notThaiAvg = total_notthai / genFor.length;

  const fattinessAvg = sumfat / genFor.length;
  const spicinessAvg = sumspicy / genFor.length;
  const saltinessAvg = sumsalty / genFor.length;
  const bitternessAvg = sumbitter / genFor.length;
  const savorinessAvg = sumsavory / genFor.length;
  const sweetnessAvg = sumsweet / genFor.length;
  const sournessAvg = sumsour / genFor.length;

  const taste = {
    fattiness: fattinessAvg,
    spiciness: spicinessAvg,
    saltiness: saltinessAvg,
    bitterness: bitternessAvg,
    savoriness: savorinessAvg,
    sweetness: sweetnessAvg,
    sourness: sournessAvg,
  };
  const userTasteRank = await getRanked(taste);

  //user's gen data of ..(genby).. --> nutrition per meal
  const energyAvg = Math.round((total_energy / genFor.length) * 100) / 100;
  const fatAvg = Math.round((total_fat / genFor.length) * 100) / 100;
  const carbAvg = Math.round((total_carb / genFor.length) * 100) / 100;
  const sugarAvg = Math.round((total_sugar / genFor.length) * 100) / 100;
  const proteinAvg = Math.round((total_protein / genFor.length) * 100) / 100;
  const sodiumAvg = Math.round((total_sodium / genFor.length) * 100) / 100;
  const fiberAvg = Math.round((total_fiber / genFor.length) * 100) / 100;

  const userIngredient = await getUserIngredient(userID);

  for (let i = 0; i < userIngredient.length; i++) {
    ingredientNameList += userIngredient[i].name + ",";
  }
  const possibleMenus = await getPossibleMenu(ingredientNameList);

  for (let i = 0; i < possibleMenus.length; i++) {
    menuID_str += possibleMenus[i].id + ",";
  }
  const menuInfo = await getMenuInfo(menuID_str);

  for (let i = 0; i < possibleMenus.length; i++) {
    menuID = possibleMenus[i].id;
    menuTitle = possibleMenus[i].title;
    url = possibleMenus[i].image;

    for (let j = 0; j < menuInfo.length; j++) {
      if (menuID == menuInfo[j].id) {
        console.log(`${menuID}: ${menuTitle}`);

        missedCount = possibleMenus[i].missedIngredientCount;
        usedCount = possibleMenus[i].usedIngredientCount;
        missedIngredients = possibleMenus[i].missedIngredients;
        usedIngredients = possibleMenus[i].usedIngredients;
        duration = menuInfo[j].readyInMinutes;
        missingIngredient = [];
        lackingIngredient = [];
        ingredientData = [];
        totalLackIngredient = [];
        hasThai = 0;

        menuServing = menuInfo[j].servings;
        //if there's missing ingredient
        if (missedCount != 0) {
          for (let n = 0; n < missedCount; n++) {
            ingredientName = missedIngredients[n].name;
            missingIngredient.push(ingredientName);
            totalLackIngredient.push(ingredientName);
          }
        }
        //loop through used ingredient -> lack or not
        for (let k = 0; k < usedCount; k++) {
          ingredientID = usedIngredients[k].id;
          ingredientName = usedIngredients[k].name;
          amount = usedIngredients[k].amount;
          convertedAmount = servingSize * (amount / menuServing);
          unit = usedIngredients[k].unit;

          for (let m = 0; m < userIngredient.length; m++) {
            userIngredientID = userIngredient[m].id;
            userIngredientName = userIngredient[m].name;
            userAmount = userIngredient[m].quantity;
            userUnit = userIngredient[m].unit;

            if (
              ingredientID == userIngredientID ||
              ingredientName.includes(userIngredientName) ||
              userIngredientName.includes(ingredientName)
            ) {
              if (
                userUnit == unit ||
                unit.includes(userUnit) ||
                userUnit.includes(unit)
              ) {
                if (userAmount < convertedAmount) {
                  lackingIngredient.push(ingredientName);
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
                  lackingIngredient.push(ingredientName);
                  totalLackIngredient.push(ingredientName);

                  //if want to tell how many can calculate here
                }
              }
            }
          }
        }
        //score ingredient = 50 (match/all) = 50(used/use+miss)
        //miss1, use1 --> use/(miss+use) = 25
        //miss1, use2(lack1) --> use-lack/(miss+use) = 1/3(50)
        actualUsedCount = usedCount - lackingIngredient.length;
        ingredientScore =
          Math.round(50 * (actualUsedCount / (usedCount + missedCount)) * 100) /
          100;
        //update score (cuisine, taste)
        //cuisine
        //loop through menu's array if there's thai
        if (menuInfo[j].cuisines.length == 0) {
          cuisineScore = notThaiAvg * 25;
        } else {
          for (let q = 0; q < menuInfo[j].cuisines.length; q++) {
            let cuisine = menuInfo[j].cuisines[q];
            if (cuisine == "Thai") {
              hasThai++;
            }
          }
          if (hasThai == 1) {
            cuisineScore = thaiAvg * 25;
          } else {
            cuisineScore = notThaiAvg * 25;
          }
        }
        // taste
        // get tasteRank of this menuID
        // compare with userTasteRank
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

        //get ingredient info (converted qty, unit)
        for (let p = 0; p < menuInfo[j].extendedIngredients.length; p++) {
          let menuInfoIngredientID = menuInfo[j].extendedIngredients[p].id;
          let menuInfoIngredientName = menuInfo[j].extendedIngredients[p].name;
          let menuInfoAmount = menuInfo[j].extendedIngredients[p].amount;
          let menuInfoConvertedAmount =
            servingSize * (menuInfoAmount / menuServing);
          let menuInfoUnit = menuInfo[j].extendedIngredients[p].unit;
          ingredientData.push({
            id: menuInfoIngredientID,
            name: menuInfoIngredientName,
            amount: Math.round(menuInfoConvertedAmount * 100) / 100,
            unit: menuInfoUnit,
          });
        }

        //update menu nutrition according to serving size (this case nutrition already per 1 serving size)
        for (let s = 0; s < menuInfo[j].nutrition.nutrients.length; s++) {
          if (menuInfo[j].nutrition.nutrients[s].name == "Calories") {
            menuEnergy = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Fat") {
            menuFat = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Carbohydrates") {
            menuCarb = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Sugar") {
            menuSugar = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Protein") {
            menuProtein = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Sodium") {
            menuSodium = menuInfo[j].nutrition.nutrients[s].amount;
          }
          if (menuInfo[j].nutrition.nutrients[s].name == "Fiber") {
            menuFiber = menuInfo[j].nutrition.nutrients[s].amount;
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
        console.log(`menuEnergy: ${menuEnergy}`);
        console.log(`energyAvg: ${energyAvg}`);

        if (
          menuEnergy <= energyAvg &&
          menuFat <= fatAvg &&
          menuCarb <= carbAvg &&
          menuSugar <= sugarAvg &&
          menuProtein <= proteinAvg &&
          menuSodium <= sodiumAvg &&
          menuFiber <= fiberAvg &&
          menuInfo[j].analyzedInstructions.length != 0
        ) {
          let recipe = menuInfo[j].analyzedInstructions[0].steps;
          let recipeStep = [];
          for (let r = 0; r < recipe.length; r++) {
            let step = recipe[r].number;
            let instruction = recipe[r].step;
            recipeStep.push({
              step: step,
              instruction: instruction,
            });
          }
          let params = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
              PK: `user_${userID}`,
              SK: `gen_${timestamp}_${menuID}`,
              id: menuID,
              title: menuTitle,
              duration: duration,
              score: ingredientScore + cuisineScore + tasteScore,
              missingIngredient: missingIngredient,
              lackingIngredient: lackingIngredient,
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

          ///push to database
          genMenuData.push({
            PK: `user_${userID}`,
            SK: `gen_${timestamp}_${menuID}`,
            menuID: menuID,
            score: ingredientScore + cuisineScore + tasteScore,
            duration: duration,
            energy: nutrition.energy,
            fat: nutrition.fat,
            carb: nutrition.carb,
            sugar: nutrition.sugar,
            protein: nutrition.protein,
            sodium: nutrition.sodium,
            fiber: nutrition.fiber,
          });
        }
      }
    }
  }

  //loop throuh genMenuData find max/min of genBy --> optimized
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
    // body: JSON.stringify(genMenuData),
    body: JSON.stringify(optimizedMenu),
  };
};

const getProfileInfo = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `daily_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
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

const getPossibleMenu = async (userIngredient) => {
  let ingredientList = userIngredient.slice(0, -1);
  // let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=4631dc8e84774bf39edd76df5679ba38&ingredients=${ingredientList}&ignorePantry=true&ranking=1`;
  let search_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8&ingredients=${ingredientList}&ignorePantry=true&ranking=1`;

  let res = await fetch(search_url);
  let json = await res.json();
  return json;
};

const getMenuInfo = async (menuIDs) => {
  let menuIDList = menuIDs.slice(0, -1);
  let search_url = `https://api.spoonacular.com/recipes/informationBulk?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8&ids=${menuIDList}&includeNutrition=true`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
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
  let search_url = `https://api.spoonacular.com/recipes/convert?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8&ingredientName=${ingredientName}&sourceAmount=${convertedAmount}&sourceUnit=${unit}&targetUnit=${userUnit}`;
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

const getUserCuisine = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `cuisine_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const getUserTaste = async (userID, profileName) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `user_${userID}`,
      SK: `taste_${profileName}`,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const getMenuTaste = async (menuID) => {
  let search_url = `https://api.spoonacular.com/recipes/${menuID}/tasteWidget.json?apiKey=57dea7a7968e4f2fb29c0fe73b479ce8`;
  let res = await fetch(search_url);
  let json = await res.json();
  return json;
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

  let scoreObj = menuArr.reduce(
    (obj, item) => Object.assign(obj, { [item.SK]: item.score }),
    {}
  );
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
  //check duration
  if (opDuration == "max") {
    let menu = await checkMax(durationObj);
    menuIDs.push(menu);
  } else if (opDuration == "min") {
    let menu = await checkMin(durationObj);
    menuIDs.push(menu);
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
  }
  //check energy
  if (opEnergy == "max") {
    let menu = await checkMax(energyObj);
    menuIDs.push(menu);
  } else if (opEnergy == "min") {
    let menu = await checkMin(energyObj);
    menuIDs.push(menu);
  } else {
    let menu = await checkMax(scoreObj);
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
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
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
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
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
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
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
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
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
  } else {
    let menu = await checkMax(scoreObj);
    menuIDs.push(menu);
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
  } else {
    let menu = await checkMax(fiberObj);
    menuIDs.push(menu);
  }
  let result = await findUniqueDuplicates(menuIDs);
  return result[0];
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

//saetang.nattharika
//e15593c068d142fa9cf278b7a68e8638
//nutidol@gmail
//e6b34e7165a042a49a19811bc0057118
//6031748721
//4631dc8e84774bf39edd76df5679ba38
//newnicknat
//57dea7a7968e4f2fb29c0fe73b479ce8
//nutidol@hotmail
//7b9f2b35ba8f4fe697b93357fdc09314
