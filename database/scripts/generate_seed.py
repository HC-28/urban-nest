import base64
import io
import random
from PIL import Image, ImageDraw, ImageFont

# ── 1. VISUAL SETTINGS ────────────────────────────────────────────────────────
TYPE_COLORS = {
    'Apartment':  (173, 216, 230),
    'Villa':      (144, 238, 144),
    'Penthouse':  (221, 160, 221),
    'Studio':     (255, 218, 185),
    'Projects':   (135, 206, 250),
}

BCRYPT_HASH = "$2b$10$kDQrk6GPIHNcnMQ8Jh/vx.vuaHHkQLO3984BnJbTGsYST4Fpzt.GKy"
# All seed accounts share password: password123

# ── Rich data pools ────────────────────────────────────────────────────────────
CITY_DATA = {
    "Mumbai":    {"pincodes": ["400001", "400018", "400050"], "phone_prefix": "9820", "city_short": "MUM"},
    "Bangalore": {"pincodes": ["560001", "560034", "560066"], "phone_prefix": "9845", "city_short": "BLR"},
    "Ahmedabad": {"pincodes": ["380015", "380054", "380058"], "phone_prefix": "9726", "city_short": "AMD"},
}

AGENT_DATA = [
    {"name": "Aryan Mehta",   "email": "aryan@agent.com",   "city": "Mumbai",    "phone": "9820112233", "pincode": "400001"},
    {"name": "Neha Sharma",   "email": "neha@agent.com",    "city": "Mumbai",    "phone": "9820223344", "pincode": "400018"},
    {"name": "Rohan Kapoor",  "email": "rohan@agent.com",   "city": "Mumbai",    "phone": "9820334455", "pincode": "400050"},
    {"name": "Priya Nair",    "email": "priya@agent.com",   "city": "Bangalore", "phone": "9845112233", "pincode": "560001"},
    {"name": "Rahul Verma",   "email": "rahul@agent.com",   "city": "Bangalore", "phone": "9845223344", "pincode": "560034"},
    {"name": "Anjali Singh",  "email": "anjali@agent.com",  "city": "Bangalore", "phone": "9845334455", "pincode": "560066"},
    {"name": "Amit Patel",    "email": "amit@agent.com",    "city": "Ahmedabad", "phone": "9726112233", "pincode": "380015"},
    {"name": "Kavita Desai",  "email": "kavita@agent.com",  "city": "Ahmedabad", "phone": "9726223344", "pincode": "380054"},
    {"name": "Vikram Shah",   "email": "vikram@agent.com",  "city": "Ahmedabad", "phone": "9726334455", "pincode": "380058"},
]

AGENCY_DATA = [
    {
        "name": "Mumbai Metro Realty",      "code": "BOM01",
        "license": "MH-RERA-BOM-2018-001", "city": "Mumbai",
        "bio": "Mumbai's premier luxury real estate agency with 15+ years of excellence in residential and commercial properties."
    },
    {
        "name": "Coastal Properties",       "code": "BOM02",
        "license": "MH-RERA-BOM-2019-002", "city": "Mumbai",
        "bio": "Specializing in coastal and sea-view premium homes across Mumbai's most sought-after localities."
    },
    {
        "name": "Silicon Valley Homes",     "code": "BLR01",
        "license": "KA-RERA-BLR-2017-001", "city": "Bangalore",
        "bio": "Bangalore's trusted name for tech-hub residential communities and smart home developments."
    },
    {
        "name": "Garden City Estates",      "code": "BLR02",
        "license": "KA-RERA-BLR-2020-002", "city": "Bangalore",
        "bio": "Curating green, sustainable living spaces in Bangalore's lush residential corridors."
    },
    {
        "name": "Gujarat Heritage Homes",   "code": "AMD01",
        "license": "GJ-RERA-AMD-2016-001", "city": "Ahmedabad",
        "bio": "Preserving the charm of Ahmedabad with modern amenities in heritage-style residential projects."
    },
    {
        "name": "Karnavati Prime Realty",   "code": "AMD02",
        "license": "GJ-RERA-AMD-2019-002", "city": "Ahmedabad",
        "bio": "Ahmedabad's fastest-growing agency offering premium affordable housing across all major sectors."
    },
]

