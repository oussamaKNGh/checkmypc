#!/usr/bin/env python3
"""Generates every HTML page from one shared shell.
Run:  python3 tools/build-pages.py   (after build-catalog.py)
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CAT = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))

SHELL = """<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{root}assets/mark.svg">
<link rel="stylesheet" href="{root}assets/picker.css">
<link rel="stylesheet" href="{root}assets/site.css">
<!-- Applied before first paint so a dark-mode user never sees a white flash.
     app.js takes over from here; this only sets the initial attributes. -->
<script>
(function(){{
  try{{
    var t=localStorage.getItem("cmp.theme.v1");
    if(t!=="dark"&&t!=="light"){{
      t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
    }}
    document.documentElement.setAttribute("data-theme",t);
    var l=localStorage.getItem("cmp.lang.v1");
    if(l==="en"||l==="fr"||l==="ar"){{
      document.documentElement.setAttribute("lang",l);
      document.documentElement.setAttribute("dir",l==="ar"?"rtl":"ltr");
    }}
  }}catch(e){{}}
}})();
</script>
</head>
<body data-page="{page}">

<!-- Global navigation is injected by app.js so every page stays in sync. -->
<header id="site-header"></header>

<main>
{main}
</main>

<!-- Footer is injected by app.js so its 4 columns stay in sync everywhere. -->
<footer id="site-footer"></footer>

<script>window.CHECKMYPC_ROOT="{root}";</script>
<script src="{root}assets/catalog.js"></script>
<script src="{root}assets/app.js"></script>
</body>
</html>
"""


def write(path, page, title, desc, main, depth):
    root = "../" * depth
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(SHELL.format(title=title, desc=desc, page=page,
                                main=main, root=root), encoding="utf-8")


# ----------------------------------------------------------------- home
cat_cards = "".join(
    '<a class="category-card" href="products/index.html?category={s}">'
    '<div class="cat-icon"><img src="{i}" alt=""></div>'
    '<h3>{l}</h3><p>Compare prices across Moroccan stores.</p></a>'.format(
        s=c["slug"], i=c["icon"], l=c["label"])
    for c in CAT["categories"])

home = """
<section class="hero">
  <div class="hero-grid">
    <div>
      <span class="eyebrow">Morocco &middot; PC buying made smarter</span>
      <h1>Build smarter.<br>Buy better.</h1>
      <p>Compare component prices across Moroccan stores, check compatibility before you
         commit, and track price drops in dirham. Every part below is tracked across
         {n} local retailers.</p>
      <div class="hero-actions">
        <a class="btn primary" href="builder/index.html">Open System Builder</a>
        <a class="btn" href="products/index.html">Browse components</a>
        <a class="btn soft" href="inspection/index.html">Inspect a used PC</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-badge">Compatibility &middot; Price &middot; Inspection</div>
      <img src="assets/parts/gpu.svg" alt="PC hardware">
    </div>
  </div>
</section>

<section class="section" id="categories">
  <div class="section-head">
    <div><h2>Shop by component</h2><p>{c} categories, live store pricing in DH.</p></div>
    <a class="btn soft" href="products/index.html">View full catalogue &rarr;</a>
  </div>
  <div class="category-grid">{cards}</div>
</section>

<section class="section">
  <div class="section-head">
    <div><h2>Start from a prebuilt</h2><p>Ready systems filtered by budget bracket.</p></div>
    <a class="btn primary" href="new/index.html">Browse prebuilt PCs</a>
  </div>
</section>
""".format(n=len(CAT["stores"]), c=len(CAT["categories"]), cards=cat_cards)

write("index.html", "home", "Build smarter. Buy better. — CHECKMYPC.MA",
      "Compare PC component prices across Moroccan stores in DH.", home, 0)

# ------------------------------------------------------- component catalog
products_main = """
<section class="prebuilt-hero">
  <span class="eyebrow">Components</span>
  <h1>Component catalogue</h1>
  <p>Filter by budget, brand and specification. Prices are the lowest in-stock offer
     found across tracked Moroccan stores.</p>
</section>

