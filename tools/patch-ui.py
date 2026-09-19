#!/usr/bin/env python3
"""Adds the footer, mobile navigation, filter drawer and language switcher."""
import pathlib, sys

APP = pathlib.Path(__file__).resolve().parent.parent / "assets" / "app.js"
src = APP.read_text(encoding="utf-8")


def sub(anchor, new, count=1):
    global src
    if src.count(anchor) != count:
        sys.exit("anchor not found (%d hits): %.70s" % (src.count(anchor), anchor))
    src = src.replace(anchor, new, count)


# ------------------------------------------------ re-render registry
sub('''  function isRTL() { return lang === "ar"; }''',
    '''  function isRTL() { return lang === "ar"; }

  /* Views register a repaint fn here so switching language re-renders
     dynamic content without a page reload. */
  var RERENDER = [];
  function onLangChange(fn) { RERENDER.push(fn); }''')

sub('''    applyLang();
    document.dispatchEvent(new CustomEvent("cmp:lang", { detail: next }));''',
    '''    applyLang();
    RERENDER.forEach(function (fn) { try { fn(); } catch (e) {} });
    applyLang(); /* second pass: newly rendered nodes carry data-i18n too */
    document.dispatchEvent(new CustomEvent("cmp:lang", { detail: next }));''')

# ------------------------------------------------ nav: hamburger + i18n labels
sub('''        '<div class="links">' +
          '<a data-nav="builder" href="' + url("builder/index.html") + '">System Builder</a>' +''',
    '''        '<button class="nav-burger" id="nav-burger" type="button" ' +
          'aria-expanded="false" data-i18n-label="nav.menu">' +
          '<span></span><span></span><span></span></button>' +
        '<div class="links" id="nav-links">' +
          '<a data-nav="builder" data-i18n="nav.builder" href="' +
            url("builder/index.html") + '">System Builder</a>' +''')

sub('''            '<button class="menu-trigger" type="button" aria-expanded="false">Components <span class="caret">\\u25BE</span></button>' +''',
    '''            '<button class="menu-trigger" type="button" aria-expanded="false">' +
              '<span data-i18n="nav.components">Components</span> ' +
              '<span class="caret">\\u25BE</span></button>' +''')

sub('''              '<div><h4>Browse</h4>' +
                '<a href="' + url("products/index.html") + '">All components</a>' +
                '<a href="' + url("builder/index.html") + '">System Builder</a>' +
                '<a href="' + url("search/index.html") + '">Trends &amp; price alerts</a>' +
                '<a href="' + url("inspection/index.html") + '">PC Inspection</a>' +
              "</div>" +''',
    '''              '<div><h4 data-i18n="mega.browse">Browse</h4>' +
                '<a data-i18n="mega.all" href="' + url("products/index.html") + '">All components</a>' +
                '<a data-i18n="nav.builder" href="' + url("builder/index.html") + '">System Builder</a>' +
                '<a data-i18n="mega.alerts" href="' + url("search/index.html") + '">Trends</a>' +
                '<a data-i18n="mega.inspection" href="' + url("inspection/index.html") + '">Inspection</a>' +
              "</div>" +''')

sub('''          '<a data-nav="builds" href="' + url("builds/index.html") + '">Build Guides</a>' +
          '<a data-nav="prebuilts" href="' + url("new/index.html") + '">Prebuilt PCs</a>' +
          '<a data-nav="search" href="' + url("search/index.html") + '">Trends</a>' +''',
    '''          '<a data-nav="builds" data-i18n="nav.guides" href="' +
            url("builds/index.html") + '">Build Guides</a>' +
          '<a data-nav="prebuilts" data-i18n="nav.prebuilts" href="' +
            url("new/index.html") + '">Prebuilt PCs</a>' +
          '<a data-nav="search" data-i18n="nav.trends" href="' +
            url("search/index.html") + '">Trends</a>' +''')

sub('''          '<button class="nav-icon" id="nav-search-btn" type="button" title="Search" aria-label="Search">\\u2315</button>' +''',
    '''          '<button class="nav-icon" id="nav-search-btn" type="button" ' +
            'data-i18n-label="ui.search">\\u2315</button>' +''')

sub('''          '<a class="nav-cta" href="' + url("builder/index.html") + '">My Build <span id="nav-build-count"></span></a>' +''',
    '''          '<a class="nav-cta" href="' + url("builder/index.html") + '">' +
            '<span data-i18n="nav.mybuild">My Build</span> ' +
            '<span id="nav-build-count"></span></a>' +''')

sub('''        '<input type="search" id="nav-search-input" autocomplete="off" ' +
          'placeholder="Search components \\u2014 RTX 4060, AM5 motherboard, 240mm AIO\\u2026">' +''',
    '''        '<input type="search" id="nav-search-input" autocomplete="off" ' +
          'data-i18n-ph="ui.searchPlaceholder">' +''')

sub('''    var wrap = $(".menu-wrap", host);''',
    '''    /* Hamburger: toggles the slide-out panel below 900px. */
    var burger = $("#nav-burger", host), links = $("#nav-links", host);
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      this.classList.toggle("is-open", open);
      this.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.classList.remove("is-open");
        document.body.classList.remove("nav-locked");
      });
    });

    var wrap = $(".menu-wrap", host);''')

