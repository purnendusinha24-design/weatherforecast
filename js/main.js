// js/main.js
// 7Timer 7-day weather app

const citySelect = document.getElementById("citySelect");
const lookupBtn  = document.getElementById("lookupBtn");
const statusEl   = document.getElementById("status");
const forecastEl = document.getElementById("forecast");

// Map 7Timer "weather" codes to PNG icons in /weather_icons
function getIconPath(weatherCode) {
  // codes: clear, pcloudy, mcloudy, cloudy, humid,
  // lightrain, oshower, ishower, lightsnow, rain, snow, ts
  return `weather_icons/${weatherCode}.png`;
}

// Load cities from CSV and fill the dropdown
async function loadCities() {
  console.log("Loading cities from CSV…");
  try {
    const resp = await fetch("city_coordinates.csv");
    if (!resp.ok) {
      throw new Error(`Could not load city_coordinates.csv (status ${resp.status})`);
    }

    const text = await resp.text();
    const lines = text.trim().split(/\r?\n/);

    if (lines.length <= 1) {
      throw new Error("CSV has no data rows");
    }

    // Detect header style: either
    // 1) latitude,longitude,city,country
    // 2) city,lat,lon
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    console.log("CSV header:", header);

    let latIdx  = header.indexOf("latitude");
    let lonIdx  = header.indexOf("longitude");
    let cityIdx = header.indexOf("city");
    let countryIdx = header.indexOf("country");

    // fallback: city,lat,lon
    if (latIdx === -1 && lonIdx === -1) {
      latIdx  = header.indexOf("lat");
      lonIdx  = header.indexOf("lon");
    }

    if (latIdx === -1 || lonIdx === -1 || cityIdx === -1) {
      throw new Error("CSV headers must include latitude & longitude (or lat/lon) and city");
    }

    // Clear existing options
    citySelect.innerHTML = "";

    // Placeholder option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Select a city…";
    citySelect.appendChild(defaultOpt);

    // Add each row as an <option>
    lines.slice(1).forEach(line => {
      if (!line.trim()) return; // skip empty lines
      const cols = line.split(",");
      if (cols.length < 3) return;

      const lat  = cols[latIdx].trim();
      const lon  = cols[lonIdx].trim();
      const city = cols[cityIdx].trim();
      const country = countryIdx !== -1 ? cols[countryIdx].trim() : "";

      const opt = document.createElement("option");
      opt.value = `${lat},${lon}`;
      opt.textContent = country ? `${city}, ${country}` : city;
      citySelect.appendChild(opt);
    });

    console.log("Cities loaded into dropdown");

  } catch (err) {
    console.error("Error in loadCities:", err);
    statusEl.textContent = "Error loading city list. Check console for details.";
  }
}

// Fetch weather for selected city
async function loadWeather() {
  const value = citySelect.value;

  if (!value) {
    statusEl.textContent = "Please choose a city first.";
    return;
  }

  const [lat, lon] = value.split(",");
  console.log(`Loading weather for lat=${lat}, lon=${lon}`);

  forecastEl.innerHTML = "";
  statusEl.textContent = "Loading forecast…";

  try {
    const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`HTTP error: ${resp.status}`);
    }

    const data = await resp.json();
    const series = data.dataseries || [];

    if (!series.length) {
      statusEl.textContent = "No forecast data available.";
      return;
    }

    statusEl.textContent = "";

    // Show up to 7 days
    series.slice(0, 7).forEach(day => {
      const card = document.createElement("div");
      card.className = "day-card";

      const iconSrc = getIconPath(day.weather);

      // civillight uses temp2m: { max, min }
      const maxTemp = day.temp2m?.max;
      const minTemp = day.temp2m?.min;

      card.innerHTML = `
        <h3>${day.date}</h3>
        <img class="weather-icon" src="${iconSrc}" alt="${day.weather}" />
        <p><strong>${day.weather}</strong></p>
        <p>Temp: ${maxTemp}°C / ${minTemp}°C</p>
        <p>Wind max: ${day.wind10m_max} m/s</p>
      `;

      forecastEl.appendChild(card);
    });

    console.log("Forecast rendered");

  } catch (err) {
    console.error("Error in loadWeather:", err);
    statusEl.textContent = "Error loading forecast. Check console for details.";
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js loaded, initializing…");
  loadCities();
  lookupBtn.addEventListener("click", loadWeather);
});
