-- ==========================================
-- UrbanNest Database Update Script
-- ==========================================

-- 1. Add new columns to 'users' table for Agent details
-- PostgreSQL syntax for conditional column addition

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='agency_name') THEN
        ALTER TABLE users ADD COLUMN agency_name VARCHAR(255) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experience') THEN
        ALTER TABLE users ADD COLUMN experience VARCHAR(100) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='specialties') THEN
        ALTER TABLE users ADD COLUMN specialties TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;
    END IF;
END $$;

-- 2. Ensure 'property' table has correct data types for Map features
-- Ensure price and area are numeric for calculations (PostgreSQL syntax)
ALTER TABLE property ALTER COLUMN price TYPE DOUBLE PRECISION;
ALTER TABLE property ALTER COLUMN area TYPE DOUBLE PRECISION;

-- 3. Update existing AGENT users with dummy data to prevent null errors
UPDATE users 
SET 
    agency_name = COALESCE(agency_name, 'Independent Realty'),
    experience = COALESCE(experience, '3-5 Years'),
    specialties = COALESCE(specialties, 'Residential,Commercial'),
    bio = COALESCE(bio, 'Experienced real estate professional.')
WHERE role = 'AGENT';

-- 4. (Optional) Insert Dummy Agent Data for Testing
-- Uncomment to execute
/*
INSERT INTO users (email, password, name, role, city, phone, agency_name, experience, specialties, bio)
VALUES ('agent@urbannest.com', 'password123', 'Top Agent', 'AGENT', 'Mumbai', '9876543210', 'Urban Realty', '5+ Years', 'Residential,Luxury', 'Top rated agent in Mumbai.');
*/

-- ==========================================
-- End of Script
-- ==========================================
