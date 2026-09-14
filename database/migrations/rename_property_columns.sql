/* 
   MIGRATION: Rename legacy boolean fields
   Database: MySQL / MariaDB
*/

-- Rename Active status
ALTER TABLE property CHANGE COLUMN is_active active BOOLEAN DEFAULT TRUE;

-- Rename Sold status
ALTER TABLE property CHANGE COLUMN is_sold sold BOOLEAN DEFAULT FALSE;

-- Rename Featured status
ALTER TABLE property CHANGE COLUMN is_featured featured BOOLEAN DEFAULT FALSE;
