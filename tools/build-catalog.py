#!/usr/bin/env python3
"""Generates assets/catalog.json + assets/catalog.js from a compact seed.
Run:  python3 tools/build-catalog.py
"""
import json, random, datetime, pathlib

random.seed(7)
ROOT = pathlib.Path(__file__).resolve().parent.parent

STORES = [
    ("Setup Game", "Casablanca"), ("PC Gamer Maroc", "Rabat"),
    ("UltraPC", "Casablanca"), ("Matrix Informatique", "Marrakech"),
    ("Iris Tech", "Tanger"), ("Jumia MA", "Online"),
]

CATEGORIES = [
    ("cpu", "Processors", "cpu"), ("cooler", "CPU Coolers", "cooler"),
    ("motherboard", "Motherboards", "motherboard"), ("ram", "Memory (RAM)", "ram"),
    ("storage", "Storage", "ssd"), ("gpu", "Graphics Cards", "gpu"),
    ("psu", "Power Supplies", "psu"), ("case", "PC Cases", "case"),
    ("display", "Displays", "gpu"), ("peripheral", "Peripherals", "case"),
]

# id | cat | name | brand | base price DH | specs
SEED = [
    ("ryzen-5-5600","cpu","AMD Ryzen 5 5600","AMD",799,{"Socket":"AM4","Cores":"6","Threads":"12","Boost":"4.4 GHz","TDP":"65W","Integrated graphics":"No"}),
    ("ryzen-5-7600","cpu","AMD Ryzen 5 7600","AMD",1999,{"Socket":"AM5","Cores":"6","Threads":"12","Boost":"5.1 GHz","TDP":"65W","Integrated graphics":"Yes"}),
    ("ryzen-7-5700x","cpu","AMD Ryzen 7 5700X","AMD",1450,{"Socket":"AM4","Cores":"8","Threads":"16","Boost":"4.6 GHz","TDP":"65W","Integrated graphics":"No"}),
    ("i5-12400f","cpu","Intel Core i5-12400F","Intel",1190,{"Socket":"LGA1700","Cores":"6","Threads":"12","Boost":"4.4 GHz","TDP":"65W","Integrated graphics":"No"}),
    ("i5-13400f","cpu","Intel Core i5-13400F","Intel",1690,{"Socket":"LGA1700","Cores":"10","Threads":"16","Boost":"4.6 GHz","TDP":"65W","Integrated graphics":"No"}),
    ("dp-ak400","cooler","Deepcool AK400","Deepcool",299,{"Water cooled":"No","Socket":"AM4 / AM5 / LGA1700","Fan RPM":"1850 RPM","Noise level":"29 dBA","Height":"155 mm","Radiator size":"—"}),
    ("dp-ls520","cooler","Deepcool LS520 240mm","Deepcool",899,{"Water cooled":"Yes","Socket":"AM4 / AM5 / LGA1700","Fan RPM":"2250 RPM","Noise level":"32 dBA","Height":"—","Radiator size":"240 mm"}),
    ("corsair-h100i","cooler","Corsair iCUE H100i Elite","Corsair",1590,{"Water cooled":"Yes","Socket":"AM4 / AM5 / LGA1700","Fan RPM":"2400 RPM","Noise level":"36 dBA","Height":"—","Radiator size":"240 mm"}),
    ("msi-b550m-pro-vdh","motherboard","MSI B550M PRO-VDH WIFI","MSI",999,{"Socket":"AM4","Form factor":"Micro-ATX","Memory type":"DDR4","Memory slots":"4","M.2 slots":"2","Wi-Fi":"Yes"}),
    ("asus-b650m-ddr5","motherboard","ASUS PRIME B650M-A","Asus",1799,{"Socket":"AM5","Form factor":"Micro-ATX","Memory type":"DDR5","Memory slots":"4","M.2 slots":"2","Wi-Fi":"No"}),
    ("msi-b760m","motherboard","MSI PRO B760M-A","MSI",1690,{"Socket":"LGA1700","Form factor":"Micro-ATX","Memory type":"DDR4","Memory slots":"4","M.2 slots":"2","Wi-Fi":"No"}),
    ("corsair-16gb-ddr4","ram","Corsair Vengeance LPX 16GB","Corsair",499,{"Memory type":"DDR4","Capacity":"16 GB","Modules":"2 x 8 GB","Speed":"3200 MHz","CAS latency":"CL16","RGB":"No"}),
    ("gskill-32gb-ddr5","ram","G.Skill Trident Z5 32GB","G.Skill",1199,{"Memory type":"DDR5","Capacity":"32 GB","Modules":"2 x 16 GB","Speed":"6000 MHz","CAS latency":"CL30","RGB":"Yes"}),
    ("kingston-16gb-ddr5","ram","Kingston Fury Beast 16GB","Kingston",699,{"Memory type":"DDR5","Capacity":"16 GB","Modules":"2 x 8 GB","Speed":"5200 MHz","CAS latency":"CL40","RGB":"No"}),
    ("kingston-nv2-1tb","storage","Kingston NV2 1TB NVMe","Kingston",649,{"Type":"NVMe SSD","Capacity":"1 TB","Interface":"PCIe 4.0 x4","Read speed":"3500 MB/s","Form factor":"M.2 2280"}),
    ("samsung-990-1tb","storage","Samsung 990 EVO 1TB","Samsung",1090,{"Type":"NVMe SSD","Capacity":"1 TB","Interface":"PCIe 4.0 x4","Read speed":"5000 MB/s","Form factor":"M.2 2280"}),
    ("seagate-2tb-hdd","storage","Seagate BarraCuda 2TB","Seagate",549,{"Type":"HDD","Capacity":"2 TB","Interface":"SATA III","Read speed":"190 MB/s","Form factor":'3.5"'}),
    ("rtx-4060-8gb","gpu","MSI GeForce RTX 4060 Ventus 8GB","MSI",3499,{"Chipset":"RTX 4060","Memory":"8 GB GDDR6","Length":"199 mm","TDP":"115W","Power connectors":"1 x 8-pin","Outputs":"3x DP, 1x HDMI"}),
    ("rtx-4070-12gb","gpu","ASUS Dual RTX 4070 12GB","Asus",6790,{"Chipset":"RTX 4070","Memory":"12 GB GDDR6X","Length":"227 mm","TDP":"200W","Power connectors":"1 x 8-pin","Outputs":"3x DP, 1x HDMI"}),
    ("rx-7600-8gb","gpu","Sapphire Pulse RX 7600 8GB","Sapphire",3099,{"Chipset":"RX 7600","Memory":"8 GB GDDR6","Length":"204 mm","TDP":"165W","Power connectors":"1 x 8-pin","Outputs":"2x DP, 2x HDMI"}),
    ("rtx-3060-12gb","gpu","Gigabyte RTX 3060 12GB","Gigabyte",2790,{"Chipset":"RTX 3060","Memory":"12 GB GDDR6","Length":"242 mm","TDP":"170W","Power connectors":"1 x 8-pin","Outputs":"2x DP, 2x HDMI"}),
    ("corsair-cv650","psu","Corsair CV650 650W","Corsair",649,{"Wattage":"650 W","Efficiency":"80+ Bronze","Modular":"No","Form factor":"ATX","PCIe connectors":"2"}),
    ("msi-a750","psu","MSI MAG A750BN 750W","MSI",949,{"Wattage":"750 W","Efficiency":"80+ Bronze","Modular":"No","Form factor":"ATX","PCIe connectors":"4"}),
    ("corsair-rm850","psu","Corsair RM850e 850W","Corsair",1690,{"Wattage":"850 W","Efficiency":"80+ Gold","Modular":"Full","Form factor":"ATX","PCIe connectors":"4"}),
    ("dp-matrexx-40","case","Deepcool Matrexx 40","Deepcool",449,{"Form factor":"Micro-ATX","Side panel":"Tempered glass","Max GPU length":"320 mm","Max cooler height":"165 mm","Included fans":"1"}),
    ("msi-mag-forge","case","MSI MAG Forge 100R","MSI",699,{"Form factor":"ATX","Side panel":"Tempered glass","Max GPU length":"330 mm","Max cooler height":"160 mm","Included fans":"4"}),
    ("corsair-4000d","case","Corsair 4000D Airflow","Corsair",1090,{"Form factor":"ATX","Side panel":"Tempered glass","Max GPU length":"360 mm","Max cooler height":"170 mm","Included fans":"2"}),
    ("aoc-24g2","display",'AOC 24G2SP 24" 165Hz',"AOC",1790,{"Screen size":'24"',"Resolution":"1920 x 1080","Refresh rate":"165 Hz","Panel type":"IPS","Response time":"1 ms"}),
    ("msi-g274f","display",'MSI G274F 27" 180Hz',"MSI",2290,{"Screen size":'27"',"Resolution":"1920 x 1080","Refresh rate":"180 Hz","Panel type":"IPS","Response time":"1 ms"}),
    ("logi-g502","peripheral","Logitech G502 HERO","Logitech",599,{"Type":"Mouse","Connection":"Wired","DPI":"25600","Buttons":"11","RGB":"Yes"}),
    ("redragon-k552","peripheral","Redragon K552 Mechanical","Redragon",349,{"Type":"Keyboard","Connection":"Wired","Switch":"Blue","Layout":"TKL","RGB":"Yes"}),
]