<div class="catalog-layout" id="catalog-view">
  <!-- Mobile only: opens the sidebar as a drawer. -->
  <div class="filter-bar">
    <button class="btn" id="filter-toggle" type="button" aria-expanded="false"
            data-i18n="ui.filters">Filters</button>
  </div>

  <!-- Sidebar: rendered by app.js from the facets of the active category. -->
  <aside class="filters" id="catalog-filters">
    <button class="filter-close" id="filter-close" type="button"
            data-i18n="ui.close">Close</button>
  </aside>

  <section>
    <div class="catalog-toolbar">
      <div class="results-head"><strong id="catalog-count">&mdash;</strong></div>
      <select class="select" id="catalog-sort">
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="stores">Most stores</option>
        <option value="name">Name A &rarr; Z</option>
      </select>
    </div>
    <div class="product-list" id="catalog-results"></div>
  </section>
</div>
"""
write("products/index.html", "products", "Component catalogue — CHECKMYPC.MA",
      "Browse and filter PC components by budget, brand and specs.", products_main, 1)

# -------------------------------------------------------------- builder
builder_main = """
<section class="prebuilt-hero">
  <span class="eyebrow">System Builder</span>
  <h1>Build your PC</h1>
  <p>Pick a part per slot. Totals, power draw and compatibility update live, and your
     build is kept in this browser.</p>
</section>

<div class="builder-layout" id="builder-view">
  <div class="builder-card">
    <div id="builder-slots"></div>
    <div class="hero-actions">
      <button class="btn primary" id="b-share" type="button">Share build link</button>
      <button class="btn" id="b-clear" type="button">Clear build</button>
      <a class="btn soft" href="../products/index.html">Add more parts</a>
    </div>
  </div>

  <aside class="summary-card">
    <div style="color:#728398;font-weight:800;font-size:12px;letter-spacing:.5px">BUILD SUMMARY</div>
    <div class="summary-total" id="b-total">0 DH</div>
    <div class="summary-grid">
      <div class="mini-stat"><small>Used estimate</small><b id="b-used">0 DH</b></div>
      <div class="mini-stat"><small>Power draw</small><b id="b-power">0W</b></div>
      <div class="mini-stat"><small>Recommended PSU</small><b id="b-rec">&mdash;</b></div>
      <div class="mini-stat"><small>Parts chosen</small><b id="b-parts">0 / 8</b></div>
    </div>
    <h3>Compatibility</h3>
    <div id="b-checks"></div>
  </aside>
</div>
"""
write("builder/index.html", "builder", "System Builder — CHECKMYPC.MA",
      "Pick parts, check compatibility and price your build in DH.", builder_main, 1)

# ------------------------------------------------------------- prebuilts
prebuilt_main = """
<section class="prebuilt-hero">
  <span class="eyebrow">Prebuilt PCs</span>
  <h1>Ready-to-buy systems</h1>
  <p>Complete machines priced from live component offers. Filter by budget bracket,
     store, GPU or condition.</p>
</section>

<div id="prebuilt-view">
  <div class="toolbar">
    <div class="budget-row" id="pb-brackets"></div>
    <div class="select-row">
      <select class="select" id="pb-store"></select>
      <select class="select" id="pb-gpu"></select>
      <select class="select" id="pb-cpu"></select>
      <select class="select" id="pb-format"></select>
      <select class="select" id="pb-condition">
        <option value="">New &amp; used</option>
        <option value="new">New only</option>
        <option value="used">Used only</option>
      </select>
      <select class="select" id="pb-sort">
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </div>
  </div>
  <div class="results-head"><strong id="pb-count">&mdash;</strong></div>
  <div class="prebuilt-grid" id="pb-grid"></div>
