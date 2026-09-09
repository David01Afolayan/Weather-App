const apiKey = "524e02987153213e8cf8681f62673cb8";
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weather = document.getElementById("weather");
const updatedEl = document.getElementById("updated");
const dateValue = document.getElementById("dateValue");
const searchForm = document.getElementById("searchForm");
const body = document.body;

// Utility: format date/time for UI
function formatDateTime(d = new Date()){
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const date = d.toLocaleDateString(undefined, options);
    const time = d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
    return { date, time };
}

// Apply theme classes to body (remove previous theme classes first)
function setBackground(condition, iconCode){
    // Clear theme classes
    body.classList.remove('bg-sunny','bg-cloudy','bg-rainy','bg-snowy','bg-default','bg-night');

    // Night detection: OpenWeather icon codes end with 'n' for night, 'd' for day
    const isNight = iconCode && iconCode.endsWith('n');

    if (condition === 'Clear'){
        body.classList.add(isNight ? 'bg-night' : 'bg-sunny');
    } else if (['Rain','Drizzle','Thunderstorm'].includes(condition)){
        body.classList.add('bg-rainy');
    } else if (condition === 'Clouds'){
        body.classList.add('bg-cloudy');
    } else if (condition === 'Snow'){
        body.classList.add('bg-snowy');
    } else {
        body.classList.add('bg-default');
    }
}

// Show a small inline loader
function showLoader(){
    weather.innerHTML = `<div class="loader" role="status" aria-label="loading"></div>`;
}

// Render weather card with unit toggle (C/F)
function renderWeather(data){
    const cityName = data.name;
    const country = data.sys.country;
    const cTemp = Math.round(data.main.temp);
    const condition = data.weather[0].main;
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    // Save last successful city
    try{ localStorage.setItem('weather:lastCity', cityName); }catch(e){}

    const card = document.createElement('div');
    card.className = 'weather-card';
    card.innerHTML = `
        <h2>${cityName}, ${country}</h2>
        <div class="weather-main">
            <img src="${iconUrl}" alt="${description}" loading="lazy">
            <div>
                <div class="temp"><span id="tempValue">${cTemp}</span>°<span id="tempUnit">C</span></div>
                <div class="description">${description}</div>
            </div>
        </div>
        <div class="extra">
            <div><strong>${humidity}%</strong><span>Humidity</span></div>
            <div><strong>${windSpeed} m/s</strong><span>Wind</span></div>
        </div>
        <div style="display:flex;justify-content:center"><button class="unit-toggle" id="unitToggle" aria-pressed="false">Show °F</button></div>
    `;

    weather.innerHTML = '';
    weather.appendChild(card);

    // Update updated timestamp and date pill
    const now = new Date();
    const dt = formatDateTime(now);
    if (updatedEl) updatedEl.textContent = `Updated at ${dt.time}`;
    if (dateValue) dateValue.textContent = dt.date;

    setBackground(condition, icon);

    // Unit toggle behavior
    const unitToggle = document.getElementById('unitToggle');
    const tempValueEl = document.getElementById('tempValue');
    const tempUnitEl = document.getElementById('tempUnit');
    let showingC = true;

    unitToggle.addEventListener('click', () =>{
        showingC = !showingC;
        unitToggle.textContent = showingC ? 'Show °F' : 'Show °C';
        unitToggle.setAttribute('aria-pressed', (!showingC).toString());
        if (showingC){
            tempValueEl.textContent = cTemp;
            tempUnitEl.textContent = 'C';
        } else {
            const f = Math.round((cTemp * 9/5) + 32);
            tempValueEl.textContent = f;
            tempUnitEl.textContent = 'F';
        }
    });
}

async function fetchWeather(city){
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    showLoader();

    try{
        const res = await fetch(url);
        if (!res.ok) throw new Error('City not found');
        const data = await res.json();
        renderWeather(data);
    }catch(err){
        weather.innerHTML = `<div class="weather-card"><p style="color:#c0353e">${err.message}. Try another city.</p></div>`;
        setBackground('Default');
    }
}

// Handle form submit (search)
searchForm.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const city = cityInput.value.trim();
    if (!city){
        weather.innerHTML = `<div class="weather-card"><p>Please enter a city name.</p></div>`;
        return;
    }
    fetchWeather(city);
});

// Load last city on start if available
(function init(){
    // initialize date and time pill
    const now = new Date();
    const dt = formatDateTime(now);
    if (dateValue) dateValue.textContent = dt.date;
    if (updatedEl) updatedEl.textContent = `Updated at ${dt.time}`;

    // attempt to load last city from storage
    try{
        const last = localStorage.getItem('weather:lastCity');
        if (last){
            cityInput.value = last;
            fetchWeather(last);
        }
    }catch(e){/* ignore storage errors */}
})();

// Keyboard accessibility: Enter inside input will submit via form so no extra handler needed