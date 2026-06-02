function goTo(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function calculate() {
  const price = Number(document.getElementById("price").value);
  const city = document.getElementById("city").value.trim();

  if (!city || !price || price <= 0) {
    alert("Veuillez entrer votre ville et votre prix mensuel.");
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
  document.getElementById("result-diff").textContent = (diff >= 0 ? "+" : "") + diff + " € / mois";
  document.getElementById("result-saving").textContent = saving + " € / an";
  document.getElementById("saving-month").textContent = "Soit " + monthSaving + " € par mois";

  goTo("result");
}