ADMIN_DATA = [
    {"name": "Mumbai Metro Admin",   "email": "admin@mumbaimetro.in", "city": "Mumbai",    "phone": "9820001001", "pincode": "400001"},
    {"name": "Coastal Properties Admin","email": "admin@coastal.in",  "city": "Mumbai",    "phone": "9820001002", "pincode": "400018"},
    {"name": "Silicon Valley Admin", "email": "admin@silicon.in",    "city": "Bangalore", "phone": "9845001001", "pincode": "560001"},
    {"name": "Garden City Admin",    "email": "admin@garden.in",     "city": "Bangalore", "phone": "9845001002", "pincode": "560034"},
    {"name": "Gujarat Heritage Admin","email": "admin@gujarat.in",   "city": "Ahmedabad", "phone": "9726001001", "pincode": "380015"},
    {"name": "Karnavati Prime Admin","email": "admin@karnavati.in",  "city": "Ahmedabad", "phone": "9726001002", "pincode": "380054"},
]

SPECIALTIES = [
    "Luxury Homes,Sea View,High Rise",
    "Residential,Commercial,Plots",
    "Villas,Independent Houses,Bungalows",
    "Apartments,Condos,Gated Communities",
    "New Projects,Under Construction,Ready to Move",
    "Rental,Lease,PG Accommodations",
]

BIOS = [
    "Seasoned real estate professional with a passion for matching clients to their perfect homes. 10+ years in the industry.",
    "Expert in luxury properties and premium localities. Trusted by 500+ satisfied families across the city.",
    "Dedicated to transparent transactions and client satisfaction. Specialist in new project launches.",
    "Helping families and investors navigate the property market with confidence and clarity for over a decade.",
    "Award-winning agent with deep local market knowledge. Certified RERA agent with zero compromise on integrity.",
    "Focused on making real estate simple, fair and stress-free. Your dream home is my mission.",
    "Full-service real estate consultant with expertise in both residential and commercial segments.",
    "Passionate about creating communities through great real estate deals. Your trusted property partner.",
    "Over 8 years of experience helping NRI clients and first-time buyers find their ideal properties.",
]

PROPERTY_TITLES = {
    "Apartment":  ["Urban Heights Apt", "Skyline Apartment", "City View Flat", "Metro Park Apt", "Palm Grove Apartment"],
    "Villa":      ["Serene Villa", "Lakeview Villa", "Garden Estate Villa", "Royal Villa", "Horizon Villa"],
    "Penthouse":  ["Sky Penthouse", "Elite Summit PH", "Crown Penthouse", "Panorama Penthouse", "Prestige Penthouse"],
    "Studio":     ["Smart Studio", "Urban Studio Suite", "Compact Living Studio", "City Studio", "Zen Studio"],
    "Projects":   ["Green Valley Township", "Sunrise Enclave", "Metro Smart City", "Emerald Township", "Golden Horizon"],
}

AMENITIES_POOL = [
    "Swimming Pool,Gym,24/7 Security,Power Backup,Parking",
    "Club House,Swimming Pool,Children Play Area,Gym,CCTV",
    "Gym,Jogging Track,Rainwater Harvesting,Solar Power,EV Charging",
    "Concierge,Rooftop Garden,Sky Lounge,Smart Home,In-house Cafe",
    "24/7 Security,Power Backup,Water Treatment Plant,Parking,Lift",
    "Tennis Court,Badminton Court,Indoor Games,Yoga Studio,Meditation Zone",
]

FURNISHING_OPTIONS = ["Unfurnished", "Semi-Furnished", "Fully Furnished"]
FACING_OPTIONS     = ["East", "West", "North", "South", "North-East", "South-West"]
PROPERTY_TYPES     = ["Apartment", "Villa", "Penthouse", "Studio", "Projects"]


def generate_property_image(prop_type, title, prop_id):
    base_color = TYPE_COLORS.get(prop_type, (200, 200, 200))
    bg_color = (
        max(0, min(255, base_color[0] + random.randint(-20, 20))),
        max(0, min(255, base_color[1] + random.randint(-20, 20))),
        max(0, min(255, base_color[2] + random.randint(-20, 20))),
    )
    img = Image.new('RGB', (600, 400), color=bg_color)
    d = ImageDraw.Draw(img)
    try:
        font_large = ImageFont.truetype("arial.ttf", 28)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    d.text((30, 150), f"[{prop_type.upper()}]", fill=(40, 40, 40), font=font_large)
    d.text((30, 200), title,                     fill=(0, 0, 0),   font=font_large)
    d.text((30, 350), f"Urban Nest Verified ID: #{prop_id}", fill=(80, 80, 80), font=font_small)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=70)
    return f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"


def sq(s):
    """Wrap a string value in single quotes for SQL, escaping apostrophes."""
    return "'" + s.replace("'", "''") + "'"


