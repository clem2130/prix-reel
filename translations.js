const translations = {
fr: {
  heroTitle: 'Découvrez combien vous pourriez <span>économiser.</span>',
  heroMessageStrong: 'Prix Réel compare votre facture aux montants réellement payés par les consommateurs belges.',
  heroMessageSmall: 'Pas aux tarifs officiels affichés par les fournisseurs.',
  communityCounterText: 'consommateurs ont déjà partagé leur prix',

  featureRealPricesTitle: 'Prix réels',
  featureRealPricesText: 'Données réellement partagées par les consommateurs.',
  featureSavingsTitle: 'Économies',
  featureSavingsText: 'Découvrez si vous payez plus que les autres.',
  featureAnonymousTitle: 'Anonyme',
  featureAnonymousText: 'Aucun compte, aucun email, aucune donnée personnelle.',
  compareButton: "Comparer ma facture maintenant",
  statsButton: "Voir les statistiques",
  communityTitle: "Une communauté qui s'entraide",
  communityText: "Chaque prix partagé aide d'autres consommateurs à payer le juste prix.",
  brandSlogan: "Le juste prix, basé sur la réalité.",
  navHome: "Accueil",
  navCompare: "Comparer",
  navStats: "Stats",
  navInfo: "Infos",
  footerSlogan: "Le juste prix, basé sur la réalité.",
  footerLegal: "Mentions légales & Confidentialité",
  footerContact: "Contact",
},

nl: {
  heroTitle: 'Ontdek hoeveel u kunt <span>besparen.</span>',
  heroMessageStrong: 'Prix Réel vergelijkt uw factuur met de bedragen die Belgische consumenten werkelijk betalen.',
  heroMessageSmall: 'Niet met de officiële tarieven die door de providers worden weergegeven.',
  communityCounterText: 'consumenten hebben hun prijs al gedeeld',

  featureRealPricesTitle: 'Echte prijzen',
  featureRealPricesText: 'Gegevens die werkelijk door consumenten gedeeld zijn.',
  featureSavingsTitle: 'Besparingen',
  featureSavingsText: 'Ontdek of u meer betaalt dan anderen.',
  featureAnonymousTitle: 'Anoniem',
  featureAnonymousText: 'Geen account, geen e-mail, geen persoonlijke gegevens.',
  compareButton: "Vergelijk nu mijn factuur",
  statsButton: "Statistieken bekijken",
  communityTitle: "Een gemeenschap die elkaar helpt",
  communityText: "Elke gedeelde prijs helpt andere consumenten de juiste prijs te betalen.",
  brandSlogan: "De juiste prijs, gebaseerd op de werkelijkheid.",
  navHome: "Start",
  navCompare: "Vergelijken",
  navStats: "Statistieken",
  navInfo: "Info",
  footerSlogan: "De juiste prijs, gebaseerd op de werkelijkheid.",
  footerLegal: "Juridische informatie & Privacy",
  footerContact: "Contact",
}
};

let currentLanguage = localStorage.getItem('language') || 'fr';

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  applyTranslations();
}

function applyTranslations() {
  const t = translations[currentLanguage];

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');

    if (t[key]) {
      element.innerHTML = t[key];
    }
  });

  document.getElementById('lang-fr')?.classList.toggle('active', currentLanguage === 'fr');
  document.getElementById('lang-nl')?.classList.toggle('active', currentLanguage === 'nl');
}

document.addEventListener('DOMContentLoaded', applyTranslations);
