-- ============================================================
-- Urban Nest — MNC-Grade Database Schema Upgrade
-- Version: 2.0.0
-- Author: Urban Nest Engineering Team
-- Date: 2026-09-28
-- Description: Production-grade indexes, constraints, views,
--              and audit infrastructure
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fast LIKE searches
CREATE EXTENSION IF NOT EXISTS btree_gin; -- For composite GIN indexes

-- ─── Migration Tracking Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS db_migrations (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(20) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by      VARCHAR(100) DEFAULT CURRENT_USER,
    execution_ms    INTEGER,
    checksum        VARCHAR(64)
);

COMMENT ON TABLE db_migrations IS 'Tracks all database schema migrations for audit and rollback purposes';

-- ─── Record this migration ───────────────────────────────────
INSERT INTO db_migrations (version, description) 
VALUES ('2.0.0', 'MNC-grade schema upgrade: indexes, constraints, views, audit columns')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- SECTION 1: TABLE COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE app_user IS 'Core user accounts table. Supports BUYER, AGENT, and ADMIN roles.';
COMMENT ON TABLE property IS 'Property listings. purpose=(Sale|Rent), type=(Apartment|Villa|Independent House|Projects).';
COMMENT ON TABLE favorite IS 'User-saved/wishlisted properties. Acts as the user watchlist.';
COMMENT ON TABLE pincode_scores IS 'Pre-computed heatmap analytics scores per pincode per city. Refreshed on startup and via scheduled job.';
COMMENT ON TABLE property_view IS 'Unique property view tracking per user for recently-viewed and analytics.';
COMMENT ON TABLE agent_profile IS 'Extended agent profile data — bio, experience, specialization.';
COMMENT ON TABLE agent_slot IS 'Agent availability slots for property visit appointments.';
COMMENT ON TABLE appointment IS 'Property visit appointments between buyers and agents.';
COMMENT ON TABLE chat_message IS 'Chat messages between buyers and agents for specific properties.';
COMMENT ON TABLE agent_review IS 'Reviews and ratings submitted by buyers for agents.';
COMMENT ON TABLE agency IS 'Real estate agency entities that can group multiple agents.';

-- ============================================================
-- SECTION 2: AUDIT COLUMNS
-- Add created_at / updated_at where missing
-- ============================================================

-- property table audit
ALTER TABLE property 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,  -- Soft-delete support
    ADD COLUMN IF NOT EXISTS version    INTEGER NOT NULL DEFAULT 1; -- Optimistic locking

COMMENT ON COLUMN property.deleted_at IS 'Soft delete — NULL means active, non-NULL means logically deleted.';
COMMENT ON COLUMN property.version IS 'Optimistic lock version for concurrent update safety.';

-- app_user table audit  
ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;

COMMENT ON COLUMN app_user.last_login_at IS 'Timestamp of most recent successful login.';

-- favorite table audit
ALTER TABLE favorite
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- appointment table audit
ALTER TABLE appointment
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- chat_message table audit (already has sent_at typically)
ALTER TABLE chat_message
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- pincode_scores audit (already has last_computed)
ALTER TABLE pincode_scores
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================
-- SECTION 3: AUTO-UPDATE TRIGGERS FOR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at() IS 'Trigger function: auto-sets updated_at on every row update.';

-- Apply trigger to property
DROP TRIGGER IF EXISTS trg_property_updated_at ON property;
CREATE TRIGGER trg_property_updated_at
    BEFORE UPDATE ON property
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Apply trigger to app_user
DROP TRIGGER IF EXISTS trg_app_user_updated_at ON app_user;
CREATE TRIGGER trg_app_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Apply trigger to appointment
DROP TRIGGER IF EXISTS trg_appointment_updated_at ON appointment;
CREATE TRIGGER trg_appointment_updated_at
    BEFORE UPDATE ON appointment
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 4: CHECK CONSTRAINTS (Data Integrity)
-- ============================================================

-- Property: price must be positive
ALTER TABLE property 
    DROP CONSTRAINT IF EXISTS chk_property_price_positive;
ALTER TABLE property 
    ADD CONSTRAINT chk_property_price_positive CHECK (price > 0);

-- Property: area must be positive  
ALTER TABLE property 
    DROP CONSTRAINT IF EXISTS chk_property_area_positive;
ALTER TABLE property 
    ADD CONSTRAINT chk_property_area_positive CHECK (area > 0);

