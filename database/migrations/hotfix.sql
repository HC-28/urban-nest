-- HOTFIX: Fix passwords and agent agency_status for existing DB
UPDATE users SET password = '$2b$10$kDQrk6GPIHNcnMQ8Jh/vx.vuaHHkQLO3984BnJbTGsYST4Fpzt.GKy';
UPDATE agent_profiles SET agency_status = 'JOINED' WHERE agency_id IS NOT NULL;
UPDATE agent_profiles SET bio = 'Experienced real estate professional. Specialist in local market trends.'
    WHERE bio IS NULL OR bio = '';
UPDATE agent_profiles SET specialties = 'Residential,Commercial' WHERE specialties IS NULL;
UPDATE agent_profiles SET reviews = 0 WHERE reviews IS NULL;
UPDATE agent_profiles SET rating = 0.0 WHERE rating IS NULL;
UPDATE agencies SET bio = 'A trusted real estate agency serving clients with excellence.' WHERE bio IS NULL;
UPDATE agencies SET license_number = CONCAT('RERA-', id, '-2020') WHERE license_number IS NULL;
UPDATE users SET city = 'Mumbai' WHERE city IS NULL AND role = 'AGENT';
UPDATE users SET phone = CONCAT('98200', id::text, '0000') WHERE phone IS NULL;
UPDATE users SET pincode = '400001' WHERE pincode IS NULL;