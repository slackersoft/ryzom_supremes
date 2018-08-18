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

const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

let app = express();
app.use(morgan('combined'));
app.set('view engine', 'ejs');

app.use('/css', express.static('css'));
app.use('/images', express.static('images'));

if (process.env['NODE_ENV'] === 'production') {
  const cfenv = require('cfenv');
  const appEnv = cfenv.getAppEnv();
  const secrets = appEnv.getServiceCreds('secrets');
  const cookieSession = require('cookie-session');
  const auth = require('./lib/auth');
  app.use(cookieSession({
    name: 'session',
    secret: secrets.cookie
  }));
  app.use(auth(secrets.appKey));
}

function upcomingWeatherBands(weather, zone) {
  const bands = [];
  weather.forEach(w => {
    if (bands.length === 0) {
      bands.push({
        weather: w,
        sups: materials.supremes(w.ryzomTime.season, w.humidity, zone)
      });
    } else if (!bands[bands.length - 1].endTime && w.weatherClass !== bands[bands.length - 1].weather.weatherClass) {
      bands[bands.length - 1].endTime = w.ryzomTime;
    }
    if (bands[bands.length - 1].endTime && bands.map(b => b.weather.weatherClass).every(wc => wc !== w.weatherClass)) {
      bands.push({
        weather: w,
        sups: materials.supremes(w.ryzomTime.season, w.humidity, zone)
      });
    }
  });
  return bands;
}

function getWeatherColor(weatherClass) {
  switch(weatherClass) {
    case 'best':
      return '#CF49CF';
    case 'good':
      return '#00CCFF';
    case 'bad':
      return '#A494E4';
    case 'worst':
      return '#FFA960';
  }
}

app.get('/', async (req, res) => {
  let currentTime = await ryzomTime.fetchCurrentTime();
  let times = [currentTime];
  while (times.length < 24) {
    times.push(times[times.length - 1].next());
  }
  let weather = times.map(time => new WeatherReport(time, Math.floor(humidity(time.cycleNumber) * 100)));
  let bands = []
  if (req.query.zone) {
    bands = upcomingWeatherBands(weather, req.query.zone);
  }

  res.render('index', { weather, bands, zones, seasons, getWeatherColor, zone: req.query.zone });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status_code || 500).send(err.message);
});

app.listen(process.env.PORT || 3000);
