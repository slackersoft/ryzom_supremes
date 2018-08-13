function getWeatherClass(humidity) {
  humidity = typeof humidity === 'number' ? humidity : parseInt(humidity, 10);
  if (humidity < 17) {
    return 'best';
  } else if (humidity <= 50) {
    return 'good';
  } else if (humidity <= 83) {
    return 'bad';
  } else {
    return 'worst';
  }
}

function getWeatherColor(weatherClass) {
  switch(weatherClass) {
    case 'best':
      return 'color: #FF00FF;text-decoration:none;';
    case 'good':
      return 'color: #00CCFF;text-decoration:none;';
    case 'bad':
      return 'color: #A494E4;text-decoration:none;';
    case 'worst':
      return 'color: #FF7500;text-decoration:none;';
  }
}

class WeatherReport {
  constructor(ryzomTime, humidity) {
    this.ryzomTime = ryzomTime;
    this.humidity = humidity + '%';
    this.weatherClass = getWeatherClass(humidity);
    this.weatherColor = getWeatherColor(this.weatherClass);
  }
}

module.exports = WeatherReport;
