const xml2js = require('xml2js');
const request = require('request');

const RYZOM_HOURS_IN_TICKS = 1800;
const RYZOM_DAY_IN_HOUR= 24;
const RYZOM_HOUR_IN_MINUTES= 60;
const RYZOM_MINUTES_IN_TICKS = RYZOM_HOURS_IN_TICKS / RYZOM_HOUR_IN_MINUTES;
const RYZOM_DAY_IN_TICKS= RYZOM_HOURS_IN_TICKS * RYZOM_DAY_IN_HOUR;
const RYZOM_SEASON_IN_DAY= 90;
const RYZOM_MONTH_IN_DAY= 30;
const RYZOM_YEAR_IN_MONTH= 48;
const RYZOM_WEEK_IN_DAY= 6;
const RYZOM_YEAR_IN_DAY= RYZOM_MONTH_IN_DAY*RYZOM_YEAR_IN_MONTH;
const RYZOM_CYCLE_IN_MONTH= 12;

const RYZOM_START_YEAR= 2570-2;
const RYZOM_START_SPRING= 61;

class RyzomTime {
  constructor(hourOfDay, cycleNumber, season) {
    this.hourOfDay = hourOfDay;
    this.season = season;
    // keep this out of JSON conversion
    Object.defineProperty(this, 'cycleNumber', { value: cycleNumber, writable: false });
  }

  next() {
    return new RyzomTime((this.hourOfDay + 3) % RYZOM_DAY_IN_HOUR, this.cycleNumber + 1);
  }
}

function ryzomTime(shardTime) {
  let hourOfDay = Math.floor(Number(shardTime.time_of_day[0]) / 3) * 3;
  let tick = Number(shardTime.server_tick[0]);
  let days = Math.floor(tick / RYZOM_DAY_IN_TICKS);
  let dayCycle = tick - Math.floor(days * RYZOM_DAY_IN_TICKS);
  days = days - RYZOM_START_SPRING;
  let hours = Math.floor(dayCycle / RYZOM_HOURS_IN_TICKS);
  let cycleStart = Math.floor(hours / 3) * 3;
  let ryzomHoursFromStart = days * RYZOM_DAY_IN_HOUR + cycleStart;
  let cycleNumber = Math.floor(ryzomHoursFromStart / 3);

  const season = parseInt(shardTime.season[0], 10);

  return new RyzomTime(hourOfDay, cycleNumber, season);
}

function createRyzomTime(raw) {
  return new Promise(function(resolve, reject) {
    xml2js.parseString(raw, (err, parsed) => {
      if (err) { reject(err); }

      let time = ryzomTime(parsed.shard_time);
      resolve(time);
    });
  });
}

function fetchCurrentTime() {
  return new Promise(function(resolve, reject) {
    request.get('https://api.ryzom.com/time.php?format=xml', (httpErr, httpRes, httpBody) => {
      if (httpErr) {
        reject(httpErr);
      } else {
        resolve(httpBody);
      }
    });
  }).then(createRyzomTime);
}

module.exports = {
  createRyzomTime,
  fetchCurrentTime
};
