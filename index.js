const express = require('express');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const morgan = require('morgan');
const time = require('time');
const ryzomTime = require('./lib/ryzomTime');
const humidity = require('./lib/humidity');
const materials = require('./lib/materials');
const WeatherReport = require('./lib/weatherReport');
const tzdata = require('tzdata');

const allZones = Object.keys(tzdata.zones).sort();

const zones = {
  FD: 'Forbidden Depths',
  LoC: 'Land of Continuity',
  SC: 'Sunken City',
  US: 'Under Spring'
}

const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

let app = express();
app.use(morgan('combined'));
app.use(cookieParser());
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
      return 'color:#CF49CF;';
    case 'good':
      return 'color:#00CCFF;';
    case 'bad':
      return 'color:#A494E4;';
    case 'worst':
      return 'color:#FFA960;';
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

  const layout = req.query.ig ? 'ig' : 'index';

  res.render(layout, { view: 'contents', params: {
    weather, bands, zones, seasons, getWeatherColor, zone: req.query.zone
  }});
});

function currentZones(req, res, additionalZones) {
  const current = req.cookies.zone ? JSON.parse(req.cookies.zone) : [];
  additionalZones = additionalZones || [];
  const total = current.concat(additionalZones);
  res.setHeader('Set-Cookie',
    cookie.serialize('zone', JSON.stringify(total), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365 // 1 year
    }));

  return total;
}

app.get('/time', (req, res) => {
  const now = new time.Date();
  const timeZones = ['UTC'].concat(currentZones(req, res));

  const layout = req.query.ig ? 'ig' : 'index';
  res.render(layout, { view: 'times', params: {
    now, timeZones, allZones, timeInZone: (t, z) => {
      t.setTimezone(z);
      return t.toString();
    }
  }});
});

app.use('/time/addZone', express.urlencoded());
app.post('/time/addZone', (req, res) => {
  currentZones(req, res, [req.body.zone]);
  res.redirect('/time');
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status_code || 500).send(err.message);
});

app.listen(process.env.PORT || 3000);
