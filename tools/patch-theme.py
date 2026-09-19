#!/usr/bin/env python3
"""Adds the theme system, dual language/theme controls and the grouped
mobile drawer. Every anchor is asserted so drift fails loudly."""
import pathlib, sys

APP = pathlib.Path(__file__).resolve().parent.parent / "assets" / "app.js"
src = APP.read_text(encoding="utf-8")


def sub(anchor, new, count=1):
    global src
    if src.count(anchor) != count:
        sys.exit("anchor not found (%d hits): %.70s" % (src.count(anchor), anchor))
    src = src.replace(anchor, new, count)


# ---------------------------------------------------- new dictionary keys
NEW_KEYS = {
    "en": {
        "ui.theme": "Theme", "ui.themeDark": "Switch to dark mode",
        "ui.themeLight": "Switch to light mode", "ui.closeMenu": "Close menu",
        "drawer.main": "Navigation", "drawer.categories": "Shop by category",
        "drawer.utility": "Tools & account", "drawer.inspection": "PC Inspection",
        "drawer.guides": "Build Guides", "drawer.myBuild": "My saved build"
    },
    "fr": {
        "ui.theme": "Th\\u00E8me", "ui.themeDark": "Passer en mode sombre",
        "ui.themeLight": "Passer en mode clair", "ui.closeMenu": "Fermer le menu",
        "drawer.main": "Navigation", "drawer.categories": "Par cat\\u00E9gorie",
        "drawer.utility": "Outils & compte", "drawer.inspection": "Inspection PC",
        "drawer.guides": "Guides de montage", "drawer.myBuild": "Ma configuration"
    },
    "ar": {
        "ui.theme": "\\u0627\\u0644\\u0645\\u0638\\u0647\\u0631",
        "ui.themeDark": "\\u062A\\u0641\\u0639\\u064A\\u0644 \\u0627\\u0644\\u0648\\u0636\\u0639 \\u0627\\u0644\\u0644\\u064A\\u0644\\u064A",
        "ui.themeLight": "\\u062A\\u0641\\u0639\\u064A\\u0644 \\u0627\\u0644\\u0648\\u0636\\u0639 \\u0627\\u0644\\u0646\\u0647\\u0627\\u0631\\u064A",
        "ui.closeMenu": "\\u0625\\u063A\\u0644\\u0627\\u0642 \\u0627\\u0644\\u0642\\u0627\\u0626\\u0645\\u0629",
        "drawer.main": "\\u0627\\u0644\\u062A\\u0646\\u0642\\u0644",
        "drawer.categories": "\\u062D\\u0633\\u0628 \\u0627\\u0644\\u0641\\u0626\\u0629",
        "drawer.utility": "\\u0623\\u062F\\u0648\\u0627\\u062A \\u0648\\u062D\\u0633\\u0627\\u0628",
        "drawer.inspection": "\\u0641\\u062D\\u0635 \\u0627\\u0644\\u062D\\u0627\\u0633\\u0648\\u0628",
        "drawer.guides": "\\u0623\\u062F\\u0644\\u0629 \\u0627\\u0644\\u062A\\u0631\\u0643\\u064A\\u0628",
        "drawer.myBuild": "\\u0627\\u0644\\u062A\\u062C\\u0645\\u064A\\u0639\\u0629 \\u0627\\u0644\\u0645\\u062D\\u0641\\u0648\\u0638\\u0629"
    },
}
ANCHORS = {
    "en": '      "foot.language": "Language"\n    },',
    "fr": '      "foot.language": "Langue"\n    },',
    "ar": '      "foot.language": "\\u0627\\u0644\\u0644\\u063A\\u0629"\n    }\n  };',
}
for code, anchor in ANCHORS.items():
    extra = ",\n" + ",\n".join(
        '      "%s": "%s"' % (k, v) for k, v in NEW_KEYS[code].items())
    sub(anchor, anchor.split("\n")[0] + extra + "\n" + "\n".join(anchor.split("\n")[1:]))

# --------------------------------------------------------- theme module
THEME = r'''
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

'''
sub('  /* ============================================================\n     GLOBAL NAVIGATION',
    THEME + '  /* ============================================================\n     GLOBAL NAVIGATION')

