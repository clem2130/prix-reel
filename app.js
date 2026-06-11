// =====================================================
// Configuration Supabase
// =====================================================

// URL du projet Supabase utilisé par Prix Réel
const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";

// Clé publique Supabase utilisée pour lire/écrire les données autorisées
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";


// =====================================================
// État global du formulaire
// =====================================================

// Stocke la ville sélectionnée dans l'autocomplete
let selectedCityData = null;

// =====================================================
// Navigation entre les différentes pages du site
// =====================================================

function goTo(id) {

  // Masque toutes les pages
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  // Récupère la page demandée
  const target = document.getElementById(id);
  if (!target) return;

  // Affiche la page sélectionnée
  target.classList.add("active");

  // Remonte le contenu de la page en haut
  target.scrollTop = 0;

  // Remonte le conteneur principal en haut
  const app = document.querySelector(".app");
  if (app) {
    app.scrollTop = 0;
  }

  // Sécurité : remonte également la fenêtre du navigateur
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Charge les statistiques uniquement
  // lorsque l'utilisateur ouvre la page Statistiques
  if (id === "stats") {
    loadStatistics();
  }

  // Charge les données du profil uniquement
  // lorsque l'utilisateur ouvre la page Profil
  if (id === "profile") {
    loadProfile();
  }
}


// =====================================================
// Requêtes Supabase - Internet
// =====================================================
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

// =====================================================
// Gestion des villes et zones géographiques
// =====================================================
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

async function getPricesByCities(cities, offerType, speed) {
  const cityList = cities.map(city => `"${city}"`).join(",");

  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City,Provider,Offer_type,Speed` +
    `&City=in.(${cityList})` +
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

  let prices = await getPricesByCities([city], offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return { prices, level: "city", label: city };
  }

  if (!cityInfo) {
    return await getBelgiumPricesFallback(offerType, speed);
  }

  const provinceCities = await getCitiesByZone("province", cityInfo.province);
  prices = await getPricesByCities(provinceCities, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return { prices, level: "province", label: cityInfo.province };
  }

  const regionCities = await getCitiesByZone("region", cityInfo.region);
  prices = await getPricesByCities(regionCities, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return { prices, level: "region", label: cityInfo.region };
  }

  let belgiumResult = await getBelgiumPricesFallback(offerType, speed);

  if (belgiumResult.prices.length >= MIN_RESULTS) {
    return belgiumResult;
  }

  prices = await getPricesByCities([city], offerType, "unknown");

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "city",
      label: city,
      ignoredSpeed: true
    };
  }

  prices = await getPricesByCities(provinceCities, offerType, "unknown");

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "province",
      label: cityInfo.province,
      ignoredSpeed: true
    };
  }

  prices = await getPricesByCities(regionCities, offerType, "unknown");

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "region",
      label: cityInfo.region,
      ignoredSpeed: true
    };
  }

  return await getBelgiumPricesFallback(offerType, "unknown", true);
}

async function getBelgiumPricesFallback(offerType, speed, ignoredSpeed = false) {
  let url =
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City,Provider,Offer_type,Speed` +
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

  const prices = await response.json();

  return {
    prices,
    level: "belgium",
    label: "Belgique",
    ignoredSpeed
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



async function getBestDeals(city, offerType, speed) {

  // Recherche des abonnements similaires
  const resultData = await getSimilarPricesSmart(city, "", offerType, speed);
  const data = resultData.prices || [];

  if (!data || data.length === 0) return [];

  const grouped = {};

  data.forEach(item => {
    const provider = item.Provider;
    const price = Number(item.Monthly_price);

    if (!provider || isNaN(price)) return;

    if (!grouped[provider]) {
      grouped[provider] = {
        total: 0,
        count: 0
      };
    }

    grouped[provider].total += price;
    grouped[provider].count++;
  });

  return Object.entries(grouped)
    .map(([provider, info]) => {
      const average = Math.round(info.total / info.count);

      return {
        provider,
        average,
        count: info.count
      };
    })
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);
}

async function savePriceToSupabase(city, provider, monthlyPrice, offerType, speed, extraServices) {
  const cityInfo = await getCityInfo(city);

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
      province: cityInfo?.province || null,
      region: cityInfo?.region || null
    })
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}


