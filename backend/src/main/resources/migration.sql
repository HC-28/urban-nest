-- ================================================================
-- Urban Nest: Appointment & Sale Confirmation System Migration
-- Run this script in pgAdmin/SQL tool to sync your database schema.
-- ================================================================

-- 1. Create Agent Slots Table
-- Agents use this to define availability time windows.
CREATE TABLE IF NOT EXISTS agent_slots (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_slot_agent FOREIGN KEY(agent_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_slot_property FOREIGN KEY(property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 2. Update Appointments Table
-- Add fields for the 5-day double-confirmation sale flow.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS slot_id BIGINT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS buyer_confirmed VARCHAR(10);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS agent_confirmed VARCHAR(10);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP;

-- Constraint for slot_id (optional but recommended)
-- ALTER TABLE appointments ADD CONSTRAINT fk_appt_slot FOREIGN KEY(slot_id) REFERENCES agent_slots(id) ON DELETE SET NULL;

-- 3. Update Property Table
-- Add fields to track sold status and buyer identity.
ALTER TABLE property ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS sold_to_user_id BIGINT;
ALTER TABLE property ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP;

-- 4. Set Deletion Policy (Optional)
-- Ensure that when a user is deleted, their appointments and slots are handled.
-- (Existing CASCADE constraints in table definitions handle this).
