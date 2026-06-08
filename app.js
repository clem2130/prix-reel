const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";
let selectedCityData = null;

function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);
  if (!target) return;

  target.classList.add("active");
  target.scrollTop = 0;

  if (id === "stats") {
    loadStatistics();
  }
}

async function priceAlreadyExists(city, provider, monthlyPrice, offerType, speed) {
  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price` +
    `&City=eq.${encodeURIComponent(city)}` +
    `&Provider=eq.${encodeURIComponent(provider)}` +
    `&Monthly_price=eq.${monthlyPrice}` +
    `&Offer_type=eq.${encodeURIComponent(offerType)}` +
    `&limit=1`;

  if (speed !== "unknown") {
    url += `&Speed=eq.${encodeURIComponent(speed)}`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data.length > 0;
}

async function getAveragePrice(city, provider, offerType, speed) {
  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price` +
    `&City=eq.${encodeURIComponent(city)}` +
    `&Provider=eq.${encodeURIComponent(provider)}` +
    `&Offer_type=eq.${encodeURIComponent(offerType)}`;

  if (speed !== "unknown") {
    url += `&Speed=eq.${encodeURIComponent(speed)}`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + Number(item.Monthly_price), 0);

  return {
    average: Math.round(total / data.length),
    count: data.length
  };
}

const MIN_RESULTS = 3;

async function getCityInfo(cityName) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/belgian_cities?select=name,province,region&name=eq.${encodeURIComponent(cityName)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();
  return data[0] || null;
}

