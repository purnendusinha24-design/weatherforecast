// js/main.js
// 7Timer 7-day weather app

const citySelect = document.getElementById("citySelect");
const lookupBtn  = document.getElementById("lookupBtn");
const statusEl   = document.getElementById("status");
const forecastEl = document.getElementById("forecast");

// Map 7Timer "weather" codes to PNG icons in /weather_icons
function getIconPath(weatherCode) {
  return `weather_icons/${weatherCode}.png`;
}

// Load cities from CSV and fill the dropdown
async function loadCities() {
  try {
    const resp = await fetch("city_coordinates.csv");
    if (!resp.ok) {
      throw new Error(`Cannot load CSV: ${resp.status}`);
    }

    const text = await resp.text();
    const lines = text.trim().split(/\r?\n/);

    const header = lines[0].split(",");
    const latIdx  = header.findIndex(h => h.toLowerCase() === "latitude");
    const lonIdx  = header.findIndex(h => h.toLowerCase() === "longitude");
    const cityIdx = header.findIndex(h => h.toLowerCase() === "city");
    const countryIdx = header.findIndex(h => h.toLowerCase() === "country");

    citySelect.innerHTML = "<option value=''>Select a city…</option>";

    lines.slice(1).forEach(line => {
      const cols = line.split(",");

      const lat  = cols[latIdx];
      const lon  = cols[lonIdx];
      const city = cols[cityIdx];
      const country = cols[countryIdx] || "";

      const opt = document.createElement("option");
      opt.value = `${lat},${lon}`;
      opt.textContent = country ? `${city}, ${country}` : city;
      citySelect.appendChild(opt);
    });

  } catch (err) {
    console.error("City loading error:", err);
    statusEl.textContent = "Error loading cities.";
  }
}

// Fetch weather for selected city
async function loadWeather() {
  const value = citySelect.value;
  if (!value) {
    statusEl.textContent = "Please choose a city.";
    return;
  }

  const [lat, lon] = value.split(",");
  statusEl.textContent = "Loading forecast...";
  forecastEl.innerHTML = "";

  try {
    const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;
    const resp = await fetch(url);
    const data = await resp.json();

    statusEl.textContent = "";

    data.dataseries.slice(0,7).forEach(day => {
      const card = document.createElement("div");
      card.className = "day-card";

      card.innerHTML = `
        <h3>${day.date}</h3>
        <img class="weather-icon" src="${getIconPath(day.weather)}" alt="${day.weather}">
        <p><strong>${day.weather}</strong></p>
        <p>Temp: ${day.temp2m.max}°C / ${day.temp2m.min}°C</p>
        <p>Wind: ${day.wind10m_max} m/s</p>
      `;

      forecastEl.appendChild(card);
    });

  } catch (err) {
    console.error("Forecast error:", err);
    statusEl.textContent = "Error loading forecast.";
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadCities();
  lookupBtn.addEventListener("click", loadWeather);
});
