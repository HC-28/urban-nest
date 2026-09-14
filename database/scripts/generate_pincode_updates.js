const http = require('http');
const fs = require('fs');

http.get('http://localhost:8083/api/properties?size=1000', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const resp = JSON.parse(body);
            // Depending on Pagination or raw array, get the properties array
            const properties = Array.isArray(resp) ? resp : (resp.content ? resp.content : []);
            const geo = JSON.parse(fs.readFileSync('geo_data.json', 'utf8'));

            let sql = '';
            const cityCount = {};

            properties.forEach(p => {
                const city = p.city ? p.city.toLowerCase() : null;
                if (!city || !geo[city] || geo[city].length === 0) return;

                if (cityCount[city] === undefined) cityCount[city] = 0;

                // Cycle through areas for variation
                const areaObj = geo[city][cityCount[city] % geo[city].length];
                cityCount[city]++;

                // Add small jitter
                const lat = areaObj.lat + (Math.random() * 0.01 - 0.005);
                const lng = areaObj.lng + (Math.random() * 0.01 - 0.005);
                const pin = areaObj.pin;
                const loc = areaObj.area.replace(/'/g, "''"); // escape single quotes

                sql += `UPDATE property SET pin_code = '${pin}', location = '${loc}', latitude = ${lat}, longitude = ${lng} WHERE id = ${p.id};\n`;
            });

            fs.writeFileSync('update_pincodes.sql', sql);
            console.log('update_pincodes.sql generated with updates for ' + properties.length + ' properties.');
        } catch (err) {
            console.error(err);
        }
    });
}).on('error', e => console.error(e));
