/* ============================================================
   CHECKMYPC.MA — application runtime
   Single entry point. Pages declare <body data-page="..."> and
   mount points (#catalog-view, #product-view, ...); app.js wires
   the nav plus whichever view that page exposes.
   Replaces the old app.js + site.js pair.
   ============================================================ */
(function () {
  "use strict";

  var ROOT = window.CHECKMYPC_ROOT || "";
  var CAT = window.CHECKMYPC_CATALOG || { products: [], categories: [], stores: [] };
  var BUILD_KEY = "cmp.build.v2";
  var ALERT_KEY = "cmp.alerts.v1";
  var ADMIN_KEY = "cmp.admin.v1";

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var url = function (p) { return /^(?:https?:|data:|blob:|#|\/)/i.test(String(p || "")) ? String(p) : ROOT + p; };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var dh = function (n) { return Number(n || 0).toLocaleString("fr-MA") + " DH"; };

  function ago(min) {
    if (min < 60) return min + " " + t("ui.minAgo");
    if (min < 1440) return Math.round(min / 60) + " " + t("ui.hAgo");
    return Math.round(min / 1440) + " " + t("ui.dAgo");
  }

  /* Stock labels resolve at render time so they follow the active language. */
  var STOCK = {
    in_stock: { key: "stock.in", cls: "ok" },
    low_stock: { key: "stock.low", cls: "warn" },
    out_of_stock: { key: "stock.out", cls: "bad" }
  };
  function stockOf(code) {
    var s = STOCK[code] || STOCK.out_of_stock;
    return { label: t(s.key), cls: s.cls };
  }

  function toast(msg) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }


  /* ============================================================
     I18N — EN / FR / AR with RTL
     Static markup is tagged data-i18n="key"; dynamic renders call t(key).
     Language is stored in localStorage and applied before first paint.
     ============================================================ */
  var LANG_KEY = "cmp.lang.v1";
  var LANGS = { en: "English", fr: "Fran\u00E7ais", ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" };

  var DICT = {
    en: {
      "nav.builder": "System Builder", "nav.components": "Components",
      "nav.guides": "Build Guides", "nav.prebuilts": "Prebuilt PCs",
      "nav.trends": "Trends", "nav.mybuild": "My Build",
      "nav.search": "Search", "nav.menu": "Menu",
      "mega.core": "Core components", "mega.graphics": "Graphics & power",
      "mega.displays": "Displays & gear", "mega.browse": "Browse",
      "mega.all": "All components", "mega.alerts": "Trends & price alerts",
      "mega.inspection": "PC Inspection",
      "cat.cpu": "Processors", "cat.cooler": "CPU Coolers",
      "cat.motherboard": "Motherboards", "cat.ram": "Memory (RAM)",
      "cat.storage": "Storage", "cat.gpu": "Graphics Cards",
      "cat.psu": "Power Supplies", "cat.case": "PC Cases",
      "cat.display": "Displays", "cat.peripheral": "Peripherals",
      "stock.in": "In stock", "stock.low": "Low stock", "stock.out": "Out of stock",
      "ui.filters": "Filters", "ui.close": "Close", "ui.stores": "stores",
      "ui.components": "components", "ui.search": "Search",
      "ui.searchPlaceholder": "Search components \u2014 RTX 4060, AM5 motherboard\u2026",
      "ui.noMatch": "No match", "ui.noMatchBody": "Loosen the budget range or clear a brand filter.",
      "ui.noResult": "No component matches that.",
      "ui.add": "Add", "ui.addedTo": "Added to build",
      "ui.buy": "Buy", "ui.choose": "\u2014 choose \u2014", "ui.browse": "Browse",
      "ui.category": "Category", "ui.budget": "Budget (DH)",
      "ui.availability": "Availability", "ui.inStockOnly": "In stock only",
      "ui.brand": "Brand", "ui.reset": "Reset filters",
      "ui.minAgo": "min ago", "ui.hAgo": "h ago", "ui.dAgo": "d ago",
      "ui.checked": "Checked", "ui.alertOn": "\u2713 Price alert active",
      "ui.alertOff": "Set price-drop alert", "ui.alertAdded": "Price alert set",
      "ui.alertRemoved": "Price alert removed", "ui.copied": "Build link copied",
      "ui.pickParts": "Pick a CPU and a motherboard to start checking compatibility.",
      "ui.systems": "prebuilt systems", "ui.viewOffer": "View offer",
      "ui.noSystem": "No system in that range", "ui.widerBudget": "Try a wider budget bracket.",
      "ui.new": "New", "ui.used": "Used", "ui.store": "Store", "ui.price": "Price",
      "foot.tagline": "Compare aggregated prices from 27+ computer stores in Morocco, check component compatibility, and find the best available deals in DH.",
      "foot.hubs": "Hardware Hubs", "foot.alerts": "Price Alerts",
      "foot.pro": "PCPicker Pro Studio", "foot.trends": "Price Trends",
      "foot.budgetTitle": "Gaming PC by Budget", "foot.allBudgets": "All budgets (3k to 50k+)",
      "foot.cityTitle": "Stores by City", "foot.allCities": "All cities in Morocco",
      "foot.infoTitle": "Information", "foot.about": "About",
      "foot.support": "Support the Project \u2615", "foot.status": "System Status",
      "foot.privacy": "Privacy Policy", "foot.terms": "Terms of Service",
      "foot.rights": "\u00A9 2026 checkmypc.ma. All rights reserved.",
      "foot.builtBy": "Built by incconu_two",
      "foot.disclaimer": "PCPicker is an independent price comparison platform. Purchases are completed directly with the listed retailers.",
      "foot.language": "Language",
      "ui.theme": "Theme",
      "ui.themeDark": "Switch to dark mode",
      "ui.themeLight": "Switch to light mode",
      "ui.closeMenu": "Close menu",
      "drawer.main": "Navigation",
      "drawer.categories": "Shop by category",
      "drawer.utility": "Tools & account",
      "drawer.inspection": "PC Inspection",
      "drawer.guides": "Build Guides",
      "drawer.myBuild": "My saved build"
    },
    fr: {
      "nav.builder": "Configurateur", "nav.components": "Composants",
      "nav.guides": "Guides de montage", "nav.prebuilts": "PC pr\u00E9mont\u00E9s",
      "nav.trends": "Tendances", "nav.mybuild": "Ma config",
      "nav.search": "Rechercher", "nav.menu": "Menu",
      "mega.core": "Composants essentiels", "mega.graphics": "Graphismes & alimentation",
      "mega.displays": "\u00C9crans & p\u00E9riph\u00E9riques", "mega.browse": "Parcourir",
      "mega.all": "Tous les composants", "mega.alerts": "Tendances & alertes prix",
      "mega.inspection": "Inspection PC",
      "cat.cpu": "Processeurs", "cat.cooler": "Refroidissement CPU",
      "cat.motherboard": "Cartes m\u00E8res", "cat.ram": "M\u00E9moire (RAM)",
      "cat.storage": "Stockage", "cat.gpu": "Cartes graphiques",
      "cat.psu": "Alimentations", "cat.case": "Bo\u00EEtiers",
      "cat.display": "\u00C9crans", "cat.peripheral": "P\u00E9riph\u00E9riques",
      "stock.in": "En stock", "stock.low": "Stock faible", "stock.out": "Rupture",
      "ui.filters": "Filtres", "ui.close": "Fermer", "ui.stores": "magasins",
      "ui.components": "composants", "ui.search": "Rechercher",
      "ui.searchPlaceholder": "Rechercher \u2014 RTX 4060, carte m\u00E8re AM5\u2026",
      "ui.noMatch": "Aucun r\u00E9sultat", "ui.noMatchBody": "\u00C9largissez le budget ou retirez un filtre de marque.",
      "ui.noResult": "Aucun composant ne correspond.",
      "ui.add": "Ajouter", "ui.addedTo": "Ajout\u00E9 \u00E0 la config",
      "ui.buy": "Acheter", "ui.choose": "\u2014 choisir \u2014", "ui.browse": "Parcourir",
      "ui.category": "Cat\u00E9gorie", "ui.budget": "Budget (DH)",
      "ui.availability": "Disponibilit\u00E9", "ui.inStockOnly": "En stock uniquement",
      "ui.brand": "Marque", "ui.reset": "R\u00E9initialiser",
      "ui.minAgo": "min", "ui.hAgo": "h", "ui.dAgo": "j",
      "ui.checked": "V\u00E9rifi\u00E9 il y a", "ui.alertOn": "\u2713 Alerte prix active",
      "ui.alertOff": "Cr\u00E9er une alerte prix", "ui.alertAdded": "Alerte prix cr\u00E9\u00E9e",
      "ui.alertRemoved": "Alerte prix supprim\u00E9e", "ui.copied": "Lien copi\u00E9",
      "ui.pickParts": "Choisissez un processeur et une carte m\u00E8re pour lancer les v\u00E9rifications.",
      "ui.systems": "PC pr\u00E9mont\u00E9s", "ui.viewOffer": "Voir l'offre",
      "ui.noSystem": "Aucun PC dans cette tranche", "ui.widerBudget": "Essayez une tranche plus large.",
      "ui.new": "Neuf", "ui.used": "Occasion", "ui.store": "Magasin", "ui.price": "Prix",
      "foot.tagline": "Comparez les prix agr\u00E9g\u00E9s de plus de 27 magasins informatiques au Maroc, v\u00E9rifiez la compatibilit\u00E9 des composants et trouvez les meilleures offres en DH.",
      "foot.hubs": "Hubs mat\u00E9riel", "foot.alerts": "Alertes prix",
      "foot.pro": "PCPicker Pro Studio", "foot.trends": "Tendances des prix",
      "foot.budgetTitle": "PC Gamer par budget", "foot.allBudgets": "Tous les budgets (3k \u00E0 50k+)",
      "foot.cityTitle": "Magasins par ville", "foot.allCities": "Toutes les villes du Maroc",
      "foot.infoTitle": "Informations", "foot.about": "\u00C0 propos",
      "foot.support": "Soutenir le projet \u2615", "foot.status": "\u00C9tat du service",
      "foot.privacy": "Politique de confidentialit\u00E9", "foot.terms": "Conditions d'utilisation",
      "foot.rights": "\u00A9 2026 checkmypc.ma. Tous droits r\u00E9serv\u00E9s.",
      "foot.builtBy": "D\u00E9velopp\u00E9 par incconu_two",
      "foot.disclaimer": "PCPicker est une plateforme ind\u00E9pendante de comparaison de prix. Les achats se font directement aupr\u00E8s des revendeurs list\u00E9s.",
      "foot.language": "Langue",
      "ui.theme": "Th\u00E8me",
      "ui.themeDark": "Passer en mode sombre",
      "ui.themeLight": "Passer en mode clair",
      "ui.closeMenu": "Fermer le menu",
      "drawer.main": "Navigation",
      "drawer.categories": "Par cat\u00E9gorie",
      "drawer.utility": "Outils & compte",
      "drawer.inspection": "Inspection PC",
      "drawer.guides": "Guides de montage",
      "drawer.myBuild": "Ma configuration"
    },
    ar: {
      "nav.builder": "\u0645\u0631\u0643\u0651\u0628 \u0627\u0644\u062D\u0627\u0633\u0648\u0628", "nav.components": "\u0627\u0644\u0642\u0637\u0639",
      "nav.guides": "\u0623\u062F\u0644\u0629 \u0627\u0644\u062A\u0631\u0643\u064A\u0628", "nav.prebuilts": "\u0623\u062C\u0647\u0632\u0629 \u062C\u0627\u0647\u0632\u0629",
      "nav.trends": "\u0627\u0644\u0623\u0633\u0639\u0627\u0631", "nav.mybuild": "\u0627\u0644\u062A\u062C\u0645\u064A\u0639\u0629 \u062F\u064A\u0627\u0644\u064A",
      "nav.search": "\u0628\u062D\u062B", "nav.menu": "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      "mega.core": "\u0627\u0644\u0642\u0637\u0639 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", "mega.graphics": "\u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u062A\u063A\u0630\u064A\u0629",
      "mega.displays": "\u0627\u0644\u0634\u0627\u0634\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A", "mega.browse": "\u062A\u0635\u0641\u0651\u062D",
      "mega.all": "\u062C\u0645\u064A\u0639 \u0627\u0644\u0642\u0637\u0639", "mega.alerts": "\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A",
      "mega.inspection": "\u0641\u062D\u0635 \u0627\u0644\u062D\u0627\u0633\u0648\u0628",
      "cat.cpu": "\u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0627\u062A", "cat.cooler": "\u0645\u0628\u0631\u0651\u062F\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0644\u062C",
      "cat.motherboard": "\u0627\u0644\u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0623\u0645", "cat.ram": "\u0627\u0644\u0630\u0627\u0643\u0631\u0629 (RAM)",
      "cat.storage": "\u0627\u0644\u062A\u062E\u0632\u064A\u0646", "cat.gpu": "\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A",
      "cat.psu": "\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629", "cat.case": "\u0627\u0644\u0635\u0646\u0627\u062F\u064A\u0642",
      "cat.display": "\u0627\u0644\u0634\u0627\u0634\u0627\u062A", "cat.peripheral": "\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A",
      "stock.in": "\u0645\u062A\u0648\u0641\u0631", "stock.low": "\u0643\u0645\u064A\u0629 \u0642\u0644\u064A\u0644\u0629", "stock.out": "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631",
      "ui.filters": "\u0627\u0644\u0641\u0644\u0627\u062A\u0631", "ui.close": "\u0625\u063A\u0644\u0627\u0642", "ui.stores": "\u0645\u062D\u0644\u0627\u062A",
      "ui.components": "\u0642\u0637\u0639\u0629", "ui.search": "\u0628\u062D\u062B",
      "ui.searchPlaceholder": "\u0628\u062D\u062B \u2014 RTX 4060\u060C \u0644\u0648\u062D\u0629 AM5\u2026",
      "ui.noMatch": "\u0645\u0627 \u0643\u0627\u064A\u0646 \u0648\u0627\u0644\u0648", "ui.noMatchBody": "\u0648\u0633\u0651\u0639 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0623\u0648 \u0645\u0633\u062D \u0641\u0644\u062A\u0631 \u0627\u0644\u0639\u0644\u0627\u0645\u0629.",
      "ui.noResult": "\u0645\u0627 \u0644\u0642\u064A\u0646\u0627 \u062D\u062A\u0649 \u0642\u0637\u0639\u0629.",
      "ui.add": "\u0632\u064A\u062F", "ui.addedTo": "\u062A\u0632\u0627\u062F \u0644\u0644\u062A\u062C\u0645\u064A\u0639\u0629",
      "ui.buy": "\u0634\u0631\u064A", "ui.choose": "\u2014 \u0627\u062E\u062A\u0627\u0631 \u2014", "ui.browse": "\u062A\u0635\u0641\u0651\u062D",
      "ui.category": "\u0627\u0644\u0641\u0626\u0629", "ui.budget": "\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 (\u062F\u0631\u0647\u0645)",
      "ui.availability": "\u0627\u0644\u062A\u0648\u0641\u0631", "ui.inStockOnly": "\u0627\u0644\u0645\u062A\u0648\u0641\u0631 \u0641\u0642\u0637",
      "ui.brand": "\u0627\u0644\u0639\u0644\u0627\u0645\u0629", "ui.reset": "\u0645\u0633\u062D \u0627\u0644\u0641\u0644\u0627\u062A\u0631",
      "ui.minAgo": "\u062F\u0642\u064A\u0642\u0629", "ui.hAgo": "\u0633\u0627\u0639\u0629", "ui.dAgo": "\u064A\u0648\u0645",
      "ui.checked": "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0642\u0628\u0644", "ui.alertOn": "\u2713 \u0627\u0644\u062A\u0646\u0628\u064A\u0647 \u0645\u0641\u0639\u0651\u0644",
      "ui.alertOff": "\u0641\u0639\u0651\u0644 \u062A\u0646\u0628\u064A\u0647 \u0627\u0646\u062E\u0641\u0627\u0636 \u0627\u0644\u062B\u0645\u0646", "ui.alertAdded": "\u062A\u0641\u0639\u0651\u0644 \u0627\u0644\u062A\u0646\u0628\u064A\u0647",
      "ui.alertRemoved": "\u062A\u0645\u0633\u062D \u0627\u0644\u062A\u0646\u0628\u064A\u0647", "ui.copied": "\u062A\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637",
      "ui.pickParts": "\u0627\u062E\u062A\u0627\u0631 \u0645\u0639\u0627\u0644\u062C \u0648\u0644\u0648\u062D\u0629 \u0623\u0645 \u0628\u0627\u0634 \u062A\u0628\u062F\u0627 \u0641\u062D\u0648\u0635\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0641\u0642.",
      "ui.systems": "\u0623\u062C\u0647\u0632\u0629 \u062C\u0627\u0647\u0632\u0629", "ui.viewOffer": "\u0634\u0648\u0641 \u0627\u0644\u0639\u0631\u0636",
      "ui.noSystem": "\u0645\u0627 \u0643\u0627\u064A\u0646 \u062D\u062A\u0649 \u062C\u0647\u0627\u0632 \u0641\u0647\u0627\u062F \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629", "ui.widerBudget": "\u062C\u0631\u0651\u0628 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0623\u0648\u0633\u0639.",
      "ui.new": "\u062C\u062F\u064A\u062F", "ui.used": "\u0645\u0633\u062A\u0639\u0645\u0644", "ui.store": "\u0627\u0644\u0645\u062D\u0644", "ui.price": "\u0627\u0644\u062B\u0645\u0646",
      "foot.tagline": "\u0642\u0627\u0631\u0646 \u0627\u0644\u0623\u062B\u0645\u0646\u0629 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 27 \u0645\u062D\u0644 \u0644\u0644\u0625\u0639\u0644\u0627\u0645\u064A\u0627\u062A \u0641\u0627\u0644\u0645\u063A\u0631\u0628\u060C \u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0648\u0627\u0641\u0642 \u0627\u0644\u0642\u0637\u0639\u060C \u0648\u0644\u0642\u0627 \u0623\u062D\u0633\u0646 \u0627\u0644\u0639\u0631\u0648\u0636 \u0628\u0627\u0644\u062F\u0631\u0647\u0645.",
      "foot.hubs": "\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0639\u062A\u0627\u062F", "foot.alerts": "\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0623\u0633\u0639\u0627\u0631",
      "foot.pro": "PCPicker Pro Studio", "foot.trends": "\u062A\u0637\u0648\u0631 \u0627\u0644\u0623\u0633\u0639\u0627\u0631",
      "foot.budgetTitle": "\u062D\u0627\u0633\u0648\u0628 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062D\u0633\u0628 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629", "foot.allBudgets": "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0627\u062A (3\u0643 \u0625\u0644\u0649 +50\u0643)",
      "foot.cityTitle": "\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0645\u062F\u064A\u0646\u0629", "foot.allCities": "\u062C\u0645\u064A\u0639 \u0645\u062F\u0646 \u0627\u0644\u0645\u063A\u0631\u0628",
      "foot.infoTitle": "\u0645\u0639\u0644\u0648\u0645\u0627\u062A", "foot.about": "\u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0639",
      "foot.support": "\u062F\u0639\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u2615", "foot.status": "\u062D\u0627\u0644\u0629 \u0627\u0644\u062E\u062F\u0645\u0629",
      "foot.privacy": "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629", "foot.terms": "\u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
      "foot.rights": "\u00A9 2026 checkmypc.ma. \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.",
      "foot.builtBy": "\u062A\u0637\u0648\u064A\u0631 incconu_two",
      "foot.disclaimer": "PCPicker \u0645\u0646\u0635\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0623\u062B\u0645\u0646\u0629. \u0627\u0644\u0634\u0631\u0627\u0621 \u0643\u064A\u062A\u0645 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639 \u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629.",
      "foot.language": "\u0627\u0644\u0644\u063A\u0629",
      "ui.theme": "\u0627\u0644\u0645\u0638\u0647\u0631",
      "ui.themeDark": "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A",
      "ui.themeLight": "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A",
      "ui.closeMenu": "\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      "drawer.main": "\u0627\u0644\u062A\u0646\u0642\u0644",
      "drawer.categories": "\u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0629",
      "drawer.utility": "\u0623\u062F\u0648\u0627\u062A \u0648\u062D\u0633\u0627\u0628",
      "drawer.inspection": "\u0641\u062D\u0635 \u0627\u0644\u062D\u0627\u0633\u0648\u0628",
      "drawer.guides": "\u0623\u062F\u0644\u0629 \u0627\u0644\u062A\u0631\u0643\u064A\u0628",
      "drawer.myBuild": "\u0627\u0644\u062A\u062C\u0645\u064A\u0639\u0629 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629"
    }
  };

  var lang = (function () {
    try { var s = localStorage.getItem(LANG_KEY); if (DICT[s]) return s; } catch (e) {}
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return DICT[n] ? n : "en";
  })();

  /* Falls back to English, then to the key itself, so a missing string is
     visible in review rather than rendering as blank. */
  function t(key) {
    return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  }

  function isRTL() { return lang === "ar"; }

  /* Views register a repaint fn here so switching language re-renders
     dynamic content without a page reload. */
  var RERENDER = [];
  function onLangChange(fn) { RERENDER.push(fn); }

  function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    applyLang();
    syncLangControls();
    applyTheme(); /* toggle labels are translated too */
    RERENDER.forEach(function (fn) { try { fn(); } catch (e) {} });
    applyLang(); /* second pass: newly rendered nodes carry data-i18n too */
    document.dispatchEvent(new CustomEvent("cmp:lang", { detail: next }));
  }

  /* Applies direction + translates every [data-i18n] node currently in the DOM.
     Called on boot and after any re-render. */
  function applyLang() {
    var html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", isRTL() ? "rtl" : "ltr");
    html.classList.toggle("is-rtl", isRTL());

    $$("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    $$("[data-i18n-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-label")));
    });
  }

  /* ---------- catalog access ---------- */
  function adminData() {
    var empty = { prebuilts: [], components: [], componentOverrides: {}, prebuiltOverrides: {}, hiddenComponents: {}, hiddenPrebuilts: {}, site: {} };
    try {
      var d = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}');
      Object.keys(empty).forEach(function(k){ if (d[k] == null) d[k] = empty[k]; });
      return d;
    } catch (e) { return empty; }
  }
  function siteData() {
    var d = adminData(), s = d.site || {};
    var def = {
      brand: 'CHECKMYPC.MA',
      logoLight: 'assets/logo-light.svg', logoDark: 'assets/logo-dark.svg',
      nav: { builder:'System Builder', components:'Components', guides:'Build Guides', prebuilts:'Prebuilt PCs', trends:'Trends', mybuild:'My Build' },
      home: { eyebrow:'Morocco · PC buying made smarter', title:'Build smarter.<br>Buy better.', description:'Compare component prices across Moroccan stores, check compatibility before you commit, and track price drops in dirham. Every part below is tracked across 6 local retailers.', build:'Open System Builder', browse:'Browse components', inspect:'Inspect a used PC', componentsTitle:'Shop by component', componentsDesc:'10 categories, live store pricing in DH.', componentsButton:'View full catalogue →', prebuiltTitle:'Start from a prebuilt', prebuiltDesc:'Ready systems filtered by budget bracket.', prebuiltButton:'Browse prebuilt PCs' },
      pages: {
        prebuilts:{eyebrow:'Prebuilt PCs',title:'Ready-to-buy systems',description:'Complete machines priced from live component offers. Filter by budget bracket, store, GPU or condition.'},
        products:{eyebrow:'Components',title:'Component catalogue',description:'Filter by budget, brand and specification. Prices are the lowest in-stock offer found across tracked Moroccan stores.'},
        used:{eyebrow:'Used market',title:'Used PCs & parts',description:'Used estimates are derived from current new pricing. Always request an inspection before buying.'},
        builder:{eyebrow:'System Builder',title:'Build your PC',description:'Pick a part per slot. Totals, power draw and compatibility update live, and your build stays saved in this browser.'},
        inspection:{eyebrow:'CHECKMYPC Inspection',title:'Pre-purchase PC inspection',description:'Before you pay for a used machine, have its condition verified.'},
        compatibility:{eyebrow:'Compatibility',title:'Compatibility checks',description:'The System Builder validates these automatically as you pick parts.'},
        search:{eyebrow:'Market tools',title:'Price trends & alerts',description:'Use the search icon in the header to look up any tracked part. Open a product page to watch price history.'},
        builds:{eyebrow:'Guides',title:'Build guides',description:'Starting points you can load into the System Builder and adjust.'}
      },
      footer:{tagline:'CHECKMYPC.MA · Compare smarter. Inspect before you buy.'}
    };
    function merge(a,b){ var o={}; Object.keys(a).forEach(function(k){o[k]=a[k]}); Object.keys(b||{}).forEach(function(k){ if(a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])&&b[k]&&typeof b[k]==='object') o[k]=merge(a[k],b[k]); else o[k]=b[k]; }); return o; }
    return merge(def,s);
  }
  function applySiteContent(){
    var s=siteData(), page=document.body.getAttribute('data-page');
    $$('[data-cms]').forEach(function(el){
      var key=el.getAttribute('data-cms'), val;
      var path=location.pathname.toLowerCase();
      var pageKey=(page==='prebuilts' && path.indexOf('/used/')>-1)?'used':page;
      if(key.indexOf('home.')===0) val=s.home[key.slice(5)];
      else if(key.indexOf('page.')===0){ var p=s.pages[pageKey==='prebuilts'?'prebuilts':pageKey]; val=p&&p[key.slice(5)]; }
      else if(key==='footer.tagline') val=s.footer.tagline;
      if(val!=null) { if(key==='home.title') el.innerHTML=val; else el.textContent=val; }
    });
    $$('[data-cat]').forEach(function(card){
      var slug=card.getAttribute('data-cat'), c=(s.categories||[]).filter(function(x){return x.slug===slug})[0];
      if(c){ if(c.label){var h=card.querySelector('h3');if(h)h.textContent=c.label} if(c.description){var p=card.querySelector('p');if(p)p.textContent=c.description} if(c.visible===false) card.hidden=true; }
    });
  }
  function customComponents() {
    var d = adminData();
    return (d.components || []).filter(function (p) { return p.published; }).map(function (p) {
      return {
        id: p.id, custom: true, category: p.category, name: p.name, brand: p.brand || "Other",
        image: p.image || "assets/parts/gpu.svg", best_price: Number(p.price || 0),
        used_price: p.condition === "used" ? Number(p.price || 0) : Number(p.used_price || 0), in_stock: true, store_count: 1, power_draw: 0,
        specs: p.specs || {},
        offers: [{ store: p.store || "CHECKMYPC.MA", city: "Morocco", price: Number(p.price || 0), stock: "in_stock", checked_minutes_ago: 0, url: p.offerUrl || "#" }],
        history: [{ d: new Date().toISOString().slice(0,10), p: Number(p.price || 0) }],
        offerUrl: p.offerUrl || "#"
      };
    });
  }
  function applyComponentOverride(p){
    var d=adminData(), o=(d.componentOverrides||{})[p.id];
    if(!o || (d.hiddenComponents||{})[p.id]) return (d.hiddenComponents||{})[p.id] ? null : p;
    var x={}; Object.keys(p).forEach(function(k){x[k]=p[k]}); Object.keys(o).forEach(function(k){x[k]=o[k]});
    x.best_price=Number(o.price!=null?o.price:p.best_price||0);
    x.used_price=Number(o.used_price!=null?o.used_price:p.used_price||0);
    x.image=o.image||p.image; x.specs=o.specs||p.specs||{};
    x.offers=o.offerUrl ? [{store:o.store||'CHECKMYPC.MA',city:o.city||'Morocco',price:x.best_price,stock:o.stock||'in_stock',checked_minutes_ago:0,url:o.offerUrl}] : p.offers;
    x.offerUrl=o.offerUrl||p.offerUrl||((x.offers||[])[0]||{}).url||'#';
    x.custom=false;
    return x;
  }
  var Catalog = {
    all: function () { return (CAT.products || []).map(applyComponentOverride).filter(Boolean).concat(customComponents()); },
    byId: function (id) { return this.all().filter(function (p) { return p.id === id; })[0] || null; },
    byCategory: function (slug) {
      if (!slug || slug === "all") return this.all();
      return this.all().filter(function (p) { return p.category === slug; });
    },
    categoryLabel: function (slug) {
      var key = "cat." + slug;
      var translated = t(key);
      if (translated !== key) return translated;
      var customCats=(siteData().categories||[]).filter(function(x){return x.slug===slug})[0];
      if(customCats && customCats.label) return customCats.label;
      var c = (CAT.categories || []).filter(function (x) { return x.slug === slug; })[0];
      return c ? c.label : slug;
    },
    bestOffer: function (p) {
      var live = (p.offers || []).filter(function (o) { return o.stock !== "out_of_stock"; });
      return (live.length ? live : p.offers || [])[0] || null;
    },
    /* Facets drive the sidebar: brands + every spec key that discriminates. */
    facets: function (items) {
      var brands = {}, specs = {};
      items.forEach(function (p) {
        brands[p.brand] = (brands[p.brand] || 0) + 1;
        Object.keys(p.specs || {}).forEach(function (k) {
          var v = p.specs[k];
          if (v === "\u2014" || v == null) return;
          (specs[k] = specs[k] || {})[v] = (specs[k][v] || 0) + 1;
        });
      });
      Object.keys(specs).forEach(function (k) {
        var n = Object.keys(specs[k]).length;
        if (n < 2 || n > 8) delete specs[k];
      });
      return { brands: brands, specs: specs };
    },
    priceBounds: function (items) {
      if (!items.length) return [0, 1000];
      var ps = items.map(function (p) { return p.best_price; });
      return [Math.floor(Math.min.apply(null, ps) / 100) * 100,
              Math.ceil(Math.max.apply(null, ps) / 100) * 100];
    }
  };

  /* ---------- build state (localStorage) ---------- */
  var Build = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(BUILD_KEY) || "{}"); } catch (e) { return {}; }
    },
    write: function (b) {
      try { localStorage.setItem(BUILD_KEY, JSON.stringify(b)); } catch (e) {}
      document.dispatchEvent(new CustomEvent("cmp:build", { detail: b }));
      this.paintCount();
    },
    add: function (id, qty) {
      var p = Catalog.byId(id);
      if (!p) return;
      var b = this.read();
      b[p.category] = { id: id, qty: Math.max(1, qty || 1) };
      this.write(b);
      toast(t("ui.addedTo") + " \u2014 " + p.name);
    },
    remove: function (cat) { var b = this.read(); delete b[cat]; this.write(b); },
    clear: function () { this.write({}); },
    /* Line items priced off the cheapest in-stock offer. */
    items: function () {
      var b = this.read(), out = [];
      Object.keys(b).forEach(function (cat) {
        var p = Catalog.byId(b[cat].id);
        if (!p) return;
        var o = Catalog.bestOffer(p), q = b[cat].qty || 1;
        out.push({ product: p, qty: q, offer: o, line: (o ? o.price : p.best_price) * q });
      });
      return out;
    },
    total: function () { return this.items().reduce(function (a, i) { return a + i.line; }, 0); },
    count: function () { return Object.keys(this.read()).length; },
    paintCount: function () {
      var el = $("#nav-build-count");
      if (el) { var n = this.count(); el.textContent = n ? "(" + n + ")" : ""; }
    }
  };

  /* ---------- price alerts ---------- */
  var Alerts = {
    read: function () { try { return JSON.parse(localStorage.getItem(ALERT_KEY) || "[]"); } catch (e) { return []; } },
    has: function (id) { return this.read().indexOf(id) > -1; },
    toggle: function (id) {
      var a = this.read(), i = a.indexOf(id);
      if (i > -1) a.splice(i, 1); else a.push(id);
      try { localStorage.setItem(ALERT_KEY, JSON.stringify(a)); } catch (e) {}
      toast(t(i > -1 ? "ui.alertRemoved" : "ui.alertAdded"));
      return i === -1;
    }
  };


  /* ============================================================
     THEME — light / dark with system fallback
     An inline script in <head> applies the stored theme before first
     paint; this module keeps it in sync afterwards.
     ============================================================ */
  var THEME_KEY = "cmp.theme.v1";
  var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedTheme() {
    try { var s = localStorage.getItem(THEME_KEY); return s === "dark" || s === "light" ? s : null; }
    catch (e) { return null; }
  }
  function systemTheme() { return mql && mql.matches ? "dark" : "light"; }
  var theme = storedTheme() || systemTheme();

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme);
    $$("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(theme === "dark"));
      b.setAttribute("aria-label", t(theme === "dark" ? "ui.themeLight" : "ui.themeDark"));
      b.setAttribute("title", t(theme === "dark" ? "ui.themeLight" : "ui.themeDark"));
    });
  }
  function setTheme(next, persist) {
    theme = next === "dark" ? "dark" : "light";
    if (persist !== false) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
    applyTheme();
  }
  /* Follow the OS only while the user hasn't made an explicit choice. */
  if (mql && mql.addEventListener) {
    mql.addEventListener("change", function (e) {
      if (!storedTheme()) setTheme(e.matches ? "dark" : "light", false);
    });
  }

  /* One markup source for both control pairs, so header and footer
     can never drift apart. */
  function themeToggleHTML() {
    return '<button class="theme-toggle" type="button" data-theme-toggle>' +
      '<span class="ic ic-moon" aria-hidden="true">\u263E</span>' +
      '<span class="ic ic-sun" aria-hidden="true">\u2600</span></button>';
  }
  function langSelectHTML(cls) {
    return '<select class="lang-select ' + (cls || "") + '" data-lang-select ' +
      'data-i18n-label="foot.language">' +
      Object.keys(LANGS).map(function (c) {
        return '<option value="' + c + '"' + (c === lang ? " selected" : "") +
               ">" + LANGS[c] + "</option>";
      }).join("") + "</select>";
  }
  /* Delegated so controls rendered later still work, and so every
     lang <select> on the page mirrors the others instantly. */
  function bindControls() {
    $$("[data-theme-toggle]").forEach(function (b) {
      b.onclick = function () { setTheme(theme === "dark" ? "light" : "dark"); };
    });
    $$("[data-lang-select]").forEach(function (s) {
      s.onchange = function () { setLang(this.value); };
    });
  }
  function syncLangControls() {
    $$("[data-lang-select]").forEach(function (s) { s.value = lang; });
  }

  /* ============================================================
     GLOBAL NAVIGATION — injected so every page stays in sync
     ============================================================ */
  var NAV_GROUPS = [
    { title: "Core components", items: ["cpu", "cooler", "motherboard", "ram", "storage"] },
    { title: "Graphics & power", items: ["gpu", "psu", "case"] },
    { title: "Displays & gear", items: ["display", "peripheral"] }
  ];

  function megaColumn(group) {
    var links = group.items.map(function (slug) {
      var c = (CAT.categories || []).filter(function (x) { return x.slug === slug; })[0];
      if (!c) return "";
      return '<a href="' + url("products/index.html?category=" + slug) + '">' +
             '<span class="mi"><img src="' + url(c.icon) + '" alt=""></span>' + esc(c.label) + "</a>";
    }).join("");
    return "<div><h4>" + esc(group.title) + "</h4>" + links + "</div>";
  }


  /* Category shortcuts shown as chips inside the mobile drawer. */
  var DRAWER_CATS = ["cpu", "gpu", "ram", "motherboard"];

  function drawerExtrasHTML() {
    var chips = DRAWER_CATS.map(function (slug) {
      var c = (CAT.categories || []).filter(function (x) { return x.slug === slug; })[0];
      if (!c) return "";
      return '<a href="' + url("products/index.html?category=" + slug) + '">' +
        '<img src="' + url(c.icon) + '" alt=""><span data-i18n="cat.' + slug + '">' +
        esc(c.label) + "</span></a>";
    }).join("");

    return '<div class="drawer-group"><h5 data-i18n="drawer.categories">Shop by category</h5>' +
        '<div class="drawer-chips">' + chips + "</div></div>" +
      '<div class="drawer-group"><h5 data-i18n="drawer.utility">Tools &amp; account</h5>' +
        '<div class="drawer-chips">' +
          '<a href="' + url("builder/index.html") + '" data-i18n="drawer.myBuild">My build</a>' +
          '<a href="' + url("builds/index.html") + '" data-i18n="drawer.guides">Build Guides</a>' +
          '<a href="' + url("inspection/index.html") + '" data-i18n="drawer.inspection">Inspection</a>' +
        "</div></div>";
  }

  function mountNav(active) {
    var host = $("#site-header");
    if (!host) return;
    host.className = "top";
    host.innerHTML =
      '<nav class="nav">' +
        '<a class="brand" href="' + url("index.html") + '">' +
          '<img class="brand-logo logo-light" src="' + url(siteData().logoLight) + '" alt="' + esc(siteData().brand) + '">' +
          '<img class="brand-logo logo-dark" src="' + url(siteData().logoDark) + '" alt="' + esc(siteData().brand) + '">' +
          '</a>' +
        '<button class="nav-burger" id="nav-burger" type="button" ' +
          'aria-expanded="false" data-i18n-label="nav.menu">' +
          '<span></span><span></span><span></span></button>' +
        '<div class="links" id="nav-links">' +
          '<div class="drawer-head">' +
            '<div class="drawer-tools">' + themeToggleHTML() + langSelectHTML("") + "</div>" +
            '<button class="nav-icon" id="drawer-close" type="button" ' +
              'data-i18n-label="ui.closeMenu">\u2715</button>' +
          "</div>" +
          '<a data-nav="builder" href="' +
            url("builder/index.html") + '">' + esc(siteData().nav.builder) + '</a>' +
          '<div class="menu-wrap" data-nav="products">' +
            '<button class="menu-trigger" type="button" aria-expanded="false">' +
              '<span>' + esc(siteData().nav.components) + '</span> ' +
              '<span class="caret">\u25BE</span></button>' +
            '<div class="mega">' + NAV_GROUPS.map(megaColumn).join("") +
              '<div><h4 data-i18n="mega.browse">Browse</h4>' +
                '<a data-i18n="mega.all" href="' + url("products/index.html") + '">All components</a>' +
                '<a data-i18n="nav.builder" href="' + url("builder/index.html") + '">' + esc(siteData().nav.builder) + '</a>' +
                '<a data-i18n="mega.alerts" href="' + url("search/index.html") + '">' + esc(siteData().nav.trends) + '</a>' +
                '<a data-i18n="mega.inspection" href="' + url("inspection/index.html") + '">Inspection</a>' +
              "</div>" +
            "</div></div>" +
          '<a data-nav="builds" href="' +
            url("builds/index.html") + '">' + esc(siteData().nav.guides) + '</a>' +
          '<a data-nav="prebuilts" href="' +
            url("new/index.html") + '">' + esc(siteData().nav.prebuilts) + '</a>' +
          '<a data-nav="search" href="' +
            url("search/index.html") + '">' + esc(siteData().nav.trends) + '</a>' +
          drawerExtrasHTML() +
        "</div>" +
        '<div class="nav-right">' +
          '<button class="nav-icon" id="nav-search-btn" type="button" ' +
            'data-i18n-label="ui.search">\u2315</button>' +
          '<span class="nav-currency" title="All prices in Moroccan dirham">DH \u00B7 MAD</span>' +
          themeToggleHTML() + langSelectHTML("") +
          '<a class="nav-cta" href="' + url("builder/index.html") + '">' +
            '<span>' + esc(siteData().nav.mybuild) + '</span> ' +
            '<span id="nav-build-count"></span></a>' +
        "</div>" +
      "</nav>" +
      '<div class="drawer-backdrop" id="drawer-backdrop"></div>' +
      '<div class="nav-search" id="nav-search" hidden>' +
        '<input type="search" id="nav-search-input" autocomplete="off" ' +
          'data-i18n-ph="ui.searchPlaceholder">' +
        '<div class="nav-search-results" id="nav-search-results"></div>' +
      "</div>";

    var cur = $('[data-nav="' + active + '"]', host);
    if (cur) cur.classList.add("active");

    /* Mega-menu opens on hover (CSS) and on click for touch/keyboard. */
    /* Hamburger + slide-out drawer below 900px. */
    var burger = $("#nav-burger", host), links = $("#nav-links", host),
        backdrop = $("#drawer-backdrop", host);

    if (!burger || !links || !backdrop) return;

    /*
     * Mobile drawer portal:
     * .top uses backdrop-filter, which can establish a containing block for
     * fixed descendants. If the drawer stays inside the sticky header, some
     * mobile browsers constrain the "fixed" drawer to the header's height.
     * Move the drawer and its backdrop to <body> so they are positioned
     * against the real viewport and can cover the complete page.
     */
    if (links && window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
      document.body.appendChild(links);
      document.body.appendChild(backdrop);
    }

    function setDrawer(open) {
      links.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
      if (open) {
        var first = $("a", links);
        if (first) setTimeout(function () { first.focus(); }, 340);
      } else { burger.focus(); }
    }

    burger.addEventListener("click", function () {
      setDrawer(!links.classList.contains("open"));
    });
    backdrop.addEventListener("click", function () { setDrawer(false); });
    var drawerClose = $("#drawer-close", links);
    if (drawerClose) drawerClose.addEventListener("click", function () { setDrawer(false); });
    /* Any page link closes the drawer; the controls inside it must not. */
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { setDrawer(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) setDrawer(false);
    });

    var wrap = $(".menu-wrap", host);
    var menuTrigger = $(".menu-trigger", host);
    var mega = wrap ? $(".mega", wrap) : null;

    /*
     * Keep the desktop mega-menu in its normal nav parent so the standard
     * CSS hover/click states continue to work. On small screens, the drawer
     * is portaled to <body> to avoid clipping by mobile transforms/overflow.
     */
    if (mega && wrap) {
      var mobileLayout = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
      if (mobileLayout) {
        if (!mega.classList.contains("mega-portal")) {
          document.body.appendChild(mega);
          mega.classList.add("mega-portal");
        }
      } else {
        if (mega.classList.contains("mega-portal")) {
          mega.classList.remove("mega-portal");
        }
        if (!wrap.contains(mega)) {
          wrap.appendChild(mega);
        }
      }
    }

    if (mega && wrap && menuTrigger) {
      function positionMega() {
        if (!mega || !menuTrigger) return;
        var r = menuTrigger.getBoundingClientRect();
        var gap = 8;
        var side = 12;
        var maxW = Math.min(850, window.innerWidth - side * 2);
        var left = r.left + (r.width / 2) - (maxW / 2);
        left = Math.max(side, Math.min(left, window.innerWidth - maxW - side));
        mega.style.width = maxW + "px";
        mega.style.left = left + "px";
        mega.style.top = (r.bottom + gap) + "px";
      }

      function setMega(open) {
        if (!mega) return;
        wrap.classList.toggle("open", open);
        mega.classList.toggle("portal-open", open);
        menuTrigger.setAttribute("aria-expanded", String(open));
        if (open && mega.classList.contains("mega-portal")) positionMega();
      }

      menuTrigger.addEventListener("click", function (e) {
        e.preventDefault();
        var next = !mega.classList.contains("portal-open");
        setMega(next);
        if (!mega.classList.contains("mega-portal") && next) {
          positionMega();
        }
      });

      window.addEventListener("resize", function () {
        if (mega && mega.classList.contains("portal-open")) positionMega();
      });
      window.addEventListener("scroll", function () {
        if (mega && mega.classList.contains("portal-open")) positionMega();
      }, { passive: true });

      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target) && !(mega && mega.contains(e.target))) setMega(false);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMega(false);
      });
    }

    mountNavSearch();
    Build.paintCount();
  }

  function mountNavSearch() {
    var btn = $("#nav-search-btn"), box = $("#nav-search"),
        input = $("#nav-search-input"), out = $("#nav-search-results");
    if (!btn || !box || !input || !out) return;

    function renderSearchResults() {
      var q = (input.value || "").trim().toLowerCase();
      if (q.length < 2) { out.innerHTML = ""; return; }

      var hits = Catalog.all().filter(function (p) {
        var hay = (p.name || "") + " " + (p.brand || "") + " " + Object.keys(p.specs || {})
          .map(function (k) { return p.specs[k]; }).join(" ");
        return (hay || "").toLowerCase().indexOf(q) > -1;
      }).slice(0, 8);

      out.innerHTML = hits.length ? hits.map(function (p) {
        return '<a href="' + url(p.custom ? ("products/custom/index.html?id=" + encodeURIComponent(p.id)) : ("products/" + p.id + "/")) + '">' +
          '<img src="' + url(p.image) + '" alt=""><span>' + esc(p.name) + "</span>" +
          "<b>" + dh(p.best_price) + "</b></a>";
      }).join("") : '<div class="ns-empty">' + t("ui.noResult") + "</div>";
    }

    btn.addEventListener("click", function () {
      box.hidden = !box.hidden;
      if (!box.hidden) {
        renderSearchResults();
        input.focus();
      }
    });

    ["input", "keyup", "search", "change"].forEach(function (evt) {
      input.addEventListener(evt, renderSearchResults);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") box.hidden = true;
    });
  }


  /* ============================================================
     FOOTER — injected on every page, same pattern as the nav
     ============================================================ */
  var FOOT_BUDGETS = [
    ["PC Gamer 5 000 DH", 5000], ["PC Gamer 7 000 DH", 7000],
    ["PC Gamer 8 000 DH", 8000], ["PC Gamer 10 000 DH", 10000],
    ["PC Gamer 15 000 DH", 15000]
  ];
  var FOOT_CITIES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "F\u00E8s", "Agadir"];

  function footLink(href, label, key) {
    return '<a href="' + href + '"' + (key ? ' data-i18n="' + key + '"' : "") +
           ">" + esc(label) + "</a>";
  }

  function mountFooter() {
    var host = $("#site-footer");
    if (!host) return;
    host.className = "site-footer";

    var col1 = [
      footLink(url("builder/index.html"), "System Builder", "nav.builder"),
      footLink(url("products/index.html"), "Components", "nav.components"),
      footLink(url("new/index.html"), "Prebuilt PCs", "nav.prebuilts"),
      footLink(url("search/index.html"), "Price Trends", "foot.trends"),
      footLink(url("products/index.html"), "Hardware Hubs", "foot.hubs"),
      footLink(url("search/index.html"), "Price Alerts", "foot.alerts"),
      footLink(url("builder/index.html"), "PCPicker Pro Studio", "foot.pro")
    ].join("");

    var col2 = FOOT_BUDGETS.map(function (b) {
      return footLink(url("new/index.html?budget=" + b[1]), b[0]);
    }).join("") +
      '<a class="foot-more" href="' + url("new/index.html") + '">' +
        '<span data-i18n="foot.allBudgets">All budgets (3k to 50k+)</span> ' +
        '<span class="foot-arrow">&rarr;</span></a>';

    var col3 = FOOT_CITIES.map(function (c) {
      return footLink(url("new/index.html?city=" + encodeURIComponent(c)), "PC Gamer " + c);
    }).join("") +
      '<a class="foot-more" href="' + url("new/index.html") + '">' +
        '<span data-i18n="foot.allCities">All cities in Morocco</span> ' +
        '<span class="foot-arrow">&rarr;</span></a>';

    var col4 = [
      footLink(url("inspection/index.html"), "About", "foot.about"),
      footLink(url("inspection/index.html"), "Support the Project \u2615", "foot.support"),
      footLink(url("search/index.html"), "System Status", "foot.status"),
      footLink(url("index.html"), "Privacy Policy", "foot.privacy"),
      footLink(url("index.html"), "Terms of Service", "foot.terms")
    ].join("");

    host.innerHTML =
      '<div class="foot-banner"><p data-cms="footer.tagline">' + esc(siteData().footer.tagline) + '</p></div>' +
      '<div class="foot-cols">' +
        '<div class="foot-col foot-brand">' +
          '<a class="brand" href="' + url("index.html") + '">' +
            '<img class="brand-logo logo-light" src="' + url(siteData().logoLight) + '" alt="' + esc(siteData().brand) + '">' +
            '<img class="brand-logo logo-dark" src="' + url(siteData().logoDark) + '" alt="' + esc(siteData().brand) + '">' +
            '</a>' +
          '<nav class="foot-links">' + col1 + "</nav></div>" +
        '<div class="foot-col"><h4 data-i18n="foot.budgetTitle">Gaming PC by Budget</h4>' +
          '<nav class="foot-links">' + col2 + "</nav></div>" +
        '<div class="foot-col"><h4 data-i18n="foot.cityTitle">Stores by City</h4>' +
          '<nav class="foot-links">' + col3 + "</nav></div>" +
        '<div class="foot-col"><h4 data-i18n="foot.infoTitle">Information</h4>' +
          '<nav class="foot-links">' + col4 + "</nav></div>" +
      "</div>" +
      '<div class="foot-bottom">' +
        '<div class="foot-legal">' +
          '<span data-i18n="foot.rights"></span>' +
          '<span class="foot-sep">&middot;</span>' +
          '<span data-i18n="foot.builtBy"></span>' +
          '<p class="foot-disclaimer" data-i18n="foot.disclaimer"></p>' +
        "</div>" +
        '<div class="lang-switch">' +
          '<span class="lang-globe" aria-hidden="true">\u2295</span>' +
          langSelectHTML("") + themeToggleHTML() +
        "</div>" +
      "</div>";
  }

  /* ============================================================
     VIEW: component catalog (/products/)
     ============================================================ */
  function initCatalogView() {
    if (!$("#catalog-view")) return;

    var params = new URLSearchParams(location.search);
    var state = {
      category: params.get("category") || "all",
      q: params.get("q") || "",
      min: null, max: null,
      brands: [], specs: {}, sort: "price-asc", inStockOnly: false
    };

    function pool() { return Catalog.byCategory(state.category); }

    function apply() {
      var q = state.q.toLowerCase();
      return pool().filter(function (p) {
        if (q && (p.name + " " + p.brand).toLowerCase().indexOf(q) === -1) return false;
        if (state.min != null && p.best_price < state.min) return false;
        if (state.max != null && p.best_price > state.max) return false;
        if (state.brands.length && state.brands.indexOf(p.brand) === -1) return false;
        if (state.inStockOnly && !p.in_stock) return false;
        for (var k in state.specs) {
          if (!state.specs[k].length) continue;
          if (state.specs[k].indexOf((p.specs || {})[k]) === -1) return false;
        }
        return true;
      }).sort(function (a, b) {
        if (state.sort === "price-desc") return b.best_price - a.best_price;
        if (state.sort === "name") return a.name.localeCompare(b.name);
        if (state.sort === "stores") return b.store_count - a.store_count;
        return a.best_price - b.best_price;
      });
    }

    function renderFilters() {
      var items = pool();
      var f = Catalog.facets(items);
      var bounds = Catalog.priceBounds(items);
      if (state.min == null) state.min = bounds[0];
      if (state.max == null) state.max = bounds[1];

      var cats = '<select class="select w-full" id="f-category">' +
        '<option value="all">All components</option>' +
        (CAT.categories || []).map(function (c) {
          return '<option value="' + c.slug + '"' +
            (c.slug === state.category ? " selected" : "") + ">" + esc(c.label) + "</option>";
        }).join("") + "</select>";

      var brands = Object.keys(f.brands).sort().map(function (b) {
        return '<label class="check"><input type="checkbox" data-brand="' + esc(b) + '"' +
          (state.brands.indexOf(b) > -1 ? " checked" : "") + "> " + esc(b) +
          ' <span class="count">' + f.brands[b] + "</span></label>";
      }).join("");

      var specs = Object.keys(f.specs).map(function (key) {
        return '<div class="filter-section"><h4>' + esc(key) + "</h4>" +
          Object.keys(f.specs[key]).sort().map(function (v) {
            var on = (state.specs[key] || []).indexOf(v) > -1;
            return '<label class="check"><input type="checkbox" data-spec="' + esc(key) +
              '" data-value="' + esc(v) + '"' + (on ? " checked" : "") + "> " + esc(v) +
              ' <span class="count">' + f.specs[key][v] + "</span></label>";
          }).join("") + "</div>";
      }).join("");

      $("#catalog-filters").innerHTML =
        '<button class="filter-close" id="filter-close" type="button">' + t("ui.close") + "</button>" +
        '<div class="filter-section"><h4>' + t("ui.category") + "</h4>" + cats + "</div>" +
        '<div class="filter-section"><h4>' + t("ui.search") + "</h4>" +
          '<input class="searchbox" id="f-q" type="search" data-i18n-ph="ui.searchPlaceholder" value="' +
          esc(state.q) + '"></div>' +
        '<div class="filter-section"><h4>' + t("ui.budget") + "</h4>" +
          '<div class="budget-readout"><span id="f-min-out">' + dh(state.min) + "</span>" +
            '<span id="f-max-out">' + dh(state.max) + "</span></div>" +
          '<input class="slider" type="range" id="f-max" min="' + bounds[0] + '" max="' + bounds[1] +
            '" step="50" value="' + state.max + '">' +
          '<div class="range"><input type="number" id="f-min-n" value="' + state.min +
            '" min="' + bounds[0] + '"><input type="number" id="f-max-n" value="' + state.max +
            '" max="' + bounds[1] + '"></div></div>' +
        '<div class="filter-section"><h4>' + t("ui.availability") + "</h4>" +
          '<label class="check"><input type="checkbox" id="f-stock"' +
          (state.inStockOnly ? " checked" : "") + "> " + t("ui.inStockOnly") + "</label></div>" +
        (brands ? '<div class="filter-section"><h4>' + t("ui.brand") + "</h4>" + brands + "</div>" : "") +
        specs +
        '<div class="filter-section"><button class="btn w-full" id="f-reset" type="button">' +
          t("ui.reset") + "</button></div>";

      var close = $("#filter-close");
      if (close) close.onclick = function () {
        $("#catalog-filters").classList.remove("open");
        document.body.classList.remove("nav-locked");
      };
      bindFilters(bounds);
    }

    function bindFilters(bounds) {
      $("#f-category").onchange = function () {
        state.category = this.value;
        state.brands = []; state.specs = {}; state.min = null; state.max = null;
        history.replaceState({}, "", "?category=" + state.category);
        renderFilters(); renderResults();
      };
      $("#f-q").oninput = function () { state.q = this.value; renderResults(); };
      $("#f-stock").onchange = function () { state.inStockOnly = this.checked; renderResults(); };

      var maxRange = $("#f-max"), minN = $("#f-min-n"), maxN = $("#f-max-n");
      maxRange.oninput = function () {
        state.max = +this.value;
        if (state.min > state.max) { state.min = bounds[0]; minN.value = state.min; }
        maxN.value = state.max;
        $("#f-min-out").textContent = dh(state.min);
        $("#f-max-out").textContent = dh(state.max);
        renderResults();
      };
      minN.onchange = function () {
        state.min = Math.max(bounds[0], +this.value || bounds[0]);
        $("#f-min-out").textContent = dh(state.min); renderResults();
      };
      maxN.onchange = function () {
        state.max = Math.min(bounds[1], +this.value || bounds[1]);
        maxRange.value = state.max;
        $("#f-max-out").textContent = dh(state.max); renderResults();
      };

      $$("[data-brand]").forEach(function (el) {
        el.onchange = function () {
          var b = this.getAttribute("data-brand"), i = state.brands.indexOf(b);
          if (this.checked && i === -1) state.brands.push(b);
          if (!this.checked && i > -1) state.brands.splice(i, 1);
          renderResults();
        };
      });
      $$("[data-spec]").forEach(function (el) {
        el.onchange = function () {
          var k = this.getAttribute("data-spec"), v = this.getAttribute("data-value");
          state.specs[k] = state.specs[k] || [];
          var i = state.specs[k].indexOf(v);
          if (this.checked && i === -1) state.specs[k].push(v);
          if (!this.checked && i > -1) state.specs[k].splice(i, 1);
          renderResults();
        };
      });
      $("#f-reset").onclick = function () {
        state = { category: state.category, q: "", min: null, max: null,
                  brands: [], specs: {}, sort: state.sort, inStockOnly: false };
        renderFilters(); renderResults();
      };
    }

    function specLine(p) {
      return Object.keys(p.specs || {}).slice(0, 3).map(function (k) {
        return esc(k) + ": <b>" + esc(p.specs[k]) + "</b>";
      }).join(" \u00B7 ");
    }

    function renderResults() {
      var rows = apply();
      $("#catalog-count").textContent = rows.length + " " +
        (state.category === "all" ? t("ui.components")
                                  : Catalog.categoryLabel(state.category).toLowerCase());

      $("#catalog-results").innerHTML = rows.length ? rows.map(function (p) {
        var o = Catalog.bestOffer(p);
        var st = stockOf(o ? o.stock : "out_of_stock");
        return '<div class="product-row">' +
          '<div class="thumb"><img src="' + url(p.image) + '" alt=""></div>' +
          '<div><a class="product-name" target="' + (p.custom ? '_blank' : '_self') + '" rel="noopener" href="' + (p.custom ? url("products/custom/index.html?id=" + encodeURIComponent(p.id)) : url("products/" + p.id + "/")) + '">' +
            esc(p.name) + "</a>" +
            '<div class="product-sub">' + specLine(p) + "</div></div>" +
          '<div class="spec"><span class="pill">' + p.store_count + " " + t("ui.stores") + "</span>" +
            '<div class="stock ' + st.cls + '">' + st.label + "</div></div>" +
          '<div class="price-col"><strong>' + dh(p.best_price) + "</strong>" +
            '<div class="fresh">' + (o ? esc(o.store) + " \u00B7 " + ago(o.checked_minutes_ago) : "\u2014") +
            "</div></div>" +
          '<div class="catalog-actions">' +
            (p.custom ? '<a class="add-btn offer-link" target="_blank" rel="noopener" href="' + esc(p.offerUrl || '#') + '">' + t("ui.viewOffer") + '</a>' : '') +
            '<button class="add-btn" data-add="' + p.id + '" type="button">' + t("ui.add") + "</button>" +
          '</div>' +
        "</div>";
      }).join("") :
        '<div class="empty"><h3>' + t("ui.noMatch") + '</h3><p>' + t("ui.noMatchBody") + '</p></div>';

      $$("[data-add]", $("#catalog-results")).forEach(function (b) {
        b.onclick = function () { Build.add(this.getAttribute("data-add"), 1); };
      });
    }

    $("#catalog-sort").onchange = function () { state.sort = this.value; renderResults(); };

    /* Below 900px the sidebar becomes a drawer behind a Filters button. */
    var drawer = $("#catalog-filters"), toggle = $("#filter-toggle");
    function closeCatalogFilters() {
      if (!drawer) return;
      drawer.classList.remove("open");
      document.body.classList.remove("nav-locked");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    if (toggle) {
      toggle.onclick = function (e) {
        e.stopPropagation();
        var open = drawer.classList.toggle("open");
        document.body.classList.toggle("nav-locked", open);
        this.setAttribute("aria-expanded", String(open));
      };

      var filterClose = $("#filter-close");
      if (filterClose) {
        filterClose.onclick = function () { closeCatalogFilters(); };
      }

      document.addEventListener("pointerdown", function (e) {
        if (!drawer || !drawer.classList.contains("open")) return;
        if (drawer.contains(e.target) || (toggle && toggle.contains(e.target))) return;
        closeCatalogFilters();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && drawer.classList.contains("open")) closeCatalogFilters();
      });
    }

    renderFilters();
    renderResults();
    onLangChange(function () { renderFilters(); renderResults(); });
  }

  /* ============================================================
     VIEW: product detail (/products/<id>/)
     ============================================================ */
  function initProductView() {
    var host = $("#product-view");
    if (!host) return;
    var pid = host.getAttribute("data-product");
    if (!pid) {
      try { pid = new URLSearchParams(location.search).get("id"); } catch (e) {}
    }
    var p = Catalog.byId(pid);
    if (!p) { host.innerHTML = '<div class="empty"><h3>Product not found</h3></div>'; return; }

    var best = Catalog.bestOffer(p);
    document.title = p.name + " \u2014 price in Morocco \u2014 CHECKMYPC.MA";

    $("#p-title").textContent = p.name;
    $("#p-brand").textContent = p.brand + " \u00B7 " + Catalog.categoryLabel(p.category);
    $("#p-price").textContent = dh(p.best_price);
    var st = stockOf(best ? best.stock : "out_of_stock");
    $("#p-stock").innerHTML = '<span class="stock ' + st.cls + '">' + st.label + "</span> \u00B7 " +
      p.store_count + " stores tracked";

    var alertBtn = $("#p-alert");
    function paintAlert() {
      var on = Alerts.has(p.id);
      alertBtn.textContent = t(on ? "ui.alertOn" : "ui.alertOff");
      alertBtn.classList.toggle("primary", !on);
    }
    alertBtn.onclick = function () { Alerts.toggle(p.id); paintAlert(); };
    paintAlert();

    /* Left panel: gallery + quantity + add to part list */
    $("#p-gallery").innerHTML =
      '<div class="gallery-main"><img src="' + url(p.image) + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="gallery-strip">' + [0, 1, 2].map(function (i) {
        return '<button class="gthumb' + (i === 0 ? " active" : "") + '" type="button">' +
          '<img src="' + url(p.image) + '" alt=""></button>';
      }).join("") + "</div>";
    $$(".gthumb").forEach(function (b) {
      b.onclick = function () {
        $$(".gthumb").forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
      };
    });

    var qty = 1;
    $("#p-qty-out").textContent = qty;
    $("#p-qty-dec").onclick = function () { qty = Math.max(1, qty - 1); $("#p-qty-out").textContent = qty; };
    $("#p-qty-inc").onclick = function () { qty = Math.min(10, qty + 1); $("#p-qty-out").textContent = qty; };
    $("#p-add").onclick = function () { Build.add(p.id, qty); };

    /* Right panel: store offer comparator.
       data-label feeds the mobile card layout via CSS ::before. */
    function renderOffers() {
      $("#p-offers").innerHTML =
        '<div class="offer-head"><span>' + t("ui.store") + "</span><span>" +
          t("ui.availability") + "</span><span>" + t("ui.price") + "</span><span></span></div>" +
        (p.offers || []).map(function (o) {
          var s = stockOf(o.stock);
          return '<div class="offer-row">' +
            '<div class="offer-store">' + esc(o.store) + "<small>" + esc(o.city) + "</small></div>" +
            '<div data-label="' + esc(t("ui.availability")) + '">' +
              '<span class="stock ' + s.cls + '">' + s.label + "</span>" +
              '<small class="checked">' + t("ui.checked") + " " + ago(o.checked_minutes_ago) + "</small></div>" +
            '<div class="offer-price" data-label="' + esc(t("ui.price")) + '">' + dh(o.price) + "</div>" +
            '<a class="btn primary" href="' + esc(o.url) + '"' +
              (o.stock === "out_of_stock" ? ' aria-disabled="true"' : "") + ">" + t("ui.buy") + "</a>" +
          "</div>";
        }).join("");
    }
    renderOffers();

    /* Tabs: specifications + price history */
    $("#tab-specs").innerHTML = '<table class="spec-table"><tbody>' +
      Object.keys(p.specs || {}).map(function (k) {
        return "<tr><th>" + esc(k) + "</th><td>" + esc(p.specs[k]) + "</td></tr>";
      }).join("") + "</tbody></table>";
    $("#tab-history").innerHTML = sparkline(p.history || []);

    onLangChange(function () {
      $("#p-brand").textContent = p.brand + " \u00B7 " + Catalog.categoryLabel(p.category);
      var s2 = stockOf(best ? best.stock : "out_of_stock");
      $("#p-stock").innerHTML = '<span class="stock ' + s2.cls + '">' + s2.label +
        "</span> \u00B7 " + p.store_count + " " + t("ui.stores");
      paintAlert();
      renderOffers();
    });

    $$(".detail-tabs a").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        var target = this.getAttribute("data-tab");
        $$(".detail-tabs a").forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
        $$(".tab-panel").forEach(function (x) { x.hidden = x.id !== "tab-" + target; });
      };
    });
  }

  /* Inline SVG price chart — no chart library needed. */
  function sparkline(pts) {
    if (pts.length < 2) return '<p class="muted">Not enough price history yet.</p>';
    var W = 720, H = 220, PAD = 34;
    var vals = pts.map(function (p) { return p.p; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var span = (hi - lo) || 1;
    var x = function (i) { return PAD + i * (W - PAD * 2) / (pts.length - 1); };
    var y = function (v) { return H - PAD - (v - lo) / span * (H - PAD * 2); };
    var line = pts.map(function (p, i) {
      return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.p).toFixed(1);
    }).join(" ");
    var area = line + " L" + x(pts.length - 1).toFixed(1) + " " + (H - PAD) + " L" + PAD + " " + (H - PAD) + " Z";
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.p).toFixed(1) +
             '" r="3"><title>' + p.d + " \u2014 " + dh(p.p) + "</title></circle>";
    }).join("");
    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + " " + H + '" class="price-chart" ' +
      'role="img" aria-label="Price history for the last 90 days">' +
      '<path class="c-area" d="' + area + '"/><path class="c-line" d="' + line + '"/>' + dots +
      '<text class="c-lab" x="4" y="' + (PAD - 12) + '">' + dh(hi) + "</text>" +
      '<text class="c-lab" x="4" y="' + (H - PAD + 16) + '">' + dh(lo) + "</text></svg>" +
      '<div class="chart-foot"><span>' + pts[0].d + "</span><span>" +
      pts[pts.length - 1].d + "</span></div></div>";
  }

  /* ============================================================
     VIEW: prebuilt PCs (/new/)
     ============================================================ */
  var BRACKETS = [
    { label: "< 5,000 DH", min: 0, max: 5000 },
    { label: "5,000 \u2013 8,000 DH", min: 5000, max: 8000 },
    { label: "8,000 \u2013 12,000 DH", min: 8000, max: 12000 },
    { label: "12,000 \u2013 18,000 DH", min: 12000, max: 18000 },
    { label: "18,000 DH +", min: 18000, max: Infinity }
  ];

  /* Prebuilts are composed from catalog parts so prices stay consistent.
     Published items from the private admin panel are appended here. */
  function prebuilts() {
    var recipes = [
      ["Starter eSports Build", ["ryzen-5-5600", "msi-b550m-pro-vdh", "corsair-16gb-ddr4", "kingston-nv2-1tb", "rtx-3060-12gb", "corsair-cv650", "dp-matrexx-40", "dp-ak400"], "new"],
      ["1080p Gaming Rig", ["i5-12400f", "msi-b760m", "corsair-16gb-ddr4", "kingston-nv2-1tb", "rtx-4060-8gb", "corsair-cv650", "msi-mag-forge", "dp-ak400"], "new"],
      ["Ryzen Creator Station", ["ryzen-7-5700x", "msi-b550m-pro-vdh", "gskill-32gb-ddr5", "samsung-990-1tb", "rx-7600-8gb", "msi-a750", "corsair-4000d", "dp-ls520"], "new"],
      ["1440p Performance Build", ["ryzen-5-7600", "asus-b650m-ddr5", "gskill-32gb-ddr5", "samsung-990-1tb", "rtx-4070-12gb", "corsair-rm850", "corsair-4000d", "corsair-h100i"], "new"],
      ["Budget Office PC", ["i5-12400f", "msi-b760m", "corsair-16gb-ddr4", "kingston-nv2-1tb", "corsair-cv650", "dp-matrexx-40", "dp-ak400"], "used"],
      ["Used Gaming Deal", ["ryzen-5-5600", "msi-b550m-pro-vdh", "corsair-16gb-ddr4", "seagate-2tb-hdd", "rtx-3060-12gb", "corsair-cv650", "dp-matrexx-40"], "used"]
    ];
    var built = recipes.map(function (r, i) {
      var parts = r[1].map(function (id) { return Catalog.byId(id); }).filter(Boolean);
      var used = r[2] === "used";
      var price = parts.reduce(function (a, p) { return a + (used ? p.used_price : p.best_price); }, 0);
      var pick = function (c) { return parts.filter(function (p) { return p.category === c; })[0]; };
      var gpu = pick("gpu"), cpu = pick("cpu"), cs = pick("case");
      return {
        id: "pb-" + i, title: r[0], parts: parts, price: price, condition: r[2], custom: false,
        store: (CAT.stores[i % CAT.stores.length] || {}).name || "Setup Game",
        gpu: gpu ? (gpu.specs.Chipset || gpu.name) : "Integrated",
        cpu: cpu ? cpu.name : "\u2014",
        format: cs && cs.specs["Form factor"] === "ATX" ? "Mid Tower" : "Micro-ATX",
        image: (gpu || parts[0]).image, offerUrl: url("builder/index.html")
      };
    });
    var d = adminData();
    var overrides=d.prebuiltOverrides||{}, hidden=d.hiddenPrebuilts||{};
    built=built.map(function(b){ var o=overrides[b.id]; if(hidden[b.id]) return null; if(!o) return b; var x={}; Object.keys(b).forEach(function(k){x[k]=b[k]}); Object.keys(o).forEach(function(k){x[k]=o[k]}); x.title=o.title||b.title; x.price=Number(o.price!=null?o.price:b.price); x.image=o.image||b.image; x.offerUrl=o.offerUrl||b.offerUrl; x.parts=(o.partsText?o.partsText.split(/\n|,/).map(function(n){return {name:n.trim()}}).filter(function(n){return n.name}):b.parts); return x; }).filter(Boolean);
    var custom = (d.prebuilts || []).filter(function (x) { return x.published; }).map(function (x) {
      var parts = [x.cpu, x.gpu, x.ram, x.storage, x.motherboard, x.psu, x.extra].filter(Boolean);
      return {
        id: x.id, title: x.name, parts: parts.map(function (name) { return { name: name }; }),
        price: Number(x.price || 0), condition: x.condition || "new", custom: true,
        store: x.store || "CHECKMYPC.MA", gpu: x.gpu || "Integrated", cpu: x.cpu || "\u2014",
        format: x.format || "Gaming PC", image: x.image || url("assets/parts/gpu.svg"),
        offerUrl: x.offerUrl || "#", description: x.description || ""
      };
    });
    return built.concat(custom);
  }

  function initPrebuiltView() {
    if (!$("#prebuilt-view")) return;
    var all = prebuilts();
    var f = { bracket: null, store: "", gpu: "", cpu: "", format: "", condition: "", sort: "price-asc" };

    var uniq = function (k) {
      return all.map(function (b) { return b[k]; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    };
    function fill(sel, vals, label) {
      var el = $(sel);
      if (el) el.innerHTML = '<option value="">' + label + "</option>" +
        vals.map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("");
    }
    fill("#pb-store", uniq("store"), "All stores");
    fill("#pb-gpu", uniq("gpu"), "Any GPU");
    fill("#pb-cpu", uniq("cpu"), "Any processor");
    fill("#pb-format", uniq("format"), "Any format");

    $("#pb-brackets").innerHTML = BRACKETS.map(function (b, i) {
      return '<button class="budget" type="button" data-b="' + i + '">' + b.label + "</button>";
    }).join("");
    $$("#pb-brackets .budget").forEach(function (btn) {
      btn.onclick = function () {
        var i = +this.getAttribute("data-b"), same = f.bracket === i;
        f.bracket = same ? null : i;
        $$("#pb-brackets .budget").forEach(function (x) { x.classList.remove("active"); });
        if (!same) this.classList.add("active");
        render();
      };
    });
    ["store", "gpu", "cpu", "format", "condition", "sort"].forEach(function (k) {
      var el = $("#pb-" + k);
      if (el) el.onchange = function () { f[k] = this.value; render(); };
    });

    function render() {
      var rows = all.filter(function (b) {
        if (f.bracket != null) {
          var br = BRACKETS[f.bracket];
          if (b.price < br.min || b.price > br.max) return false;
        }
        if (f.store && b.store !== f.store) return false;
        if (f.gpu && b.gpu !== f.gpu) return false;
        if (f.cpu && b.cpu !== f.cpu) return false;
        if (f.format && b.format !== f.format) return false;
        if (f.condition && b.condition !== f.condition) return false;
        return true;
      }).sort(function (a, b) {
        return f.sort === "price-desc" ? b.price - a.price : a.price - b.price;
      });

      $("#pb-count").textContent = rows.length + " " + t("ui.systems");
      $("#pb-grid").innerHTML = rows.length ? rows.map(function (b) {
        return '<article class="pc-card">' +
          '<div class="pc-image"><span class="pc-badge">' +
            (b.condition === "used" ? '<span class="used-badge">' + t("ui.used") + "</span>" : t("ui.new")) + "</span>" +
            '<span class="pc-store">' + esc(b.store) + "</span>" +
            '<img src="' + url(b.image) + '" alt=""></div>' +
          "<h3>" + esc(b.title) + "</h3>" +
          '<p class="pc-spec">' + b.parts.slice(0, 5).map(function (p) {
            return esc(p.name); }).join("<br>") + (b.description ? '<br><span class="admin-mini">' + esc(b.description) + '</span>' : '') + "</p>" +
          '<div class="pc-bottom"><span class="pc-price">' + dh(b.price) + "</span>" +
            '<a class="btn primary" target="_blank" rel="noopener" href="' + esc(b.offerUrl || url("builder/index.html")) + '">' + t("ui.viewOffer") + "</a></div>" +
        "</article>";
      }).join("") : '<div class="empty"><h3>' + t("ui.noSystem") + '</h3><p>' +
        t("ui.widerBudget") + '</p></div>';
    }
    render();
    onLangChange(render);
  }

  /* ============================================================
     VIEW: system builder (/builder/)
     ============================================================ */
  var SLOTS = ["cpu", "cooler", "motherboard", "ram", "storage", "gpu", "psu", "case"];

  function compatibility(items) {
    var by = {};
    items.forEach(function (i) { by[i.product.category] = i.product; });
    var out = [];
    var cpu = by.cpu, mb = by.motherboard, ram = by.ram,
        psu = by.psu, gpu = by.gpu, cs = by["case"], cl = by.cooler;

    if (cpu && mb) {
      var ok = cpu.specs.Socket === mb.specs.Socket;
      out.push([ok ? "pass" : "fail", "CPU \u2194 Motherboard",
        ok ? "Both on " + cpu.specs.Socket
           : cpu.specs.Socket + " CPU in a " + mb.specs.Socket + " board"]);
    }
    if (ram && mb) {
      var okr = ram.specs["Memory type"] === mb.specs["Memory type"];
      out.push([okr ? "pass" : "fail", "RAM \u2194 Motherboard",
        okr ? mb.specs["Memory type"] + " on both"
            : ram.specs["Memory type"] + " kit in a " + mb.specs["Memory type"] + " board"]);
    }
    if (cl && cpu) {
      var okc = (cl.specs.Socket || "").indexOf(cpu.specs.Socket) > -1;
      out.push([okc ? "pass" : "warn", "Cooler \u2194 CPU socket",
        okc ? "Bracket included for " + cpu.specs.Socket
            : "Check bracket availability for " + cpu.specs.Socket]);
    }
    if (gpu && cs) {
      var len = parseInt(gpu.specs.Length, 10), max = parseInt(cs.specs["Max GPU length"], 10);
      var okg = !(len && max) || len <= max;
      out.push([okg ? "pass" : "fail", "GPU \u2194 Case clearance",
        len + " mm card, " + max + " mm available"]);
    }
    var draw = items.reduce(function (a, i) { return a + (i.product.power_draw || 0) * i.qty; }, 0);
    var rec = Math.ceil(draw * 1.4 / 50) * 50;
    if (psu) {
      var w = parseInt(psu.specs.Wattage, 10);
      out.push([w >= rec ? "pass" : "warn", "PSU headroom",
        w + "W supply, " + rec + "W recommended for ~" + draw + "W load"]);
    }
    return { checks: out, draw: draw, rec: rec };
  }

  function initBuilderView() {
    if (!$("#builder-view")) return;

    /* Restore a shared build from ?build= before first paint. */
    var shared = new URLSearchParams(location.search).get("build");
    if (shared) { try { Build.write(JSON.parse(atob(shared))); } catch (e) {} }

    function render() {
      var b = Build.read();
      $("#builder-slots").innerHTML = SLOTS.map(function (slot) {
        var picked = b[slot] ? Catalog.byId(b[slot].id) : null;
        var label = Catalog.categoryLabel(slot);
        return '<div class="builder-row">' +
          "<label>" + esc(label) + "</label>" +
          '<select data-slot="' + slot + '">' +
            '<option value="">' + t("ui.choose") + '</option>' +
            Catalog.byCategory(slot).map(function (p) {
              return '<option value="' + p.id + '"' +
                (picked && picked.id === p.id ? " selected" : "") + ">" +
                esc(p.name) + " \u2014 " + dh(p.best_price) + "</option>";
            }).join("") +
          "</select>" +
          '<a class="slot-browse" href="' + url("products/index.html?category=" + slot) +
            '">' + t("ui.browse") + "</a>" +
        "</div>";
      }).join("");

      $$("[data-slot]").forEach(function (sel) {
        sel.onchange = function () {
          var slot = this.getAttribute("data-slot");
          if (!this.value) Build.remove(slot); else Build.add(this.value, 1);
        };
      });

      var items = Build.items();
      var c = compatibility(items);
      $("#b-total").textContent = dh(Build.total());
      $("#b-used").textContent = dh(items.reduce(function (a, i) {
        return a + i.product.used_price * i.qty; }, 0));
      $("#b-power").textContent = c.draw + "W";
      $("#b-rec").textContent = c.rec + "W+";
      $("#b-parts").textContent = items.length + " / " + SLOTS.length;

      $("#b-checks").innerHTML = c.checks.length ? c.checks.map(function (k) {
        var mark = k[0] === "pass" ? "\u2713" : k[0] === "warn" ? "!" : "\u2715";
        return '<div class="status"><span>' + esc(k[1]) + "</span>" +
          '<span class="' + k[0] + '">' + mark + " " + esc(k[2]) + "</span></div>";
      }).join("") : '<p class="muted">' + t("ui.pickParts") + "</p>";
    }

    $("#b-clear").onclick = function () { Build.clear(); };
    $("#b-share").onclick = function () {
      var link = location.href.split("?")[0] + "?build=" + btoa(JSON.stringify(Build.read()));
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(function () { toast(t("ui.copied")); },
          function () { prompt("Copy build link", link); });
      } else { prompt("Copy build link", link); }
    };

    render();
    document.addEventListener("cmp:build", render);
    onLangChange(render);
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    applySiteContent();
    mountNav(document.body.getAttribute("data-page"));
    mountFooter();
    initCatalogView();
    initProductView();
    initPrebuiltView();
    initBuilderView();
    applyLang();
    applyTheme();
    bindControls();
    syncLangControls();
  }

  window.CMP = {
    Catalog: Catalog, Build: Build, Alerts: Alerts,
    toast: toast, dh: dh, url: url,
    t: t, setLang: setLang, getLang: function () { return lang; }, langs: LANGS,
    setTheme: setTheme, getTheme: function () { return theme; },
    getSite: siteData, getPrebuilts: prebuilts
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
