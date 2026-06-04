const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.scrollTop = 0;
  });

  const target = document.getElementById(id);
  target.classList.add("active");

  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  setTimeout(() => {
    window.scrollTo(0, 0);
    target.scrollTop = 0;
  }, 50);

  if (id === "stats") {
    loadStatistics();
  }
}

async function priceAlreadyExists(city, provider, monthlyPrice, offerType, speed) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Monthly_price=eq.${monthlyPrice}&Offer_type=eq.${encodeURIComponent(offerType)}&Speed=eq.${encodeURIComponent(speed)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data.length > 0;
}

async function getAveragePrice(city, provider, offerType, speed) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Offer_type=eq.${encodeURIComponent(offerType)}&Speed=eq.${encodeURIComponent(speed)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();

  if (!data || data.length === 0) return null;

  const total = data.reduce(
    (sum, item) => sum + Number(item.Monthly_price),
    0
  );

  return {
    average: Math.round(total / data.length),
    count: data.length
  };
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

async function getRanking(city, provider, offerType, speed, userPrice) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Offer_type=eq.${encodeURIComponent(offerType)}&Speed=eq.${encodeURIComponent(speed)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();

  if (!data || data.length === 0) {
    return 50;
  }

  const moreExpensiveCount = data.filter(
    item => Number(item.Monthly_price) > userPrice
  ).length;

  return Math.round((moreExpensiveCount / data.length) * 100);
}

async function savePriceToSupabase(city, provider, monthlyPrice, offerType, speed) {
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
      Speed: speed
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
  const city = document.getElementById("citySearch").value.trim();
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;
  const speed = document.getElementById("speed").value;

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
    return;
  }

  if (price < 10 || price > 200) {
  alert("Veuillez entrer un prix Internet réaliste.");
  return;
  }

  try {
    const alreadyExists = await priceAlreadyExists(
      city,
      provider,
      price,
      offerType,
      speed
    );

    if (!alreadyExists) {
      await savePriceToSupabase(
        city,
        provider,
        price,
        offerType,
        speed
      );
    }

    const stats = await getAveragePrice(
      city,
      provider,
      offerType,
      speed
    );

    let average = price;
    let sampleCount = 1;

    if (stats) {
      average = stats.average;
      sampleCount = stats.count;
    }

    const ranking = await getRanking(
      city,
      provider,
      offerType,
      speed,
      price
    );

    const diff = price - average;
    const yearlyGap = Math.abs(diff * 12);
    const monthlyGap = Math.abs(diff);

    let rating = "";
    let ratingColor = "";

    if (diff <= -10) {
      rating = "🟢 Excellent prix";
      ratingColor = "#16a34a";
    } else if (diff <= 5) {
      rating = "🟠 Prix correct";
      ratingColor = "#f59e0b";
    } else {
      rating = "🔴 Prix élevé";
      ratingColor = "#dc2626";
    }

    const ratingElement = document.getElementById("price-rating");
    ratingElement.textContent = rating;
    ratingElement.style.color = ratingColor;

    const insight = document.getElementById("price-insight");

    if (diff < 0) {
      insight.textContent =
        "Vous payez " + monthlyGap + " € de moins par mois que la moyenne.";
    } else if (diff > 0) {
      insight.textContent =
        "Vous payez " + monthlyGap + " € de plus par mois que la moyenne.";
    } else {
      insight.textContent =
        "Votre prix est exactement dans la moyenne.";
    }

    const saving = diff < 0 ? yearlyGap : 0;
    const monthSaving = diff < 0 ? monthlyGap : 0;

    document.getElementById("result-saving").textContent = saving + " € / an";
    document.getElementById("saving-month").textContent =
      "Soit " + monthSaving + " € par mois";

    let displayPercent = ranking;

    if (diff < 0) {
      displayPercent = 100 - ranking;
    }

    document.getElementById("percent").textContent = displayPercent + "%";

    const scoreDot = document.querySelector(".score-dot");
    if (scoreDot) {
      scoreDot.style.left = displayPercent + "%";
    }

    const rankingMessage = document.getElementById("ranking-message");

    if (diff < 0) {
      rankingMessage.textContent =
        "Vous payez moins cher que " +
        displayPercent +
        "% des utilisateurs similaires";
    } else if (diff > 0) {
      rankingMessage.textContent =
        "Vous payez plus cher que " +
        displayPercent +
        "% des utilisateurs similaires";
    } else {
      rankingMessage.textContent =
        "Votre prix est dans la moyenne";
    }

    document.getElementById("result-summary").textContent =
      city + " • " + provider + " • " + offerType + " • " + speed;

    const quality = document.getElementById("data-quality");

    quality.innerHTML =
      "Calcul basé sur " +
      sampleCount +
      (sampleCount > 1
        ? " abonnements similaires."
        : " abonnement similaire.");
  
      const reliabilityBadge = document.getElementById("reliability-badge");
      
      if (reliabilityBadge) {
        reliabilityBadge.className = "reliability-badge";
      
      if (sampleCount >= 30) {
        reliabilityBadge.textContent = "🟢 Fiabilité élevée";
        reliabilityBadge.classList.add("reliability-high");
      } else if (sampleCount >= 10) {
        reliabilityBadge.textContent = "🟡 Fiabilité moyenne";
        reliabilityBadge.classList.add("reliability-medium");
      } else {
        reliabilityBadge.textContent = "🔴 Données limitées";
        reliabilityBadge.classList.add("reliability-low");
        }
      }

    const bestDeals = await getBestDeals(city);
    const dealsContainer = document.getElementById("best-deals-list");

    dealsContainer.innerHTML = "";

    bestDeals.forEach(([dealProvider, dealPrice], index) => {
      dealsContainer.innerHTML += `
        <div class="deal-item">
          <div class="deal-provider">
            <img src="${getProviderLogo(dealProvider)}" alt="${dealProvider}">
            <span>${index + 1}. ${dealProvider}</span>
          </div>
          <div class="deal-price">${dealPrice} €</div>
        </div>
      `;
    });

    const recommendationCard = document.getElementById("recommendation-card");

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

    goTo("result");
      

  } catch (error) {
    alert("Erreur Supabase : " + error.message);
    console.error(error);
  }
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
      `${SUPABASE_URL}/rest/v1/belgian_cities?select=name&name=ilike.*${encodeURIComponent(query)}*&order=name.asc&limit=10`,
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
      item.textContent = city.name;

      item.onclick = () => {
        cityInput.value = city.name;
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
