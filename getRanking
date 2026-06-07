const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);
  target.classList.add("active");

  // Force le scroll du nouvel écran tout en haut
  target.scrollTop = 0;

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
    
    const isExcellentPrice = ranking >= 90;
    const diff = price - average;
    
    const piggy = document.getElementById("piggy-container");
    const pigImage = document.getElementById("piggy-image");
    
if (diff > 5) {

  piggy.className = "saving-icon piggy-sad";
  pigImage.src = "piggy-sad.png";

} else if (diff >= -5 && diff <= 5) {

  piggy.className = "saving-icon piggy-neutral";
  pigImage.src = "piggy-neutral.png";

} else {

  const savingsPercent =
    Math.abs(((average - price) / average) * 100);

  if (savingsPercent < 15) {

    piggy.className = "saving-icon piggy-happy";
    pigImage.src = "piggy-happy.png";

  } else {

    piggy.className = "saving-icon piggy-superhappy";
    pigImage.src = "piggy-superhappy.png";

  }
}




    
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
    document.getElementById("saving-month").textContent = "Soit " + monthSaving + " € par mois";

    const isExcellentPrice = userPrice <= averagePrice * 0.9;

    if (isExcellentPrice) {
      resultTitle.textContent = "Excellent prix !";
      resultSummary.innerHTML =
        "🏆 Félicitations, vous faites partie des abonnements les moins chers enregistrés.";
    
      resultSaving.textContent = "0 € / an";
      savingMonth.textContent = "Aucune économie significative détectée pour le moment.";
    
      recommendationCard.innerHTML = `
        <h3>Vous payez déjà un très bon prix</h3>
        <p>Votre facture est déjà très compétitive par rapport aux prix réellement payés près de chez vous.</p>
      `;
    
      if (duoPercent) duoPercent.textContent = "Excellent";
      if (duoStatus) duoStatus.textContent = "prix";
      
      return;
    }

    let displayPercent = ranking;

    if (diff < 0) {
      displayPercent = 100 - ranking;
    }

    animateCounter("percent", displayPercent, 1000);
    animateCounter("duo-percent", displayPercent, 1000);

    const duoStatus = document.getElementById("duo-status");
    
    if (diff < 0) {
      duoStatus.textContent = "moins cher";
    } else if (diff > 0) {
      duoStatus.textContent = "plus cher";
    } else {
      duoStatus.textContent = "moyenne";
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

    rankingMessage.style.display = "none";

    document.getElementById("result-summary").textContent =
      city + " • " + provider + " • " + offerType + " • " + speed;

    const quality = document.getElementById("data-quality");

    quality.innerHTML = `
      <div class="quality-clean-card">
        <div class="quality-icon">👥</div>
        <div class="quality-content">
          <strong>${sampleCount} ${
            sampleCount > 1
              ? "abonnements similaires analysés"
              : "abonnement similaire analysé"
          }</strong>
          <span class="quality-badge">${getReliabilityShortMessage(sampleCount)}</span>
        </div>
      </div>
    `;
  
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

    function scrollResultToTop() {
      const resultScreen = document.getElementById("result");
      const app = document.querySelector(".app");
    
      if (resultScreen) resultScreen.scrollTop = 0;
      if (app) app.scrollTop = 0;
    
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    goTo("result");

    setTimeout(() => {
    document.getElementById("result").scrollTop = 0;
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

function getReliabilityShortMessage(sampleCount) {
  if (sampleCount <= 2) {
    return "🔴 Données limitées";
  }

  if (sampleCount <= 4) {
    return "🟠 Tendance indicative";
  }

  if (sampleCount <= 9) {
    return "🟢 Comparaison utile";
  }

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
  console.log("Fonction loadTrustCounter exécutée");

  const counter = document.getElementById("trust-counter");

  if (!counter) {
    console.error("Compteur introuvable : vérifie id='trust-counter' dans le HTML");
    return;
  }

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

    console.log("Status :", response.status);

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

document.addEventListener("DOMContentLoaded", () => {
  loadTrustCounter();
});

window.addEventListener("load", () => {
  loadTrustCounter();
});

function animateCounter(elementId, target, duration = 2000) {
  const element = document.getElementById(elementId);

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    element.textContent =
      Math.round(target * progress) + "%";

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
