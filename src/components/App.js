import { useEffect, useState } from 'react';

const today = new Date();

const day = today.getDate().toString().padStart(2, '0');
const month = (today.getMonth() + 1).toString().padStart(2, '0');
const year = today.getFullYear();

const fullDate = `${year}-${month}-${day}`;

const weatherCodeToIcon = {
  0: { icon: '☀️', label: 'Clear sky' },
  1: { icon: '🌤️', label: 'Mainly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Depositing rime fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Moderate drizzle' },
  55: { icon: '🌦️', label: 'Dense drizzle' },
  61: { icon: '🌧️', label: 'Slight rain' },
  63: { icon: '🌧️', label: 'Moderate rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  71: { icon: '❄️', label: 'Slight snow fall' },
  73: { icon: '❄️', label: 'Moderate snow fall' },
  75: { icon: '❄️', label: 'Heavy snow fall' },
  80: { icon: '🌦️', label: 'Slight rain showers' },
  81: { icon: '🌦️', label: 'Moderate rain showers' },
  82: { icon: '🌦️', label: 'Violent rain showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm with slight hail' },
  99: { icon: '⛈️', label: 'Thunderstorm with heavy hail' },
};

export default function App() {
  const [location, setLocation] = useState('');
  const [locationsData, setLocationsData] = useState();
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { name, country, country_code, latitude, longitude } =
    locationsData || {};

  useEffect(
    function () {
      const handler = setTimeout(() => {
        setDebouncedLocation(location);
      }, 1000);

      return function () {
        clearTimeout(handler);
      };
    },
    [location]
  );

  useEffect(
    function () {
      if (!debouncedLocation) return;

      const controller = new AbortController();

      async function getLocation() {
        try {
          setIsLoading(true);
          setStatusMessage('Fetching location...');
          setErrorMessage('');

          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${debouncedLocation}`,
            { signal: controller.signal }
          );

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          const locationResult = data?.results?.at(0);

          if (!locationResult) {
            throw new Error('No location data found');
          }
          setLocationsData(locationResult);
        } catch (error) {
          setErrorMessage(`Failed to fetch location data: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
      getLocation();

      return () => controller.abort();
    },
    [debouncedLocation]
  );

  return (
    <div className="app">
      <h1>WEATHER-FORCAST</h1>
      <input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Search for location..."
      />

      {isLoading && <p className="loader">Loading...</p>}

      {errorMessage && <h2 style={{ color: 'red' }}>{errorMessage}</h2>}

      {locationsData && !errorMessage && (
        <h2>
          {
            <>
              Weather forecast in {name}, {country}{' '}
              <img
                src={`https://flagcdn.com/48x36/${country_code?.toLowerCase()}.png`}
                alt={country}
                style={{ verticalAlign: 'middle' }}
              />
            </>
          }
        </h2>
      )}
      <Weather lon={longitude} lat={latitude} />
    </div>
  );
}

function Weather({ lon, lat }) {
  const [dailyWeatherConditions, setDailyWeatherConditions] = useState(null);
  const [weatherError, setWeatherError] = useState('');

  const { daily } = dailyWeatherConditions || {};

  function getWeekDays(i) {
    // const date = daily?.time.map((date, i) => new Date(date));
    // console.log(date[i].slice(' ', 1));
    // // return date;

    if (!daily?.time[i]) return '';
    const date = new Date(daily.time[i]);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    // return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  useEffect(
    function () {
      if (!lat && !lon) return;

      const controller = new AbortController();

      async function getWeather() {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`,
            { signal: controller.signal }
          );
          if (!res.ok) {
            throw new Error('Could not get weather data');
          }
          const data = await res.json();
          setDailyWeatherConditions(data);
        } catch (error) {
          // Optionally, show a message on UI using state:
          setWeatherError(`Could not get weather data: ${error.message}`);
        }
      }
      getWeather();

      return () => controller.abort();
    },
    [lon, lat]
  );

  return (
    <div>
      {weatherError && <h2 style={{ color: 'red' }}>{weatherError}</h2>}
      {!weatherError && (
        <ul className="weather">
          {daily?.time.map((day, i) => (
            <>
              <li className="day" key={day}>
                <span className="important">
                  {weatherCodeToIcon[daily.weathercode[i]].icon}
                </span>
                <p
                  style={{
                    fontSize: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {weatherCodeToIcon[daily.weathercode[i]].label}
                </p>
                {/* <p>{day === fullDate ? 'Today' : day}</p> */}
                <p>{getWeekDays(i)}</p>
                <em className="temp">
                  {daily.temperature_2m_min[i]}°C -{' '}
                  {daily.temperature_2m_max[i]}
                  °C
                </em>
              </li>
            </>
          ))}
        </ul>
      )}
    </div>
  );
}