</div>
"""
write("new/index.html", "prebuilts", "Prebuilt PCs — CHECKMYPC.MA",
      "Prebuilt gaming and office PCs in Morocco, filtered by budget.", prebuilt_main, 1)
write("prebuilts/index.html", "prebuilts", "Prebuilt PCs — CHECKMYPC.MA",
      "Prebuilt gaming and office PCs in Morocco, filtered by budget.", prebuilt_main, 1)

# --------------------------------------------------------- product pages
PRODUCT_MAIN = """
<section class="detail-hero" id="product-view" data-product="{pid}">
  <div class="detail-head">
    <div>
      <span class="eyebrow" id="p-brand"></span>
      <h1 id="p-title"></h1>
      <div class="chips"><span class="chip" id="p-stock"></span></div>
    </div>
    <div class="detail-price-block">
      <small>Lowest price</small>
      <div class="detail-price" id="p-price"></div>
      <button class="btn primary" id="p-alert" type="button" style="margin-top:10px"></button>
    </div>
  </div>

  <div class="detail-layout">
    <!-- Left: gallery + add to part list -->
    <div>
      <div id="p-gallery"></div>
      <div class="qty-row">
        <div class="qty">
          <button id="p-qty-dec" type="button" aria-label="Decrease quantity">&minus;</button>
          <span id="p-qty-out">1</span>
          <button id="p-qty-inc" type="button" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn primary" id="p-add" type="button">Add to part list</button>
      </div>
    </div>

    <!-- Right: store offer comparator -->
    <div class="offers">
      <h3>Store offers</h3>
      <div id="p-offers"></div>
    </div>
  </div>

  <div class="detail-tabs" style="margin-top:28px">
    <a href="#" data-tab="specs" class="active">Specifications</a>
    <a href="#" data-tab="history">Price history</a>
  </div>
  <div class="tab-panel" id="tab-specs"></div>
  <div class="tab-panel" id="tab-history" hidden></div>
</section>
"""

for p in CAT["products"]:
    write("products/%s/index.html" % p["id"], "products",
          "%s — price in Morocco — CHECKMYPC.MA" % p["name"],
          "Compare %s prices across Moroccan stores." % p["name"],
          PRODUCT_MAIN.format(pid=p["id"]), 2)

# ------------------------------------------------- category shortcut pages
# Legacy /products/<category>/ URLs redirect into the filtered catalogue.
for c in CAT["categories"]:
    redirect = (
        '<section class="prebuilt-hero"><h1>{l}</h1>'
        '<p>Opening the filtered catalogue&hellip; '
        '<a href="../index.html?category={s}">continue</a></p></section>'
        '<script>location.replace("../index.html?category={s}");</script>'
    ).format(l=c["label"], s=c["slug"])
    write("products/%s/index.html" % c["slug"], "products",
          "%s — CHECKMYPC.MA" % c["label"], "", redirect, 2)

print("pages written: %d products + %d categories + 6 core" % (
    len(CAT["products"]), len(CAT["categories"])))

# ------------------------------------------------- remaining static pages
GUIDES = """
<section class="prebuilt-hero"><span class="eyebrow">Build Guides</span>
<h1>Build guides</h1><p>Starting points you can load into the System Builder and adjust.</p></section>
<div class="category-grid">
  <a class="category-card" href="../builder/index.html"><div class="cat-icon"><img src="../assets/parts/cpu.svg" alt=""></div><h3>Budget 1080p</h3><p>Entry gaming under 8,000 DH.</p></a>
  <a class="category-card" href="../builder/index.html"><div class="cat-icon"><img src="../assets/parts/gpu.svg" alt=""></div><h3>1440p Gaming</h3><p>High refresh, 12,000&ndash;18,000 DH.</p></a>
  <a class="category-card" href="../builder/index.html"><div class="cat-icon"><img src="../assets/parts/ram.svg" alt=""></div><h3>Creator Workstation</h3><p>32 GB memory, fast NVMe.</p></a>
  <a class="category-card" href="../builder/index.html"><div class="cat-icon"><img src="../assets/parts/case.svg" alt=""></div><h3>Small Form Factor</h3><p>Micro-ATX compact builds.</p></a>
</div>
<section class="section"><div class="section-head"><div><h2>Your saved build</h2>
<p>Open the builder to edit the configuration stored in this browser.</p></div>
<a class="btn primary" href="../builder/index.html">Open System Builder</a></div></section>
"""
write("builds/index.html", "builds", "Build Guides — CHECKMYPC.MA",
      "Curated PC build guides for the Moroccan market.", GUIDES, 1)

TRENDS = """
<section class="prebuilt-hero"><span class="eyebrow">Trends</span>
<h1>Price trends &amp; alerts</h1>
<p>Use the search icon in the header to look up any tracked part. Open a product page
   to see its 90-day price history and set a drop alert.</p></section>
