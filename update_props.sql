-- Ahmedabad
UPDATE property 
SET pin_code = CASE WHEN id % 2 = 0 THEN '380009' ELSE '380021' END,
    latitude = 23.0225 + (random() * 0.05 - 0.025),
    longitude = 72.5714 + (random() * 0.05 - 0.025)
WHERE city = 'Ahmedabad';

-- Mumbai
UPDATE property 
SET pin_code = CASE WHEN id % 2 = 0 THEN '400063' ELSE '400020' END,
    latitude = 19.0760 + (random() * 0.05 - 0.025),
    longitude = 72.8777 + (random() * 0.05 - 0.025)
WHERE city = 'Mumbai';

-- Bangalore
UPDATE property 
SET pin_code = CASE WHEN id % 2 = 0 THEN '560066' ELSE '560022' END,
    latitude = 12.9716 + (random() * 0.05 - 0.025),
    longitude = 77.5946 + (random() * 0.05 - 0.025)
WHERE city = 'Bangalore';