def main():
    sql  = []
    sql.append("-- URBAN NEST ENTERPRISE SEED  (password for all accounts: password123)")
    sql.append("TRUNCATE TABLE inquiries, favorites, property, agent_profiles, agencies, users CASCADE;\n")

    # ── 1. SEED USERS ─────────────────────────────────────────────────────────
    sql.append("-- 1. SEED USERS")
    user_rows = []

    # Platform admin (id=1)
    user_rows.append(
        f"(1, 'Platform Admin', 'admin@urbannest.com', {sq(BCRYPT_HASH)}, "
        f"'ADMIN', 'Mumbai', '9000000001', '400001', true, true)"
    )

    # Agency admin users (id=2..7)
    for i, a in enumerate(ADMIN_DATA):
        uid = i + 2
        user_rows.append(
            f"({uid}, {sq(a['name'])}, {sq(a['email'])}, {sq(BCRYPT_HASH)}, "
            f"'AGENT', {sq(a['city'])}, {sq(a['phone'])}, {sq(a['pincode'])}, true, true)"
        )

    # Agent users (id=8..16)
    for i, ag in enumerate(AGENT_DATA):
        uid = i + 8
        user_rows.append(
            f"({uid}, {sq(ag['name'])}, {sq(ag['email'])}, {sq(BCRYPT_HASH)}, "
            f"'AGENT', {sq(ag['city'])}, {sq(ag['phone'])}, {sq(ag['pincode'])}, true, true)"
        )

    sql.append(
        "INSERT INTO users (id, name, email, password, role, city, phone, pincode, email_verified, verified) VALUES"
    )
    for j, row in enumerate(user_rows):
        sql.append(row + ("," if j < len(user_rows) - 1 else ";"))

    # ── 2. SEED AGENCIES ──────────────────────────────────────────────────────
    sql.append("\n-- 2. SEED AGENCIES")
    agency_rows = []
    for i, ag in enumerate(AGENCY_DATA):
        aid       = i + 1
        admin_uid = i + 2           # ids 2..7 are the agency admins
        agency_rows.append(
            f"({aid}, {sq(ag['name'])}, {sq(ag['code'])}, {sq(ag['license'])}, "
            f"{sq(ag['bio'])}, 'APPROVED', {admin_uid})"
        )

    sql.append(
        "INSERT INTO agencies (id, name, agency_code, license_number, bio, status, admin_user_id) VALUES"
    )
    for j, row in enumerate(agency_rows):
        sql.append(row + ("," if j < len(agency_rows) - 1 else ";"))

    # ── 3. SEED AGENT PROFILES ────────────────────────────────────────────────
    sql.append("\n-- 3. SEED AGENT PROFILES")
    # agency-admin profiles (id=1..6, user_id=2..7)
    # actual agent profiles  (id=7..15, user_id=8..16)
    profile_rows = []

    # Agency admins → also need profiles so they show correctly
    agency_profile_map = [(1,2,1),(2,3,2),(3,4,3),(4,5,4),(5,6,5),(6,7,6)]
    for pid, uid, ag_id in agency_profile_map:
        bio = random.choice(BIOS)
        sp  = random.choice(SPECIALTIES)
        exp = random.randint(8, 20)
        rev = random.randint(10, 80)
        rat = round(random.uniform(3.8, 5.0), 1)
        profile_rows.append(
            f"({pid}, {uid}, {ag_id}, {sq(bio)}, {exp}, {sq(sp)}, {rev}, {rat}, 'JOINED')"
        )

    # Regular agents
    agent_agency_map = [(7,8,1),(8,9,1),(9,10,2),(10,11,3),(11,12,3),(12,13,4),(13,14,5),(14,15,5),(15,16,6)]
    for pid, uid, ag_id in agent_agency_map:
        idx = uid - 8
        bio = BIOS[idx % len(BIOS)]
        sp  = SPECIALTIES[idx % len(SPECIALTIES)]
        exp = random.randint(3, 15)
        rev = random.randint(5, 60)
        rat = round(random.uniform(3.5, 5.0), 1)
        profile_rows.append(
            f"({pid}, {uid}, {ag_id}, {sq(bio)}, {exp}, {sq(sp)}, {rev}, {rat}, 'JOINED')"
        )

    sql.append(
        "INSERT INTO agent_profiles (id, user_id, agency_id, bio, experience, specialties, reviews, rating, agency_status) VALUES"
    )
    for j, row in enumerate(profile_rows):
        sql.append(row + ("," if j < len(profile_rows) - 1 else ";"))

    # ── 4. SEED PROPERTIES ────────────────────────────────────────────────────
    sql.append("\n-- 4. SEED PROPERTIES")
    # agent profile ids 7..15 map to actual agents (user_id 8..16)
    city_profile_map = {
        "Mumbai":    [7, 8, 9],
        "Bangalore": [10, 11, 12],
        "Ahmedabad": [13, 14, 15],
    }
    prop_id = 1
    for city, cdata in CITY_DATA.items():
        for pin in cdata["pincodes"]:
            for i in range(5):
                p_type          = random.choice(PROPERTY_TYPES)
                agent_profile   = random.choice(city_profile_map[city])
                purpose         = random.choice(["Sale", "Rent"])
                bhk             = 1 if p_type in ("Studio", "Projects") else random.randint(1, 4)
                bathrooms       = 1 if p_type == "Studio" else bhk
                balconies       = 0 if p_type == "Studio" else random.randint(1, 3)
                price           = random.randint(50, 300) * 100000
                if purpose == "Rent":
                    price = int(price * 0.005)
                area            = random.randint(500, 3000)
                furnishing      = random.choice(FURNISHING_OPTIONS)
                facing          = random.choice(FACING_OPTIONS)
                floor           = random.randint(1, 25)
                total_floors    = floor + random.randint(0, 10)
                age             = random.randint(0, 15)
                floor_str       = str(floor)
                total_floors_str= str(total_floors)
                age_str         = str(age)
                amenities       = random.choice(AMENITIES_POOL)
                title_base      = random.choice(PROPERTY_TITLES.get(p_type, ["Property"]))
                title           = f"{city} {title_base} #{i + 1}"
                desc            = (f"A beautiful {bhk}BHK {p_type.lower()} in {city}, offering {furnishing.lower()} "
                                   f"accommodation with excellent amenities. {facing}-facing unit on floor {floor} "
                                   f"of {total_floors}. Ideal for {'investment' if purpose == 'Sale' else 'comfortable living'}.")
                location        = f"Sector {random.randint(1, 20)}, {city}"
                address         = f"Plot {random.randint(1, 99)}, {location}, {pin}"
                img_b64         = generate_property_image(p_type, title, prop_id)

                sql.append(
                    f"INSERT INTO property "
                    f"(id, title, description, city, pin_code, location, address, price, area, type, purpose, "
                    f"bhk, bathrooms, balconies, furnishing, facing, floor, total_floors, age, amenities, photos, agent_id) VALUES "
                    f"({prop_id}, {sq(title)}, {sq(desc)}, {sq(city)}, {sq(pin)}, {sq(location)}, {sq(address)}, "
                    f"{price}, {area}, {sq(p_type)}, {sq(purpose)}, {bhk}, {bathrooms}, {balconies}, "
                    f"{sq(furnishing)}, {sq(facing)}, {sq(floor_str)}, {sq(total_floors_str)}, {sq(age_str)}, {sq(amenities)}, "
                    f"'[\"{img_b64}\"]', {agent_profile});"
                )
                prop_id += 1

    # ── 5. RESET SEQUENCES ────────────────────────────────────────────────────
    sql.append("\n-- 5. RESET ID SEQUENCES")
    for tbl in ("users", "agencies", "agent_profiles", "property"):
        sql.append(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), (SELECT MAX(id) FROM {tbl}));")

    with open("master_seed.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql))
    print("\nSUCCESS! master_seed.sql generated with full data (no nulls for key fields).")

    # Hotfix for existing DB
    hotfix = [
        "-- HOTFIX: Fix passwords and agent agency_status for existing DB",
        f"UPDATE users SET password = '{BCRYPT_HASH}';",
        "UPDATE agent_profiles SET agency_status = 'JOINED' WHERE agency_id IS NOT NULL;",
        "UPDATE agent_profiles SET bio = 'Experienced real estate professional. Specialist in local market trends.'",
        "    WHERE bio IS NULL OR bio = '';",
        "UPDATE agent_profiles SET specialties = 'Residential,Commercial' WHERE specialties IS NULL;",
        "UPDATE agent_profiles SET reviews = 0 WHERE reviews IS NULL;",
        "UPDATE agent_profiles SET rating = 0.0 WHERE rating IS NULL;",
        "UPDATE agencies SET bio = 'A trusted real estate agency serving clients with excellence.' WHERE bio IS NULL;",
        "UPDATE agencies SET license_number = CONCAT('RERA-', id, '-2020') WHERE license_number IS NULL;",
        "UPDATE users SET city = 'Mumbai' WHERE city IS NULL AND role = 'AGENT';",
        "UPDATE users SET phone = CONCAT('98200', id::text, '0000') WHERE phone IS NULL;",
        "UPDATE users SET pincode = '400001' WHERE pincode IS NULL;",
    ]
    with open("hotfix.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(hotfix))
    print("HOTFIX SQL written to hotfix.sql (run against existing DB to fill nulls without re-seeding).")


if __name__ == "__main__":
    main()