// =====================================================
// Logos fournisseurs
// =====================================================
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


// =====================================================
// Calcul principal de comparaison Internet
// =====================================================

async function calculate() {
  
  // Récupération des valeurs du formulaire
  const price = Number(document.getElementById("price").value);
  const cityInputValue = document.getElementById("citySearch").value.trim();
  const city = selectedCityData?.name || cityInputValue;
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;
  const speed = document.getElementById("speed").value;
  const hasExtraServices = document.getElementById("hasExtraServices").checked;

  
  // Vérifications de base avant d'envoyer les données
  if (!cityInputValue || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
    return;
  }

  if (/\d/.test(cityInputValue)) {
    alert("La ville ne peut pas contenir de chiffre.");
    return;
  }

  if (!selectedCityData || cityInputValue !== selectedCityData.name) {
    alert("Veuillez sélectionner une ville dans la liste proposée.");
    return;
  }

  if (price < 10 || price > 200) {
    alert("Veuillez entrer un prix Internet réaliste.");
    return;
  }

  // =====================================================
  // Enregistrement et calcul du résultat
  // =====================================================
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

let diffPercent = 0;

if (average > 0) {
  diffPercent = Math.round((Math.abs(diff) / average) * 100);
}

    
const monthlyGap = Math.round(Math.abs(diff));
const yearlyGap = monthlyGap * 12;

    
// Construction du résumé affiché à l'utilisateur
const summaryText = document.getElementById("price-summary-text");

if (summaryText) {
  if (diff > 5) {
    summaryText.innerHTML =
    `<strong class="expensive-price">Tarif élevé</strong><br>
     <span>
       Vous payez environ
       <strong class="extra-cost-highlight">${yearlyGap} € de plus par an</strong>
       <br>
       <small class="extra-cost-month"> ≈ +${monthlyGap} € par mois</small>
      </span>`;
  } else if (diff < -5) {
    summaryText.innerHTML =
  `<strong class="excellent-price">Excellent tarif</strong><br>
   <span>
     Vous économisez environ
     <strong class="saving-highlight">${yearlyGap} € par an</strong>
     <br>
     <small class="saving-month"> ≈ -${monthlyGap} € par mois </small>
   </span>`;
  } else {
    summaryText.innerHTML =
      `<strong class="correct-price">Tarif correct</strong><br>
       <span>Votre prix est proche de la moyenne observée</span>`;
  }
}

    
const savingTipTitle = document.getElementById("saving-tip-title");
const savingTipText = document.getElementById("saving-tip-text");

if (savingTipTitle && savingTipText) {
  if (diff > 5) {
    savingTipTitle.textContent = "💰 Économies possibles";
    savingTipText.textContent =
      "Votre prix est supérieur à la moyenne observée. Consultez le classement des fournisseurs pour repérer une offre plus avantageuse.";
  } else if (diff < -5) {
    savingTipTitle.textContent = "🏆 Très bon tarif";
    savingTipText.textContent =
      "Votre abonnement est déjà très compétitif. Surveillez simplement les évolutions du marché de temps en temps.";
  } else {
    savingTipTitle.textContent = "📊 Prix dans la moyenne";
    savingTipText.textContent =
      "Votre prix est proche de la moyenne observée. Une comparaison occasionnelle peut vous aider à rester compétitif.";
  }
}


  
const recommendationCard = document.getElementById("recommendation-card");

// Recherche des meilleures alternatives disponibles
const bestDeals = await getBestDeals(city, offerType, speed);

if (recommendationCard) {
  if (bestDeals.length > 1) {
    const bestProvider = bestDeals[0].provider;
    const bestPrice = bestDeals[0].average;

    const potentialMonthlySaving = Math.round(price - bestPrice);
    const potentialYearlySaving = potentialMonthlySaving * 12;

    if (potentialMonthlySaving <= 5) {
      recommendationCard.innerHTML = `
        <p>🏆 Tarif très compétitif</p>

        <strong>
          Vous bénéficiez déjà d'un excellent tarif.
        </strong>

        <small>
          Votre abonnement fait partie des prix les plus compétitifs observés.
        </small>

        <div class="trust-badge">
          ✅ Aucun écart significatif observé parmi ${sampleCount} abonnements similaires
        </div>
      `;
    } else {
      recommendationCard.innerHTML = `
        <p>💰 Économie possible</p>

        <strong>${bestProvider} — ${bestPrice} € / mois</strong>

        <p class="current-price">
          Vous payez actuellement : ${price} € / mois
        </p>

        <small>
          Vous pourriez économiser jusqu'à ${potentialYearlySaving} € par an.
        </small>

        <div class="trust-badge">
          ✅ Offre la plus avantageuse observée parmi ${sampleCount} abonnements similaires
        </div>
      `;
    }
  } else {
    recommendationCard.innerHTML = `
      <p>ℹ️ Données insuffisantes</p>
      <strong>Aucune alternative fiable disponible pour le moment.</strong>
      <small>
        Pas encore assez de fournisseurs différents pour proposer une comparaison fiable.
      </small>
    `;
  }
}
    
    let gapPercent = 0;
    const isExcellentPrice = ranking >= 90;

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

    const speedLabel = speed === "unknown" ? "Vitesse non renseignée" : speed;

    document.getElementById("result-summary").textContent =
  city + " • " + provider + " • " + offerType + " • " + speedLabel;

    const quality = document.getElementById("data-quality");

    let speedInfo = "";

    if (speed === "unknown" || resultData.ignoredSpeed) {
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
  const bestDeals = await getBestDeals(city, offerType, speed);
  const dealsContainer = document.getElementById("best-deals-list");
  const bestDealsCard = document.getElementById("best-deals-card");

if (bestDealsCard) {
  bestDealsCard.style.display =
    bestDeals.length <= 1 ? "none" : "block";
}    

if (dealsContainer) {
  dealsContainer.innerHTML = "";

  const medals = ["🥇", "🥈", "🥉"];

  bestDeals.forEach((deal, index) => {
    const rank = index < 3 ? medals[index] : `${index + 1}.`;

    dealsContainer.innerHTML += `
      <div class="deal-item">
        <div class="deal-provider">
          <img src="${getProviderLogo(deal.provider)}" alt="${deal.provider}">
          <span>${rank} ${deal.provider}</span>
        </div>
        
        <div class="deal-price">
          <span class="provider-price">${deal.average} €</span>
          <small class="provider-count">
            ${deal.count === 1
              ? "1 contribution"
              : deal.count + " contributions"}
          </small>
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
  if (sampleCount <= 2) {
    return "🔴 Données limitées";
  }

  if (sampleCount <= 4) {
    return `🟡 Échantillon limité (${sampleCount} abonnements analysés)`;
  }

  if (sampleCount <= 9) {
    return "🟢 Comparaison utile";
  }

  return "✅ Comparaison fiable";
}

// =====================================================
// Statistiques Internet
// =====================================================
async function loadStatistics() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City,Provider&Monthly_price=not.is.null`,
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

    const validPrices = prices.filter(
    price => !isNaN(price) && price >= 10 && price <= 200
    );

    const uniqueCities = new Set(
      data
        .map(item => item.City)
        .filter(city => city && city.trim() !== "")
    );

    const statsCities = document.getElementById("stats-cities");
    if (statsCities) {
      statsCities.textContent = uniqueCities.size;
    }

    document.getElementById("stats-total").textContent = prices.length;

    const communityCount = document.getElementById("stats-community-count");
    if (communityCount) {
      communityCount.textContent = prices.length;
    }

    document.getElementById("stats-average").textContent =
      Math.round(
        validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      ) + " €";
    
    document.getElementById("stats-min").textContent =
      Math.min(...validPrices) + " €";
    
    document.getElementById("stats-max").textContent =
      Math.max(...validPrices) + " €";

    const providerStats = {};
    

    data.forEach(item => {
      const provider = item.Provider;
      const price = Number(item.Monthly_price);

      if (!provider || isNaN(price)) return;

      if (!providerStats[provider]) {
        providerStats[provider] = {
          total: 0,
          count: 0
        };
      }

      providerStats[provider].total += price;
      providerStats[provider].count += 1;
    });

      const providerAverages = Object.keys(providerStats)
        .map(provider => ({
          provider,
          average: Math.round(
            providerStats[provider].total / providerStats[provider].count
          ),
          count: providerStats[provider].count
        }))
        .filter(item => item.count >= 10)
        .sort((a, b) => a.average - b.average)
  .slice(0, 6);

    const chartContainer = document.getElementById("provider-chart");

    if (chartContainer) {
      chartContainer.innerHTML = "";

      if (providerAverages.length === 0) {
        chartContainer.innerHTML = `
          <p class="provider-empty">
            Pas encore assez de données pour afficher les fournisseurs.
          </p>
        `;
      } else {
        const providerPrices = providerAverages.map(item => item.average);

        const minAverage = Math.min(...providerPrices);
        const maxAverage = Math.max(...providerPrices);
        const range = maxAverage - minAverage || 1;

providerAverages.forEach((item, index) => {
  const medals = ["🥇", "🥈", "🥉"];

  const label =
    index < 3
      ? `${medals[index]} ${item.provider}`
      : item.provider;

  const width = Math.max(65, 100 - ((item.average - minAverage) / range) * 35);

  chartContainer.innerHTML += `
    <div class="provider-chart-row">
      <div class="provider-chart-name">
          <img src="${getProviderLogo(item.provider)}" alt="${item.provider}" class="provider-chart-logo">
          <span>${label}</span>
      </div>

      <div class="provider-chart-bar-wrap">
        <div class="provider-chart-bar" style="width: ${width}%"></div>
      </div>
        
          <div class="provider-chart-price">
            ${item.average} €
            <small>
              ${item.count === 1
              ? "1 contribution"
              : item.count + " contributions"}
          </small>
        </div>
    </div>
  `;
});
      }
    }

  } catch (error) {
    alert("Erreur stats : " + error.message);
    console.error(error);
  }
}

async function loadTrustCounter() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/internet_prices?select=Id`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const total = data.length;

    const homeCounter = document.getElementById("home-trust-counter");
    const infoCounter = document.getElementById("info-trust-counter");

    if (homeCounter) {
      homeCounter.textContent = total;
    }

    if (infoCounter) {
      infoCounter.textContent = total;
    }
  } catch (error) {
    console.error("Erreur compteur :", error);
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

      item.textContent = city.name;

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
    selectedCityData = null;
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


// =====================================================
// Partage du résultat
// =====================================================
async function shareResult() {
  const shareText = `Je viens de comparer mon abonnement Internet sur Prix Réel.

💰 Découvrez gratuitement si vous payez le juste prix.

Comparez votre facture en 30 secondes :
https://prix-reel.vercel.app`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Prix Réel",
        text: shareText
      });
    } catch (err) {
      console.log("Partage annulé");
    }
  } else {
    navigator.clipboard.writeText(shareText);

    alert("Lien copié dans le presse-papiers. Vous pouvez maintenant le coller où vous souhaitez.");
  }
}