-- Property: purpose must be valid
ALTER TABLE property
    DROP CONSTRAINT IF EXISTS chk_property_purpose_valid;
ALTER TABLE property
    ADD CONSTRAINT chk_property_purpose_valid 
    CHECK (purpose IN ('Sale', 'Rent'));

-- Property: type must be valid
ALTER TABLE property
    DROP CONSTRAINT IF EXISTS chk_property_type_valid;
ALTER TABLE property
    ADD CONSTRAINT chk_property_type_valid 
    CHECK (type IN ('Apartment', 'Villa', 'Independent House', 'Projects'));

-- Property: BHK reasonable range
ALTER TABLE property
    DROP CONSTRAINT IF EXISTS chk_property_bhk_range;
ALTER TABLE property
    ADD CONSTRAINT chk_property_bhk_range 
    CHECK (bhk IS NULL OR (bhk >= 1 AND bhk <= 10));

-- Property: latitude/longitude valid ranges
ALTER TABLE property
    DROP CONSTRAINT IF EXISTS chk_property_coords_valid;
ALTER TABLE property
    ADD CONSTRAINT chk_property_coords_valid 
    CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    );

-- Pincode scores: all scores in 0-100 range
ALTER TABLE pincode_scores
    DROP CONSTRAINT IF EXISTS chk_pincode_score_range;
ALTER TABLE pincode_scores
    ADD CONSTRAINT chk_pincode_score_range
    CHECK (
        (price_score IS NULL OR price_score BETWEEN 0 AND 100) AND
        (market_activity_score IS NULL OR market_activity_score BETWEEN 0 AND 100) AND
        (inventory_score IS NULL OR inventory_score BETWEEN 0 AND 100) AND
        (buyer_opportunity_score IS NULL OR buyer_opportunity_score BETWEEN 0 AND 100) AND
        (demand_score IS NULL OR demand_score BETWEEN 0 AND 100) AND
        (liquidity_score IS NULL OR liquidity_score BETWEEN 0 AND 100)
    );

-- app_user: role must be valid
ALTER TABLE app_user
    DROP CONSTRAINT IF EXISTS chk_user_role_valid;
ALTER TABLE app_user
    ADD CONSTRAINT chk_user_role_valid 
    CHECK (role IN ('BUYER', 'AGENT', 'ADMIN'));

-- agent_review: rating must be 1-5
ALTER TABLE agent_review
    DROP CONSTRAINT IF EXISTS chk_agent_review_rating;
ALTER TABLE agent_review
    ADD CONSTRAINT chk_agent_review_rating CHECK (rating BETWEEN 1 AND 5);

-- ============================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================================

-- ─── property table indexes ─────────────────────────────────

-- Primary heatmap query: city + pincode + active + sold
CREATE INDEX IF NOT EXISTS idx_property_city_pincode_active
    ON property (city, pin_code)
    WHERE active = true AND sold = false;
COMMENT ON INDEX idx_property_city_pincode_active IS 'Covers heatmap computation: grouping by city+pincode for active listings';

-- Purpose-filtered heatmap
CREATE INDEX IF NOT EXISTS idx_property_city_purpose_active
    ON property (city, purpose)
    WHERE active = true AND sold = false;

-- Type-filtered heatmap  
CREATE INDEX IF NOT EXISTS idx_property_city_type_active
    ON property (city, type)
    WHERE active = true AND sold = false;

-- Full filtered heatmap (city + purpose + type)
CREATE INDEX IF NOT EXISTS idx_property_heatmap_full
    ON property (city, purpose, type, pin_code)
    WHERE active = true AND sold = false;
COMMENT ON INDEX idx_property_heatmap_full IS 'Covers the most selective heatmap query: city+purpose+type+pincode';

-- Agent properties lookup
CREATE INDEX IF NOT EXISTS idx_property_agent_id
    ON property (agent_id);

-- Featured properties
CREATE INDEX IF NOT EXISTS idx_property_featured
    ON property (featured)
    WHERE featured = true AND active = true AND sold = false;

-- Recently listed
CREATE INDEX IF NOT EXISTS idx_property_listed_date
    ON property (listed_date DESC)
    WHERE active = true AND sold = false;

-- Most viewed (trending)
CREATE INDEX IF NOT EXISTS idx_property_views_desc
    ON property (views DESC)
    WHERE active = true AND sold = false;

-- Price range queries  
CREATE INDEX IF NOT EXISTS idx_property_price
    ON property (price)
    WHERE active = true AND sold = false;

