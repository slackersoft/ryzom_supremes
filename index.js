const express = require('express');
const morgan = require('morgan');
const ryzomTime = require('./lib/ryzomTime');
const humidity = require('./lib/humidity');
const WeatherReport = require('./lib/weatherReport');

let app = express();
app.use(morgan('combined'));
app.set('view engine', 'ejs');

app.use('/css', express.static('css'));

app.get('/', async (req, res) => {
  let currentTime = await ryzomTime.fetchCurrentTime();
  let times = [currentTime];
  while (times.length < 24) {
    times.push(times[times.length - 1].next());
  }
  let weather = times.map(time => new WeatherReport(time, Math.floor(humidity(time.cycleNumber) * 100)));
  res.render('index', { weather });
});

app.listen(process.env.PORT || 3000);
