const fs = require('fs');
const path = require('path');
const axios = require('axios');

const IMG_DIR = 'G:\\Users\\HP\\Desktop\\images';
const API_URL = 'http://localhost:8083/api/users/add-property'; // Reusing the add-property endpoint

const images = fs.readdirSync(IMG_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i));

async function migrate() {
    // We'll create 4 properties with 4 images each
    const properties = [
        {
            title: "Luxurious Hillside Mansion",
            type: "Villa",
            price: 45000000,
            area: 4500,
            bhk: 5,
            bathrooms: 4,
            balconies: 3,
            pinCode: "110001",
            city: "New Delhi",
            address: "Hilltop View, Sector 15",
            purpose: "For Sale",
            description: "A stunning luxury home with panoramic views of the hills. Features modern architecture and high-end finishes.",
            agentId: 1, // Placeholder, will try to find real one
            agentName: "Urban Nest Agent",
            agentEmail: "agent@urbannest.com"
        },
        {
            title: "Modern Suburban Home",
            type: "House",
            price: 12500000,
            area: 1800,
            bhk: 3,
            bathrooms: 2,
            balconies: 1,
            pinCode: "400001",
            city: "Mumbai",
            address: "Laurel Way, Bandra West",
            purpose: "For Sale",
            description: "Cozy 3 BHK home in a quiet suburban neighborhood. Perfect for a small family.",
            agentId: 1,
            agentName: "Urban Nest Agent",
            agentEmail: "agent@urbannest.com"
        },
        {
            title: "Premium Heritage Estate",
            type: "Apartment",
            price: 8500000,
            area: 1200,
            bhk: 2,
            bathrooms: 2,
            balconies: 2,
            pinCode: "560001",
            city: "Bangalore",
            address: "Heritage House, Indiranagar",
            purpose: "For Rent",
            description: "Fully furnished 2 BHK apartment in a prime heritage building. Modern amenities included.",
            agentId: 1,
            agentName: "Urban Nest Agent",
            agentEmail: "agent@urbannest.com"
        },
        {
            title: "Downtown Penthouse",
            type: "Penthouse",
            price: 65000000,
            area: 3200,
            bhk: 4,
            bathrooms: 3,
            balconies: 4,
            pinCode: "700001",
            city: "Kolkata",
            address: "Lewiston Sky, Park Street",
            purpose: "For Sale",
            description: "Breathtaking penthouse in the heart of the city. Luxury living at its finest.",
            agentId: 1,
            agentName: "Urban Nest Agent",
            agentEmail: "agent@urbannest.com"
        }
    ];

    for (let i = 0; i < 4; i++) {
        const propImages = images.slice(i * 4, (i + 1) * 4);
        const base64Images = propImages.map(img => {
            const ext = path.extname(img).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            const buffer = fs.readFileSync(path.join(IMG_DIR, img));
            return `data:image/${mime};base64,${buffer.toString('base64')}`;
        });

        const propertyData = {
            ...properties[i],
            photos: base64Images.join(',')
        };

        console.log(`Uploading property ${i + 1}: ${propertyData.title}...`);
        try {
            const resp = await axios.post(API_URL, propertyData);
            console.log(`Success: ${resp.data}`);
        } catch (err) {
            console.error(`Error uploading property ${i + 1}:`, err.response?.data || err.message);
        }
    }
}

migrate();
