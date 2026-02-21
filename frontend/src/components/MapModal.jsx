import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";
import "../styles/Map.css";
import { analyticsApi, propertyApi } from "../api/api";

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

// Dynamic color palettes per mode
const DYNAMIC_PALETTES = {
    price: { title: "💰 Price per sq.ft (₹)", colors: ["#22c55e", "#facc15", "#fb923c", "#dc2626", "#7f1d1d"] },
    inventory: { title: "📦 Inventory Level", colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"] },
    market_activity: { title: "📊 Market Activity", colors: ["#ede9fe", "#c4b5fd", "#a78bfa", "#7c3aed", "#4c1d95"] },
    buyer_opportunity: { title: "🏠 Buyer Opportunity", colors: ["#e0f7fa", "#a5f3fc", "#67e8f9", "#06b6d4", "#0e7490"] },
    demand: { title: "📈 Demand (Agent)", colors: ["#fef9c3", "#fde68a", "#fbbf24", "#d97706", "#92400e"] },
    liquidity: { title: "💧 Liquidity Score", colors: ["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"] },
    saturation: { title: "🔴 Market Saturation", colors: ["#fff1f2", "#fecaca", "#f87171", "#dc2626", "#7f1d1d"] }
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

    // Mini Property Panel State
    const [selectedPincode, setSelectedPincode] = useState(null);
    const [miniProperties, setMiniProperties] = useState([]);
    const [loadingMini, setLoadingMini] = useState(false);

    // Filters
    const [selectedCity, setSelectedCity] = useState("Ahmedabad");
    const [selectedType, setSelectedType] = useState("All");
    const [heatmapMode, setHeatmapMode] = useState("price");

    // Property Types
    const propertyTypes = [
        "All", "Apartment", "Villa", "House", "Penthouse", "Studio", "Plot", "Commercial"
    ];

    // Clear mini-panel when city changes
    useEffect(() => {
        setSelectedPincode(null);
    }, [selectedCity]);

    const currentCity = useMemo(() => cities.find(c => c.name === selectedCity) || cities[0], [selectedCity]);
    const palette = DYNAMIC_PALETTES[heatmapMode] || DYNAMIC_PALETTES.price;

    // Dynamic Bins for heatmap
    const [dynamicBins, setDynamicBins] = useState(null);

    useEffect(() => {
        if (!heatmapData || Object.keys(heatmapData).length === 0) {
            setDynamicBins(null);
            return;
        }

        const values = [];
        Object.values(heatmapData).forEach(data => {
            if (data.activeListings > 10) {
                let val = heatmapMode === 'price' ? data.medianPrice : data.score;
                if (val != null) values.push(val);
            }
        });

        if (values.length === 0) {
            setDynamicBins(null);
            return;
        }

        values.sort((a, b) => a - b);
        const getP = (p) => values[Math.max(0, Math.floor((p / 100) * (values.length - 1)))];

        setDynamicBins([getP(20), getP(40), getP(60), getP(80)]);
    }, [heatmapData, heatmapMode]);

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
            params: { mode: heatmapMode, type: selectedType }
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
    }, [isOpen, selectedCity, heatmapMode, selectedType]);

    const getColor = (feature) => {
        const geoPincode = String(
            feature.properties?.pin_code ||
            feature.properties?.pincode ||
            feature.properties?.PINCODE ||
            ""
        ).trim();

        const data = heatmapData[geoPincode];

        // 1. Handle No Data (0 listings)
        if (!data || data.activeListings === 0 || data.activeListings == null) {
            return "#ffffff"; // White for 0 properties
        }

        // 2. Handle Low Data Threshold (1-10 listings) -> Grey for ALL modes
        if (data.activeListings > 0 && data.activeListings <= 10) {
            return "#9ca3af";
        }

        // 3. Score-based coloring for >10 listings
        let val = heatmapMode === 'price' ? (data.medianPrice ?? null) : (data.score ?? null);
        if (val === null || val === undefined) return "#6b7280";

        if (!dynamicBins) return palette.colors[2];

        const [p20, p40, p60, p80] = dynamicBins;
        if (val <= p20) return palette.colors[0];
        if (val <= p40) return palette.colors[1];
        if (val <= p60) return palette.colors[2];
        if (val <= p80) return palette.colors[3];
        return palette.colors[4];
    };

    // Fetch top 5 properties for mini-panel (sorted by mode)
    const fetchMiniProperties = async (pincode) => {
        if (!pincode) return;
        setLoadingMini(true);
        setSelectedPincode(pincode);
        try {
            const res = await propertyApi.get(`/top?pincode=${pincode}&mode=${heatmapMode}`);
            setMiniProperties(res.data);
        } catch (err) {
            console.error("Failed to fetch mini properties", err);
        } finally {
            setLoadingMini(false);
        }
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
            click: (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map container click
                if (geoPincode) {
                    fetchMiniProperties(geoPincode);
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

                    <div className="filter-divider-vertical"></div>

                    <select
                        className="type-dropdown"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{ minWidth: '120px' }}
                    >
                        {propertyTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
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

                {/* Mini Property Panel (Right Side) */}
                {selectedPincode && (
                    <div className="mini-property-panel">
                        <div className="mini-panel-header">
                            <h3 className="mini-panel-title">Properties in {selectedPincode}</h3>
                            <button className="mini-panel-close" onClick={() => setSelectedPincode(null)}>✕</button>
                        </div>

                        {loadingMini ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                        ) : (
                            <div className="mini-property-list">
                                {miniProperties.length > 0 ? (
                                    miniProperties.map(p => (
                                        <div key={p.id} className="mini-property-card" onClick={() => {
                                            onClose();
                                            navigate(`/property/${p.id}`);
                                        }}>
                                            {/* Decode Base64 image if possible, or use placeholder */}
                                            <img
                                                src={p.photos ? `data:image/jpeg;base64,${p.photos.split(',')[0]}` : "https://via.placeholder.com/80"}
                                                alt="Property"
                                                className="mini-card-img"
                                                onError={(e) => e.target.src = "https://via.placeholder.com/80"}
                                            />
                                            <div className="mini-card-info">
                                                <div className="mini-card-price">₹{p.price.toLocaleString('en-IN')}</div>
                                                <div className="mini-card-title">{p.title}</div>
                                                <div className="mini-card-type">{p.type} • {p.bhk} BHK</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-properties-msg">No properties found in this area.</div>
                                )}
                                <button className="view-all-btn" onClick={() => {
                                    onClose();
                                    navigate(`/properties?pincode=${selectedPincode}`);
                                }}>
                                    View All in this Area ➝
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}

                {/* Legend */}
                <div className="map-legend">
                    <div className="legend-title">{palette.title}</div>
                    <div className="legend-items">
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: "#ffffff", border: "1px solid #ddd" }}></span>
                            <span>0 properties</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: "#9ca3af" }}></span>
                            <span>1-10 properties</span>
                        </div>
                        {dynamicBins ? (
                            [
                                { color: palette.colors[0], label: `< ${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[0] / 1000) + 'K' : Math.round(dynamicBins[0])}` },
                                { color: palette.colors[1], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[0] / 1000) + 'K' : Math.round(dynamicBins[0])}-${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[1] / 1000) + 'K' : Math.round(dynamicBins[1])}` },
                                { color: palette.colors[2], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[1] / 1000) + 'K' : Math.round(dynamicBins[1])}-${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[2] / 1000) + 'K' : Math.round(dynamicBins[2])}` },
                                { color: palette.colors[3], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[2] / 1000) + 'K' : Math.round(dynamicBins[2])}-${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[3] / 1000) + 'K' : Math.round(dynamicBins[3])}` },
                                { color: palette.colors[4], label: `> ${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[3] / 1000) + 'K' : Math.round(dynamicBins[3])}` }
                            ].map((item, i) => (
                                <div key={i} className="legend-item">
                                    <span className="legend-color" style={{ background: item.color }}></span>
                                    <span>{item.label}</span>
                                </div>
                            ))
                        ) : (
                            <div className="legend-item">
                                <span className="legend-color" style={{ background: "#6b7280" }}></span>
                                <span>No data</span>
                            </div>
                        )}
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