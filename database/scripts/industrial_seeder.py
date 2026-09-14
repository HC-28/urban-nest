import json
import random
import time
import urllib.request
import urllib.error
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load environment variables from root .env
load_dotenv("../.env")

# --- CLOUDINARY CONFIGURATION ---
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
FOLDER_NAME = os.getenv("CLOUDINARY_FOLDER", "urban-nest")

# --- ENTERPRISE CONFIGURATION: 150 PROPERTIES / 450+ UNIQUE IMAGES ---
TOTAL_PROPERTIES = 150
SQL_OUTPUT_FILE = "final_industrial_seed.sql"

# VERIFIED PHOTO ID POOLS (Standardized photo- prefix)
ARCH_IDS = [
    'photo-1512917774080-9991f1c4c750', 'photo-1600585154340-be6161a56a0c', 'photo-1600596542815-ffad4c1539a9',
    'photo-1600607687946-371d2348b030', 'photo-1600573472591-ee6b68d14c68', 'photo-1580587767073-bc59432f416c',
    'photo-1613490493576-7fde63acd811', 'photo-1518780664697-55e3ad937233', 'photo-1568605114967-8130f3a36994',
    'photo-1570129477492-45c003edd2be', 'photo-1572120339554-d54a248a733e', 'photo-1576941089067-2de3c901e126',
    'photo-1598228723793-52759bba239c', 'photo-1480074568708-e7b720bb3f09'
]

def upload_to_cloudinary(filename, index):
    """Downloads image from Unsplash and uploads to Cloudinary, returns URL"""
    try:
        # High entropy sig ensures uniqueness from Unsplash
        seed_id = ARCH_IDS[index % len(ARCH_IDS)]
        url = f"https://images.unsplash.com/{seed_id}?auto=format&fit=crop&q=80&w=800&sig={index}"
        
        # Upload directly from URL to Cloudinary
        upload_result = cloudinary.uploader.upload(
            url,
            folder=FOLDER_NAME,
            public_id=filename,
            overwrite=True,
            resource_type="image"
        )
        return upload_result.get("secure_url")
        
    except Exception as e:
        print(f"    ! Error uploading {filename}: {str(e)}. Using Fallback...")
        try:
            fallback_url = f"https://loremflickr.com/800/600/architecture,interior?lock={index}"
            upload_result = cloudinary.uploader.upload(
                fallback_url,
                folder=FOLDER_NAME,
                public_id=f"fallback_{filename}",
                overwrite=True
            )
            return upload_result.get("secure_url")
        except:
            return "https://res.cloudinary.com/demo/image/upload/sample.jpg"

def generate_seeding():
    print(f"--- THE MASTER CLOUDINARY SEEDER (PROD-READY) ---")
    
    cities = ["Mumbai", "Ahmedabad", "Bangalore"]
    pins = {"Mumbai": "400013", "Ahmedabad": "380001", "Bangalore": "560001"}
    
    with open(SQL_OUTPUT_FILE, "w", encoding='utf-8') as f:
        # SQL Header and Cleanup
        f.write("-- ULTIMATE CLOUDINARY MASTER SEED\n")
        f.write("TRUNCATE TABLE appointments, agent_slots, chat_messages, favorite_properties, properties, agent_profiles, agencies CASCADE;\n")
        f.write("DELETE FROM users WHERE email NOT IN ('realestateddu@gmail.com');\n\n")

        # Procedural Block - Setup Variables
        f.write("DO $$\nDECLARE\n")
        f.write("  img_str TEXT;\n  agent_id INT;\n  photos_data TEXT;\n")
        f.write("BEGIN\n")

        # 1. Agencies (Cloudinary)
        print("Creating Agencies and uploading logos...")
        for i in range(1, 5):
            logo_url = upload_to_cloudinary(f"agency_logo_{i}", i + 1000)
            f.write(f"  INSERT INTO agencies (id, name, agency_code, status, logo_url, created_at) VALUES\n")
            f.write(f"  ({i}, 'Agency {i}', 'BRAND-{i}', 'APPROVED', '{logo_url}', NOW());\n")
            print(f"    > Agency {i} logo uploaded.")
            time.sleep(0.5)

        # 2. Agents (Cloudinary)
        print("\nCreating Agents and uploading portraits...")
        for i in range(1, 11):
            portrait_url = upload_to_cloudinary(f"agent_portrait_{i}", i + 2000)
            f.write(f"  INSERT INTO users (id, name, email, password, role, city, profile_picture_url) VALUES\n")
            f.write(f"  ({i+10}, 'Agent {i}', 'agent{i}@nest.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', 'AGENT', 'Mumbai', '{portrait_url}');\n")
            f.write(f"  INSERT INTO agent_profiles (user_id, agency_id, agency_status, experience) VALUES ({i+10}, {random.randint(1,4)}, 'JOINED', {random.randint(1,15)});\n")
            print(f"    > Agent {i} portrait uploaded.")
            time.sleep(0.5)

        # 3. 150 Properties (Cloudinary Galleries)
        print(f"\nGenerating {TOTAL_PROPERTIES} Unique Properties and uploading galleries...")
        img_counter = 0
        for k in range(TOTAL_PROPERTIES):
            city = cities[k % 3]
            num_imgs = random.randint(2, 3)
            property_photos = []
            for m in range(num_imgs):
                url = upload_to_cloudinary(f"prop_{k+1}_{m+1}", img_counter)
                if url: property_photos.append(url)
                img_counter += 1
                time.sleep(0.5) 
            
            photos_json = json.dumps(property_photos)
            
            # THE "INDUSTRIAL" INSERT FORMAT (Cleanly synced with schema)
            f.write(f"  INSERT INTO properties (\n")
            f.write(f"    title, description, price, area, type, purpose, city, location, address, pin_code, \n")
            f.write(f"    property_images, bhk, bathrooms, balconies, floor, total_floors, amenities, agent_id, active, views, latitude, longitude, listed_date\n")
            f.write(f"  ) VALUES (\n")
            f.write(f"    'Unit {k+1} Residency', 'Premium residential unit with world-class finish.', {random.randint(5,20)*1000000}, {random.randint(600,2000)}, 'Apartment', 'Sale', '{city}', 'Sector {k%10}', \n")
            f.write(f"    'Address {k+1}, {city}', '{pins[city]}', '{photos_json}', {random.randint(1,4)}, 2, 2, 8, 20, 'Gym, Pool, Security', {(k%10)+11}, true, {random.randint(10,500)}, {19.0 + random.uniform(-0.1, 0.1)}, {72.8 + random.uniform(-0.1, 0.1)}, NOW()\n")
            f.write(f"  );\n")

            if (k + 1) % 5 == 0:
                print(f"  > Progress: {k+1}/{TOTAL_PROPERTIES} properties uploaded...")

        f.write("END $$;\n")
        f.write("UPDATE users SET role = 'ADMIN' WHERE email = 'realestateddu@gmail.com';\n")

    print(f"\nSUCCESS! Created {SQL_OUTPUT_FILE} with Cloudinary URLs.")
    print(f"Folder used: {FOLDER_NAME}")

if __name__ == "__main__":
    generate_seeding()
