-- MASTER RESET & SEED SCRIPT (BASE64 IMAGE STORAGE)
-- Purpose: Wipe all legacy tables and populate with Base64-ready data.

-- 1. DROP ALL LEGACY TABLES (Clean Slate)
DROP TABLE IF EXISTS agent_slots CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS deleted_users CASCADE;
DROP TABLE IF EXISTS pincode_scores CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS property_analytics CASCADE;
DROP TABLE IF EXISTS property_view CASCADE;
DROP TABLE IF EXISTS agent_reviews CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS agent_profiles CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE CORE TABLES
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50),
    profile_picture TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    pincode VARCHAR(10),
    email_verified BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo TEXT, -- Storing Base64 Logo
    license_number VARCHAR(100),
    agency_code VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    admin_user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    agency_id INT REFERENCES agencies(id),
    bio TEXT,
    phone VARCHAR(20),
    experience_years INT,
    average_rating DOUBLE PRECISION DEFAULT 0.0,
    ratings_count INT DEFAULT 0
);

CREATE TABLE property (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(100),
    price DOUBLE PRECISION,
    area DOUBLE PRECISION,
    photos TEXT, -- Storing Base64 JSON Array
    bhk INT,
    bathrooms INT,
    city VARCHAR(100),
    location TEXT,
    pin_code VARCHAR(20),
    agent_id INT REFERENCES users(id),
    purpose VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_sold BOOLEAN DEFAULT FALSE,
    listed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SEED INITIAL DATA (With Base64 Placeholders)
-- Generic House Icon (Base64 Placeholder)
-- Data: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==

INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Skyline Admin', 'admin@skylinerealty.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'ADMIN'),
(2, 'Aryan Sharma', 'aryan@skylinerealty.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'AGENT'),
(3, 'Priya Patel', 'priya@greenvalley.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2', 'AGENT');

INSERT INTO agencies (id, name, agency_code, logo, bio, admin_user_id) VALUES
(1, 'Skyline Realty', 'SKY77', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'Luxury Urban Experts.', 1),
(2, 'Green Valley Homes', 'GVH22', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'Sustainable Estates.', 1);

INSERT INTO agent_profiles (id, user_id, agency_id, bio, experience_years) VALUES
(1, 2, 1, 'Top agent in Mumbai.', 8),
(2, 3, 2, 'Expert in eco-villas.', 5);

INSERT INTO property (id, title, description, price, area, type, purpose, city, location, pin_code, bhk, bathrooms, photos, agent_id) VALUES
(1, 'Skyline 4BHK Penthouse', 'Luxury penthouse with private deck.', 85000000, 2400, 'Apartment', 'Sale', 'Mumbai', 'Worli', '400018', 4, 4, '["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]', 2),
(2, 'Green Valley Eco Villa', 'Spacious 5BHK villa.', 120000000, 4500, 'Villa', 'Sale', 'Bangalore', 'Whitefield', '560066', 5, 5, '["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]', 3),
(3, 'Modern Studio Apartment', 'Perfect for young professionals.', 45000, 550, 'Apartment', 'Rent', 'Mumbai', 'Bandra West', '400050', 1, 1, '["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]', 2);

-- 4. RESET ID SEQUENCES
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('agencies', 'id'), (SELECT MAX(id) FROM agencies));
SELECT setval(pg_get_serial_sequence('agent_profiles', 'id'), (SELECT MAX(id) FROM agent_profiles));
SELECT setval(pg_get_serial_sequence('property', 'id'), (SELECT MAX(id) FROM property));
