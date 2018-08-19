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

function padTime(value) {
  if (value >= 10) {
    return value.toString();
  }
  return `0${value}`;
}

class RyzomTime {
  constructor(cycleStart, cycleNumber, season, hour, minute) {
    this.cycleStart = cycleStart;
    this.season = season;
    this.cycleNumber = cycleNumber;
    this.hour = hour;
    this.minute = minute;
  }

  prettyHour() {
    return `${padTime(this.cycleStart)}:00`;
  }

  next() {
    return new RyzomTime((this.cycleStart + 3) % RYZOM_DAY_IN_HOUR, this.cycleNumber + 1, this.season);
  }

  time() {
    return `${padTime(this.hour)}:${padTime(this.minute)}`;
  }
}

function getCurrentTick(shardTime, now) {
  now = Math.floor(now / 1000);
  const createdAt = Number(shardTime.cache[0].$.created);
  return Number(shardTime.server_tick[0]) + (now - createdAt);
}

function ryzomTime(shardTime, now) {
  const tick = getCurrentTick(shardTime, now);
  let days = Math.floor(tick / RYZOM_DAY_IN_TICKS);
  const ticksToday = tick - Math.floor(days * RYZOM_DAY_IN_TICKS);
  days = days - RYZOM_START_SPRING;
  const hours = Math.floor(ticksToday / RYZOM_HOURS_IN_TICKS);
  const ticksThisHour = ticksToday - hours * RYZOM_HOURS_IN_TICKS;
  const minutes = Math.floor(ticksThisHour / RYZOM_MINUTES_IN_TICKS);
  const cycleStart = Math.floor(hours / 3) * 3;
  const ryzomHoursFromStart = days * RYZOM_DAY_IN_HOUR + cycleStart;
  const cycleNumber = Math.floor(ryzomHoursFromStart / 3);
  console.log(hours, minutes);

  const season = parseInt(shardTime.season[0], 10);

  return new RyzomTime(cycleStart, cycleNumber, season, hours, minutes);
}

function createRyzomTime(raw) {
  return new Promise(function(resolve, reject) {
    xml2js.parseString(raw, (err, parsed) => {
      if (err) { reject(err); }

      let time = ryzomTime(parsed.shard_time, Date.now());
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
  ryzomTime,
  fetchCurrentTime
};