# keep both control pairs in step whenever the language changes
sub('''    applyLang();
    RERENDER.forEach(function (fn) { try { fn(); } catch (e) {} });''',
    '''    applyLang();
    syncLangControls();
    applyTheme(); /* toggle labels are translated too */
    RERENDER.forEach(function (fn) { try { fn(); } catch (e) {} });''')

# ------------------------------------------------ header controls + drawer
sub('''          '<span class="nav-currency" title="All prices in Moroccan dirham">DH \\u00B7 MAD</span>' +''',
    '''          '<span class="nav-currency" title="All prices in Moroccan dirham">DH \\u00B7 MAD</span>' +
          themeToggleHTML() + langSelectHTML("") +''')

DRAWER = r'''
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

'''
sub('  function mountNav(active) {', DRAWER + '  function mountNav(active) {')

# drawer header (brand + theme + language + close) and the grouped sections
sub('''        '<div class="links" id="nav-links">' +''',
    '''        '<div class="links" id="nav-links">' +
          '<div class="drawer-head">' +
            '<div class="drawer-tools">' + themeToggleHTML() + langSelectHTML("") + "</div>" +
            '<button class="nav-icon" id="drawer-close" type="button" ' +
              'data-i18n-label="ui.closeMenu">\\u2715</button>' +
          "</div>" +''')

sub('''          '<a data-nav="search" data-i18n="nav.trends" href="' +
            url("search/index.html") + '">Trends</a>' +
        "</div>" +''',
    '''          '<a data-nav="search" data-i18n="nav.trends" href="' +
            url("search/index.html") + '">Trends</a>' +
          drawerExtrasHTML() +
        "</div>" +''')

# backdrop element
sub('''      '<div class="nav-search" id="nav-search" hidden>' +''',
    '''      '<div class="drawer-backdrop" id="drawer-backdrop"></div>' +
      '<div class="nav-search" id="nav-search" hidden>' +''')

# ------------------------------------------------ drawer open/close logic
sub('''    /* Hamburger: toggles the slide-out panel below 900px. */
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
    });''',
    '''    /* Hamburger + slide-out drawer below 900px. */
    var burger = $("#nav-burger", host), links = $("#nav-links", host),
        backdrop = $("#drawer-backdrop", host);

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
    $("#drawer-close", host).addEventListener("click", function () { setDrawer(false); });
    /* Any page link closes the drawer; the controls inside it must not. */
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { setDrawer(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) setDrawer(false);
    });''')

# ------------------------------------------------------- footer controls
sub('''    var langOptions = Object.keys(LANGS).map(function (code) {
      return '<option value="' + code + '"' + (code === lang ? " selected" : "") +
             ">" + LANGS[code] + "</option>";
    }).join("");

''', "")

sub('''        '<div class="lang-switch">' +
          '<label for="lang-select" class="sr-only" data-i18n="foot.language">Language</label>' +
          '<span class="lang-globe" aria-hidden="true">\\u2295</span>' +
          '<select id="lang-select" class="select">' + langOptions + "</select>" +
        "</div>" +
      "</div>";

    $("#lang-select").onchange = function () { setLang(this.value); };''',
    '''        '<div class="lang-switch">' +
          '<span class="lang-globe" aria-hidden="true">\\u2295</span>' +
          langSelectHTML("") + themeToggleHTML() +
        "</div>" +
      "</div>";''')

# --------------------------------------------------------------- boot
sub('''    initBuilderView();
    applyLang();
  }''',
    '''    initBuilderView();
    applyLang();
    applyTheme();
    bindControls();
    syncLangControls();
  }''')

sub('''    t: t, setLang: setLang, getLang: function () { return lang; }, langs: LANGS
  };''',
    '''    t: t, setLang: setLang, getLang: function () { return lang; }, langs: LANGS,
    setTheme: setTheme, getTheme: function () { return theme; }
  };''')

APP.write_text(src, encoding="utf-8")
print("theme + controls + drawer patch applied (%d bytes)" % len(src))
