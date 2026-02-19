-- =====================================================
-- INTELLIGENT HEATMAP SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This script adds analytics tracking and scoring infrastructure
-- for role-specific heatmap views (Buyers vs Agents)

-- =====================================================
-- 1. PROPERTY ANALYTICS TABLE
-- =====================================================
-- Tracks engagement and timing metrics for each property

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
-- 2. PINCODE SCORES TABLE
-- =====================================================
-- Precomputed scores for each pincode (updated hourly)

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
-- 3. PRICE HISTORY TABLE
-- =====================================================
-- Historical price tracking (daily snapshots)

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
-- 4. MODIFY EXISTING PROPERTY TABLE
-- =====================================================
-- Add analytics tracking columns

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
-- 5. INITIALIZE PROPERTY ANALYTICS
-- =====================================================
-- First, ensure all existing properties have a listed_date
-- This is critical for analytics calculations

-- Set listed_date to CURRENT_TIMESTAMP for properties that don't have it
UPDATE property 
SET listed_date = CURRENT_TIMESTAMP 
WHERE listed_date IS NULL AND is_active = true;

-- Backfill analytics for existing properties
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
    listed_date,  -- Now guaranteed to be non-NULL
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - listed_date))
FROM property
WHERE is_active = true
ON CONFLICT (property_id) DO NOTHING;

-- =====================================================
-- 6. UTILITY FUNCTIONS
-- =====================================================

-- Function to update days_on_market automatically
CREATE OR REPLACE FUNCTION update_days_on_market()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_on_market := EXTRACT(DAY FROM (CURRENT_TIMESTAMP - NEW.listed_date));
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update days_on_market
DROP TRIGGER IF EXISTS trigger_update_days_on_market ON property_analytics;
CREATE TRIGGER trigger_update_days_on_market
    BEFORE UPDATE ON property_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_days_on_market();

-- =====================================================
-- 7. SAMPLE SCORE COMPUTATION QUERY
-- =====================================================
-- This is a template for the batch job that computes scores

-- Example: Compute Price Score for a city
/*
WITH price_stats AS (
    SELECT 
        pin_code,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price/area) as median_price_per_sqft,
        COUNT(*) as listing_count
    FROM property
    WHERE city = 'Mumbai' AND is_active = true AND area > 0
    GROUP BY pin_code
),
city_stats AS (
    SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_price_per_sqft) as city_median
    FROM price_stats
),
normalized AS (
    SELECT 
        ps.pin_code,
        ps.median_price_per_sqft,
        LN(ps.median_price_per_sqft) as log_price,
        MIN(LN(ps.median_price_per_sqft)) OVER () as min_log_price,
        MAX(LN(ps.median_price_per_sqft)) OVER () as max_log_price
    FROM price_stats ps
)
SELECT 
    pin_code,
    median_price_per_sqft,
    ((log_price - min_log_price) / NULLIF(max_log_price - min_log_price, 0)) * 100 as price_score
FROM normalized;
*/

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check property_analytics population
-- SELECT COUNT(*) as total_properties, 
--        COUNT(pa.id) as properties_with_analytics
-- FROM property p
-- LEFT JOIN property_analytics pa ON p.id = pa.property_id
-- WHERE p.is_active = true;

-- Check pincode_scores
-- SELECT * FROM pincode_scores 
-- WHERE city = 'Mumbai' 
-- ORDER BY price_score DESC 
-- LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Implement PincodeScoreService.java for score computation
-- 2. Create scheduled job for hourly updates
-- 3. Add analytics tracking endpoints
-- 4. Update frontend MapModal.jsx with new modes
