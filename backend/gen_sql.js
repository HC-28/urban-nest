const fs = require('fs');
const path = require('path');

const IMG_DIR = 'G:\\Users\\HP\\Desktop\\images';
const SQL_PATH = 'g:\\Users\\HP\\Downloads\\urban-nest-main (2)\\urban-nest-main\\backend\\migration_v2.sql';

const images = fs.readdirSync(IMG_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i));

const properties = [
    {
        title: "Luxurious Hillside Mansion",
        type: "Villa",
        price: 45000000,
        area: 4500,
        bhk: 5,
        bathrooms: 4,
        balconies: 3,
        pin_code: "110001",
        city: "New Delhi",
        address: "Hilltop View, Sector 15",
        location: "{\"lat\": 28.6139, \"lng\": 77.2090}",
        purpose: "For Sale",
        description: "A stunning luxury home with panoramic views of the hills. Features modern architecture and high-end finishes.",
        agent_id: 1,
        agent_name: "Urban Nest Agent",
        agent_email: "agent@urbannest.com",
        amenities: "Parking,Pool,Gym,Security",
        is_active: true,
        is_featured: true,
        is_sold: false
    },
    {
        title: "Modern Suburban Home",
        type: "House",
        price: 12500000,
        area: 1800,
        bhk: 3,
        bathrooms: 2,
        balconies: 1,
        pin_code: "400001",
        city: "Mumbai",
        address: "Laurel Way, Bandra West",
        location: "{\"lat\": 19.0760, \"lng\": 72.8777}",
        purpose: "For Sale",
        description: "Cozy 3 BHK home in a quiet suburban neighborhood. Perfect for a small family.",
        agent_id: 1,
        agent_name: "Urban Nest Agent",
        agent_email: "agent@urbannest.com",
        amenities: "Garden,Power Backup,Security",
        is_active: true,
        is_featured: true,
        is_sold: false
    },
    {
        title: "Premium Heritage Estate",
        type: "Apartment",
        price: 8500000,
        area: 1200,
        bhk: 2,
        bathrooms: 2,
        balconies: 2,
        pin_code: "560001",
        city: "Bangalore",
        address: "Heritage House, Indiranagar",
        location: "{\"lat\": 12.9716, \"lng\": 77.5946}",
        purpose: "For Rent",
        description: "Fully furnished 2 BHK apartment in a prime heritage building. Modern amenities included.",
        agent_id: 1,
        agent_name: "Urban Nest Agent",
        agent_email: "agent@urbannest.com",
        amenities: "Lift,Water Supply,Power Backup",
        is_active: true,
        is_featured: false,
        is_sold: false
    },
    {
        title: "Downtown Penthouse",
        type: "Penthouse",
        price: 65000000,
        area: 3200,
        bhk: 4,
        bathrooms: 3,
        balconies: 4,
        pin_code: "700001",
        city: "Kolkata",
        address: "Lewiston Sky, Park Street",
        location: "{\"lat\": 22.5726, \"lng\": 88.3639}",
        purpose: "For Sale",
        description: "Breathtaking penthouse in the heart of the city. Luxury living at its finest.",
        agent_id: 1,
        agent_name: "Urban Nest Agent",
        agent_email: "agent@urbannest.com",
        amenities: "Terrace Garden,Home Automation,Luxury Lobby",
        is_active: true,
        is_featured: true,
        is_sold: false
    }
];

let sql = `-- Migration SQL generated at ${new Date().toISOString()}\n`;
sql += `DELETE FROM property;\n`;

for (let i = 0; i < 4; i++) {
    const propImages = images.slice(i * 4, (i + 1) * 4);
    const base64Images = propImages.map(img => {
        const ext = path.extname(img).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' ? 'jpeg' : ext;
        const buffer = fs.readFileSync(path.join(IMG_DIR, img));
        return `data:image/${mime};base64,${buffer.toString('base64')}`;
    });

    const p = properties[i];
    const photosString = base64Images.join(',');

    sql += `INSERT INTO property (title, type, price, area, bhk, bathrooms, balconies, pin_code, city, address, location, purpose, description, photos, agent_id, agent_name, agent_email, is_active, is_featured, is_sold, listed_date) VALUES ('${p.title}', '${p.type}', ${p.price}, ${p.area}, ${p.bhk}, ${p.bathrooms}, ${p.balconies}, '${p.pin_code}', '${p.city}', '${p.address}', '${p.location}', '${p.purpose}', '${p.description}', '${photosString}', ${p.agent_id}, '${p.agent_name}', '${p.agent_email}', ${p.is_active}, ${p.is_featured}, ${p.is_sold}, NOW());\n`;
}

fs.writeFileSync(SQL_PATH, sql);
console.log('SQL Migration file generated at:', SQL_PATH);
