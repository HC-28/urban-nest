-- FORCE RECREATE FAVORITES TABLE
-- This fixes 500 errors caused by schema mismatch (e.g. wrong column names)

DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_property FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);

-- Verify it works
INSERT INTO favorites (user_id, property_id) 
SELECT u.id, p.id FROM users u, property p LIMIT 1
ON CONFLICT DO NOTHING;

SELECT * FROM favorites;
