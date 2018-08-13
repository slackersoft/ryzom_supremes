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

function sups(allWeather, zone, startIndex) {
  return {
    mats: materials.supremes(allWeather[startIndex].ryzomTime.season, allWeather[startIndex].humidity, zone),
    weather: allWeather[startIndex],
  };
}

function upcomingWeatherBands(weather) {
  const bands = [];
  weather.forEach(w => {
    if (bands.length === 0) {
      bands.push({
        weather: w
      });
    } else if (!bands[bands.length - 1].endTime && w.weatherClass !== bands[bands.length - 1].weather.weatherClass) {
      bands[bands.length - 1].endTime = w.ryzomTime;
    }
    if (bands[bands.length - 1].endTime && bands.map(b => b.weather.weatherClass).every(wc => wc !== w.weatherClass)) {
      bands.push({
        weather: w
      });
    }
  });
  return bands;
}

app.get('/', async (req, res) => {
  let currentTime = await ryzomTime.fetchCurrentTime();
  let times = [currentTime];
  while (times.length < 24) {
    times.push(times[times.length - 1].next());
  }
  let weather = times.map(time => new WeatherReport(time, Math.floor(humidity(time.cycleNumber) * 100)));
  let supremes = {};
  if (req.query.zone) {
    console.dir(upcomingWeatherBands(weather));
    supremes.current = sups(weather, req.query.zone, 0);
//    {
//      mats: materials.supremes(weather[0].ryzomTime.season, weather[0].humidity, req.query.zone),
//      weather: weather[0],
//    };
    const nextChange = weather.find(w => w.weatherClass !== weather[0].weatherClass);
    supremes.next = {
      mats: materials.supremes(nextChange.ryzomTime.season, nextChange.humidity, req.query.zone),
      weather: nextChange,
    };
    const afterThat = weather.find(w => w.weatherClass !== weather[0].weatherClass && w.weatherClass !== nextChange.weatherClass);
    supremes.afterThat = {
      mats: materials.supremes(afterThat.ryzomTime.season, afterThat.humidity, req.query.zone),
      weather: afterThat,
    };
    const lastOne = weather.find(w => [weather[0].weatherClass, nextChange.weatherClass, afterThat.weatherClass].indexOf(w.weatherClass) < 0)
    supremes.lastOne = {
      mats: materials.supremes(lastOne.ryzomTime.season, lastOne.humidity, req.query.zone),
      weather: lastOne,
    };
  }

  res.render('index', { weather, supremes, zones, seasons, zone: req.query.zone });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status_code || 500).send(err.message);
});

app.listen(process.env.PORT || 3000);
