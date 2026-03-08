const fs = require('fs');
const path = require('path');

const IMG_DIR = 'G:\\Users\\HP\\Desktop\\images';
const SQL_PATH = 'g:\\Users\\HP\\Downloads\\urban-nest-main (2)\\urban-nest-main\\backend\\migration_v3_added.sql';

const images = fs.readdirSync(IMG_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i));

// Convert all images to base64 once for reuse
const base64List = images.map(img => {
    const ext = path.extname(img).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    const buffer = fs.readFileSync(path.join(IMG_DIR, img));
    return `data:image/${mime};base64,${buffer.toString('base64')}`;
});

const extras = [
    { title: "Azure Coast Villa", type: "Villa", price: 38000000, city: "Chennai", address: "ECR Beach Road", photos: base64List.slice(0, 3).join(',') },
    { title: "Silver Oak Residency", type: "Apartment", price: 7200000, city: "Pune", address: "Koregaon Park", photos: base64List.slice(3, 6).join(',') },
    { title: "Emerald Heights", type: "Penthouse", price: 52000000, city: "Gurgaon", address: "DLF Phase 5", photos: base64List.slice(6, 9).join(',') },
    { title: "Maple Leaf Cottage", type: "House", price: 11000000, city: "Simla", address: "Mall Road", photos: base64List.slice(9, 12).join(',') },
    { title: "Skyline View Studio", type: "Studio", price: 4500000, city: "Hyderabad", address: "Gachibowli", photos: base64List.slice(12, 16).join(',') }
];

let sql = extras.map(p => {
    return `INSERT INTO property (title, type, price, area, bhk, bathrooms, balconies, pin_code, city, address, location, purpose, description, photos, agent_id, agent_name, agent_email, is_active, is_featured, is_sold, listed_date) VALUES ('${p.title}', '${p.type}', ${p.price}, 2000, 3, 2, 2, '000000', '${p.city}', '${p.address}', '{"lat": 0, "lng": 0}', 'For Sale', 'Luxury residence with premium finishes.', '${p.photos}', 1, 'Urban Nest Agent', 'agent@urbannest.com', true, false, false, NOW());`;
}).join('\n');

fs.writeFileSync(SQL_PATH, sql);
console.log('Extra listings generated at:', SQL_PATH);
