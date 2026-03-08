UPDATE property
SET pin_code = '400063',
    location = 'GOREGAON EAST',
    latitude = 19.177806168902624 + (random() * 0.005 - 0.0025),
    longitude = 72.85856454699197 + (random() * 0.005 - 0.0025)
WHERE id IN (
    SELECT id FROM property WHERE city ilike 'Mumbai' LIMIT 7
);

UPDATE property
SET pin_code = '380009',
    location = 'NAVRANGPURA PO',
    latitude = 23.03310143543225 + (random() * 0.005 - 0.0025),
    longitude = 72.55500034489948 + (random() * 0.005 - 0.0025)
WHERE id IN (
    SELECT id FROM property WHERE city ilike 'Ahmedabad' LIMIT 7
);

UPDATE property
SET pin_code = '560095',
    location = 'good koramangla VI Bk 560095',
    latitude =  12.945926969726143 + (random() * 0.005 - 0.0025),
    longitude = 77.61838202391502 + (random() * 0.005 - 0.0025)
WHERE id IN (
    SELECT id FROM property WHERE city ilike 'Bangalore' LIMIT 7
);
