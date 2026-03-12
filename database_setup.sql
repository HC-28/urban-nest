
-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50),
    profile_picture TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    pincode VARCHAR(20),
    bio TEXT,
    agency_name VARCHAR(255),
    experience VARCHAR(100),
    specialties VARCHAR(255),
    verified BOOLEAN DEFAULT TRUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    deletion_requested BOOLEAN DEFAULT FALSE NOT NULL,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: property
CREATE TABLE IF NOT EXISTS property (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(100),
    price DOUBLE PRECISION,
    photos TEXT,
    area DOUBLE PRECISION,
    bhk INT,
    bathrooms INT,
    balconies INT,
    floor VARCHAR(50),
    total_floors VARCHAR(50),
    facing VARCHAR(50),
    furnishing VARCHAR(100),
    age VARCHAR(50),
    city VARCHAR(100),
    location TEXT,
    address TEXT,
    amenities TEXT,
    pin_code VARCHAR(50) NOT NULL,
    agent_id BIGINT,
    agent_name VARCHAR(255),
    agent_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    purpose VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    inquiries INT DEFAULT 0,
    listed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP,
    is_sold BOOLEAN DEFAULT FALSE,
    sold_to_user_id BIGINT,
    sold_at TIMESTAMP,
    launch_date VARCHAR(50),
    possession_starts VARCHAR(50),
    rera_id VARCHAR(100),
    video_link TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    slot_id BIGINT,
    confirmation_deadline TIMESTAMP,
    buyer_confirmed VARCHAR(10),
    agent_confirmed VARCHAR(10),
    sold_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Table: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    sender VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    seen BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Table: favorites
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 6. Table: property_view
CREATE TABLE IF NOT EXISTS property_view (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 7. Table: deleted_users
CREATE TABLE IF NOT EXISTS deleted_users (
    id BIGSERIAL PRIMARY KEY,
    original_user_id BIGINT,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50),
    phone VARCHAR(50),
    city VARCHAR(100),
    agency_name VARCHAR(255),
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletion_reason VARCHAR(255),
    deleted_by BIGINT
);

-- 8. Table: agent_slots
CREATE TABLE IF NOT EXISTS agent_slots (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    is_booked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 9. Table: pincode_scores (Heatmap Analytics)
-- IMPORTANT: This table is managed by JPA/Hibernate (ddl-auto=update).
-- The unique constraint is (city, pincode) NOT (pin_code, property_type).
CREATE TABLE IF NOT EXISTS pincode_scores (
    id BIGSERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    -- Buyer Scores (0-100)
    price_score DOUBLE PRECISION DEFAULT 0,
    market_activity_score DOUBLE PRECISION DEFAULT 0,
    inventory_score DOUBLE PRECISION DEFAULT 0,
    buyer_opportunity_score DOUBLE PRECISION DEFAULT 0,

    -- Agent Scores (0-100)
    demand_score DOUBLE PRECISION DEFAULT 0,
    liquidity_score DOUBLE PRECISION DEFAULT 0,
    growth_score DOUBLE PRECISION DEFAULT 0,
    saturation_score DOUBLE PRECISION DEFAULT 0,
    conversion_score DOUBLE PRECISION DEFAULT 0,

    -- Raw Metrics
    active_listings INT DEFAULT 0,
    median_price_per_sqft DOUBLE PRECISION,
    avg_price_per_sqft DOUBLE PRECISION,
    avg_days_on_market DOUBLE PRECISION,
    total_views INT DEFAULT 0,
    total_favorites INT DEFAULT 0,
    total_inquiries INT DEFAULT 0,
    agent_count INT DEFAULT 0,
    last_computed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (city, pincode)
);

-- =========================================================
-- INITIAL DATA SEEDING
-- =========================================================

-- Create a master admin account (Password: password123)
-- Note: Replace with proper BCrypt hash if your backend requires Spring Security encrypted passwords.
INSERT INTO users (name, email, password, role, verified, deletion_requested) 
VALUES ('System Admin', 'admin@urbannest.com', 'password123', 'ADMIN', TRUE, FALSE)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Create a test buyer account
INSERT INTO users (name, email, password, role, verified, deletion_requested) 
VALUES ('John Doe', 'buyer@urbannest.com', 'password123', 'BUYER', TRUE, FALSE)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Create a test agent account
INSERT INTO users (name, email, password, role, city, agency_name, verified, deletion_requested) 
VALUES ('Jane Smith', 'agent@urbannest.com', 'password123', 'AGENT', 'Mumbai', 'Nest Realty', TRUE, FALSE)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Optional: Insert a test property
INSERT INTO property (title, description, type, price, area, bhk, city, pin_code, agent_id, agent_name, agent_email, purpose, is_active, amenities)
VALUES ('Luxury Apartment in Bandra', 'Spacious 3BHK with sea view.', 'Apartment', 25000000, 1500, 3, 'Mumbai', '400050', 3, 'Jane Smith', 'agent@urbannest.com', 'Sale', TRUE, 'WiFi, Gym, Pool, Parking, Security, Balcony');
