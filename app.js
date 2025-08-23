let translations = {};
let weatherDesc = null;
const allPrayerKeys = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
  "Midnight",
  "Sunrise",
];
const actualPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
let translatedPray = {};
let hijriDateStr = "";

async function loadTranslations() {
  const response = await fetch("translations.json");
  translations = await response.json();
}

const container = document.querySelector(".container");
const effects = document.querySelector(".effects");
const sun = document.querySelector(".day-icon");
const moon = document.querySelector(".night-icon");

function updateSky() {
  const now = new Date();
  const hour = now.getHours();

  const hijriDay = parseInt(hijriDateStr.split("/")[0], 10);

  if ([13, 14, 15].includes(hijriDay)) {
    moon.src = "assets/moon.svg";
  } else {
    moon.src = "assets/half-moon.svg";
  }

  sun.classList.remove("sun-set", "sun-rise");
  moon.classList.remove("moon-rise", "moon-set");
  container.classList.remove("day", "night");

  if (hour >= 18 || hour < 4) {
    container.classList.add("night");
    sun.classList.add("sun-set");
    moon.classList.add("moon-rise");
  } else {
    container.classList.add("day");
    sun.classList.add("sun-rise");
    moon.classList.add("moon-set");
  }
}

function updateTime() {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ampm = hours24 >= 12 ? translations.ampm.pm : translations.ampm.am;
  const hours12 = (hours24 % 12 || 12).toString().padStart(2, "0");

  document.getElementById(
    "time-now"
  ).textContent = `${hours12}:${minutes}:${seconds} ${ampm}`;
  document.getElementById("day-now").textContent =
    translations.days[now.getDay()];

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const date = now.getDate().toString().padStart(2, "0");
  document.getElementById("date-now").textContent = `${year}-${month}-${date}`;
}

async function getWeather() {
  const lat = 24.7136;
  const lon = 46.6753;
  const apiKey = "8983998cd9fce60c71a2f472e2cbe032";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const weatherTemp = data.main.temp;
    weatherDesc = data.weather[0].description;
    const translatedDesc = translations.weather[weatherDesc] || weatherDesc;
    document.getElementById(
      "weather"
    ).textContent = `${weatherTemp}°C, ${translatedDesc}`;
  } catch (error) {
    console.error("Weather fetch error:", error);
  }

  updateWeatherEffect();
}

function updateWeatherEffect() {
  effects.innerHTML = "";
  container.classList.remove(
    "cloudy",
    "rainy",
    "sandstorm",
    "drizzle",
    "thunderstorm"
  );

  if (!weatherDesc) return;

  if (weatherDesc.includes("cloud")) {
    container.classList.add("cloudy");
    createCloud("assets/cloud-1.svg", 10, 0.8);
    createCloud("assets/cloud-2.svg", 20, 0.6);
  } else if (weatherDesc.includes("rain")) {
    container.classList.remove("day");
    container.classList.add("rainy");
    createRaindrops(100);
  } else if (weatherDesc.includes("thunderstorm")) {
    container.classList.remove("day");
    container.classList.add("thunderstorm");
    createRaindrops(150);
  } else if (weatherDesc.includes("dust") || weatherDesc.includes("sand")) {
    container.classList.remove("day");
    container.classList.add("sandstorm");
    createSandstorm();
  } else if (weatherDesc.includes("drizzle")) {
    createRaindrops(50);
  }
}

function createCloud(src, topPercent, opacity) {
  const cloud = document.createElement("img");
  cloud.src = src;
  cloud.className = "cloud";
  cloud.style.top = `${topPercent}%`;
  cloud.style.opacity = opacity;
  effects.appendChild(cloud);
}

function createRaindrops(num) {
  for (let i = 0; i < num; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";
    drop.style.left = Math.random() * 100 + "%";
    drop.style.animationDuration = 0.5 + Math.random() * 1 + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    effects.appendChild(drop);
  }
}