async function getPricesByCities(cities, provider, offerType, speed) {
  const cityList = cities.map(city => `"${city}"`).join(",");

  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City` +
    `&City=in.(${cityList})` +
    `&Provider=eq.${encodeURIComponent(provider)}` +
    `&Offer_type=eq.${encodeURIComponent(offerType)}`;

  if (speed !== "unknown") {
    url += `&Speed=eq.${encodeURIComponent(speed)}`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

async function getCitiesByZone(column, value) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/belgian_cities?select=name&${column}=eq.${encodeURIComponent(value)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();
  return data.map(city => city.name);
}


async function getSimilarPricesSmart(city, provider, offerType, speed) {
  const cityInfo = await getCityInfo(city);

  // 1. Commune
  let prices = await getPricesByCities([city], provider, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "city",
      label: city
    };
  }

  if (!cityInfo) {
    return {
      prices,
      level: "belgium",
      label: "Belgique"
    };
  }

  // 2. Province
  const provinceCities = await getCitiesByZone("province", cityInfo.province);
  prices = await getPricesByCities(provinceCities, provider, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "province",
      label: cityInfo.province
    };
  }

  // 3. RÃ©gion
  const regionCities = await getCitiesByZone("region", cityInfo.region);
  prices = await getPricesByCities(regionCities, provider, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "region",
      label: cityInfo.region
    };
  }

  // 4. Belgique entiÃ¨re
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City&Provider=eq.${encodeURIComponent(provider)}&Offer_type=eq.${encodeURIComponent(offerType)}&Speed=eq.${encodeURIComponent(speed)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  prices = await response.json();

  return {
    prices,
    level: "belgium",
    label: "Belgique"
  };
}

async function getRanking(city, provider, offerType, speed, userPrice) {
  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price` +
    `&City=eq.${encodeURIComponent(city)}` +
    `&Provider=eq.${encodeURIComponent(provider)}` +
    `&Offer_type=eq.${encodeURIComponent(offerType)}`;

  if (speed !== "unknown") {
    url += `&Speed=eq.${encodeURIComponent(speed)}`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  if (!data || data.length === 0) return 50;

  const moreExpensiveCount = data.filter(
    item => Number(item.Monthly_price) > userPrice
  ).length;

  return Math.round((moreExpensiveCount / data.length) * 100);
}

async function getBestDeals(city) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Provider,Monthly_price&City=eq.${encodeURIComponent(city)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const cheapest = {};

  data.forEach(item => {
    const provider = item.Provider;
    const price = Number(item.Monthly_price);

    if (!cheapest[provider] || price < cheapest[provider]) {
      cheapest[provider] = price;
    }
  });

  return Object.entries(cheapest)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
}

async function savePriceToSupabase(city, provider, monthlyPrice, offerType, speed, extraServices) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/internet_prices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify({
    City: city,
    Provider: provider,
    Monthly_price: monthlyPrice,
    Offer_type: offerType,
    Speed: speed,
    extra_services: extraServices,
    province: selectedCityData?.province || null,
    region: selectedCityData?.region || null
  })
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

function getProviderLogo(provider) {
  const logos = {
    "Proximus": "logos/proximus.png",
    "Orange": "logos/orange.png",
    "Telenet": "logos/telenet.png",
    "Mobile Vikings": "logos/mobilevikings.png",
    "Base": "logos/base.png",
    "Scarlet": "logos/scarlet.png",
    "EDPnet": "logos/edpnet.png",
    "VOO": "logos/voo.png",
    "Yoin": "logos/yoin.png",
    "Hey! Telecom": "logos/hey.png"
  };

  return logos[provider] || "logos/proximus.png";
}

async function calculate() {
  const price = Number(document.getElementById("price").value);
  const city = selectedCityData?.name || document.getElementById("citySearch").value.trim();
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;
  const speed = document.getElementById("speed").value;
  const hasExtraServices = document.getElementById("hasExtraServices").checked;

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
    return;
  }

  if (price < 10 || price > 200) {
    alert("Veuillez entrer un prix Internet réaliste.");
    return;
  }

  try {
    const alreadyExists = await priceAlreadyExists(city, provider, price, offerType, speed);

    if (!alreadyExists) {
      await savePriceToSupabase(city, provider, price, offerType, speed, hasExtraServices);
    }

    const resultData = await getSimilarPricesSmart(city, provider, offerType, speed);
const similarPrices = resultData.prices;

if (!similarPrices || similarPrices.length === 0) {
  alert("Nous n'avons pas encore assez de données pour comparer cet abonnement.");
  return;
}

const total = similarPrices.reduce((sum, item) => {
  return sum + Number(item.Monthly_price);
}, 0);

let average = Math.round(total / similarPrices.length);
let sampleCount = similarPrices.length;

    const ranking = await getRanking(city, provider, offerType, speed, price);

    const diff = price - average;
    const yearlyGap = Math.abs(diff * 12);
    const monthlyGap = Math.abs(diff);
    const isExcellentPrice = ranking >= 90;

    const piggy = document.getElementById("piggy-container");
    const pigImage = document.getElementById("piggy-image");
    const ratingElement = document.getElementById("price-rating");
    const insight = document.getElementById("price-insight");
    const resultSaving = document.getElementById("result-saving");
    const savingMonth = document.getElementById("saving-month");
    const recommendationCard = document.getElementById("recommendation-card");
    const duoStatus = document.getElementById("duo-status");

    if (isExcellentPrice) {
      ratingElement.textContent = "🏆 Excellent prix !";
      ratingElement.style.color = "#16a34a";
      insight.textContent = "🐷 Félicitations ! Vous faites partie des abonnements les moins chers enregistrés.";
      resultSaving.textContent = "0 € / an";
      savingMonth.textContent = "Aucune économie significative détectée.";

      if (piggy && pigImage) {
        piggy.className = "saving-icon piggy-superhappy";
        pigImage.src = "piggy-superhappy.png";
      }

      if (duoStatus) {
        duoStatus.textContent = "excellent prix";
      }

      recommendationCard.innerHTML = `
  <p>🏆 Excellent prix</p>
  <strong>Vous payez déjà parmi les moins chers.</strong>
  <small>Continuez simplement à surveiller les évolutions du marché.</small>
`;

      launchConfetti();
    } else {
      if (diff > 5) {
        if (piggy && pigImage) {
          piggy.className = "saving-icon piggy-sad";
          pigImage.src = "piggy-sad.png";
        }
      } else if (diff >= -5 && diff <= 5) {
        if (piggy && pigImage) {
          piggy.className = "saving-icon piggy-neutral";
          pigImage.src = "piggy-neutral.png";
        }
      } else {
        const savingsPercent = Math.abs(((average - price) / average) * 100);

        if (savingsPercent < 15) {
          if (piggy && pigImage) {
            piggy.className = "saving-icon piggy-happy";
            pigImage.src = "piggy-happy.png";
          }
        } else {
          if (piggy && pigImage) {
            piggy.className = "saving-icon piggy-superhappy";
            pigImage.src = "piggy-superhappy.png";
          }
        }
      }

      let rating = "";
      let ratingColor = "";

      if (diff <= -10) {
  rating = "🟢 Excellent prix";
  ratingColor = "#16a34a";
} else if (diff <= 5) {
  rating = "🟡 Prix correct";
  ratingColor = "#f59e0b";
} else {
  rating = "🔴 Prix élevé";
  ratingColor = "#dc2626";
      }

      ratingElement.textContent = rating;
      ratingElement.style.color = ratingColor;

      if (diff < 0) {
        insight.textContent = "Vous payez " + monthlyGap + " € de moins par mois que la moyenne.";
      } else if (diff > 0) {
        insight.textContent = "Vous payez " + monthlyGap + " € de plus par mois que la moyenne.";
      } else {
        insight.textContent = "Votre prix est exactement dans la moyenne.";
      }

      const saving = diff > 0 ? yearlyGap : 0;
      const monthSaving = diff > 0 ? monthlyGap : 0;

      resultSaving.textContent = saving + " € / an";
      savingMonth.textContent = "Soit " + monthSaving + " € par mois";

      const bestDeals = await getBestDeals(city);

      if (bestDeals.length > 0) {
        const bestProvider = bestDeals[0][0];
        const bestPrice = bestDeals[0][1];
        const potentialMonthlySaving = Math.max(price - bestPrice, 0);
        const potentialYearlySaving = potentialMonthlySaving * 12;

        recommendationCard.innerHTML = `
  <p>💡 Recommandation Prix Réel</p>
  <strong>${bestProvider} — ${bestPrice} € / mois</strong>
  <small>Économie potentielle : ${potentialYearlySaving} € / an</small>
`;
      } else {
        recommendationCard.innerHTML = "";
      }
    }

    let gapPercent = 0;

    if (average > 0) {
      gapPercent = Math.round((Math.abs(diff) / average) * 100);
    }

    let displayPercent = 50;

    if (diff < 0) {
      displayPercent = Math.max(0, 50 - gapPercent);
    } else if (diff > 0) {
      displayPercent = Math.min(100, 50 + gapPercent);
    }

    if (isExcellentPrice) {
      displayPercent = 0;
    }

    animateCounter("percent", gapPercent, 1000);
    animateCounter("duo-percent", gapPercent, 1000);

    if (duoStatus && !isExcellentPrice) {
      if (diff < 0) {
        duoStatus.textContent = "moins cher";
      } else if (diff > 0) {
        duoStatus.textContent = "plus cher";
      } else {
        duoStatus.textContent = "moyenne";
      }
    }

    const scoreDot = document.querySelector(".score-dot");

    if (scoreDot) {
      scoreDot.style.transition = "none";
      scoreDot.style.left = "0%";

      setTimeout(() => {
        scoreDot.style.transition = "left 1.5s ease-out";
        scoreDot.style.left = displayPercent + "%";
      }, 100);
    }

    const rankingMessage = document.getElementById("ranking-message");

    if (rankingMessage) {
      rankingMessage.style.display = "none";
    }

    const speedLabel = speed === "unknown" ? "Vitesse inconnue" : speed;

    document.getElementById("result-summary").textContent =
  city + " • " + provider + " • " + offerType + " • " + speedLabel;

    const quality = document.getElementById("data-quality");

    let speedInfo = "";

    if (speed === "unknown") {
      speedInfo = `
        <small style="display:block;margin-top:8px;color:#64748b;">
  Comparaison réalisée sans tenir compte de la vitesse internet.
</small>
      `;
    }

    let zoneLabel = "";

if (resultData.level === "city") {
  zoneLabel = `à  ${resultData.label}`;
} else if (resultData.level === "province") {
  zoneLabel = `dans la province de ${resultData.label}`;
} else if (resultData.level === "region") {
  zoneLabel = `en ${resultData.label}`;
} else {
  zoneLabel = "en Belgique";
}

quality.innerHTML = `
  <div class="quality-clean-card">
    <div class="quality-icon">👥</div>

    <div class="quality-content">
      <strong>
        ${sampleCount}
        ${sampleCount > 1
          ? " abonnements similaires analysés "
          : " abonnement similaire analysé "}
        ${zoneLabel}
      </strong>

      <span class="quality-badge">
        ${getReliabilityShortMessage(sampleCount)}
      </span>

      ${
        resultData.level !== "city"
          ? `<small style="display:block;margin-top:8px;color:#64748b;">
              Données locales insuffisantes : comparaison élargie automatiquement.
            </small>`
          : ""
      }

      ${speedInfo}
    </div>
  </div>
`;

    if (!isExcellentPrice) {
      const bestDeals = await getBestDeals(city);
      const dealsContainer = document.getElementById("best-deals-list");

      if (dealsContainer) {
        dealsContainer.innerHTML = "";

        bestDeals.forEach(([dealProvider, dealPrice], index) => {
          dealsContainer.innerHTML += `
            <div class="deal-item">
              <div class="deal-provider">
                <img src="${getProviderLogo(dealProvider)}" alt="${dealProvider}">
                <span>${index + 1}. ${dealProvider}</span>
              </div>
              <div class="deal-price">${dealPrice} €
              </div>
            </div>
          `;
        });
      }
    }

    goTo("result");

    setTimeout(() => {
      scrollResultToTop();
    }, 10);

    requestAnimationFrame(() => {
      scrollResultToTop();
      setTimeout(scrollResultToTop, 100);
      setTimeout(scrollResultToTop, 300);
    });
  } catch (error) {
    alert("Erreur Supabase : " + error.message);
    console.error(error);
  }
}

