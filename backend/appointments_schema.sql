-- =====================================================
-- APPOINTMENT BOOKING SYSTEM
-- =====================================================
-- Add this to your database for appointment scheduling

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    
    -- References
    property_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    
    -- Contact Information
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    
    -- Optional Message
    message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_appointment_property 
        FOREIGN KEY (property_id) 
        REFERENCES property(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_appointment_buyer 
        FOREIGN KEY (buyer_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_appointment_agent 
        FOREIGN KEY (agent_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_property_id 
    ON appointments(property_id);
CREATE INDEX IF NOT EXISTS idx_appointments_buyer_id 
    ON appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id 
    ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date 
    ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status 
    ON appointments(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointment_timestamp ON appointments;
CREATE TRIGGER trigger_update_appointment_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();

-- Verification
SELECT 'Appointments table created successfully' as status;
