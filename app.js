const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

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
      extra_services: extraServices
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

    const stats = await getAveragePrice(city, provider, offerType, speed);

    let average = price;
    let sampleCount = 1;

    if (stats) {
      average = stats.average;
      sampleCount = stats.count;
    }

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
          piggy.className = "saving-icon piggy
