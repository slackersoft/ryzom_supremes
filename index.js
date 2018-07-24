const express = require('express');
const morgan = require('morgan');
const ryzomTime = require('./lib/ryzomTime');
const humidity = require('./lib/humidity');
const materials = require('./lib/materials');
const WeatherReport = require('./lib/weatherReport');

const zones = {
  FD: 'Forbidden Depths',
  LoC: 'Land of Continuity',
  SC: 'Sunken City',
  US: 'Under Spring'
}

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
  let supremes = [];
  if (req.query.zone) {
    supremes = materials.supremes(currentTime.season, weather[0].humidity, req.query.zone);
  }
  const nextChange = weather.find(w => w.weatherClass !== weather[0].weatherClass);
  res.render('index', { weather, supremes, zones, nextChange, zone: req.query.zone });
});

app.listen(process.env.PORT || 3000);