function createSandstorm() {
  const numParticles = 50;
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement("div");
    particle.className = "sand-particle";
    particle.style.setProperty("--rand-left", Math.random());
    particle.style.animationDuration = `${2 + Math.random() * 3}s`;
    effects.appendChild(particle);
  }
}

async function fetchPrayerTimes() {
  try {
    const apiURL =
      "https://api.aladhan.com/v1/timingsByCity?city=Riyadh&country=SA&method=4";
    const response = await fetch(apiURL);
    const data = await response.json();
    const timings = data.data.timings;

    translatedPray = translations.prayTime;
    const hijri = data.data.date.hijri;
    hijriDateStr = `${hijri.day}/${hijri.month.number}/${hijri.year}`;
    document.getElementById("date-hijri").textContent = hijriDateStr;

    const today = new Date().toISOString().split("T")[0];
    prayerTimes = {};
    allPrayerKeys.forEach((prayer) => {
      const [hour, minute] = timings[prayer].split(":");
      prayerTimes[prayer] = new Date(
        `${today}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`
      );
    });
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
}

function updatePrayerCountdown() {
  if (!Object.keys(prayerTimes).length) return;

  const now = new Date();
  let nextPrayer = null;
  let isNow = false;

  for (let prayer of allPrayerKeys) {
    const diff = (prayerTimes[prayer] - now) / 1000;
    if (diff >= 0 && diff <= 60) {
      nextPrayer = prayer;
      isNow = true;
      break;
    }
    if (prayerTimes[prayer] > now && !nextPrayer) {
      nextPrayer = prayer;
    }
  }

  if (!nextPrayer) {
    nextPrayer = "Fajr";
    prayerTimes[nextPrayer].setDate(prayerTimes[nextPrayer].getDate() + 1);
  }

  const hours = prayerTimes[nextPrayer].getHours() % 12 || 12;
  const mins = prayerTimes[nextPrayer].getMinutes().toString().padStart(2, "0");
  const ampm =
    prayerTimes[nextPrayer].getHours() >= 12
      ? translations.ampm.pm
      : translations.ampm.am;

  const diffMs = prayerTimes[nextPrayer] - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let displayText = "";

  if (isNow) {
    if (actualPrayers.includes(nextPrayer)) {
      displayText = `${translatedPray.now} ${translatedPray[nextPrayer]}`;
    } else {
      displayText = `${translatedPray[nextPrayer]} ${hours}:${mins} ${ampm} - ${diffHours}${translatedPray.H} ${diffMinutes}${translatedPray.M}`;
    }
  } else {
    if (actualPrayers.includes(nextPrayer)) {
      displayText =
        `${translatedPray.msg}: ${translatedPray[nextPrayer]} ${hours}:${mins} ${ampm}<br>` +
        `${translatedPray.next}: ${diffHours}${translatedPray.H} ${diffMinutes}${translatedPray.M}`;
    } else {
      displayText = `${translatedPray[nextPrayer]} ${hours}:${mins} ${ampm}<br>${translatedPray.H}${diffHours} - ${translatedPray.M}${diffMinutes} `;
    }
  }

  document.getElementById("pray-time").innerHTML = displayText;
}

function scheduleMidnightPrayerUpdate() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 5, 0);
  if (midnight <= now) {
    midnight.setDate(midnight.getDate() + 1);
  }
  const timeUntilMidnight = midnight - now;
  setTimeout(async () => {
    await fetchPrayerTimes();
    scheduleMidnightPrayerUpdate();
  }, timeUntilMidnight);
}

window.onload = async function () {
  await loadTranslations();
  updateSky();
  updateTime();
  getWeather();
  await fetchPrayerTimes();
  updatePrayerCountdown();
  scheduleMidnightPrayerUpdate();

  setInterval(updateTime, 1000);
  setInterval(updateSky, 60 * 1000);
  setInterval(updatePrayerCountdown, 1000);
  setInterval(getWeather, 10 * 60 * 1000);
};
