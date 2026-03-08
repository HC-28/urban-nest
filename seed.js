// seed.js
async function run() {
    const BASE_URL = "http://localhost:8083/api";
    const DEFAULT_IMAGE = "/placeholder.jpg";

    const PINCODES = {
        "Ahmedabad": ["380009", "380021"],
        "Mumbai": ["400063", "400020"],
        "Bangalore": ["560066", "560022"]
    };

    const agents = [
        { name: "Agent Ahmedabad", email: "agent_ahm@urbannest.com", password: "password123", role: "AGENT", city: "Ahmedabad", agencyName: "Ahm Realty", phone: "9999999991" },
        { name: "Agent Mumbai", email: "agent_mum@urbannest.com", password: "password123", role: "AGENT", city: "Mumbai", agencyName: "Mum Realty", phone: "9999999992" },
        { name: "Agent Bangalore", email: "agent_blr@urbannest.com", password: "password123", role: "AGENT", city: "Bangalore", agencyName: "Blr Realty", phone: "9999999993" }
    ];

    for (let agentData of agents) {
        let city = agentData.city;
        console.log(`Processing ${city}...`);

        try {
            await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(agentData)
            });
        } catch (e) {
            console.log("Could not register (maybe backend is down?):", e.message);
            return;
        }

        let resp = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: agentData.email, password: agentData.password })
        });

        if (!resp.ok) {
            console.log("Login failed for", agentData.email);
            continue;
        }

        let json = await resp.json();
        let token = json.token;
        let agentId = json.id;

        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        let cityPincodes = PINCODES[city];
        for (let i = 0; i < 160; i++) {
            let pincode = cityPincodes[i % cityPincodes.length];
            let purpose = i % 2 === 0 ? "Sale" : "Rent";
            let type = ["Apartment", "Villa", "House", "Penthouse"][i % 4];
            let price = purpose === "Sale" ? (50 + i * 10) * 100000 : (10 + i) * 1000;

            let prop = {
                title: `Beautiful ${type} for ${purpose} in ${city}`,
                description: `A brand new luxury property located in ${city} with great amenities. Complete with spacious rooms, modern architecture, and scenic views.`,
                type: type,
                price: price,
                photos: DEFAULT_IMAGE,
                area: 800 + i * 50,
                bhk: (i % 4) + 1,
                bathrooms: (i % 3) + 1,
                balconies: (i % 3),
                city: city,
                pinCode: pincode,
                location: `Sector ${i + 1}`,
                address: `Plot ${100 + i}, ${city}`,
                agentId: agentId,
                agentName: agentData.name,
                agentEmail: agentData.email,
                purpose: purpose,
                isActive: true,
                furnishing: "Semi-Furnished",
                listedAt: new Date().toISOString()
            };

            let pResp = await fetch(`${BASE_URL}/properties?agentId=${agentId}`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(prop)
            });

            if (pResp.ok) {
                console.log(`Created property ${i + 1} for ${city}`);
            } else {
                let err = await pResp.text();
                console.log(`Failed to create property ${i + 1}: ${pResp.status}`, err);
            }
        }

    }
    console.log("Done seeder.");
}

run();
