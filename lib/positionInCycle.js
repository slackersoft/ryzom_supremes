const bignum = require('bignum');
const path = require('path');
const weathers = require(path.resolve('./base_weather.json')).spring;

function not(num) {
  return num.xor(bignum("FFFFFFFFFFFFFFFF", 16));
}

function wangHash(key) {
  let num = bignum(key);
  //num = not(num).add(num.shiftLeft(21));
  num = num.shiftLeft(21).sub(num).sub(1);
  num = num.xor(num.shiftRight(24));
  num = num.mul(265);
  num = num.xor(num.shiftRight(14));
  num = num.mul(21);
  num = num.xor(num.shiftRight(28));
  num = num.add(num.shiftLeft(31));
  num = num.and(bignum("FFFFFFFFFFFFFFFF", 16));

  return num;
}

function positionInCycle(cycle) {
  let value = wangHash(cycle).mod(100).toNumber();
  let currentWeight = 0;
  let k = 0;
  for(k = 0; k < weathers.length; k++) {
    if (value >= currentWeight && value <= currentWeight + weathers[k].weight) {
      return (((value - currentWeight) / weathers[k].weight) + k) / weathers.length;
    }
    currentWeight = currentWeight + weathers[k].weight;
  }
  return null;
}

module.exports = positionInCycle;
