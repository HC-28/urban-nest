-- industrial_seed_150_v4.sql
-- PURPOSE: Full production-grade environment seeding with unique images, branding, and clustered projects.
-- CITIES: Mumbai, Ahmedabad, Bangalore (30 Pincodes)
-- AUTHOR: Antigravity AI

-- 1. CLEANUP (Wipe all data to prevent primary key conflicts)
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE agent_slots CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE favorite_properties CASCADE;
TRUNCATE TABLE properties CASCADE;
TRUNCATE TABLE agent_profiles CASCADE;
TRUNCATE TABLE agencies CASCADE;
DELETE FROM users WHERE email NOT IN ('realestateddu@gmail.com');

-- 2. CREATE MASTER AGENCIES (4 unique brands)
INSERT INTO agencies (id, name, agency_code, license_number, bio, status, logo, created_at) VALUES
(1, 'Skyline Elite Living', 'SKY-MUM', 'L-MUM-9988', 'Mumbai premium luxury residences specialist.', 'APPROVED', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=400', NOW()),
(2, 'Green Valley Homes', 'GRN-BLR', 'L-BLR-1122', 'Eco-friendly and sustainable residences in Bangalore.', 'APPROVED', 'https://images.unsplash.com/photo-1542601906970-30f9770cc54b?auto=format&fit=crop&q=80&w=400', NOW()),
(3, 'Heritage Craft Realty', 'HER-AHM', 'L-AHM-4455', 'Preserving tradition with modern Ahmedabad living.', 'APPROVED', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400', NOW()),
(4, 'Urban Nexus Group', 'UBX-IND', 'L-NAT-7700', 'Modern urban apartments across India major hubs.', 'APPROVED', 'https://images.unsplash.com/photo-1449156001433-4069f1043328?auto=format&fit=crop&q=80&w=400', NOW());

-- 3. CREATE AGENTS (10 unique professionals with avatars)
-- Passwords are 'password123' bcrypt'd: $2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG
INSERT INTO users (id, name, email, password, phone, role, city, profile_picture) VALUES
(2, 'Arjun Mehta', 'arjun@skyline.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500001', 'AGENT', 'Mumbai', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'),
(3, 'Priya Sharma', 'priya@skyline.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500002', 'AGENT', 'Mumbai', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
(4, 'Kunal Rao', 'kunal@greenvalley.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500003', 'AGENT', 'Bangalore', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'),
(5, 'Anjali Nair', 'anjali@greenvalley.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500004', 'AGENT', 'Bangalore', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'),
(6, 'Vikram Patel', 'vikram@heritage.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500005', 'AGENT', 'Ahmedabad', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
(7, 'Saira Banu', 'saira@heritage.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500006', 'AGENT', 'Ahmedabad', 'https://images.unsplash.com/photo-1567532939604-b6b5b0ad2f04?auto=format&fit=crop&q=80&w=200'),
(8, 'Rahul Khanna', 'rahul@urbannexus.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500007', 'AGENT', 'Mumbai', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'),
(9, 'Neha Gupta', 'neha@indie.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500008', 'AGENT', 'Ahmedabad', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'),
(10, 'Sam Wilson', 'sam@indie.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500009', 'AGENT', 'Bangalore', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'),
(11, 'Amit Shah', 'amit@corporate.com', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG', '9876500010', 'AGENT', 'Mumbai', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200');

-- 4. LINK AGENTS TO AGENCIES
INSERT INTO agent_profiles (id, user_id, agency_id, status, experience_years) VALUES
(1, 2, 1, 'APPROVED', 8),
(2, 3, 1, 'APPROVED', 5),
(3, 4, 2, 'APPROVED', 12),
(4, 5, 2, 'APPROVED', 4),
(5, 6, 3, 'APPROVED', 15),
(6, 7, 3, 'APPROVED', 6),
(7, 8, 4, 'APPROVED', 3),
(8, 9, NULL, 'APPROVED', 7),
(9, 10, NULL, 'APPROVED', 2),
(10, 11, 4, 'APPROVED', 10);

-- 5. FUNCTION TO GENERATE 150 PROPERTIES
DO $$
DECLARE
    cities TEXT[] := ARRAY['Mumbai', 'Ahmedabad', 'Bangalore'];
    mumbai_pins TEXT[] := ARRAY['400001','400002','400013','400025','400037','400050','400064','400076','400093','400101'];
    ahm_pins TEXT[] := ARRAY['380001','380006','380009','380013','380015','380024','380052','380054','380058','380059'];
    blr_pins TEXT[] := ARRAY['560001','560004','560011','560025','560034','560047','560066','560078','560095','560100'];
    
    -- 50 Unique Architectural Unsplash IDs
    img_ids TEXT[] := ARRAY[
        'photo-1512917774080-9991f1c4c750','photo-1600585154340-be6161a56a0c','photo-1600596542815-ffad4c1539a9',
        'photo-1600607687946-371d2348b030','photo-1600573472591-ee6b68d14c68','photo-1580587767073-bc59432f416c',
        'photo-1613490493576-7fde63acd811','photo-1518780664697-55e3ad937233','photo-1568605114967-8130f3a36994',
        'photo-1570129477492-45c003edd2be','photo-1572120339554-d54a248a733e','photo-1576941089067-2de3c901e126',
        'photo-1598228723793-52759bba239c','photo-1480074568708-e7b720bb3f09','photo-1513584684374-896493a54964',
        'photo-1493663284031-b7e3aefcae8e','photo-1448630360428-6e238896be7f','photo-1512918728675-ed5a9ecdebfd',
        'photo-1564013799919-ab600027ffc6','photo-1600566753190-17f0baa2a6c3','photo-1600585154566-2244a046397c',
        'photo-1600047509807-ba8f99d2cdde','photo-1600566752734-2a0cd63aa68c','photo-1583608205776-bfd35f0d9f83',
        'photo-1505843513577-22bb7d21ef45','photo-1592595825556-980001b0f56a','photo-1575517111478-7f6abb067d53',
        'photo-1515263487990-61b07816b324','photo-1527359443443-84a48abc7df0','photo-1502672260266-1c1ef2d93688',
        'photo-1469022563428-aa04fef9f7a7','photo-1554995207-c18c203602cb','photo-1558036117-15d82a90b9b1',
        'photo-1502005229762-cf1b2da7c5d6','photo-1523217582562-09d0def993a6','photo-1516156008625-3a9d6067fab5',
        'photo-1501183007986-d0d080b147f9','photo-1512915923507-5a1b014bb649','photo-1512915922611-582111d46c4f',
        'photo-1493809842364-78817add7ffb','photo-1531971589569-0d9276fa83eb','photo-1560448204-e02f11c3d0e2',
        'photo-1549517045-bc93de075e53','photo-1449844908441-882981f42c36','photo-1506126613408-eca07ce68773',
        'photo-1448630384428-46238896be7f','photo-1498075199616-015842f1b4c9','photo-1522444195799-478538b28823',
        'photo-1512917774574-e35f8fc316f1','photo-1513584614144-c71c19d45a9a'
    ];
    
    amenities TEXT[] := ARRAY['Gym', 'Swimming Pool', 'Club House', '24x7 Security', 'Covered Parking', 'Intercom', 'Power Backup', 'Landscaped Garden', 'Jogging Track', 'Childrens Play Area'];
    building_names TEXT[] := ARRAY['Skyline Heights', 'Marigold Residency', 'Silver Oak Estates', 'Emerald Tower', 'Phoenix Bay', 'Imperial Square', 'Zenith Park', 'Trishul Residency', 'Ocean Breeze', 'Grand Crest'];
    
    city TEXT;
    pins TEXT[];
    pin TEXT;
    agent_id INT;
    bhk INT;
    price DOUBLE PRECISION;
    area DOUBLE PRECISION;
    prop_type TEXT;
    purpose TEXT;
    photos_url TEXT;
    amenity_str TEXT;
    lat DOUBLE PRECISION;
    lng DOUBLE PRECISION;
    base_lat DOUBLE PRECISION;
    base_lng DOUBLE PRECISION;
    i INT;
    j INT;
    img1 TEXT;
    img2 TEXT;
    img3 TEXT;
BEGIN
    FOR i IN 1..3 LOOP -- For each city
        city := cities[i];
        
        IF city = 'Mumbai' THEN 
            pins := mumbai_pins; base_lat := 19.0760; base_lng := 72.8777;
        ELSIF city = 'Ahmedabad' THEN 
            pins := ahm_pins; base_lat := 23.0225; base_lng := 72.5714;
        ELSE 
            pins := blr_pins; base_lat := 12.9716; base_lng := 77.5946;
        END IF;

        FOR j IN 1..50 LOOP -- 50 properties per city
            -- Cycle through pins
            pin := pins[(j % 10) + 1];
            
            -- Cycle through agents
            agent_id := ((j % 10) + 2); -- 2 to 11
            
            -- Cluster properties into "Projects" every 10 properties
            IF (j % 5) = 1 THEN 
                prop_type := 'Projects';
            ELSE 
                prop_type := ARRAY['Apartment', 'Villa', 'Penthouse', 'Bungalow'][floor(random()*4)+1];
            END IF;
            
            -- Purpose
            purpose := CASE WHEN random() > 0.3 THEN 'Sale' ELSE 'Rent' END;
            
            -- Pricing logic
            bhk := floor(random()*4) + 1;
            area := bhk * (random() * 500 + 400);
            IF city = 'Mumbai' THEN price := area * (random() * 15000 + 20000);
            ELSIF city = 'Bangalore' THEN price := area * (random() * 8000 + 8000);
            ELSE price := area * (random() * 5000 + 5000);
            END IF;
            
            -- Multiple Images (3 per property)
            img1 := 'https://images.unsplash.com/' || img_ids[((i*j)%50)+1] || '?auto=format&fit=crop&q=80&w=1200';
            img2 := 'https://images.unsplash.com/' || img_ids[(((i+1)*j)%50)+1] || '?auto=format&fit=crop&q=80&w=1200';
            img3 := 'https://images.unsplash.com/' || img_ids[(((i+2)*j)%50)+1] || '?auto=format&fit=crop&q=80&w=1200';
            photos_url := '["' || img1 || '", "' || img2 || '", "' || img3 || '"]';
            
            -- Amenities (Clean strings)
            amenity_str := (SELECT string_agg(val, ', ') FROM (SELECT unnest(amenities) ORDER BY random() LIMIT 5) t(val));
            
            -- Jitter lat/lng slightly around pincode areas
            lat := base_lat + (random() - 0.5) * 0.1;
            lng := base_lng + (random() - 0.5) * 0.1;

            INSERT INTO properties (
                title, description, price, area, type, purpose, city, location, address, pin_code, 
                photos, bhk, bathrooms, balconies, floor, total_floors, facing, furnishing, age, 
                amenities, agent_id, featured, sold, latitude, longitude, listed_date, active, views, favorites, inquiries
            ) VALUES (
                building_names[(j % 10) + 1] || (CASE WHEN prop_type = 'Projects' THEN ' Mega Project' ELSE ' Residency' END),
                'Luxury ' || bhk || ' BHK ' || prop_type || ' at ' || building_names[(j%10)+1] || '. Features modern ' || amenity_str || '.',
                price, area, prop_type, purpose, city, 'Sector ' || (j%10), 
                'Flat ' || (100+j) || ', ' || building_names[(j % 10) + 1] || ', ' || city || ' ' || pin,
                pin, photos_url, bhk, bhk, (bhk % 2) + 1, floor(random()*20)+1, floor(random()*30)+1, 
                'East', 'Semi-Furnished', '0-1 Years', 
                amenity_str, agent_id, (random() > 0.8), false, lat, lng, NOW() - (random() * 30 || ' days')::interval, true,
                floor(random()*500), floor(random()*50), floor(random()*10)
            );
        END LOOP;
    END LOOP;
END $$;

-- 6. PROMOTE ADMIN (Ensure specific user is admin)
UPDATE users SET role = 'ADMIN' WHERE email = 'realestateddu@gmail.com';
