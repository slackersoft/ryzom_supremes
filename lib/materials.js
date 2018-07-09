const path = require('path');
const sups = require(path.resolve('./mats.json'));

const seasonNames = ['spring', 'summer', 'autumn', 'winter'];

function bandHumidity(humidity) {
  humidity = parseInt(humidity.replace('%', ''));
  if (humidity > 83) {
    return '83-100';
  } else if (humidity >= 50) {
    return '50-83';
  } else if (humidity > 16) {
    return '16-60';
  } else {
    return '0-16';
  }
}

function supremes(season, humidity, zone) {
  const seasonName = seasonNames[season];
  const mats = sups[seasonName][bandHumidity(humidity)];
  return Object.keys(mats).reduce((all, matType) => {
    return all.concat(mats[matType].filter(m => m.zone === zone));
  }, []);
}

module.exports = {
  supremes
};
