"use strict";

module.exports.hello = async (event) => {
  const data = JSON.parse(event.body);

  const sweetness = data.sweetness;
  const sw = sweetness.toString();
  const saltiness = data.saltiness;
  const sourness = data.sourness;
  const bitterness = data.bitterness;
  const savoriness = data.savoriness;
  const fattiness = data.fattiness;
  const spiciness = data.spiciness;

  const res = `{"sweetness": {"N": "${sweetness}"}, \n"saltiness": {"N": "${saltiness}"}, \n "sourness":{"N": "${sourness}"}, \n"bitterness": {"N": "${bitterness}"}, \n"savoriness": {"N": "${savoriness}"}, \n "fattiness":{"N": "${fattiness}"}, \n "spiciness":{"N": "${spiciness}"}}`;

  return {
    statusCode: 200,
    body: res,
  };
};