# --------------------------------------------------------------- footer
FOOTER = r'''
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

    var langOptions = Object.keys(LANGS).map(function (code) {
      return '<option value="' + code + '"' + (code === lang ? " selected" : "") +
             ">" + LANGS[code] + "</option>";
    }).join("");

    host.innerHTML =
      '<div class="foot-banner"><p data-i18n="foot.tagline"></p></div>' +
      '<div class="foot-cols">' +
        '<div class="foot-col foot-brand">' +
          '<a class="brand" href="' + url("index.html") + '">' +
            '<img src="' + url("assets/mark.svg") + '" alt="">' +
            '<span>checkmypc<span class="dot">.ma</span></span></a>' +
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
          '<label for="lang-select" class="sr-only" data-i18n="foot.language">Language</label>' +
          '<span class="lang-globe" aria-hidden="true">\u2295</span>' +
          '<select id="lang-select" class="select">' + langOptions + "</select>" +
        "</div>" +
      "</div>";

    $("#lang-select").onchange = function () { setLang(this.value); };
  }

'''
sub('  /* ============================================================\n     VIEW: component catalog (/products/)',
    FOOTER + '  /* ============================================================\n     VIEW: component catalog (/products/)')

# ----------------------------------------- catalog: mobile filter drawer
sub('''    $("#catalog-sort").onchange = function () { state.sort = this.value; renderResults(); };
    renderFilters();
    renderResults();''',
    '''    $("#catalog-sort").onchange = function () { state.sort = this.value; renderResults(); };

    /* Below 900px the sidebar becomes a drawer behind a Filters button. */
    var drawer = $("#catalog-filters"), toggle = $("#filter-toggle");
    if (toggle) {
      toggle.onclick = function () {
        var open = drawer.classList.toggle("open");
        document.body.classList.toggle("nav-locked", open);
        this.setAttribute("aria-expanded", String(open));
      };
      $("#filter-close").onclick = function () {
        drawer.classList.remove("open");
        document.body.classList.remove("nav-locked");
      };
    }

    renderFilters();
    renderResults();
    onLangChange(function () { renderFilters(); renderResults(); });''')

# ----------------------------------------- product: repaint on lang change
sub('''    $$(".detail-tabs a").forEach(function (a) {
      a.onclick = function (e) {''',
    '''    onLangChange(function () {
      $("#p-brand").textContent = p.brand + " \\u00B7 " + Catalog.categoryLabel(p.category);
      var s2 = stockOf(best ? best.stock : "out_of_stock");
      $("#p-stock").innerHTML = '<span class="stock ' + s2.cls + '">' + s2.label +
        "</span> \\u00B7 " + p.store_count + " " + t("ui.stores");
      paintAlert();
      renderOffers();
    });

    $$(".detail-tabs a").forEach(function (a) {
      a.onclick = function (e) {''')

sub('''    /* Right panel: store offer comparator */
    $("#p-offers").innerHTML =
      '<div class="offer-head"><span>Store</span><span>Availability</span><span>Price</span><span></span></div>' +
      (p.offers || []).map(function (o) {
        var s = stockOf(o.stock);
        return '<div class="offer-row">' +
          '<div class="offer-store">' + esc(o.store) + "<small>" + esc(o.city) + "</small></div>" +
          '<div><span class="stock ' + s.cls + '">' + s.label + "</span>" +
            '<small class="checked">' + t("ui.checked") + " " + ago(o.checked_minutes_ago) + "</small></div>" +
          '<div class="offer-price">' + dh(o.price) + "</div>" +
          '<a class="btn primary" href="' + esc(o.url) + '"' +
            (o.stock === "out_of_stock" ? ' aria-disabled="true"' : "") + ">" + t("ui.buy") + "</a>" +
        "</div>";
      }).join("");''',
    '''    /* Right panel: store offer comparator.
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
    renderOffers();''')

# ----------------------------------------- prebuilt + builder repaint
sub('''      }).join("") : '<div class="empty"><h3>' + t("ui.noSystem") + '</h3><p>' + t("ui.widerBudget") + '</p></div>';
    }
    render();''',
    '''      }).join("") : '<div class="empty"><h3>' + t("ui.noSystem") + '</h3><p>' +
        t("ui.widerBudget") + '</p></div>';
    }
    render();
    onLangChange(render);''')

sub('''    render();
    document.addEventListener("cmp:build", render);''',
    '''    render();
    document.addEventListener("cmp:build", render);
    onLangChange(render);''')

# --------------------------------------------------------------- boot
sub('''  function boot() {
    mountNav(document.body.getAttribute("data-page"));
    initCatalogView();
    initProductView();
    initPrebuiltView();
    initBuilderView();
  }''',
    '''  function boot() {
    mountNav(document.body.getAttribute("data-page"));
    mountFooter();
    initCatalogView();
    initProductView();
    initPrebuiltView();
    initBuilderView();
    applyLang();
  }''')

sub('''  window.CMP = { Catalog: Catalog, Build: Build, Alerts: Alerts, toast: toast, dh: dh, url: url };''',
    '''  window.CMP = {
    Catalog: Catalog, Build: Build, Alerts: Alerts,
    toast: toast, dh: dh, url: url,
    t: t, setLang: setLang, getLang: function () { return lang; }, langs: LANGS
  };''')

APP.write_text(src, encoding="utf-8")
print("footer + mobile patch applied (%d bytes)" % len(src))