POWER = {"cpu": 90, "gpu": 0, "motherboard": 30, "ram": 10, "storage": 8,
         "cooler": 5, "case": 6, "psu": 0, "display": 0, "peripheral": 2}


def offers_for(base):
    """Each product lands in 2-5 stores with dispersed pricing + stock state."""
    picks = random.sample(STORES, random.randint(2, 5))
    out = []
    for i, (store, city) in enumerate(picks):
        delta = random.uniform(-0.06, 0.14)
        price = int(round(base * (1 + delta) / 10.0) * 10)
        stock = random.choices(["in_stock", "low_stock", "out_of_stock"],
                               weights=[7, 2, 1])[0]
        out.append({
            "store": store, "city": city, "price": price, "stock": stock,
            "checked_minutes_ago": random.choice([12, 45, 90, 180, 420, 1440]),
            "url": "#offer-" + store.lower().replace(" ", "-") + "-" + str(i),
        })
    return sorted(out, key=lambda o: o["price"])


def history_for(base):
    """90 days of weekly price points, drifting toward the current best."""
    today = datetime.date.today()
    pts, price = [], base * random.uniform(1.04, 1.18)
    for w in range(12, -1, -1):
        price *= random.uniform(0.975, 1.015)
        pts.append({"d": (today - datetime.timedelta(weeks=w)).isoformat(),
                    "p": int(round(price / 10.0) * 10)})
    return pts