function scrollResultToTop() {
  const resultScreen = document.getElementById("result");
  const app = document.querySelector(".app");

  if (resultScreen) resultScreen.scrollTop = 0;
  if (app) app.scrollTop = 0;

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function getReliabilityShortMessage(sampleCount) {
  if (sampleCount <= 2) return "🔴 Données limitées";
  if (sampleCount <= 4) return "🟡 Tendance indicative";
  if (sampleCount <= 9) return "🟢 Comparaison utile";

  return "✅ Comparaison fiable";
}


async function loadStatistics() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&Monthly_price=not.is.null`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    if (!data || data.length === 0) return;

    const prices = data.map(item => Number(item.Monthly_price));

    document.getElementById("stats-total").textContent = prices.length;
    document.getElementById("stats-average").textContent =
      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) + " €";
    document.getElementById("stats-min").textContent = Math.min(...prices) + " €";
    document.getElementById("stats-max").textContent = Math.max(...prices) + " €";
  } catch (error) {
    alert("Erreur stats : " + error.message);
    console.error(error);
  }
}

async function loadTrustCounter() {
  const counter = document.getElementById("trust-counter");
  if (!counter) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/internet_prices?select=id`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    counter.textContent =
      `📊 Basé sur ${data.length} prix réels enregistrés en Belgique`;
  } catch (error) {
    console.error("Erreur compteur :", error);
    counter.textContent =
      "📊 Basé sur des prix réels enregistrés en Belgique";
  }
}

