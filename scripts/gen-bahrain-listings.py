import os
import openpyxl
import json

"""
Regenerates src/core/industries/data/real-estate-bahrain-listings.ts from
the source spreadsheet. The spreadsheet itself isn't committed (large,
generated data isn't meant to be hand-edited) — place a copy named
Synthetic_Bahrain_Property_Listings_500.xlsx next to this script (or set
BAHRAIN_LISTINGS_XLSX) before rerunning. Columns expected: id, title, type,
bedrooms, bathrooms, price_bhd, area_sqm, city, description, image_1,
image_2, image_3.
"""

SRC = os.environ.get(
    "BAHRAIN_LISTINGS_XLSX",
    os.path.join(os.path.dirname(__file__), "Synthetic_Bahrain_Property_Listings_500.xlsx"),
)
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "core", "industries", "data", "real-estate-bahrain-listings.ts")

# Real, approximate public centroids for each area named in the dataset —
# not per-property addresses (the source data has no street-level detail),
# jittered deterministically per listing so 50 pins in the same area don't
# stack exactly on top of each other on the map.
AREA_CENTROIDS = {
    "Manama": (26.2285, 50.5860),
    "Muharraq": (26.2572, 50.6119),
    "Riffa": (26.1300, 50.5550),
    "Saar": (26.0900, 50.4800),
    "Seef": (26.2489, 50.5522),
    "Juffair": (26.2100, 50.6000),
    "Amwaj": (26.2870, 50.6600),
    "Budaiya": (26.2100, 50.4600),
    "Hamad Town": (26.1200, 50.5100),
    "Isa Town": (26.1730, 50.5480),
}

GRADIENTS = ["emerald", "sky", "amber", "violet", "rose"]

TYPE_ATTR = {"Apartment": "apartment", "Studio": "studio", "Townhouse": "townhouse", "Villa": "villa"}


def jitter(seed, spread=0.02):
    # Deterministic pseudo-random offset in [-spread, spread], seeded by id —
    # reproducible, no randomness at build time.
    x = (seed * 9301 + 49297) % 233280
    return (x / 233280 - 0.5) * 2 * spread


def esc(s):
    return json.dumps(s, ensure_ascii=False)


wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["Listings"]
rows = list(ws.iter_rows(min_row=2, values_only=True))

items = []
for r in rows:
    (id_, title, type_, bedrooms, bathrooms, price_bhd, area_sqm, city,
     description, image_1, image_2, image_3) = r

    lat0, lng0 = AREA_CENTROIDS[city]
    lat = round(lat0 + jitter(id_), 5)
    lng = round(lng0 + jitter(id_ * 7 + 3), 5)

    if type_ == "Studio":
        subtitle = f"Studio · {city}"
    else:
        bed_word = "bed" if bedrooms == 1 else "beds"
        subtitle = f"{bedrooms} {bed_word} · {type_} · {city}"

    highlights = [
        f"{area_sqm} m²",
        f"{bathrooms} bathroom" + ("" if bathrooms == 1 else "s"),
        f"{type_} in {city}",
    ]

    attrs = {
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "areaSqm": area_sqm,
        "apartment": type_ == "Apartment",
        "studio": type_ == "Studio",
        "townhouse": type_ == "Townhouse",
        "villa": type_ == "Villa",
    }

    gradient = GRADIENTS[id_ % len(GRADIENTS)]

    item_ts = f"""  {{
    id: "bh-{id_}",
    name: {esc(title)},
    subtitle: {esc(subtitle)},
    price: {price_bhd},
    currency: "BHD",
    image: "{gradient}",
    photo: {esc(image_1)},
    gallery: [{esc(image_2)}, {esc(image_3)}],
    location: {{ label: {esc(city)}, lat: {lat}, lng: {lng} }},
    attributes: {json.dumps(attrs, ensure_ascii=False)},
    highlights: {json.dumps(highlights, ensure_ascii=False)},
  }}"""
    items.append(item_ts)

header = '''import type { InventoryItem } from "@/core/types";

/**
 * 500 synthetic Bahrain property listings — specs (type, bedrooms,
 * bathrooms, price, area) and photos are all synthetic/placeholder, not
 * scraped from any real listing site. Photos are served from Lorem Picsum
 * (picsum.photos), a free placeholder-image service; they are not photos of
 * the actual (fictional) properties described. Location coordinates are
 * approximate area centroids (see AREA_CENTROIDS in the generation script),
 * not real per-property addresses — the source dataset has no street-level
 * detail. Generated once from a spreadsheet, not hand-authored — see
 * src/core/industries/real-estate-bahrain.ts for the pack this powers.
 */
export const bahrainListings: InventoryItem[] = [
'''
footer = "\n];\n"

with open(OUT, "w") as f:
    f.write(header)
    f.write(",\n".join(items))
    f.write(footer)

print(f"Wrote {len(items)} listings to {OUT}")
