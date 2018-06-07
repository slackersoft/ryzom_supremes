const xml2js = require('xml2js');
const express = require('express');
const request = require('request');
const morgan = require('morgan');
const ryzomTime = require('./lib/ryzomTime');
const positionInCycle = require('./lib/positionInCycle');

let app = express();
app.use(morgan('combined'));

function extend(base, override) {
  return Object.keys(override).reduce(function(i, k) {
    i[k] = override[k];
    return i;
  }, base);
}

app.get('/', (req, res) => {
  request.get('https://api.ryzom.com/time.php?format=xml', (httpErr, httpRes, httpBody) => {
    ryzomTime(httpBody).then(currentTime => {
      let times = [currentTime];
      while (times.length < 10) {
        times.push(times[times.length - 1].next());
      }
      times.forEach(time => {
        time.humidity = Math.floor(positionInCycle(time.cycleNumber) * 100);
      });
      res.json(times);
    });
  });
});

app.listen(3000);
