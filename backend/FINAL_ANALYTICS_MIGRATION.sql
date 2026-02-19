-- =====================================================
-- INTELLIGENT HEATMAP SYSTEM - COMPLETE DATABASE MIGRATION
-- =====================================================
-- Run this script to add analytics tracking and heatmap scoring
-- to your existing real estate database
--
-- IMPORTANT: This script is idempotent - safe to run multiple times
-- =====================================================

-- =====================================================
-- STEP 1: CREATE PROPERTY ANALYTICS TABLE
-- =====================================================
-- Tracks detailed engagement and timing metrics per property

CREATE TABLE IF NOT EXISTS property_analytics (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL,
    
    -- Engagement Metrics
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    inquiries INT DEFAULT 0,
    
    -- Timing Metrics
    days_on_market INT DEFAULT 0,
    listed_date TIMESTAMP,
    sold_date TIMESTAMP,
    
    -- Price Tracking
    original_price DECIMAL(15, 2),
    current_price DECIMAL(15, 2),
    price_drops INT DEFAULT 0,
    last_price_change_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_property_analytics_property 
        FOREIGN KEY (property_id) 
        REFERENCES property(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_property_analytics UNIQUE(property_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_id 
    ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_days_on_market 
    ON property_analytics(days_on_market);
CREATE INDEX IF NOT EXISTS idx_property_analytics_listed_date 
    ON property_analytics(listed_date);

-- =====================================================
-- STEP 2: CREATE PINCODE SCORES TABLE
-- =====================================================
-- Stores precomputed heatmap scores for each pincode

CREATE TABLE IF NOT EXISTS pincode_scores (
    id BIGSERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    
    -- === BUYER SCORES (0-100) ===
    price_score DECIMAL(5, 2),              -- Relative pricing
    market_activity_score DECIMAL(5, 2),    -- Competition level
    inventory_score DECIMAL(5, 2),          -- Available options
    buyer_opportunity_score DECIMAL(5, 2),  -- Negotiation power
    
    -- === AGENT SCORES (0-100) ===
    demand_score DECIMAL(5, 2),             -- Buyer interest
    liquidity_score DECIMAL(5, 2),          -- Speed of sales
    growth_score DECIMAL(5, 2),             -- Price trends
    saturation_score DECIMAL(5, 2),         -- Competition density
    conversion_score DECIMAL(5, 2),         -- Lead efficiency
    
    -- === RAW METRICS (for transparency/debugging) ===
    active_listings INT DEFAULT 0,
    median_price_per_sqft DECIMAL(10, 2),
    avg_price_per_sqft DECIMAL(10, 2),
    avg_days_on_market DECIMAL(10, 2),
    total_views INT DEFAULT 0,
    total_favorites INT DEFAULT 0,
    total_inquiries INT DEFAULT 0,
    agent_count INT DEFAULT 0,
    
    -- Metadata
    last_computed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_city_pincode UNIQUE(city, pincode)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pincode_scores_city_pincode 
    ON pincode_scores(city, pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_scores_last_computed 
    ON pincode_scores(last_computed);
CREATE INDEX IF NOT EXISTS idx_pincode_scores_city 
    ON pincode_scores(city);

-- =====================================================
-- STEP 3: CREATE PRICE HISTORY TABLE
-- =====================================================
-- Tracks historical price changes for growth analysis

CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    price_per_sqft DECIMAL(10, 2),
    area DECIMAL(10, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_price_history_property 
        FOREIGN KEY (property_id) 
        REFERENCES property(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_history_property_id 
    ON price_history(property_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at 
    ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_property_date 
    ON price_history(property_id, recorded_at DESC);

-- =====================================================
-- STEP 4: ADD ANALYTICS COLUMNS TO PROPERTY TABLE
-- =====================================================
-- Add tracking columns to existing property table

ALTER TABLE property 
    ADD COLUMN IF NOT EXISTS views INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS favorites INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS inquiries INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS listed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_property_city_pincode 
    ON property(city, pin_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_property_active 
    ON property(is_active);
CREATE INDEX IF NOT EXISTS idx_property_listed_date 
    ON property(listed_date);
CREATE INDEX IF NOT EXISTS idx_property_agent_city 
    ON property(agent_id, city) WHERE is_active = true;

-- =====================================================
-- STEP 5: INITIALIZE DATA FOR EXISTING PROPERTIES
-- =====================================================
-- Set listed_date for all existing properties that don't have it

UPDATE property 
SET listed_date = CURRENT_TIMESTAMP 
WHERE listed_date IS NULL AND is_active = true;

-- Backfill property_analytics for existing active properties
INSERT INTO property_analytics (
    property_id, 
    original_price, 
    current_price, 
    listed_date,
    days_on_market
)
SELECT 
    id,
    price,
    price,
    listed_date,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - listed_date))
FROM property
WHERE is_active = true
ON CONFLICT (property_id) DO NOTHING;

-- =====================================================
-- STEP 6: CREATE UTILITY FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to auto-update days_on_market
CREATE OR REPLACE FUNCTION update_days_on_market()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_on_market := EXTRACT(DAY FROM (CURRENT_TIMESTAMP - NEW.listed_date));
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update days_on_market on property_analytics updates
DROP TRIGGER IF EXISTS trigger_update_days_on_market ON property_analytics;
CREATE TRIGGER trigger_update_days_on_market
    BEFORE UPDATE ON property_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_days_on_market();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration was successful

-- Check that all tables were created
SELECT 
    'property_analytics' as table_name, 
    COUNT(*) as row_count 
FROM property_analytics
UNION ALL
SELECT 
    'pincode_scores' as table_name, 
    COUNT(*) as row_count 
FROM pincode_scores
UNION ALL
SELECT 
    'price_history' as table_name, 
    COUNT(*) as row_count 
FROM price_history;

-- Check that property table has new columns
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'property' 
    AND column_name IN ('views', 'favorites', 'inquiries', 'listed_date', 'last_viewed_at')
ORDER BY column_name;

-- Check that all active properties have listed_date
SELECT 
    COUNT(*) as total_active_properties,
    COUNT(listed_date) as properties_with_listed_date,
    COUNT(*) - COUNT(listed_date) as properties_missing_listed_date
FROM property 
WHERE is_active = true;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Restart your backend server
-- 2. Compute initial scores: POST /api/analytics/compute/{city}
-- 3. Test heatmap API: GET /api/analytics/heatmap/{city}?mode=price
-- =====================================================
