// js/main.js
// 7Timer 7-day weather app

const citySelect = document.getElementById("citySelect");
const lookupBtn  = document.getElementById("lookupBtn");
const statusEl   = document.getElementById("status");
const forecastEl = document.getElementById("forecast");

// Convert YYYYMMDD → YYYY/MM/DD
function formatDate(yyyymmdd) {
  const s = yyyymmdd.toString();
  const y = s.slice(0, 4);
  const m = s.slice(4, 6);
  const d = s.slice(6, 8);
  return `${y}/${m}/${d}`;
}

// Map 7Timer weather codes to icons in /weather_icons
function getIconPath(weatherCode) {
  return `weather_icons/${weatherCode}.png`;
}

// Load city list from CSV
async function loadCities() {
  try {
    const resp = await fetch("city_coordinates.csv");
    if (!resp.ok) throw new Error(`Cannot load CSV: ${resp.status}`);

    const text = await resp.text();
    const lines = text.trim().split(/\r?\n/);

    const header = lines[0].split(",").map(h => h.toLowerCase());

    const latIdx = header.indexOf("latitude");
    const lonIdx = header.indexOf("longitude");
    const cityIdx = header.indexOf("city");
    const countryIdx = header.indexOf("country");

    if (latIdx === -1 || lonIdx === -1 || cityIdx === -1) {
      throw new Error("CSV must contain latitude, longitude, city");
    }

    citySelect.innerHTML = `<option value="">Select a city…</option>`;

    // Add each city
    lines.slice(1).forEach(line => {
      const cols = line.split(",");
      if (cols.length < 3) return;

      const lat = cols[latIdx].trim();
      const lon = cols[lonIdx].trim();
      const city = cols[cityIdx].trim();
      const country = countryIdx !== -1 ? cols[countryIdx].trim() : "";

      const opt = document.createElement("option");
      opt.value = `${lat},${lon}`;
      opt.textContent = country ? `${city}, ${country}` : city;
      citySelect.appendChild(opt);
    });

  } catch (err) {
    console.error("City load error:", err);
    statusEl.textContent = "Error loading city list.";
  }
}

// Load weather from 7Timer API
async function loadWeather() {
  const value = citySelect.value;

  if (!value) {
    statusEl.textContent = "Please select a city.";
    return;
  }

  statusEl.textContent = "Loading forecast...";
  forecastEl.innerHTML = "";

  const [lat, lon] = value.split(",");

  try {
    const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;
    const resp = await fetch(url);
    const data = await resp.json();

    statusEl.textContent = "";

    data.dataseries.slice(0, 7).forEach(day => {
      const card = document.createElement("div");
      card.className = "day-card";

      card.innerHTML = `
        <h3>${formatDate(day.date)}</h3>
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

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadCities();
  lookupBtn.addEventListener("click", loadWeather);
});
