const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "stats") {
    loadStatistics();
  }
}

async function priceAlreadyExists(city, provider, monthlyPrice, offerType) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Monthly_price=eq.${monthlyPrice}&Offer_type=eq.${encodeURIComponent(offerType)}&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data.length > 0;
}

async function getAveragePrice(city, provider, offerType) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Offer_type=eq.${encodeURIComponent(offerType)}`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  async function getRanking(city, provider, offerType, userPrice) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price&City=eq.${encodeURIComponent(city)}&Provider=eq.${encodeURIComponent(provider)}&Offer_type=eq.${encodeURIComponent(offerType)}`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();

  if (!data || data.length === 0) {
    return 50;
  }

  const cheaperCount = data.filter(
    item => Number(item.Monthly_price) < userPrice
  ).length;

  return Math.round((cheaperCount / data.length) * 100);
}

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();

  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + Number(item.Monthly_price), 0);

  return {
    average: Math.round(total / data.length),
    count: data.length
  };
}

async function savePriceToSupabase(city, provider, monthlyPrice, offerType) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/internet_prices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      City: city,
      Provider: provider,
      Monthly_price: monthlyPrice,
      Offer_type: offerType
    })
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

async function calculate() {
  const price = Number(document.getElementById("price").value);
  const city = document.getElementById("citySearch").value.trim();
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
    return;
  }

  try {
    const alreadyExists = await priceAlreadyExists(city, provider, price, offerType);

    if (!alreadyExists) {
      await savePriceToSupabase(city, provider, price, offerType);
    }

    const stats = await getAveragePrice(city, provider, offerType);

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
      price
    );

    const diff = price - average;
    let rating = "";
    let ratingColor = "";
    

if (diff <= -10) {
  rating = "🟢 Excellent";
  ratingColor = "#16a34a";
} else if (diff <= 5) {
  rating = "🟠 Correct";
  ratingColor = "#f59e0b";
} else {
  rating = "🔴 Trop cher";
  ratingColor = "#dc2626";
}

const yearlyGain = Math.abs(diff * 12);

const insight = document.getElementById("price-insight");

if (diff < 0) {
  insight.textContent =
    "💰 Vous économisez environ " + yearlyGain +
    " € par an par rapport à la moyenne.";
} else if (diff > 0) {
  insight.textContent =
    "⚠️ Vous payez environ " + yearlyGain +
    " € par an de plus que la moyenne.";
} else {
  insight.textContent =
    "✅ Votre prix est exactement dans la moyenne.";
}

const ratingElement = document.getElementById("price-rating");

ratingElement.textContent = rating;
ratingElement.style.color = ratingColor;
    const saving = Math.max(0, diff * 12);
    const monthSaving = Math.max(0, diff);

    const percent = ranking;

    document.getElementById("result-city").textContent =
  "📍 Ville : " + city;

document.getElementById("result-provider-name").textContent =
  "🌐 Fournisseur : " + provider;

document.getElementById("result-offer-type").textContent =
  "📦 Offre : " + offerType;
    

    document.getElementById("percent").textContent = percent + "%";
    const rankingMessage = document.getElementById("ranking-message");

    if (diff < 0) {
    rankingMessage.textContent =
    "Vous payez moins cher que " + percent + "% des utilisateurs similaires";
    } else if (diff > 0) {
    rankingMessage.textContent =
    "Vous payez plus cher que " + percent + "% des utilisateurs similaires";
    } else {
    rankingMessage.textContent =
    "Votre prix est dans la moyenne des utilisateurs similaires";
    }
    
    document.getElementById("result-price").textContent = price + " € / mois";
    document.getElementById("result-average").textContent = average + " € / mois";
    document.getElementById("result-diff").textContent =
      (diff >= 0 ? "+" : "") + diff + " € / mois";
    document.getElementById("result-saving").textContent = saving + " € / an";
    document.getElementById("saving-month").textContent =
      "Soit " + monthSaving + " € par mois";

    const quality = document.getElementById("data-quality");

quality.innerHTML =
  "📊 Basé sur " +
  sampleCount +
  (sampleCount > 1
    ? " abonnements similaires dans votre région"
    : " abonnement similaire dans votre région");
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
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
