import { useEffect, useState } from 'react';

const today = new Date();

const day = today.getDate().toString().padStart(2, '0');
const month = (today.getMonth() + 1).toString().padStart(2, '0');
const year = today.getFullYear();

const fullDate = `${year}-${month}-${day}`;

const weatherCodeToIcon = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
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
      <h1>CLASSY-WEATHER</h1>
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
              Weather in {name}, {country}{' '}
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
            <li className="day" key={day}>
              <span className="important">
                {weatherCodeToIcon[daily.weathercode[i]]}
              </span>
              <p>{day === fullDate ? 'Today' : day}</p>
              <em className="temp">
                {daily.temperature_2m_min[i]}°C - {daily.temperature_2m_max[i]}
                °C
              </em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
