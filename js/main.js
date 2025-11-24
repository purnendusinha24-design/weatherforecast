// main.js - fetches 7Timer data and renders a 7-day forecast
(async function(){
  const citySelect = document.getElementById('citySelect');
  const lookupBtn = document.getElementById('lookupBtn');
  const statusEl = document.getElementById('status');
  const forecastEl = document.getElementById('forecast');

  // Load city list (CSV) shipped with starter
  async function loadCities(){
    const res = await fetch('city_coordinates.csv');
    const text = await res.text();
    const lines = text.trim().split('\n');
    const header = lines.shift().split(',');
    const cities = lines.map(line => {
      // handle commas inside names
      const parts = line.split(',');
      // latitude,longitude,city,country
      return {
        lat: parts[0],
        lon: parts[1],
        city: parts[2],
        country: parts[3]
      };
    });
    return cities;
  }

  function populateCities(cities){
    // prefer major cities first (simple sort)
    cities.sort((a,b)=> a.city.localeCompare(b.city, undefined, {sensitivity: 'base'}));
    cities.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = `${c.lat},${c.lon}`;
      opt.textContent = `${c.city}, ${c.country}`;
      citySelect.appendChild(opt);
    });
  }

  function showStatus(msg, err=false){
    statusEl.textContent = msg;
    statusEl.style.color = err ? '#900' : '#222';
  }

  function mapWeatherToImage(code){
    // mapping to images in images/ folder
    const map = {
      'clear': 'clear.png',
      'pcloudy': 'pcloudy.png',
      'mcloudy': 'mcloudy.png',
      'cloudy': 'cloudy.png',
      'humid': 'humid.png',
      'lightrain': 'lightrain.png',
      'oshower': 'oshower.png',
      'ishower': 'ishower.png',
      'lightsnow': 'lightsnow.png',
      'snow': 'snow.png',
      'rainsnow': 'rainsnow.png',
      'tsrain': 'tsrain.png',
      'tstorm': 'tstorm.png',
      'windy': 'windy.png',
      'fog': 'fog.png',
      'rain': 'rain.png'
    };
    return map[code] || 'clear.png';
  }

  function renderForecast(cityLabel, data){
    forecastEl.innerHTML = '';
    const header = document.createElement('h2');
    header.textContent = `7-day forecast — ${cityLabel}`;
    forecastEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cards';

    // dataseries usually provides multiple timesteps (every 3-hour or daily depending on product)
    // We will take first 7 distinct dates (date string)
    const seenDates = new Set();
    const days = [];
    for (let item of data.dataseries){
      const date = item.date.toString(); // e.g., 20251123
      const dateStr = date;
      if (!seenDates.has(dateStr)){
        seenDates.add(dateStr);
        days.push(item);
      }
      if (days.length >= 7) break;
    }

    days.forEach(day => {
      const card = document.createElement('article');
      card.className = 'card';
      const d = document.createElement('div');
      d.className = 'date';
      // format date like YYYYMMDD -> readable
      const ds = day.date.toString();
      const y = ds.slice(0,4), m = ds.slice(4,6), dday = ds.slice(6,8);
      d.textContent = `${y}-${m}-${dday}`;
      const img = document.createElement('img');
      img.alt = day.weather;
      img.src = 'images/' + mapWeatherToImage(day.weather);
      img.width = 64;
      img.height = 64;

      const we = document.createElement('div');
      we.className = 'weather';
      we.innerHTML = `<strong>${day.weather}</strong>`;

      const temp = document.createElement('div');
      // use temp2m if present: temp2m:max/min fields may exist, else temp2m
      let tempText = '';
      if (day.temp2m_min !== undefined && day.temp2m_max !== undefined) {
        tempText = `${day.temp2m_min}°C — ${day.temp2m_max}°C`;
      } else if (day.temp2m !== undefined) {
        tempText = `${day.temp2m}°C`;
      } else {
        tempText = 'N/A';
      }
      temp.className = 'temp';
      temp.textContent = tempText;

      const precip = document.createElement('div');
      precip.className = 'precip';
      precip.textContent = `Precip: ${day.prec_type || day.prec_amount || 'N/A'}`;

      card.appendChild(d);
      card.appendChild(img);
      card.appendChild(we);
      card.appendChild(temp);
      card.appendChild(precip);

      grid.appendChild(card);
    });

    forecastEl.appendChild(grid);
  }

  async function fetchForecast(lat, lon){
    // 7Timer API: product=civillight / output=json
    // Use 'civillight' product which has dataseries daily
    const url = `https://www.7timer.info/bin/api.pl?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&product=civillight&output=json`;
    showStatus('Loading forecast...');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data;
    } catch(err){
      throw err;
    }
  }

  // Wire up
  try {
    const cities = await loadCities();
    populateCities(cities);
    showStatus('Select a city and click Get Forecast');
  } catch(err){
    showStatus('Failed to load city list', true);
    console.error(err);
  }

  lookupBtn.addEventListener('click', async ()=>{
    const val = citySelect.value;
    if (!val) return;
    const [lat, lon] = val.split(',');
    const label = citySelect.options[citySelect.selectedIndex].text;
    try {
      showStatus('Fetching forecast for ' + label + ' ...');
      const data = await fetchForecast(lat, lon);
      if (data && data.dataseries && data.dataseries.length>0){
        renderForecast(label, data);
        showStatus('Forecast loaded');
      } else {
        showStatus('No forecast data returned', true);
      }
    } catch(err){
      console.error(err);
      showStatus('Failed to fetch forecast: ' + err.message, true);
    }
  });

})();