<div class="category-grid">
  <a class="category-card" href="../products/index.html?category=gpu"><div class="cat-icon"><img src="../assets/parts/gpu.svg" alt=""></div><h3>Graphics cards</h3><p>The most volatile category in DH.</p></a>
  <a class="category-card" href="../products/index.html?category=cpu"><div class="cat-icon"><img src="../assets/parts/cpu.svg" alt=""></div><h3>Processors</h3><p>AM4, AM5 and LGA1700 pricing.</p></a>
  <a class="category-card" href="../products/index.html?category=ram"><div class="cat-icon"><img src="../assets/parts/ram.svg" alt=""></div><h3>Memory</h3><p>DDR4 vs DDR5 kit pricing.</p></a>
  <a class="category-card" href="../products/index.html?category=storage"><div class="cat-icon"><img src="../assets/parts/ssd.svg" alt=""></div><h3>Storage</h3><p>NVMe and HDD cost per TB.</p></a>
</div>
"""
write("search/index.html", "search", "Price trends & alerts — CHECKMYPC.MA",
      "Track PC component price trends in Morocco.", TRENDS, 1)

USED = """
<section class="prebuilt-hero"><span class="eyebrow">Used market</span>
<h1>Used PCs &amp; parts</h1>
<p>Used estimates are derived from current new pricing. Always request an inspection
   before paying.</p></section>
<div class="hero-actions">
  <a class="btn primary" href="../inspection/index.html">Request an inspection</a>
  <a class="btn" href="../new/index.html">Browse used prebuilts</a>
</div>
"""
write("used/index.html", "prebuilts", "Used PCs — CHECKMYPC.MA",
      "Used PC market estimates for Morocco.", USED, 1)

COMPAT = """
<section class="prebuilt-hero"><span class="eyebrow">Compatibility</span>
<h1>Compatibility checks</h1>
<p>The System Builder validates these automatically as you pick parts.</p></section>
<div class="form-card"><div class="product-list">
""" + "".join(
    '<div class="product-row" style="grid-template-columns:1fr"><div>'
    '<div class="product-name">%s</div></div></div>' % c for c in [
        "CPU socket matches the motherboard socket",
        "Memory generation matches the board (DDR4 / DDR5)",
        "Cooler bracket covers the chosen socket",
        "GPU length fits the case clearance",
        "PSU wattage covers estimated load plus 40% headroom",
        "Storage interface is supported by the board",
    ]) + """
</div><div class="hero-actions"><a class="btn primary" href="../builder/index.html">Run checks in the builder</a></div></div>
"""
write("compatibility/index.html", "builder", "Compatibility — CHECKMYPC.MA",
      "PC part compatibility checks.", COMPAT, 1)

INSPECT = """
<section class="prebuilt-hero"><span class="eyebrow">CHECKMYPC</span>
<h1>Pre-purchase PC inspection</h1>
<p>Before you pay for a used machine, have its condition verified.</p></section>
<div class="inspection"><div class="form-card"><div class="form-grid">
  <div class="field"><label for="i-name">Your name</label><input id="i-name" type="text"></div>
  <div class="field"><label for="i-phone">Phone</label><input id="i-phone" type="tel"></div>
  <div class="field"><label for="i-city">City</label><input id="i-city" type="text"></div>
  <div class="field"><label for="i-type">Machine type</label><select id="i-type">
    <option>Desktop</option><option>Laptop</option></select></div>
  <div class="field full"><label for="i-notes">What should we check?</label>
    <textarea id="i-notes"></textarea></div>
  <div class="field full"><button class="btn primary" type="button">Request inspection</button></div>
</div></div></div>
"""
write("inspection/index.html", "home", "PC Inspection — CHECKMYPC.MA",
      "Pre-purchase used PC inspection in Morocco.", INSPECT, 1)
