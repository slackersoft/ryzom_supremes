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

class WeatherReport {
  constructor(ryzomTime, humidity) {
    this.ryzomTime = ryzomTime;
    this.humidity = humidity + '%';
    this.weatherClass = getWeatherClass(humidity);
  }
}

module.exports = WeatherReport;
