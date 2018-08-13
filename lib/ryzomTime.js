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
    this.cycleNumber = cycleNumber;
  }

  prettyHour() {
    let h = [this.hourOfDay];
    if (this.hourOfDay < 10) {
      h.unshift(0);
    }
    return `${h.join('')}:00`;
  }

  next() {
    return new RyzomTime((this.hourOfDay + 3) % RYZOM_DAY_IN_HOUR, this.cycleNumber + 1, this.season);
  }
}

function getCurrentTick(shardTime) {
  const now = Math.floor(new Date().getTime() / 1000);
  const createdAt = Number(shardTime.cache[0].$.created);
  return Number(shardTime.server_tick[0]) + (now - createdAt);
}

function ryzomTime(shardTime) {
  const hourOfDay = Math.floor(Number(shardTime.time_of_day[0]) / 3) * 3;
  const tick = getCurrentTick(shardTime);
  let days = Math.floor(tick / RYZOM_DAY_IN_TICKS);
  const dayCycle = tick - Math.floor(days * RYZOM_DAY_IN_TICKS);
  days = days - RYZOM_START_SPRING;
  const hours = Math.floor(dayCycle / RYZOM_HOURS_IN_TICKS);
  const cycleStart = Math.floor(hours / 3) * 3;
  const ryzomHoursFromStart = days * RYZOM_DAY_IN_HOUR + cycleStart;
  const cycleNumber = Math.floor(ryzomHoursFromStart / 3);

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
