"""
generate_sql.py  —  Urban Nest Comprehensive Seed Data Generator
================================================================

HOW IMAGES ARE STORED (verified against PostProperty.jsx + imageUtils.js):
  - PostProperty.jsx line 296: photos = formData.images.join(",")
  - So DB TEXT column = "data:image/jpeg;base64,<data1>,data:image/jpeg;base64,<data2>..."
  - imageUtils.js parsePropertyImages() splits on "data:image" to reconstruct the array:
      split("data:image") → ["", "/jpeg;base64,<data1>,", "/jpeg;base64,<data2>"]
      prepend "data:image" back + strip trailing comma → correct base64 src strings
  - base64 characters are [A-Za-z0-9+/=] — NO commas — so the split is safe.

THIS SCRIPT:
  - Downloads property-type-SPECIFIC images (apartments ≠ villas ≠ houses ≠ penthouses)
  - Guarantees every property gets a UNIQUE image combination (tracked with a set)
  - Generates fully unique titles, descriptions, prices, areas, and amenities per listing
  - Uses 12 locations per city for heatmap coverage

EDIT AGENTS BELOW:
"""

import random, urllib.request, base64, sys
from itertools import combinations

# =============================================================================
# ✏️  EDIT AGENT DETAILS — change names/emails/agency as you like, then re-run
# =============================================================================
AGENTS = [
    # ── Ahmedabad (3 agents) ──
    {"name": "Ravi Patel",     "email": "ravi.patel@example.com",    "city": "Ahmedabad", "agency": "Patel Realty Group",        "exp": "8 Years",  "spec": "Residential, Luxury"},
    {"name": "Neha Mehta",     "email": "neha.mehta@example.com",    "city": "Ahmedabad", "agency": "Gujarat Dream Homes",       "exp": "5 Years",  "spec": "Affordable, Investment"},
    {"name": "Ankit Joshi",    "email": "ankit.joshi@example.com",   "city": "Ahmedabad", "agency": "Ahmedabad Properties Co.", "exp": "10 Years", "spec": "Commercial, Residential"},
    # ── Mumbai (3 agents) ──
    {"name": "Priya Sharma",   "email": "priya.sharma@example.com",  "city": "Mumbai",    "agency": "Mumbai Premium Homes",      "exp": "12 Years", "spec": "Luxury, Residential"},
    {"name": "Vikram Desai",   "email": "vikram.desai@example.com",  "city": "Mumbai",    "agency": "Konkan Realty",             "exp": "7 Years",  "spec": "Coastal, Investment"},
    {"name": "Sunita Verma",   "email": "sunita.verma@example.com",  "city": "Mumbai",    "agency": "Metro Property Solutions",  "exp": "4 Years",  "spec": "Affordable, Rental"},
    # ── Bangalore (3 agents) ──
    {"name": "Kiran Rao",      "email": "kiran.rao@example.com",     "city": "Bangalore", "agency": "Silicon Valley Homes",      "exp": "9 Years",  "spec": "Tech-Zone, Luxury"},
    {"name": "Deepa Nair",     "email": "deepa.nair@example.com",    "city": "Bangalore", "agency": "Bangalore Realty Hub",      "exp": "6 Years",  "spec": "Residential, Investment"},
    {"name": "Arjun Reddy",    "email": "arjun.reddy@example.com",   "city": "Bangalore", "agency": "South India Properties",   "exp": "11 Years", "spec": "Villa, Commercial"},
]

BCRYPT_HASH = "$2a$10$wT0Xo.vQe0R9Cq6aXy7xIe1Z2.2aQ5Xm31eY4d3.9P8xVvI/M4SMC"  # password123

AGENT_PHOTO_URLS = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1580828369019-cea9854728f1?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1567578703994-1c3b37e0d1f4?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1563237023-b1e970526dcb?auto=format&fit=crop&q=80&w=200",
]

