#!/usr/bin/env python3
"""Applies the i18n + footer + mobile-nav patches to assets/app.js.
Every replacement asserts its anchor exists, so a drifted file fails loudly
instead of silently writing a broken runtime.
"""
import pathlib, sys

APP = pathlib.Path(__file__).resolve().parent.parent / "assets" / "app.js"
src = APP.read_text(encoding="utf-8")


def sub(anchor, new, count=1):
    global src
    if src.count(anchor) != count:
        sys.exit("anchor not found (%d hits): %.60s" % (src.count(anchor), anchor))
    src = src.replace(anchor, new, count)


# ---------------------------------------------------------------- 1. i18n
I18N = r'''
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
      "foot.language": "Language"
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
      "foot.language": "Langue"
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
      "foot.language": "\u0627\u0644\u0644\u063A\u0629"
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

  function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    applyLang();
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

'''
sub('  /* ---------- catalog access ---------- */', I18N + '  /* ---------- catalog access ---------- */')

# category labels now come from the dictionary, falling back to catalog.js
sub('''    categoryLabel: function (slug) {
      var c = (CAT.categories || []).filter(function (x) { return x.slug === slug; })[0];
      return c ? c.label : slug;
    },''',
    '''    categoryLabel: function (slug) {
      var key = "cat." + slug;
      var translated = t(key);
      if (translated !== key) return translated;
      var c = (CAT.categories || []).filter(function (x) { return x.slug === slug; })[0];
      return c ? c.label : slug;
    },''')

# ------------------------------------------------- 2. localise runtime strings
sub('''  function ago(min) {
    if (min < 60) return min + " min ago";
    if (min < 1440) return Math.round(min / 60) + " h ago";
    return Math.round(min / 1440) + " d ago";
  }

  var STOCK = {
    in_stock: { label: "In stock", cls: "ok" },
    low_stock: { label: "Low stock", cls: "warn" },
    out_of_stock: { label: "Out of stock", cls: "bad" }
  };''',
    '''  function ago(min) {
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
  }''')

for old, new in [
    ('var st = STOCK[o ? o.stock : "out_of_stock"];', 'var st = stockOf(o ? o.stock : "out_of_stock");'),
    ('var st = STOCK[best ? best.stock : "out_of_stock"];', 'var st = stockOf(best ? best.stock : "out_of_stock");'),
    ('var s = STOCK[o.stock];', 'var s = stockOf(o.stock);'),
    ('toast("Added to build \\u2014 " + p.name);', 'toast(t("ui.addedTo") + " \\u2014 " + p.name);'),
    ('toast(i > -1 ? "Price alert removed" : "Price alert set \\u2014 we\'ll watch this part");',
     'toast(t(i > -1 ? "ui.alertRemoved" : "ui.alertAdded"));'),
    ('" stores</span>"', '" " + t("ui.stores") + "</span>"'),
    ('\'<button class="add-btn" data-add="\' + p.id + \'" type="button">Add</button>\'',
     '\'<button class="add-btn" data-add="\' + p.id + \'" type="button">\' + t("ui.add") + "</button>"'),
    ('">Buy</a>"', '">" + t("ui.buy") + "</a>"'),
    ("'<option value=\"\">\\u2014 choose \\u2014</option>'", 'ateOption()'),
    ('\'">Browse</a>\'', '\'">\' + t("ui.browse") + "</a>"'),
    ('<h3>No match</h3><p>Loosen the budget range or clear a brand filter.</p>',
     '<h3>\' + t("ui.noMatch") + \'</h3><p>\' + t("ui.noMatchBody") + \'</p>'),
    ('\'<div class="ns-empty">No component matches that.</div>\'',
     '\'<div class="ns-empty">\' + t("ui.noResult") + "</div>"'),
    ('\'<p class="muted">Pick a CPU and a motherboard to start checking compatibility.</p>\'',
     '\'<p class="muted">\' + t("ui.pickParts") + "</p>"'),
    ('" prebuilt systems"', '" " + t("ui.systems")'),
    ('\'">View offer</a></div>\' +', '\'">\' + t("ui.viewOffer") + "</a></div>" +'),
    ('<h3>No system in that range</h3><p>Try a wider budget bracket.</p>',
     '<h3>\' + t("ui.noSystem") + \'</h3><p>\' + t("ui.widerBudget") + \'</p>'),
    ('\'<span class="used-badge">Used</span>\' : "New"',
     '\'<span class="used-badge">\' + t("ui.used") + "</span>" : t("ui.new")'),
    ('toast("Build link copied");', 'toast(t("ui.copied"));'),
    ('<small class="checked">Checked \' + ago(o.checked_minutes_ago)',
     '<small class="checked">\' + t("ui.checked") + " " + ago(o.checked_minutes_ago)'),
    ('alertBtn.textContent = on ? "\\u2713 Price alert active" : "Set price-drop alert";',
     'alertBtn.textContent = t(on ? "ui.alertOn" : "ui.alertOff");'),
]:
    sub(old, new)

sub('ateOption()', "'<option value=\"\">' + t(\"ui.choose\") + '</option>'")

# catalog count + filter headings
sub('''      $("#catalog-count").textContent = rows.length + " " +
        (state.category === "all" ? "components" : Catalog.categoryLabel(state.category).toLowerCase());''',
    '''      $("#catalog-count").textContent = rows.length + " " +
        (state.category === "all" ? t("ui.components")
                                  : Catalog.categoryLabel(state.category).toLowerCase());''')

sub('''        '<div class="filter-section"><h4>Category</h4>' + cats + "</div>" +
        '<div class="filter-section"><h4>Search</h4>' +
          '<input class="searchbox" id="f-q" type="search" placeholder="Model, brand\\u2026" value="' +
          esc(state.q) + '"></div>' +
        '<div class="filter-section"><h4>Budget (DH)</h4>' +''',
    '''        '<div class="filter-section"><h4>' + t("ui.category") + "</h4>" + cats + "</div>" +
        '<div class="filter-section"><h4>' + t("ui.search") + "</h4>" +
          '<input class="searchbox" id="f-q" type="search" data-i18n-ph="ui.searchPlaceholder" value="' +
          esc(state.q) + '"></div>' +
        '<div class="filter-section"><h4>' + t("ui.budget") + "</h4>" +''')

sub('''        '<div class="filter-section"><h4>Availability</h4>' +
          '<label class="check"><input type="checkbox" id="f-stock"' +
          (state.inStockOnly ? " checked" : "") + "> In stock only</label></div>" +
        (brands ? '<div class="filter-section"><h4>Brand</h4>' + brands + "</div>" : "") +
        specs +
        '<div class="filter-section"><button class="btn w-full" id="f-reset" type="button">Reset filters</button></div>';''',
    '''        '<div class="filter-section"><h4>' + t("ui.availability") + "</h4>" +
          '<label class="check"><input type="checkbox" id="f-stock"' +
          (state.inStockOnly ? " checked" : "") + "> " + t("ui.inStockOnly") + "</label></div>" +
        (brands ? '<div class="filter-section"><h4>' + t("ui.brand") + "</h4>" + brands + "</div>" : "") +
        specs +
        '<div class="filter-section"><button class="btn w-full" id="f-reset" type="button">' +
          t("ui.reset") + "</button></div>";''')

APP.write_text(src, encoding="utf-8")
print("app.js i18n patch applied (%d bytes)" % len(src))
