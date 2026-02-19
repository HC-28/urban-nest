-- Fix Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);
