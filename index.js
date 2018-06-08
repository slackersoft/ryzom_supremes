const express = require('express');
const morgan = require('morgan');
const ryzomTime = require('./lib/ryzomTime');
const humidity = require('./lib/humidity');

let app = express();
app.use(morgan('combined'));

app.get('/', async (req, res) => {
  let currentTime = await ryzomTime.fetchCurrentTime();
  let times = [currentTime];
  while (times.length < 10) {
    times.push(times[times.length - 1].next());
  }
  times.forEach(time => {
    time.humidity = Math.floor(humidity(time.cycleNumber) * 100) + '%';
  });
  res.json(times);
});

app.listen(process.env.PORT || 3000);