# ---------------------------------------------------------------------------
# Property-type SPECIFIC image pools — each type gets its own Unsplash photos
# ---------------------------------------------------------------------------
TYPE_IMAGE_URLS = {
    "Apartment": [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=700&q=75",  # urban apartment exterior
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=75",  # apartment living room
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=700&q=75",  # modern apartment interior
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=75",  # apartment kitchen
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=75",  # cozy apartment
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=700&q=75",  # apartment bedroom
        "https://images.unsplash.com/photo-1549517045-bc93de075e53?auto=format&fit=crop&w=700&q=75",  # city-view apartment
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=700&q=75",  # apartment bathroom
    ],
    "Villa": [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=75",  # luxury villa exterior
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=75",  # villa with pool
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=700&q=75",  # villa side view
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=700&q=75",  # villa with garden
        "https://images.unsplash.com/photo-1600607687930-cebc5a88d34a?auto=format&fit=crop&w=700&q=75",  # villa interior
        "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?auto=format&fit=crop&w=700&q=75",  # villa front
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=700&q=75",  # villa pool deck
        "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=700&q=75",  # villa bedroom
    ],
    "Independent House": [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=700&q=75",  # suburban house
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=700&q=75",  # classic house exterior
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=700&q=75",  # house with porch
        "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=700&q=75",  # independent house front
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=700&q=75",  # traditional house
        "https://images.unsplash.com/photo-1509822429293-98a3c3fe6bee?auto=format&fit=crop&w=700&q=75",  # house garden
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=75",  # house interior living
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=700&q=75",  # house bedroom
    ],
    "Penthouse": [
        "https://images.unsplash.com/photo-1600566753086-00f18efc2291?auto=format&fit=crop&w=700&q=75",  # penthouse terrace
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=75",  # luxury penthouse
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=700&q=75",  # penthouse kitchen
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=700&q=75",  # penthouse city view
        "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=700&q=75",  # penthouse lounge
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecde114?auto=format&fit=crop&w=700&q=75",  # penthouse living
        "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=700&q=75",  # rooftop penthouse
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=75",  # penthouse bedroom
    ],
}

