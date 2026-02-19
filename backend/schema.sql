-- ============================================================
-- URBAN-NEST DATABASE SCHEMA (PostgreSQL)
-- Run this in pgAdmin, psql, or any PostgreSQL client
-- ============================================================

-- Create the database (run separately if needed):
-- CREATE DATABASE urban_nest;
-- \c urban_nest

-- ============================================================
-- TABLE 1: users
-- Stores both BUYER and AGENT accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255)        NOT NULL,
    email           VARCHAR(255)        NOT NULL UNIQUE,
    password        VARCHAR(255)        NOT NULL,
    role            VARCHAR(20)         NOT NULL DEFAULT 'BUYER',  -- 'BUYER' or 'AGENT'
    profile_picture TEXT,
    city            VARCHAR(100),
    phone           VARCHAR(20),
    pincode         VARCHAR(10),
    -- Agent-only fields (NULL for buyers)
    bio             TEXT,
    agency_name     VARCHAR(255),
    experience      VARCHAR(100),
    specialties     VARCHAR(500)
);

-- ============================================================
-- TABLE 2: property
-- All property listings posted by agents
-- ============================================================
CREATE TABLE IF NOT EXISTS property (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255)        NOT NULL,
    description     TEXT,
    type            VARCHAR(100),                   -- e.g. 'Apartment', 'Villa', 'Plot'
    price           DOUBLE PRECISION    NOT NULL,
    photos          TEXT,                           -- JSON array of base64/URL strings
    area            DOUBLE PRECISION    NOT NULL DEFAULT 0,
    bhk             INTEGER             NOT NULL DEFAULT 0,
    bathrooms       INTEGER             NOT NULL DEFAULT 0,
    balconies       INTEGER             NOT NULL DEFAULT 0,
    floor           VARCHAR(50),
    total_floors    VARCHAR(50),
    facing          VARCHAR(50),
    furnishing      VARCHAR(100),
    age             VARCHAR(50),
    city            VARCHAR(100),
    location        TEXT,
    address         TEXT,
    amenities       TEXT,                           -- Comma-separated or JSON list
    pin_code        VARCHAR(10)         NOT NULL,
    agent_id        BIGINT,
    agent_name      VARCHAR(255),
    agent_email     VARCHAR(255),
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    purpose         VARCHAR(50),                    -- 'For Sale' or 'For Rent'
    is_featured     BOOLEAN             NOT NULL DEFAULT FALSE,
    -- Analytics fields
    views           INTEGER             NOT NULL DEFAULT 0,
    favorites       INTEGER             NOT NULL DEFAULT 0,
    inquiries       INTEGER             NOT NULL DEFAULT 0,
    listed_date     TIMESTAMP,
    last_viewed_at  TIMESTAMP,
    CONSTRAINT fk_property_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 3: favorites
-- Tracks which properties a buyer has saved (max 10 per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT              NOT NULL,
    property_id     BIGINT              NOT NULL,
    saved_date      TIMESTAMP           NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fav_user     FOREIGN KEY (user_id)     REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_fav_property FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    CONSTRAINT uq_fav          UNIQUE (user_id, property_id)
);

-- ============================================================
-- TABLE 4: chat_messages
-- Buyer <-> Agent messaging per property
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    property_id     BIGINT              NOT NULL,
    buyer_id        BIGINT              NOT NULL,
    agent_id        BIGINT              NOT NULL,
    sender          VARCHAR(20)         NOT NULL,   -- 'BUYER' or 'AGENT'
    message         VARCHAR(1000)       NOT NULL,
    created_at      TIMESTAMP           NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chat_property FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_buyer    FOREIGN KEY (buyer_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_chat_agent    FOREIGN KEY (agent_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5: appointments
-- Property viewing appointments booked by buyers
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                  BIGSERIAL PRIMARY KEY,
    property_id         BIGINT              NOT NULL,
    buyer_id            BIGINT              NOT NULL,
    agent_id            BIGINT              NOT NULL,
    appointment_date    DATE                NOT NULL,
    appointment_time    TIME                NOT NULL,
    duration_minutes    INTEGER             NOT NULL DEFAULT 60,
    buyer_name          VARCHAR(255)        NOT NULL,
    buyer_email         VARCHAR(255)        NOT NULL,
    buyer_phone         VARCHAR(20),
    status              VARCHAR(20)         NOT NULL DEFAULT 'pending',  -- pending, confirmed, cancelled, completed
    message             TEXT,
    created_at          TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP           NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_appt_property FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_buyer    FOREIGN KEY (buyer_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_appt_agent    FOREIGN KEY (agent_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: pincode_scores
-- Heatmap analytics scores per city+pincode (auto-computed by backend)
-- ============================================================
CREATE TABLE IF NOT EXISTS pincode_scores (
    id                      BIGSERIAL PRIMARY KEY,
    city                    VARCHAR(100)        NOT NULL,
    pincode                 VARCHAR(10)         NOT NULL,
    -- Buyer scores (0-100)
    price_score             DOUBLE PRECISION,
    market_activity_score   DOUBLE PRECISION,
    inventory_score         DOUBLE PRECISION,
    buyer_opportunity_score DOUBLE PRECISION,
    -- Agent scores (0-100)
    demand_score            DOUBLE PRECISION,
    liquidity_score         DOUBLE PRECISION,
    growth_score            DOUBLE PRECISION,
    saturation_score        DOUBLE PRECISION,
    conversion_score        DOUBLE PRECISION,
    -- Raw metrics
    active_listings         INTEGER             NOT NULL DEFAULT 0,
    median_price_per_sqft   DOUBLE PRECISION,
    avg_price_per_sqft      DOUBLE PRECISION,
    avg_days_on_market      DOUBLE PRECISION,
    total_views             INTEGER             NOT NULL DEFAULT 0,
    total_favorites         INTEGER             NOT NULL DEFAULT 0,
    total_inquiries         INTEGER             NOT NULL DEFAULT 0,
    agent_count             INTEGER             NOT NULL DEFAULT 0,
    last_computed           TIMESTAMP,
    CONSTRAINT uq_pincode_city UNIQUE (city, pincode)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_property_city        ON property(city);
CREATE INDEX IF NOT EXISTS idx_property_pincode     ON property(pin_code);
CREATE INDEX IF NOT EXISTS idx_property_active      ON property(is_active);
CREATE INDEX IF NOT EXISTS idx_property_agent       ON property(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_purpose     ON property(purpose);
CREATE INDEX IF NOT EXISTS idx_chat_property_buyer  ON chat_messages(property_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_appt_buyer           ON appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appt_agent           ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_pincode_city         ON pincode_scores(city);

-- ============================================================
-- DONE
-- ============================================================
