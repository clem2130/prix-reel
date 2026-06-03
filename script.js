const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

function goTo(id) {
  alert("Page demandée : " + id);

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "stats") {
    alert("Je charge les statistiques");
    loadStatistics();
  }
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
    await savePriceToSupabase(city, provider, price, offerType);

    const stats = await getAveragePrice(city, provider, offerType);

    let average = price;
    let sampleCount = 1;

    if (stats) {
      average = stats.average;
      sampleCount = stats.count;
    }

    const diff = price - average;
    const saving = Math.max(0, diff * 12);
    const monthSaving = Math.max(0, diff);

    let percent = 72;
    if (diff <= 0) percent = 18;
    else if (diff <= 5) percent = 42;
    else if (diff <= 15) percent = 72;
    else percent = 86;

    document.getElementById("percent").textContent = percent + "%";
    document.getElementById("result-price").textContent = price + " € / mois";
    document.getElementById("result-average").textContent = average + " € / mois";
    document.getElementById("result-diff").textContent =
      (diff >= 0 ? "+" : "") + diff + " € / mois";
    document.getElementById("result-saving").textContent = saving + " € / an";
    document.getElementById("saving-month").textContent =
      "Soit " + monthSaving + " € par mois";

    const quality = document.getElementById("data-quality");

    if (sampleCount < 3) {
      quality.innerHTML = "🟠 Fiabilité faible (" + sampleCount + " prix enregistré)";
    } else if (sampleCount < 10) {
      quality.innerHTML = "🟡 Fiabilité moyenne (" + sampleCount + " prix enregistrés)";
    } else {
      quality.innerHTML = "🟢 Fiabilité élevée (" + sampleCount + " prix enregistrés)";
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
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    alert("Stats reçues : " + JSON.stringify(data));

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

  if (query.length < 2) {
    citySuggestions.innerHTML = "";
    return;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/belgian_cities?select=name&name=ilike.*${query}*&order=name.asc&limit=10`
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const cities = await response.json();

  citySuggestions.innerHTML = "";

  cities.forEach(city => {
    const cities = await response.json();
    const item = document.createElement("div");
    item.className = "city-suggestion";
    item.textContent = city.name;

    item.onclick = () => {
      cityInput.value = city.name;
      citySuggestions.innerHTML = "";
    };

    citySuggestions.appendChild(item);
  });
}

cityInput.addEventListener("input", () => {
  searchCities(cityInput.value.trim());
});