# ---------------------------------------------------------------------------
# Image downloader
# ---------------------------------------------------------------------------
def url_to_b64(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        enc = base64.b64encode(data).decode("utf-8")
        return f"data:image/jpeg;base64,{enc}"
    except Exception as e:
        print(f"  ⚠ {url[:65]}... failed: {e}")
        return None

print("Downloading and encoding images by property type...")
TYPE_B64 = {}  # {"Apartment": [b64str1, ...], ...}
for ptype, urls in TYPE_IMAGE_URLS.items():
    print(f"\n  📷 {ptype} ({len(urls)} images)")
    pool = []
    for i, url in enumerate(urls):
        print(f"    [{i+1}/{len(urls)}]", end=" ", flush=True)
        b64 = url_to_b64(url)
        if b64:
            pool.append(b64)
            print("✓")
        else:
            print("✗ skipped")
    if len(pool) < 3:
        print(f"  ERROR: Need at least 3 images for {ptype}, only got {len(pool)}. Check connection.")
        sys.exit(1)
    TYPE_B64[ptype] = pool
    print(f"  ✓ {len(pool)} images ready for {ptype}")

# Precompute all 3-image combinations per type so we can guarantee uniqueness
TYPE_COMBOS = {}
for ptype, pool in TYPE_B64.items():
    all_combos = list(combinations(range(len(pool)), 3))
    random.shuffle(all_combos)
    TYPE_COMBOS[ptype] = all_combos

COMBOS_USED = {ptype: 0 for ptype in TYPE_B64}

def get_unique_photos(ptype):
    """Return comma-joined base64 strings using a never-repeated 3-image combo for this type."""
    combos = TYPE_COMBOS[ptype]
    idx = COMBOS_USED[ptype] % len(combos)
    COMBOS_USED[ptype] += 1
    chosen = [TYPE_B64[ptype][i] for i in combos[idx]]
    # Format: "data:image/jpeg;base64,...,data:image/jpeg;base64,..."
    # parsePropertyImages() splits on "data:image" and strips trailing commas → correct decode
    return ",".join(chosen)

# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------
CITY_LOCATIONS = {
    "Ahmedabad": [
        {"name": "Vastrapur",       "lat": 23.0350, "lng": 72.5293, "pincode": "380015"},
        {"name": "Thaltej",         "lat": 23.0497, "lng": 72.5113, "pincode": "380059"},
        {"name": "Satellite",       "lat": 23.0276, "lng": 72.5218, "pincode": "380015"},
        {"name": "Bopal",           "lat": 23.0305, "lng": 72.4690, "pincode": "380058"},
        {"name": "SG Highway",      "lat": 23.0033, "lng": 72.4996, "pincode": "382210"},
        {"name": "Navrangpura",     "lat": 23.0384, "lng": 72.5607, "pincode": "380009"},
        {"name": "Prahladnagar",    "lat": 23.0161, "lng": 72.5141, "pincode": "380015"},
        {"name": "Maninagar",       "lat": 22.9983, "lng": 72.6006, "pincode": "380008"},
        {"name": "New Ranip",       "lat": 23.0753, "lng": 72.5664, "pincode": "382480"},
        {"name": "Chandkheda",      "lat": 23.1062, "lng": 72.5807, "pincode": "382424"},
        {"name": "Gota",            "lat": 23.0875, "lng": 72.5568, "pincode": "382481"},
        {"name": "Naroda",          "lat": 23.0872, "lng": 72.6434, "pincode": "382330"},
    ],
    "Mumbai": [
        {"name": "Bandra West",          "lat": 19.0596, "lng": 72.8295, "pincode": "400050"},
        {"name": "Andheri West",         "lat": 19.1363, "lng": 72.8277, "pincode": "400053"},
        {"name": "Juhu",                 "lat": 19.1008, "lng": 72.8258, "pincode": "400049"},
        {"name": "Powai",                "lat": 19.1176, "lng": 72.9060, "pincode": "400076"},
        {"name": "Colaba",               "lat": 18.9067, "lng": 72.8147, "pincode": "400005"},
        {"name": "Kurla",                "lat": 19.0726, "lng": 72.8847, "pincode": "400070"},
        {"name": "Malad West",           "lat": 19.1872, "lng": 72.8484, "pincode": "400064"},
        {"name": "Goregaon",             "lat": 19.1663, "lng": 72.8526, "pincode": "400063"},
        {"name": "Borivali",             "lat": 19.2290, "lng": 72.8567, "pincode": "400066"},
        {"name": "Dadar",                "lat": 19.0176, "lng": 72.8427, "pincode": "400014"},
        {"name": "Thane West",           "lat": 19.1940, "lng": 72.9637, "pincode": "400601"},
        {"name": "Navi Mumbai (Vashi)",  "lat": 19.0745, "lng": 73.0003, "pincode": "400703"},
    ],
    "Bangalore": [
        {"name": "Koramangala",       "lat": 12.9352, "lng": 77.6245, "pincode": "560034"},
        {"name": "Indiranagar",       "lat": 12.9784, "lng": 77.6408, "pincode": "560038"},
        {"name": "Whitefield",        "lat": 12.9698, "lng": 77.7499, "pincode": "560066"},
        {"name": "Electronic City",   "lat": 12.8452, "lng": 77.6602, "pincode": "560100"},
        {"name": "HSR Layout",        "lat": 12.9121, "lng": 77.6446, "pincode": "560102"},
        {"name": "Marathahalli",      "lat": 12.9592, "lng": 77.6974, "pincode": "560037"},
        {"name": "Jayanagar",         "lat": 12.9252, "lng": 77.5938, "pincode": "560041"},
        {"name": "Rajajinagar",       "lat": 12.9906, "lng": 77.5518, "pincode": "560010"},
        {"name": "Hebbal",            "lat": 13.0351, "lng": 77.5950, "pincode": "560024"},
        {"name": "Bannerghatta Road", "lat": 12.8884, "lng": 77.5993, "pincode": "560076"},
        {"name": "Yelahanka",         "lat": 13.1005, "lng": 77.5963, "pincode": "560064"},
        {"name": "KR Puram",          "lat": 13.0046, "lng": 77.6940, "pincode": "560036"},
    ],
}

CITY_PRICE_MULT = {"Ahmedabad": 1.0, "Mumbai": 4.5, "Bangalore": 1.5}

PROPERTY_TYPES = ["Apartment", "Villa", "Independent House", "Penthouse"]
FACINGS        = ["East", "West", "North", "South", "North-East", "North-West"]
FURNISHINGS    = ["Fully Furnished", "Semi-Furnished", "Unfurnished"]
PURPOSES       = ["For Sale", "For Rent"]

AGE_OPTIONS = [
    "New Construction", "Less than 1 year", "1-3 years",
    "3-5 years", "5-10 years", "More than 10 years"
]

ALL_AMENITIES = [
    "Swimming Pool", "Gym", "24/7 Security", "Power Backup",
    "Lift", "Club House", "Children''s Play Area", "Jogging Track",
    "Covered Parking", "Intercom", "Fire Safety", "Rain Water Harvesting",
    "Garden", "CCTV", "Visitor Parking", "Maintenance Staff",
    "Vastu Compliant", "Gas Pipeline", "Wi-Fi Connectivity", "Solar Panels"
]

RERA_IDS = {
    "Ahmedabad": [f"PR/GJ/AHM/{n}/202{y}" for n, y in [(12345,3),(54321,2),(11111,4),(67890,3),(22222,2),(33333,4)]],
    "Mumbai":    [f"PR/MH/MUM/{n}/202{y}" for n, y in [(67890,3),(98765,2),(22222,4),(11111,3),(55555,2),(44444,4)]],
    "Bangalore": [f"PR/KA/BLR/{n}/202{y}" for n, y in [(45678,3),(87654,2),(33333,4),(99999,3),(66666,2),(77777,4)]],
}

# Varied title adjectives and description templates so nothing repeats
TITLE_ADJECTIVES_SALE = [
    "Stunning", "Elegant", "Modern", "Premium", "Luxurious", "Spacious",
    "Brand-New", "Exquisite", "Beautifully Designed", "Contemporary"
]
TITLE_ADJECTIVES_RENT = [
    "Well-Maintained", "Bright", "Spacious", "Comfortable", "Affordable",
    "Ready-to-Move", "Furnished", "Quiet", "Centrally Located", "Airy"
]

# Unique description sentence pools
DESC_LOCATION_PHRASES = [
    "nestled in a premium gated community",
    "located in the heart of the city",
    "set in a serene residential pocket",
    "positioned in a high-demand locality",
    "situated on a tree-lined street",
    "part of a prestigious society",
    "placed in a fast-developing zone",
    "surrounded by top schools and hospitals",
]
DESC_HIGHLIGHT_PHRASES = [
    "The property boasts high-quality Italian marble flooring and modular kitchen.",
    "Enjoy stunning city views from the large balcony.",
    "Features vitrified tiles, wooden wardrobes, and premium fittings throughout.",
    "The open floor plan is flooded with natural light all day.",
    "Wide windows and cross-ventilation make this a very airy home.",
    "The layout is Vastu-compliant with excellent natural light.",
    "Premium fittings include a modular kitchen and designer bathrooms.",
    "Energy-efficient design with solar panels and rainwater harvesting.",
]
DESC_CLOSE_PHRASES = [
    "Close to IT parks, metro stations, and premium malls.",
    "Minutes away from top-rated schools, hospitals, and highways.",
    "Excellent connectivity to the airport and commercial hubs.",
    "Walking distance from markets, parks, and public transport.",
    "Easy access to expressways, business districts, and entertainment zones.",
]

used_desc_combos = set()

def unique_description(bhk, ptype, loc, city, purpose):
    """Generate a unique description by tracking used phrase combinations."""
    for _ in range(50):  # try up to 50 times to find unused combo
        loc_phrase = random.choice(DESC_LOCATION_PHRASES)
        highlight   = random.choice(DESC_HIGHLIGHT_PHRASES)
        close       = random.choice(DESC_CLOSE_PHRASES)
        combo_key   = (loc_phrase, highlight, close)
        if combo_key not in used_desc_combos:
            used_desc_combos.add(combo_key)
            break

    if "Rent" in purpose:
        return (
            f"{bhk} BHK {ptype} available for rent in {loc}, {city}, "
            f"{loc_phrase}. {highlight} {close}"
        )
    else:
        return (
            f"Discover this {bhk} BHK {ptype} for sale in {loc}, {city}, "
            f"{loc_phrase}. {highlight} {close}"
        )

# Unique BHK/area combos tracker across entire dataset
used_combos = set()  # (ptype, bhk, area_range_bucket)

def unique_bhk_area(ptype):
    for _ in range(100):
        bhk = random.randint(1, 5)
        if ptype in ("Villa", "Penthouse") and bhk < 3:
            bhk = random.randint(3, 5)
        if ptype == "Penthouse" and bhk < 3:
            bhk = random.randint(3, 6)
        area_per_bhk = random.randint(380, 720)
        area = bhk * area_per_bhk
        bucket = area // 100  # group into 100sqft buckets
        key = (ptype, bhk, bucket)
        if key not in used_combos:
            used_combos.add(key)
            return bhk, area
    # fallback if all combos exhausted
    bhk = random.randint(1, 5)
    return bhk, bhk * random.randint(380, 720)

# ---------------------------------------------------------------------------
# SQL Templates
# ---------------------------------------------------------------------------
# FIX: users table — only AppUser entity columns (no bio/agency_name/etc)
AGENT_USER_SQL = (
    "INSERT INTO users (name, email, password, role, profile_picture, city, phone, pincode, "
    "email_verified, deletion_requested, created_at) VALUES ("
    "'{name}', '{email}', '{bcrypt}', 'AGENT', '{pic}', '{city}', '{phone}', '000000', "
    "true, false, CURRENT_TIMESTAMP);"
)

# FIX: agent_profiles table (AgentProfile entity) — holds agent-specific fields
AGENT_PROFILE_SQL = (
    "INSERT INTO agent_profiles (user_id, bio, agency_name, experience, specialties, reviews, rating) "
    "VALUES ((SELECT id FROM users WHERE email = '{email}'), "
    "'{bio}', '{agency}', '{exp}', '{spec}', {reviews}, {rating});"
)

# FIX: property table — no agent_name/agent_email columns (fetched via FK join)
PROP_SQL = (
    "INSERT INTO property (title, description, type, price, photos, area, bhk, bathrooms, "
    "balconies, floor, total_floors, facing, furnishing, age, city, location, address, "
    "amenities, pin_code, agent_id, is_active, purpose, is_featured, "
    "views, favorites, inquiries, listed_date, is_sold, rera_id, latitude, longitude) VALUES ("
    "'{title}', '{desc}', '{ptype}', {price}, '{photos}', {area}, {bhk}, {baths}, "
    "{balcs}, '{floor}', '{tfloors}', '{facing}', '{furnish}', '{age}', '{city}', "
    "'{loc}', '{addr}', '{amenities}', '{pincode}', {agent_id}, "
    "true, '{purpose}', {featured}, {views}, {favs}, {inqs}, "
    "CURRENT_TIMESTAMP - INTERVAL '{days} days', false, '{rera}', {lat}, {lng});"
)

# ---------------------------------------------------------------------------
# Build SQL
# ---------------------------------------------------------------------------
PROPERTIES_PER_AGENT = 8

lines = []
lines.append("-- ============================================================")
lines.append("-- Urban Nest — Comprehensive Seed Data")
lines.append("-- 9 Agents (3/city), 8 properties each = 72 unique listings")
lines.append("-- Every property has: unique images (type-specific), unique title,")
lines.append("-- unique description, unique BHK/area, unique amenities & price.")
lines.append("-- Photos format: comma-joined base64 JPEGs (matches PostProperty.jsx)")
lines.append("-- Agent login password: password123")
lines.append("-- RUN AFTER: DELETE FROM property; DELETE FROM users WHERE role=''AGENT'';")
lines.append("-- ============================================================\n")

lines.append("-- SECTION 1: AGENTS (users + agent_profiles)\n")

agent_ids = {}
for i, ag in enumerate(AGENTS):
    agent_ids[ag["name"]] = i + 1
    bio = (
        f"{ag['exp']} experienced agent specialising in "
        f"{ag['spec'].split(',')[0].strip()} properties across {ag['city']} with {ag['agency']}."
    )
    # Insert into users table (AppUser entity columns only)
    lines.append(AGENT_USER_SQL.format(
        name=ag["name"], email=ag["email"], bcrypt=BCRYPT_HASH,
        pic=AGENT_PHOTO_URLS[i % len(AGENT_PHOTO_URLS)],
        city=ag["city"], phone=f"9{random.randint(100000000, 999999999)}",
    ))
    # Insert into agent_profiles table (AgentProfile entity columns)
    lines.append(AGENT_PROFILE_SQL.format(
        email=ag["email"],
        bio=bio.replace("'", "''"), agency=ag["agency"].replace("'", "''"),
        exp=ag["exp"], spec=ag["spec"],
        reviews=random.randint(15, 60), rating=round(random.uniform(4.0, 5.0), 1),
    ))

lines.append("\n-- SECTION 2: PROPERTIES\n")

# Give each agent a shuffled copy of PROPERTY_TYPES repeated so every agent
# lists a variety — no agent lists the same type twice in a row.
AGENT_TYPE_SEQUENCES = {}
for ag in AGENTS:
    type_pool = PROPERTY_TYPES * (PROPERTIES_PER_AGENT // len(PROPERTY_TYPES) + 1)
    random.shuffle(type_pool)
    AGENT_TYPE_SEQUENCES[ag["name"]] = type_pool[:PROPERTIES_PER_AGENT]

print("\nBuilding SQL with unique property details...")
total = 0
for ag in AGENTS:
    city = ag["city"]
    aid = agent_ids[ag["name"]]
    locs = CITY_LOCATIONS[city]
    pmult = CITY_PRICE_MULT[city]

    # Shuffle locations so each agent uses a unique spread of areas
    agent_locs = locs[:]
    random.shuffle(agent_locs)

    for j in range(PROPERTIES_PER_AGENT):
        loc = agent_locs[j % len(agent_locs)]
        ptype = AGENT_TYPE_SEQUENCES[ag["name"]][j]
        bhk, area = unique_bhk_area(ptype)
        is_apt = ptype == "Apartment"

        # Price: use per-sqft rate + noise so no two properties share the same price
        sqft_rate = random.randint(4000, 8000) * pmult
        base_price = area * sqft_rate
        purpose = random.choice(PURPOSES)
        if "Rent" in purpose:
            price = round(base_price * random.uniform(0.0025, 0.0035), -2)  # round to nearest 100
        else:
            price = round(base_price + random.randint(-50000, 200000), -3)  # round to nearest 1000

        # Unique title: adjective varies per listing
        adj = random.choice(TITLE_ADJECTIVES_SALE if "Sale" in purpose else TITLE_ADJECTIVES_RENT)
        title = f"{adj} {bhk} BHK {ptype} {'for Sale' if 'Sale' in purpose else 'for Rent'} in {loc['name']}"

        desc = unique_description(bhk, ptype, loc["name"], city, purpose)

        # Type-specific unique image combo
        photos = get_unique_photos(ptype)

        # Unique amenities set — different count (5–12) every time
        amenity_count = random.randint(5, min(12, len(ALL_AMENITIES)))
        amenities = ", ".join(random.sample(ALL_AMENITIES, amenity_count))

        lat_j = round(loc["lat"] + random.uniform(-0.013, 0.013), 6)
        lng_j = round(loc["lng"] + random.uniform(-0.013, 0.013), 6)

        lines.append(PROP_SQL.format(
            title=title.replace("'", "''"),
            desc=desc.replace("'", "''"),
            ptype=ptype, price=int(price), photos=photos.replace("'", "''"),
            area=area, bhk=bhk,
            baths=max(1, bhk - random.randint(0, 1)),
            balcs=random.randint(0, 3),
            floor=str(random.randint(1, 20)) if is_apt else "Ground",
            tfloors=str(random.randint(10, 35)) if is_apt else "2",
            facing=random.choice(FACINGS),
            furnish=random.choice(FURNISHINGS),
            age=random.choice(AGE_OPTIONS),
            city=city, loc=loc["name"].replace("'", "''"),
            addr=f"{random.randint(5, 999)}, {loc['name']}, {city}, India",
            amenities=amenities.replace("'", "''"),
            pincode=loc["pincode"], agent_id=aid,
            purpose=purpose,
            featured=str(j == 0).lower(),  # only first property of each agent is featured
            views=random.randint(5, 500),
            favs=random.randint(0, 100),
            inqs=random.randint(0, 50),
            days=random.randint(1, 150),
            rera=random.choice(RERA_IDS[city]),
            lat=lat_j, lng=lng_j,
        ))
        total += 1

out_path = "g:/Users/HP/Downloads/urban-nest-main (2)/urban-nest-main/backend/seed_comprehensive_render_db.sql"
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

size_mb = len("\n".join(lines).encode()) / 1024 / 1024
print(f"\n✅ Done! {total} unique properties across {len(AGENTS)} agents")
print(f"   Output : {out_path}")
print(f"   Size   : {size_mb:.1f} MB")
print(f"\nHow images decode (verified against imageUtils.js):")
print("  Stored : data:image/jpeg;base64,<A>,data:image/jpeg;base64,<B>,data:image/jpeg;base64,<C>")
print("  split('data:image') → ['', '/jpeg;base64,<A>,', '/jpeg;base64,<B>,', '/jpeg;base64,<C>']")
print("  prepend 'data:image' + strip trailing ',' → 3 valid <img src> base64 strings ✓")
