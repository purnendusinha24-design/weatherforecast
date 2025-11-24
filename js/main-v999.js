(async function() {
  const citySelect = document.getElementById("citySelect");
  const lookupBtn = document.getElementById("lookupBtn");
  const statusEl = document.getElementById("status");
  const forecastEl = document.getElementById("forecast");

  function showStatus(msg, err = false) {
    statusEl.textContent = msg;
    statusEl.style.color = err ? "red" : "black";
  }

  async function loadCities(){
  const res = await fetch('https://raw.githubusercontent.com/purnendusinha24-design/weatherforecast/main/city_coordinates.csv');
  const text = await res.text();
  
  const lines = text.trim().split('\n');
  lines.shift(); // remove header

  return lines.map(line => {
    const parts = line.split(',');
    return {
      lat: parts[0],
      lon: parts[1],
      city: parts[2],
      country: parts[3]
    };
  });
}

  function populateCities(cities) {
    cities.sort((a, b) => a.city.localeCompare(b.city));
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = `${c.lat},${c.lon}`;
      opt.textContent = `${c.city}, ${c.country}`;
      citySelect.appendChild(opt);
    });
  }

  // Correct WORKING 7Timer Endpoint
  async function fetchForecast(lat, lon) {
    const url =
      `https://www.7timer.info/bin/civillight.php?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&ac=0&unit=metric&output=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");

    return await res.json();
  }

  function mapIcon(code) {
    return `images/${code}.png`;
  }

  function renderForecast(cityLabel, data) {
    forecastEl.innerHTML = "";

    if (!data.dataseries) {
      forecastEl.textContent = "No forecast available.";
      return;
    }

    const header = document.createElement("h2");
    header.textContent = `7-Day Forecast — ${cityLabel}`;
    forecastEl.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "cards";
    forecastEl.appendChild(grid);

    data.dataseries.slice(0, 7).forEach(day => {
      const card = document.createElement("div");
      card.className = "card";

      const dateText = day.date.toString();
      const yyyy = dateText.slice(0, 4);
      const mm = dateText.slice(4, 6);
      const dd = dateText.slice(6, 8);

      card.innerHTML = `
        <div class="date">${yyyy}-${mm}-${dd}</div>
        <img src="${mapIcon(day.weather)}" alt="${day.weather}" width="64">
        <div class="weather"><strong>${day.weather}</strong></div>
        <div class="temp">${day.temp2m.min}°C — ${day.temp2m.max}°C</div>
        <div class="precip">Precip: ${day.prec_type || "N/A"}</div>
      `;
      grid.appendChild(card);
    });
  }

  // Initialize
  try {
    const cities = await loadCities();
    populateCities(cities);
    showStatus("Select a city and click Get Forecast");
  } catch (err) {
    console.error(err);
    showStatus("Failed to load city list", true);
  }

  lookupBtn.addEventListener("click", async () => {
    const value = citySelect.value;
    if (!value) return;

    const label = citySelect.options[citySelect.selectedIndex].text;
    const [lat, lon] = value.split(",");

    try {
      showStatus(`Fetching forecast for ${label}...`);
      const data = await fetchForecast(lat, lon);
      renderForecast(label, data);
      showStatus("Forecast loaded");
    } catch (err) {
      console.error(err);
      showStatus("Failed to fetch forecast", true);
    }
  });

})();
