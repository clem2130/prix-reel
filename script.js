const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ta3ViY2dvbWhna2NibnN1a3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDE3NDUsImV4cCI6MjA5NTk3Nzc0NX0.DlaRCeGZMc9Gr4GyGX1_VhXodgzXtC87viJEd9AfiJQ";

function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

async function savePriceToSupabase(city, provider, monthlyPrice, offerType) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/internet_prices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      city: city,
      provider: provider,
      monthly_price: monthlyPrice,
      offer_type: offerType
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur Supabase :", errorText);
    throw new Error(errorText);
  }
}

async function calculate() {
  const price = Number(document.getElementById("price").value);
  const city = document.getElementById("city").value.trim();
  const provider = document.getElementById("provider").value;
  const offerType = document.getElementById("offer").value;

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix.");
    return;
  }

  try {
    await savePriceToSupabase(city, provider, price, offerType);
  } catch (error) {
    alert("Erreur lors de l'enregistrement dans Supabase.");
    console.error(error);
    return;
  }

  const average = 47;
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
}