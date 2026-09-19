CHECKMYPC.MA — refactored build
===============================

Regenerating
------------
  python3 tools/build-catalog.py    # data/catalog.json + assets/catalog.{json,js}
  python3 tools/build-pages.py      # every .html page from one shared shell

Edit SEED in tools/build-catalog.py to add parts. Edit SHELL in
tools/build-pages.py to change the page chrome once for all pages.

Architecture
------------
  assets/catalog.js   generated data. Products carry: category, brand, specs{},
                      offers[] (store, city, price, stock, checked, url),
                      history[] (90 days), best_price, used_price, power_draw.
  assets/app.js       the only runtime. Replaces the old app.js + site.js.
                      Injects the global nav, then mounts whichever view the
                      page exposes (#catalog-view / #product-view /
                      #prebuilt-view / #builder-view).
  assets/picker.css   base design system — unchanged.
  assets/site.css     component layer for the systems added here.

Pages declare <body data-page="..."> for nav highlighting and
window.CHECKMYPC_ROOT for relative depth. No page contains its own nav markup.

State
-----
  cmp.build.v2   { "<category>": { id, qty } }  one part per slot
  cmp.alerts.v1  [ productId ]                  price-drop watchlist

Known gaps
----------
  * Offer prices, stock and history are generated sample data, not scraped.
    Replace build-catalog.py with the real feed; the schema is the contract.
  * Prebuilt "View offer" links point at the builder — wire to real store URLs.
  * Price alerts are stored locally only; no backend or notification yet.

--- v10: responsive, i18n, footer ---

Languages
---------
  Dictionary lives in assets/app.js (DICT). 85 keys x EN/FR/AR, verified at
  parity by tools/smoke.js. Static markup is tagged data-i18n="key"
  (data-i18n-ph for placeholders, data-i18n-label for aria-label); dynamic
  renders call t("key"). Missing keys fall back EN -> raw key, so a gap is
  visible rather than blank.

  Switching language calls every fn registered via onLangChange(), so views
  repaint without a reload. Preference: localStorage cmp.lang.v1.
  Arabic sets <html dir="rtl" lang="ar">; part names and DH prices are held
  LTR inside RTL pages via unicode-bidi.

Responsive
----------
  >900px  full nav, sticky sidebar, table rows
  <900px  hamburger slide-out drawer, sidebar behind a Filters button,
          product rows and offer rows become stacked cards
  <700px  footer collapses to one column
  <480px  single-column grids, horizontally scrollable budget chips

Regenerate / test
-----------------
  python3 tools/build-catalog.py
  python3 tools/build-pages.py
  node tools/smoke.js          # 25 assertions

  tools/patch-i18n.py and tools/patch-ui.py were one-time migrations.
  They are kept for reference only - do NOT re-run them.

Known gaps
----------
  * Footer budget/city links carry ?budget= and ?city= but the prebuilt view
    does not read those params yet - they land on the unfiltered page.
  * Product specs, names and store names stay in Latin script in all three
    languages; only UI chrome is translated.
  * Footer says "PCPicker"; the brand elsewhere is checkmypc.ma.

--- v11: theme system + dual controls + drawer redesign ---

Theming
-------
  picker.css was tokenised by tools/patch-tokens.py: every surface
  `background` now reads a var(). `color:#fff` (white text on blue buttons)
  and the amber used-badge were deliberately left hardcoded - they must not
  flip with the theme.

  Light values live on :root in site.css; dark on html[data-theme="dark"].
  Resolution order: localStorage cmp.theme.v1 -> prefers-color-scheme.
  The OS listener only applies while no explicit choice is stored, so
  clicking the toggle wins permanently.

  Anti-flash: an inline script in each page's <head> sets data-theme and
  lang/dir before first paint. Editing it means editing SHELL in
  tools/build-pages.py (braces are doubled there for .format()).

Controls
--------
  themeToggleHTML() and langSelectHTML() are the single source for both
  pairs, marked [data-theme-toggle] / [data-lang-select]. bindControls()
  and syncLangControls() operate on all matches, so header, drawer and
  footer stay identical with no per-location code.

Drawer
------
  Backdrop with blur, Escape to close, click-outside to close, focus moved
  into the panel on open and back to the burger on close. Links are grouped:
  main nav, category chips (CPU/GPU/RAM/motherboard), tools & account.
  Entry animation is staggered and disabled under prefers-reduced-motion.

Tests
-----
  node tools/smoke.js      # 34 assertions, incl. theme persistence,
                           # OS-override precedence and control sync

Migration scripts (one-time, do NOT re-run): patch-i18n.py, patch-ui.py,
patch-theme.py. patch-tokens.py is idempotent and safe to re-run.

Known gaps (carried forward)
----------------------------
  * Footer ?budget= / ?city= links are not read by the prebuilt view yet.
  * Only UI chrome is translated; specs and store names stay Latin.
  * Footer says "PCPicker"; the brand elsewhere is checkmypc.ma.
  * Dark mode was verified by token audit, not in a browser - no headless
    browser available here. Check the hero and chart areas visually.

--- Admin listings manager ---

Private UI: /admin/index.html
- Prebuilt PCs: image, name, price, condition, store, CPU/GPU/RAM/storage/motherboard/PSU, description, offer URL, publish state.
- Components: image, name, category, brand, price, specs, offer URL, publish state.
- Publish/unpublish/edit/delete.
- Export/import JSON backup.
- Published listings are merged into the public prebuilt and component catalogue in the same browser via localStorage (cmp.admin.v1).
- For true multi-device/public publishing, replace localStorage with a backend/database and authenticated admin endpoint.
