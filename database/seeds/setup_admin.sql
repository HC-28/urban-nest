-- STANDALONE ADMIN SETUP SCRIPT
-- RUN THIS IN YOUR NEON SQL EDITOR

-- 1. Check if the user exists
SELECT id, name, email, role FROM users WHERE email = 'realestateddu@gmail.com';

-- 2. Promote the user to ADMIN role
-- This will give you full access to the Admin Dashboard
UPDATE users 
SET role = 'ADMIN', 
    verified = TRUE, 
    email_verified = TRUE 
WHERE email = 'realestateddu@gmail.com';

-- 3. Verify the change
SELECT id, name, email, role FROM users WHERE email = 'realestateddu@gmail.com';