products = []
for pid, cat, name, brand, base, specs in SEED:
    offers = offers_for(base)
    live = [o for o in offers if o["stock"] != "out_of_stock"]
    best = min([o["price"] for o in live], default=offers[0]["price"])
    icon = dict((c[0], c[2]) for c in CATEGORIES)[cat]
    products.append({
        "id": pid, "category": cat, "name": name, "brand": brand,
        "image": "assets/parts/%s.svg" % icon,
        "msrp": base,
        "best_price": best,
        "used_price": int(round(best * 0.68 / 10.0) * 10),
        "in_stock": bool(live),
        "store_count": len(offers),
        "power_draw": POWER[cat] if cat != "gpu" else int(specs["TDP"].rstrip("W")),
        "specs": specs,
        "offers": offers,
        "history": history_for(base),
    })

catalog = {
    "currency": "MAD",
    "currency_symbol": "DH",
    "generated": datetime.date.today().isoformat(),
    "categories": [{"slug": s, "label": l, "icon": "assets/parts/%s.svg" % i}
                   for s, l, i in CATEGORIES],
    "stores": [{"name": n, "city": c} for n, c in STORES],
    "products": products,
}

(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "catalog.json").write_text(
    json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
(ROOT / "assets" / "catalog.json").write_text(
    json.dumps(catalog, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
(ROOT / "assets" / "catalog.js").write_text(
    "/* Generated by tools/build-catalog.py - do not edit by hand. */\n"
    "window.CHECKMYPC_CATALOG=" +
    json.dumps(catalog, separators=(",", ":"), ensure_ascii=False) + ";\n",
    encoding="utf-8")

print("products: %d | offers: %d" % (
    len(products), sum(len(p["offers"]) for p in products)))