// =====================================================
// Profil communauté
// =====================================================
async function loadProfile() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price,City,Provider&Monthly_price=not.is.null`,
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

    const validPrices = prices.filter(
    price => price >= 10 && price <= 200
    );

    const uniqueCities = new Set(
      data
        .map(item => item.City)
        .filter(city => city && city.trim() !== "")
    );

    document.getElementById("profile-total").textContent = data.length;
    document.getElementById("profile-cities").textContent = uniqueCities.size;
    const providerStats = {};

data.forEach(item => {
  const provider = item.Provider;
  const price = Number(item.Monthly_price);

  if (!provider || isNaN(price)) return;

  if (!providerStats[provider]) {
    providerStats[provider] = {
      total: 0,
      count: 0
    };
  }

  providerStats[provider].total += price;
  providerStats[provider].count += 1;
});

const bestProvider = Object.keys(providerStats)
  .map(provider => ({
    provider,
    average: Math.round(providerStats[provider].total / providerStats[provider].count)
  }))
  .sort((a, b) => a.average - b.average)[0];

const bestProviderElement = document.getElementById("profile-best-provider");

if (bestProviderElement && bestProvider) {
  bestProviderElement.textContent = bestProvider.provider;
}

  } catch (error) {
    console.error("Erreur profil :", error);
  }
}
