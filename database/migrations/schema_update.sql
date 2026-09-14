-- URBAN NEST: CLOUDINARY MIGRATION SCHEMA UPDATES
-- Renames columns to more descriptive URL fields for consistency

-- 1. Rename columns in properties table
ALTER TABLE property RENAME COLUMN photos TO property_images;

-- 2. Rename columns in agencies table
ALTER TABLE agencies RENAME COLUMN logo TO logo_url;

-- 3. Rename columns in users table
ALTER TABLE users RENAME COLUMN profile_picture TO profile_picture_url;

-- Optional: Increase column sizes if they were constrained (Cloudinary URLs can be long)
ALTER TABLE property ALTER COLUMN property_images TYPE TEXT;
ALTER TABLE agencies ALTER COLUMN logo_url TYPE TEXT;
ALTER TABLE users ALTER COLUMN profile_picture_url TYPE TEXT;
