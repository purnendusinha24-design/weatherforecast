# js/main.js
async function loadCities() {
  const select = document.getElementById('citySelect');
  const csv = await fetch('city_coordinates.csv');
  const text = await csv.text();

  const rows = text.split(/\r?\n/);
  rows.forEach(line => {
    const parts = line.split(',');
    if (parts.length === 3) {
      const [city, lat, lon] = parts;
      const opt = document.createElement('option');
      opt.value = `${lat},${lon}`;
      opt.textContent = city;
      select.appendChild(opt);
    }
  });
}

function weatherIcon(code) {
  return `icons/${code}.png`;
}

async function loadWeather() {
  const select = document.getElementById('citySelect');
  const forecastBox = document.getElementById('forecast');
  const status = document.getElementById('status');

  forecastBox.innerHTML = '';
  status.textContent = 'Loading...';

  const [lat, lon] = select.value.split(',');

  try {
    const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;
    const response = await fetch(url);
    const data = await response.json();

    status.textContent = '';

    data.dataseries.forEach(day => {
      const card = document.createElement('div');
      card.className = 'day-card';

      card.innerHTML = `
        <h3>${day.date}</h3>
        <img class="weather-icon" src="${weatherIcon(day.weather)}" alt="icon" />
        <p><strong>${day.weather}</strong></p>
        <p>Temp: ${day.temp2m.max}°C / ${day.temp2m.min}°C</p>
        <p>Wind: ${day.wind10m_max} m/s</p>
      `;

      forecastBox.appendChild(card);
    });
  } catch (error) {
    status.textContent = 'Error loading forecast.';
    console.error(error);
  }
}

document.getElementById('lookupBtn').addEventListener('click', loadWeather);
loadCities();
