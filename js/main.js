// main.js
// 7Timer 7-day weather app
// - Loads cities from city_coordinates.csv
// - Fetches civillight forecast from 7Timer
// - Displays cards with icons, temps, and wind

const citySelect = document.getElementById("citySelect");
const lookupBtn  = document.getElementById("lookupBtn");
const statusEl   = document.getElementById("status");
const forecastEl = document.getElementById("forecast");

// Map 7Timer "weather" codes to icon file names in /icons
// (icons you generated: clear.png, pcloudy.png, mcloudy.png, cloudy.png, humid.png,
//  lightrain.png, oshower.png, ishower.png, lightsnow.png, rain.png, snow.png, ts.png)
function getIconPath(weatherCode) {
  // weatherCode is like: "clear", "pcloudy", "mcloudy", "cloudy", "humid",
  // "lightrain", "oshower", "ishower", "lightsnow", "rain", "snow", "ts"
  return `icons/${weatherCode}.png`;
}

// Load cities from CSV file and populate the dropdown
async function loadCities() {
  try {
    const resp = await fetch("city_coordinates.csv");
    if (!resp.ok) {
      throw new Error("Could not load city_coordinates.csv");
    }

    const text = await resp.text();
    const lines = text.trim().split(/\r?\n/);

    if (lines.length <= 1) {
      throw new Error("CSV has no data rows");
    }

    // Expecting header like: latitude,longitude,city,country
    const header = lines[0].split(",");
    const latIdx  = header.indexOf("latitude");
    const lonIdx  = header.indexOf("longitude");
    const cityIdx = header.indexOf("city");
    const countryIdx = header.indexOf("country"); // may or may not exist

    if (latIdx === -1 || lonIdx === -1 || cityIdx === -1) {
      throw new Error("CSV headers must include latitude, longitude, city");
    }

    // Clear existing options
    citySelect.innerHTML = "";

    // Add one default "placeholder" option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Select a city…";
    citySelect.appendChild(defaultOpt);

    // Add each city from CSV
    lines.slice(1).forEach(line => {
      if (!line.trim()) return; // skip blank lines
      const cols = line.split(",");
      const lat  = cols[latIdx];
      const lon  = cols[lonIdx];
      const city = cols[cityIdx];
      const country = countryIdx !== -1 ? cols[countryIdx] : "";

      const opt = document.createElement("option");
      opt.value = `${lat},${lon}`;
      opt.textContent = country ? `${city}, ${country}` : city;
      citySelect.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error loading city list.";
  }
}

// Fetch forecast for selected city
async function loadWeather() {
  const value = citySelect.value;

  // No city chosen
  if (!value) {
    statusEl.textContent = "Please choose a city.";
    return;
  }

  const [lat, lon] = value.split(",");

  // Clear UI
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

      // For civillight, temp2m is an object: { max, min }
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

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error loading forecast.";
  }
}

// Wire up events
lookupBtn.addEventListener("click", loadWeather);

// Load city list on page load
loadCities();
