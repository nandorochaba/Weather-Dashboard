import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";

/* --------------------------
   RELÓGIO EM TEMPO REAL
-------------------------- */
const dateTimeEl = document.getElementById('dateTime');

function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateTimeEl.textContent = `${date}, ${time}`;
}
updateDateTime();
setInterval(updateDateTime, 60000);

/* -----------------------------------------
   PEGAR LOCALIZAÇÃO DO USUÁRIO + CLIMA API
------------------------------------------- */

async function loadWeather() {
    if (!navigator.geolocation) {
        alert("Seu navegador não permite geolocalização.");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // API Open-Meteo (GRÁTIS)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&forecast_days=4&timezone=auto`;

        const res = await fetch(url);
        const data = await res.json();

        updateWeatherUI(data, lat, lon);
    });
}

function updateWeatherUI(data, lat, lon) {
    const current = data.current;
    const daily = data.daily;

    document.getElementById("temperature").textContent = current.temperature_2m + "°C";
    document.getElementById("humidity").textContent = "Humidity: " + current.relative_humidity_2m + "%";
    document.getElementById("windSpeed").textContent = "Wind: " + current.wind_speed_10m + " km/h";
    document.getElementById("precipitationChance").textContent = "Rain: " + current.precipitation + "%";

    document.getElementById("sunriseTime").textContent = daily.sunrise[0].split("T")[1];
    document.getElementById("sunsetTime").textContent = daily.sunset[0].split("T")[1];

    // Cálculo do tempo total do dia
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    const diff = new Date(sunset - sunrise);
    const hours = diff.getUTCHours();
    const mins = diff.getUTCMinutes();
    document.getElementById("dayLength").textContent = `${hours} h ${mins} m`;

    // PEGAR NOME DA CIDADE
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
        .then(res => res.json())
        .then(loc => {
            document.getElementById("location").textContent = `${loc.city || loc.locality}, ${loc.countryName}`;
        });

    // Ícone principal
    const icon = document.getElementById("mainIcon");
    icon.textContent = chooseWeatherIcon(current);

    // Previsão 4 dias
    const forecastDiv = document.getElementById("forecast");
    forecastDiv.innerHTML = "";
    const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    for (let i = 0; i < 4; i++) {
        const date = new Date(daily.time[i]);
        const day = weekdays[date.getDay()];
        const high = daily.temperature_2m_max[i];
        const low = daily.temperature_2m_min[i];

        const card = `
        <div class="forecast-day bg-white/5 rounded-xl p-3 w-20 text-center border border-white/10 shadow-sm">
            <div class="day-name text-xs font-medium mb-1 opacity-80">${i === 0 ? "Today" : day}</div>
            <div class="forecast-icon text-2xl my-1">${chooseWeatherIcon({ precipitation: daily.precipitation_sum[i] })}</div>
            <div class="high-temp text-sm font-semibold">${high}°</div>
            <div class="low-temp text-xs opacity-70">${low}°</div>
        </div>`;

        forecastDiv.innerHTML += card;
    }
}

function chooseWeatherIcon(data) {
    if (data.precipitation > 60) return "🌧️";
    if (data.precipitation > 20) return "🌦️";
    if (data.temperature_2m > 28) return "☀️";
    if (data.temperature_2m < 10) return "❄️";
    return "⛅";
}

// Carregar clima no início
loadWeather();