-- Pin code lookup (mini property panel)
CREATE INDEX IF NOT EXISTS idx_property_pincode
    ON property (pin_code)
    WHERE active = true AND sold = false;

-- Full-text search on title + location
CREATE INDEX IF NOT EXISTS idx_property_title_fts
    ON property USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(city, '')));
COMMENT ON INDEX idx_property_title_fts IS 'Full-text search index for property title, location, and city';

-- ─── pincode_scores table indexes ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_pincode_scores_city
    ON pincode_scores (city);

-- Already has unique constraint on (city, pincode) — that's the primary lookup
-- Add index for last_computed to find stale scores
CREATE INDEX IF NOT EXISTS idx_pincode_scores_last_computed
    ON pincode_scores (last_computed);

-- ─── favorite table indexes ──────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_user_property_unique
    ON favorite (user_id, property_id);
COMMENT ON INDEX idx_favorite_user_property_unique IS 'Prevents duplicate favorites; used by favoritesApi.checkStatus';

CREATE INDEX IF NOT EXISTS idx_favorite_user_id
    ON favorite (user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_property_id
    ON favorite (property_id);

-- ─── property_view table indexes ─────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_view_user_property_unique
    ON property_view (user_id, property_id);

CREATE INDEX IF NOT EXISTS idx_property_view_user_viewed_at
    ON property_view (user_id, viewed_at DESC);
COMMENT ON INDEX idx_property_view_user_viewed_at IS 'Covers recently-viewed query for Home page';

-- ─── appointment table indexes ───────────────────────────────

CREATE INDEX IF NOT EXISTS idx_appointment_status_deadline
    ON appointment (status, confirmation_deadline)
    WHERE status = 'awaiting_buyer';
COMMENT ON INDEX idx_appointment_status_deadline IS 'Covers the hourly scheduled cleanup job for expired appointments';

CREATE INDEX IF NOT EXISTS idx_appointment_buyer_id
    ON appointment (buyer_id);

CREATE INDEX IF NOT EXISTS idx_appointment_agent_id  
    ON appointment (agent_id);

-- ─── chat_message table indexes ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_chat_message_property_id
    ON chat_message (property_id);

CREATE INDEX IF NOT EXISTS idx_chat_message_sender_receiver
    ON chat_message (sender_id, receiver_id);

-- ─── agent_review table indexes ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agent_review_agent_id
    ON agent_review (agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_review_reviewer_agent
    ON agent_review (reviewer_id, agent_id);

-- ─── app_user table indexes ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_app_user_email
    ON app_user (email);

CREATE INDEX IF NOT EXISTS idx_app_user_role
    ON app_user (role);

-- ─── agent_slot table indexes ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agent_slot_agent_id
    ON agent_slot (agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_slot_available
    ON agent_slot (agent_id, booked)
    WHERE booked = false;

-- ============================================================
-- SECTION 6: DATABASE VIEWS (Common Query Patterns)
-- ============================================================

-- View: Active Property Listings (used everywhere)
CREATE OR REPLACE VIEW vw_active_properties AS
SELECT 
    p.*,
    u.name        AS agent_name,
    u.email       AS agent_email,
    u.phone       AS agent_phone
FROM property p
JOIN app_user u ON u.id = p.agent_id
WHERE (p.active = true OR p.active IS NULL)
  AND (p.sold = false OR p.sold IS NULL)
  AND p.deleted_at IS NULL;

COMMENT ON VIEW vw_active_properties IS 'All active, unsold, non-deleted properties with agent info. Use this for all listing queries.';

-- View: City Property Stats (for Home page city counts — replaces hardcoded numbers)
CREATE OR REPLACE VIEW vw_city_stats AS
SELECT
    city,
    COUNT(*)                                                    AS total_listings,
    COUNT(*) FILTER (WHERE purpose = 'Sale')                    AS sale_listings,
    COUNT(*) FILTER (WHERE purpose = 'Rent')                    AS rent_listings,
    ROUND(AVG(price)::numeric, 0)                               AS avg_price,
    ROUND(AVG(CASE WHEN area > 0 THEN price / area END)::numeric, 0) AS avg_price_per_sqft,
    MIN(price)                                                  AS min_price,
    MAX(price)                                                  AS max_price,
    SUM(views)                                                  AS total_views,
    MAX(listed_date)                                            AS latest_listing_date
FROM property
WHERE (active = true OR active IS NULL)
  AND (sold = false OR sold IS NULL)
  AND deleted_at IS NULL
GROUP BY city;

COMMENT ON VIEW vw_city_stats IS 'Real-time city-level statistics. Use GET /api/analytics/city-stats to replace hardcoded counts on Home page.';

-- View: Heatmap Summary Per Pincode
CREATE OR REPLACE VIEW vw_heatmap_summary AS
SELECT
    p.city,
    p.pin_code                                                      AS pincode,
    COUNT(*)                                                        AS active_listings,
    ROUND(AVG(CASE WHEN p.area > 0 THEN p.price / p.area END)::numeric, 2)  AS avg_price_per_sqft,
    PERCENTILE_CONT(0.5) WITHIN GROUP 
        (ORDER BY CASE WHEN p.area > 0 THEN p.price / p.area END)  AS median_price_per_sqft,
    SUM(p.views)                                                    AS total_views,
    SUM(p.favorites)                                                AS total_favorites,
    SUM(p.inquiries)                                                AS total_inquiries,
    ROUND(AVG(EXTRACT(DAY FROM NOW() - p.listed_date))::numeric, 1) AS avg_days_on_market
FROM property p
WHERE (p.active = true OR p.active IS NULL)
  AND (p.sold = false OR p.sold IS NULL)
  AND p.pin_code IS NOT NULL
  AND p.deleted_at IS NULL
GROUP BY p.city, p.pin_code
HAVING COUNT(*) >= 5;  -- Enforce minimum 5 listings per HEATMAP.md spec

COMMENT ON VIEW vw_heatmap_summary IS 'Live heatmap data per pincode. HAVING COUNT(*) >= 5 enforces the documented minimum threshold.';

-- View: Agent Performance Dashboard
CREATE OR REPLACE VIEW vw_agent_performance AS
SELECT
    u.id                                                AS agent_id,
    u.name                                              AS agent_name,
    u.email                                             AS agent_email,
    COUNT(p.id)                                         AS total_listings,
    COUNT(p.id) FILTER (WHERE p.sold = true)            AS sold_count,
    COUNT(p.id) FILTER (WHERE p.active = true AND p.sold = false) AS active_listings,
    ROUND(AVG(ar.rating)::numeric, 2)                   AS avg_rating,
    COUNT(ar.id)                                        AS review_count,
    SUM(p.views)                                        AS total_views,
    SUM(p.favorites)                                    AS total_favorites,
    SUM(p.inquiries)                                    AS total_inquiries
FROM app_user u
LEFT JOIN property p ON p.agent_id = u.id
LEFT JOIN agent_review ar ON ar.agent_id = u.id
WHERE u.role IN ('AGENT')
GROUP BY u.id, u.name, u.email;

COMMENT ON VIEW vw_agent_performance IS 'Agent KPI dashboard — listing count, sales, ratings, engagement metrics.';

-- View: Recently Viewed Properties Per User (for Home page)
CREATE OR REPLACE VIEW vw_user_recently_viewed AS
SELECT
    pv.user_id,
    pv.property_id,
    pv.viewed_at,
    p.title,
    p.price,
    p.city,
    p.type,
    p.purpose,
    p.bhk
FROM property_view pv
JOIN property p ON p.id = pv.property_id
WHERE (p.active = true OR p.active IS NULL)
  AND (p.sold = false OR p.sold IS NULL)
ORDER BY pv.viewed_at DESC;

COMMENT ON VIEW vw_user_recently_viewed IS 'Recently viewed active properties per user, newest first.';

-- ============================================================
-- SECTION 7: SCHEDULED HEATMAP REFRESH SUPPORT
-- Add last_refresh_requested column so backend can track async refreshes
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_jobs (
    id              SERIAL PRIMARY KEY,
    job_type        VARCHAR(50) NOT NULL,
    city            VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    triggered_by    VARCHAR(100)
);

COMMENT ON TABLE analytics_jobs IS 'Job queue for async heatmap score recomputation. Prevents synchronous blocking on GET requests.';

CREATE INDEX IF NOT EXISTS idx_analytics_jobs_status 
    ON analytics_jobs (status, requested_at);

-- ============================================================
-- SECTION 8: VERIFY MIGRATION
-- ============================================================

-- Show all created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify all views
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE 'vw_%'
ORDER BY viewname;

SELECT 'Migration 2.0.0 applied successfully!' AS status;
