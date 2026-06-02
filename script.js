const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";
function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
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

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => {
    return sum + Number(item.Monthly_price);
  }, 0);

  return {
  average: Math.round(total / data.length),
  count: data.length
};
}

async function getAveragePrice(city, provider) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/internet_prices?select=Monthly_price`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  if (data.length === 0) {
    return 47;
  }

  const total = data.reduce((sum, item) => {
    return sum + Number(item.Monthly_price);
  }, 0);

  return Math.round(total / data.length);
}

async function calculate() {
  const price = Number(document.getElementById("price").value);
  const city = document.getElementById("city").value.trim();
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
    return;
  }

  try {
    await savePriceToSupabase(city, provider, price, offerType);

    let average = await getAveragePrice(city, provider, offerType);

    if (average === null) {
    average = price;
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
    document.getElementById("result-saving").textContent =
      saving + " € / an";
    document.getElementById("saving-month").textContent =
      "Soit " + monthSaving + " € par mois";

    goTo("result");
  } catch (error) {
    alert("Erreur Supabase : " + error.message);
    console.error(error);
  }
}
