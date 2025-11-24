(async function(){
  const citySelect = document.getElementById('citySelect');
  const lookupBtn = document.getElementById('lookupBtn');
  const statusEl = document.getElementById('status');
  const forecastEl = document.getElementById('forecast');

  // Load city CSV
  async function loadCities(){
    const res = await fetch('../city_coordinates.csv');
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

  function populateCities(cities){
    cities.sort((a,b)=> a.city.localeCompare(b.city));
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = `${c.lat},${c.lon}`;
      opt.textContent = `${c.city}, ${c.country}`;
      citySelect.appendChild(opt);
    });
  }

  function showStatus(msg, error=false){
    statusEl.textContent = msg;
    statusEl.style.color = error ? '#b00' : '#222';
  }

  const weatherMap = {
    clear: 'clear.png',
    pcloudy: 'pcloudy.png',
    mcloudy: 'mcloudy.png',
    cloudy: 'cloudy.png',
    humid: 'humid.png',
    lightrain: 'lightrain.png',
    oshower: 'oshower.png',
    ishower: 'ishower.png',
    lightsnow: 'lightsnow.png',
    snow: 'snow.png',
    rainsnow: 'rainsnow.png',
    tsrain: 'tsrain.png',
    tstorm: 'tstorm.png',
    windy: 'windy.png',
    fog: 'fog.png',
    rain: 'rain.png'
  };

  function renderForecast(label, data){
    forecastEl.innerHTML = '';

    const header = document.createElement('h2');
    header.textContent = `7-day forecast — ${label}`;
    forecastEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cards';

    let days = data.dataseries.slice(0, 7);

    days.forEach(day => {
      const card = document.createElement('article');
      card.className = 'card';

      const date = document.createElement('div');
      date.className = 'date';
      const ds = day.date.toString();
      date.textContent = `${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`;

      const img = document.createElement('img');
      img.src = `images/${weatherMap[day.weather] || 'clear.png'}`;
      img.alt = day.weather;

      const weather = document.createElement('div');
      weather.className = 'weather';
      weather.textContent = day.weather;

      const temp = document.createElement('div');
      temp.className = 'temp';
      temp.textContent = `${day.temp2m.min}°C — ${day.temp2m.max}°C`;

      const precip = document.createElement('div');
      precip.className = 'precip';
      precip.textContent = `Precip: ${day.prec_type || 'N/A'}`;

      card.append(date, img, weather, temp, precip);
      grid.appendChild(card);
    });

    forecastEl.appendChild(grid);
  }

  // Correct 7Timer API endpoint
  async function fetchForecast(lat, lon){
    const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json`;
    showStatus('Loading forecast...');

    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response error');

    return await res.json();
  }

  // Load cities + initialize
  try {
    const cities = await loadCities();
    populateCities(cities);
    showStatus('Select a city and click Get Forecast');
  } catch (err) {
    console.error(err);
    showStatus('Failed to load city list', true);
  }

  lookupBtn.addEventListener('click', async ()=> {
    const val = citySelect.value;
    if (!val) return;
    const [lat, lon] = val.split(',');
    const label = citySelect.options[citySelect.selectedIndex].text;

    try {
      const data = await fetchForecast(lat, lon);
      renderForecast(label, data);
      showStatus('Forecast loaded');
    } catch(err){
      console.error(err);
      showStatus(`Failed to fetch forecast: ${err.message}`, true);
    }
  });

})();
