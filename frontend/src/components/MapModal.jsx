import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";
import { analyticsApi } from "../api/api";

/* --- Helper to fix the "Blank Map" resize issue --- */
function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') {
                map.invalidateSize();
            }
            if (coords) {
                map.setView(coords);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [map, coords]);
    return null;
}

// City configurations with coordinates and GeoJSON files
const cities = [
    { name: "Ahmedabad", coords: [23.0225, 72.5714], zoom: 12, geoFile: "ahmedabad.geojson" },
    { name: "Mumbai", coords: [19.0760, 72.8777], zoom: 11, geoFile: "mumbai.geojson" },
    { name: "Bangalore", coords: [12.9716, 77.5946], zoom: 11, geoFile: "bangalore.geojson" }
];

// Color scales per mode — each mode gets its own distinct palette
const COLOR_SCALES = {
    price: {
        // Price per sqft: green (cheap) → red (expensive)
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280"; // grey = no data
            if (val > 15000) return "#7f1d1d";
            if (val > 12000) return "#991b1b";
            if (val > 10000) return "#b91c1c";
            if (val > 8000) return "#dc2626";
            if (val > 6000) return "#f97316";
            if (val > 5000) return "#fb923c";
            if (val > 4000) return "#fbbf24";
            if (val > 3000) return "#facc15";
            if (val > 2000) return "#a3e635";
            if (val > 1000) return "#4ade80";
            return "#22c55e";
        },
        legend: [
            { color: "#22c55e", label: "<1K/sqft" },
            { color: "#facc15", label: "3K-5K" },
            { color: "#f97316", label: "6K-8K" },
            { color: "#b91c1c", label: ">10K" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "💰 Price per sq.ft (₹)"
    },
    inventory: {
        // Inventory: blue shades — more listings = deeper blue
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#1e3a8a";
            if (val >= 60) return "#1d4ed8";
            if (val >= 40) return "#3b82f6";
            if (val >= 20) return "#93c5fd";
            return "#dbeafe";
        },
        legend: [
            { color: "#dbeafe", label: "Low (0-20)" },
            { color: "#3b82f6", label: "Med (40-60)" },
            { color: "#1e3a8a", label: "High (80+)" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "📦 Inventory Level"
    },
    market_activity: {
        // Market activity: purple shades
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#4c1d95";
            if (val >= 60) return "#7c3aed";
            if (val >= 40) return "#a78bfa";
            if (val >= 20) return "#c4b5fd";
            return "#ede9fe";
        },
        legend: [
            { color: "#ede9fe", label: "Low" },
            { color: "#a78bfa", label: "Medium" },
            { color: "#4c1d95", label: "High" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "📊 Market Activity"
    },
    buyer_opportunity: {
        // Buyer opportunity: teal/cyan — high = good deal
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#0e7490";
            if (val >= 60) return "#06b6d4";
            if (val >= 40) return "#67e8f9";
            if (val >= 20) return "#a5f3fc";
            return "#e0f7fa";
        },
        legend: [
            { color: "#e0f7fa", label: "Low" },
            { color: "#06b6d4", label: "Medium" },
            { color: "#0e7490", label: "High" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "🏠 Buyer Opportunity"
    },
    demand: {
        // Demand: orange shades — high demand = deep orange
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#92400e";
            if (val >= 60) return "#d97706";
            if (val >= 40) return "#fbbf24";
            if (val >= 20) return "#fde68a";
            return "#fef9c3";
        },
        legend: [
            { color: "#fef9c3", label: "Low" },
            { color: "#fbbf24", label: "Medium" },
            { color: "#92400e", label: "High" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "📈 Demand (Agent)"
    },
    liquidity: {
        // Liquidity: green shades
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#14532d";
            if (val >= 60) return "#16a34a";
            if (val >= 40) return "#4ade80";
            if (val >= 20) return "#bbf7d0";
            return "#f0fdf4";
        },
        legend: [
            { color: "#f0fdf4", label: "Low" },
            { color: "#4ade80", label: "Medium" },
            { color: "#14532d", label: "High" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "💧 Liquidity (Agent)"
    },
    saturation: {
        // Saturation: red shades — high saturation = bad for agents
        getColor: (val) => {
            if (val === null || val === undefined) return "#6b7280";
            if (val >= 80) return "#7f1d1d";
            if (val >= 60) return "#dc2626";
            if (val >= 40) return "#f87171";
            if (val >= 20) return "#fecaca";
            return "#fff1f2";
        },
        legend: [
            { color: "#fff1f2", label: "Low" },
            { color: "#f87171", label: "Medium" },
            { color: "#7f1d1d", label: "High (Saturated)" },
            { color: "#6b7280", label: "No data" },
        ],
        title: "🔴 Market Saturation"
    }
};

/* ======================== USER-FACING SCORE DESCRIPTIONS ======================== */
const SCORE_DESCRIPTIONS = {
    price: {
        title: "💰 Price Index",
        description: "Shows how property prices compare across neighborhoods in the selected city.",
        whyUseful: "Quickly identify affordable areas or premium neighborhoods. Compare price trends across pincodes without browsing hundreds of listings.",
        highScore: "Higher values indicate more expensive areas (price per sq.ft).",
        lowScore: "Lower values indicate more affordable neighborhoods.",
        tip: "Combine with Inventory to find affordable areas that still have plenty of options."
    },
    inventory: {
        title: "📦 Inventory Level",
        description: "Shows how many active property listings are available in each area.",
        whyUseful: "Find areas with plenty of options to choose from, or discover low-supply zones where properties move fast.",
        highScore: "Many properties available — more choices, potentially more negotiating room.",
        lowScore: "Few listings — limited options, but could indicate an exclusive or high-demand area.",
        tip: "Low inventory + high demand often means prices are rising. Great for sellers, challenging for buyers."
    },
    market_activity: {
        title: "🔥 Market Activity",
        description: "Shows how \"hot\" each area is based on buyer interest and engagement.",
        whyUseful: "Understand which neighborhoods are trending. High activity means properties get attention quickly.",
        highScore: "Very active market — properties attract lots of views and inquiries.",
        lowScore: "Quieter market — properties may take longer to sell but could offer better deals.",
        tip: "If you're a buyer, low-activity areas may have hidden gems with less competition."
    },
    buyer_opportunity: {
        title: "🏠 Buyer Opportunity",
        description: "Highlights areas where buyers may have more negotiating power and better deals.",
        whyUseful: "Find neighborhoods where conditions favor buyers — more options, longer listing times, and better value.",
        highScore: "Buyer-friendly market — more properties to choose from and room to negotiate.",
        lowScore: "Seller-friendly market — properties move fast with less room for negotiation.",
        tip: "A high opportunity score doesn't mean low quality — it means the market conditions work in your favor."
    },
    demand: {
        title: "📈 Demand Score",
        description: "Shows which areas have the strongest buyer interest relative to available listings.",
        whyUseful: "Focus your efforts where buyers are actively looking. High demand areas lead to faster closings.",
        highScore: "Strong buyer interest — properties here attract many views and inquiries.",
        lowScore: "Lower buyer engagement — may need more marketing effort to attract interest.",
        tip: "List properties in high-demand areas first. Consider adjusting pricing strategy in low-demand zones."
    },
    liquidity: {
        title: "💧 Liquidity Score",
        description: "Shows how quickly properties tend to move in each area.",
        whyUseful: "Prioritize areas where deals close faster. High liquidity means shorter time from listing to sale.",
        highScore: "Properties sell quickly — fast turnovers and steady deal flow.",
        lowScore: "Slower market — properties may sit longer before finding buyers.",
        tip: "High liquidity areas are ideal for agents who prefer volume over individual deal size."
    },
    saturation: {
        title: "🔴 Market Saturation",
        description: "Shows competition level — how many agents and listings are competing in each area.",
        whyUseful: "Find underserved areas where you can establish yourself before the competition arrives.",
        highScore: "Highly competitive — many agents and listings fighting for the same buyers.",
        lowScore: "Less competition — opportunity to become the go-to agent in this area.",
        tip: "Low saturation + rising demand = golden opportunity. Get in early before others notice."
    }
};

function MapModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const isAgent = user?.role === "AGENT";

    const [geoData, setGeoData] = useState(null);
    const [heatmapData, setHeatmapData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Filters
    const [selectedCity, setSelectedCity] = useState("Ahmedabad");
    const [heatmapMode, setHeatmapMode] = useState("price");

    const currentCity = useMemo(() => cities.find(c => c.name === selectedCity) || cities[0], [selectedCity]);
    const colorScale = COLOR_SCALES[heatmapMode] || COLOR_SCALES.price;

    // Available modes based on user role
    const modes = [
        { value: "price", label: "Price Heatmap" },
        { value: "inventory", label: "Inventory Level" },
        { value: "market_activity", label: "Market Activity" },
        { value: "buyer_opportunity", label: "Buyer Opportunity" },
        ...(isAgent ? [
            { value: "demand", label: "Demand (Agent)" },
            { value: "liquidity", label: "Liquidity (Agent)" },
            { value: "saturation", label: "Market Saturation" }
        ] : [])
    ];

    // Fetch GeoJSON + heatmap data whenever city or mode changes
    useEffect(() => {
        if (!isOpen || !currentCity) return;

        setLoading(true);
        // Clear stale data immediately when city changes
        setGeoData(null);
        setHeatmapData({});

        const fetchGeo = fetch(`/geo/${currentCity.geoFile}`)
            .then(res => {
                if (!res.ok) throw new Error("GeoJSON not found");
                return res.json();
            })
            .then(data => setGeoData(data))
            .catch(err => {
                console.error(`Failed to load GeoJSON for ${currentCity.name}:`, err);
                setGeoData(null);
            });

        // ✅ Use analyticsApi (axios) for consistent CORS handling
        const fetchHeatmap = analyticsApi.get(`/heatmap/${encodeURIComponent(selectedCity)}`, {
            params: { mode: heatmapMode }
        })
            .then(res => {
                const json = res.data;
                // Extract the 'data' array from the response envelope
                const items = Array.isArray(json) ? json : (json.data || []);
                const dataMap = {};
                items.forEach(item => {
                    if (item.pincode) {
                        dataMap[String(item.pincode).trim()] = item;
                    }
                });
                setHeatmapData(dataMap);
            })
            .catch(err => console.error("Heatmap fetch error:", err));

        Promise.all([fetchGeo, fetchHeatmap]).finally(() => setLoading(false));
    }, [isOpen, selectedCity, heatmapMode]);

    const getColor = (feature) => {
        const geoPincode = String(
            feature.properties?.pin_code ||
            feature.properties?.pincode ||
            feature.properties?.PINCODE ||
            ""
        ).trim();

        const data = heatmapData[geoPincode];

        // No data for this pincode → grey
        if (!data) return "#6b7280";

        let val = null;
        if (heatmapMode === 'price') {
            val = data.medianPrice ?? null;
        } else {
            val = data.score ?? null;
        }

        // Score of 0 is valid but treat null/undefined as no-data
        if (val === null || val === undefined) return "#6b7280";

        return colorScale.getColor(val);
    };

    const defaultStyle = (feature) => {
        const color = getColor(feature);
        const geoPincode = String(
            feature.properties?.pin_code ||
            feature.properties?.pincode ||
            feature.properties?.PINCODE ||
            ""
        ).trim();
        const hasData = !!heatmapData[geoPincode];

        return {
            color: "#1e293b",
            weight: 1.5,
            fillColor: color,
            fillOpacity: hasData ? 0.75 : 0.35,
        };
    };

    const onEachFeature = (feature, layer) => {
        const geoPincode = String(
            feature.properties?.pin_code ||
            feature.properties?.pincode ||
            feature.properties?.PINCODE ||
            ""
        ).trim();
        const area = feature.properties?.area_name || feature.properties?.name || "Unknown Area";
        const data = heatmapData[geoPincode];

        const activeListings = data?.activeListings ?? "—";
        const score = data?.score != null ? Math.round(data.score) : "N/A";
        const price = data?.medianPrice != null ? `₹${Math.round(data.medianPrice).toLocaleString('en-IN')}` : "N/A";
        const modeLabel = modes.find(m => m.value === heatmapMode)?.label || heatmapMode;

        layer.bindTooltip(
            `<div style="font-family: 'Inter', sans-serif; padding: 8px 10px; min-width: 160px;">
                <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 14px;">${area}</h4>
                <div style="font-size: 12px; color: #374151; line-height: 1.8;">
                    <strong>Pincode:</strong> ${geoPincode || "—"}<br/>
                    <strong>${modeLabel}:</strong> ${heatmapMode === 'price' ? price + '/sqft' : score}<br/>
                    <strong>Avg Price:</strong> ${price}/sq.ft<br/>
                    <strong>Active Listings:</strong> ${activeListings}
                </div>
                ${!data ? '<div style="color:#9ca3af;font-size:11px;margin-top:4px;">No data available</div>' : ''}
            </div>`,
            { sticky: true, opacity: 1 }
        );

        layer.on({
            mouseover: (e) => {
                e.target.setStyle({ weight: 3, color: "#ffffff", fillOpacity: 0.9 });
                e.target.bringToFront();
            },
            mouseout: (e) => {
                e.target.setStyle(defaultStyle(feature));
            },
            click: () => {
                if (geoPincode) {
                    onClose();
                    navigate(`/properties?pincode=${geoPincode}`);
                }
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="map-modal" onClick={onClose}>
            <div className="map-container" onClick={(e) => e.stopPropagation()}>
                <button className="map-close-btn" onClick={onClose}>Close</button>

                {/* Filter Bar */}
                <div className="map-filter-bar">
                    <select
                        className="type-dropdown city-dropdown"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{ fontWeight: '600', color: '#1e40af' }}
                    >
                        {cities.map((city) => (
                            <option key={city.name} value={city.name}>📍 {city.name}</option>
                        ))}
                    </select>

                    <div className="filter-divider-vertical"></div>

                    <select
                        className="type-dropdown"
                        value={heatmapMode}
                        onChange={(e) => setHeatmapMode(e.target.value)}
                        style={{ minWidth: '160px' }}
                    >
                        {modes.map((mode) => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                    </select>

                    <button
                        className={`info-toggle-btn ${showInfo ? 'active' : ''}`}
                        onClick={() => setShowInfo(!showInfo)}
                        title="What does this score mean?"
                    >
                        ℹ️
                    </button>
                </div>

                {/* Score Info Side Panel */}
                {showInfo && SCORE_DESCRIPTIONS[heatmapMode] && (
                    <div className="score-info-panel">
                        <button className="score-info-close" onClick={() => setShowInfo(false)}>✕</button>
                        <h3 className="score-info-title">{SCORE_DESCRIPTIONS[heatmapMode].title}</h3>
                        <p className="score-info-desc">{SCORE_DESCRIPTIONS[heatmapMode].description}</p>

                        <div className="score-info-section">
                            <h4>Why is this useful?</h4>
                            <p>{SCORE_DESCRIPTIONS[heatmapMode].whyUseful}</p>
                        </div>

                        <div className="score-info-section">
                            <h4>Reading the Map</h4>
                            <div className="score-info-indicator high">
                                <span className="indicator-dot high"></span>
                                <p>{SCORE_DESCRIPTIONS[heatmapMode].highScore}</p>
                            </div>
                            <div className="score-info-indicator low">
                                <span className="indicator-dot low"></span>
                                <p>{SCORE_DESCRIPTIONS[heatmapMode].lowScore}</p>
                            </div>
                        </div>

                        <div className="score-info-tip">
                            <span>💡</span>
                            <p>{SCORE_DESCRIPTIONS[heatmapMode].tip}</p>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="map-legend">
                    <div className="legend-title">{colorScale.title}</div>
                    <div className="legend-items">
                        {colorScale.legend.map((item, i) => (
                            <div key={i} className="legend-item">
                                <span className="legend-color" style={{ background: item.color }}></span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <MapContainer
                    center={currentCity.coords}
                    zoom={currentCity.zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={selectedCity}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />

                    <RecenterMap coords={currentCity.coords} />

                    {geoData && (
                        <GeoJSON
                            key={`geojson-${selectedCity}-${heatmapMode}-${Object.keys(heatmapData).length}`}
                            data={geoData}
                            style={defaultStyle}
                            onEachFeature={onEachFeature}
                        />
                    )}
                </MapContainer>

                {loading && <div className="map-loading">Loading Heatmap Data...</div>}
            </div>
        </div>
    );
}

export default MapModal;