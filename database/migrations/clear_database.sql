-- 🛑 SAFE DATABASE WIPE SCRIPT 🛑
-- This script completely DESTROYS all columns and data by dropping the tables,
-- but it DOES NOT drop the schema itself. It gives you a 100% fresh, blank database.

-- Drop all tables you created. CASCADE ensures any foreign keys are ignored.
DROP TABLE IF EXISTS agent_reviews CASCADE;
DROP TABLE IF EXISTS agent_slots CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS property_view CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS deleted_users CASCADE;
DROP TABLE IF EXISTS pincode_scores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop standard Spring Boot sequence tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS property CASCADE;

-- 🚀 STOP HERE! 🚀
-- 1. Run this script in pgAdmin. Your database will now be completely empty.
-- 2. Once it finishes, START YOUR SPRING BOOT BACKEND. 
--    (Spring Boot will see the empty database and recreate the tables with the correct latest columns).
-- 3. Shut down the backend or keep it running.
-- 4. NOW run your 28MB seed data script, AND run the command below to create an Admin:

-- INSERT DEFAULT ADMIN USER (Run this AFTER Spring Boot creates tables)
-- Password is 'admin123'
-- INSERT INTO users (name, email, password, role, is_active, created_at, phone, city) 
-- VALUES ('System Admin', 'admin@urbannest.com', '$2a$10$wXYb2aO87W7S26hWb5l4UObt.Z5B.QeX50A/P7V3d/m9aX65U7mO2', 'ADMIN', true, CURRENT_TIMESTAMP, '+91 9999999999', 'System');
