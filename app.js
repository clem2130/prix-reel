const SUPABASE_URL = "https://mmkubcgomhgkcbnsukze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BYt9R3P4zWvrIZFOQ1k-yg_47Jr2_DN";

const MIN_RESULTS = 3;

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
  if (!cities || cities.length === 0) return [];

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
  if (!value) return [];

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/belgian_cities?select=name&${column}=eq.${encodeURIComponent(value)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data.map(city => city.name);
}

async function getSimilarPricesSmart(city, provider, offerType, speed) {
  const cityInfo = await getCityInfo(city);

  let prices = await getPricesByCities([city], provider, offerType, speed);

  if (prices.length >= MIN_RESULTS) {
    return {
      prices,
      level: "city",
      label: city
    };
  }

  if (cityInfo && cityInfo.province