const cityInput = document.getElementById("citySearch");
const citySuggestions = document.getElementById("citySuggestions");

async function searchCities(query) {
  if (!cityInput || !citySuggestions) return;

  if (query.length < 2) {
    citySuggestions.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/belgian_cities?select=name,province,region&name=ilike.*${encodeURIComponent(query)}*&order=name.asc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const cities = await response.json();

    citySuggestions.innerHTML = "";

    cities.forEach(city => {
      const item = document.createElement("div");
      item.className = "city-suggestion";

      item.textContent = city.province
        ? `${city.name} (${city.province})`
        : city.name;

      item.onclick = () => {
        selectedCityData = {
          name: city.name,
          province: city.province || null,
          region: city.region || null
        };

        cityInput.value = city.name;
        selectedCityData = {
          name: city.name,
          province: city.province || null,
          region: city.region || null
        };
        citySuggestions.innerHTML = "";
      };

      citySuggestions.appendChild(item);
    });

  } catch (error) {
    console.error("Erreur recherche villes :", error);
  }
}

if (cityInput && citySuggestions) {
  cityInput.addEventListener("input", () => {
    searchCities(cityInput.value.trim());
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".city-autocomplete")) {
      citySuggestions.innerHTML = "";
    }
  });
}








    
document.addEventListener("DOMContentLoaded", () => {
  loadTrustCounter();
});

window.addEventListener("load", () => {
  loadTrustCounter();
});


    
function animateCounter(elementId, target, duration = 2000) {
  const element = document.getElementById(elementId);

  if (!element) return;

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    element.textContent = Math.round(target * progress) + "%";

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function launchConfetti() {
  const confetti = document.createElement("div");
  confetti.className = "confetti-burst";
  confetti.textContent = "🎉 🎊 🐷 🏆 🎉 🎊";

  document.body.appendChild(confetti);

  setTimeout(() => {
    confetti.remove();
  }, 2000);
}
