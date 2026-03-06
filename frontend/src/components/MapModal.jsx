import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";
import { analyticsApi, propertyApi } from "../api/api";
import { parsePropertyImages } from "../utils/imageUtils";
import { formatPrice } from "../utils/priceUtils";

/* ── Helper to fix the "Blank Map" resize issue ── */
function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') map.invalidateSize();
            if (coords) map.setView(coords);
        }, 300);
        return () => clearTimeout(timer);
    }, [map, coords]);
    return null;
}

/* ── Cities ── */
const cities = [
    { name: "Ahmedabad", coords: [23.0225, 72.5714], zoom: 12, geoFile: "ahmedabad.geojson" },
    { name: "Mumbai", coords: [19.0760, 72.8777], zoom: 11, geoFile: "mumbai.geojson" },
    { name: "Bangalore", coords: [12.9716, 77.5946], zoom: 11, geoFile: "bangalore.geojson" }
];

/* ── Color palettes ── */
const DYNAMIC_PALETTES = {
    price: { title: "Price per sq.ft (₹)", colors: ["#22c55e", "#facc15", "#fb923c", "#dc2626", "#7f1d1d"] },
    inventory: { title: "Inventory Level", colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"] },
    market_activity: { title: "Market Activity", colors: ["#ede9fe", "#c4b5fd", "#a78bfa", "#7c3aed", "#4c1d95"] },
    buyer_opportunity: { title: "Buyer Opportunity", colors: ["#e0f7fa", "#a5f3fc", "#67e8f9", "#06b6d4", "#0e7490"] },
    demand: { title: "Demand (Agent)", colors: ["#fef9c3", "#fde68a", "#fbbf24", "#d97706", "#92400e"] },
    liquidity: { title: "Liquidity Score", colors: ["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"] },
    saturation: { title: "Market Saturation", colors: ["#fff1f2", "#fecaca", "#f87171", "#dc2626", "#7f1d1d"] }
};

/* ── Score info descriptions ── */
const SCORE_DESCRIPTIONS = {
    price: {
        title: "💰 Price Index",
        description: "This heatmap shows the median price per square foot across different neighborhoods. Darker or warmer colors indicate higher-priced areas, while lighter or cooler colors indicate more affordable zones. Click on any area to see actual property listings and their prices. This helps you quickly identify which neighborhoods fit your budget and compare value across the city.",
        tip: "Pro Tip: Compare this with the Inventory view — areas with low prices AND high inventory often mean great deals with room to negotiate. Areas with high prices but low inventory suggest premium, in-demand neighborhoods."
    },
    inventory: {
        title: "📦 Inventory Level",
        description: "This view shows how many active property listings are currently available in each area. More listings mean more choices for buyers and potentially more room to negotiate. Fewer listings suggest a tighter market where properties may sell faster. Use this to find neighborhoods where you'll have the most options to choose from.",
        tip: "Pro Tip: Low inventory + high demand (check Activity view) usually means prices are rising and you'll face competition. High inventory areas give you leverage to negotiate better deals. If you're a first-time buyer, start with high-inventory areas."
    },
    market_activity: {
        title: "🔥 Market Activity",
        description: "This heatmap reveals how 'hot' each neighborhood is based on buyer engagement — including property views, inquiries, favorites, and appointment requests. Areas glowing with warm colors are attracting the most attention from buyers. Cooler areas have less competition, which could mean either hidden opportunities or lower demand.",
        tip: "Pro Tip: High activity = more competition and potentially bidding wars. Low-activity areas may have hidden gems where you can take your time and negotiate. Check why an area is quiet — it could be an upcoming neighborhood that hasn't been discovered yet."
    },
    buyer_opportunity: {
        title: "🏠 Buyer Opportunity",
        description: "This smart index combines multiple factors — price trends, inventory levels, demand, and market activity — to highlight areas where buyers currently have the upper hand. High opportunity scores mean favorable conditions: reasonable prices, good inventory, and manageable competition. Low scores suggest seller-friendly markets.",
        tip: "Pro Tip: This is the best starting point for first-time buyers! Focus on neighborhoods with high opportunity scores for the best chance of finding a good deal. These areas offer the ideal mix of affordability, choice, and negotiation power."
    },
    demand: {
        title: "📈 Demand Score (Agent View)",
        description: "Designed for agents and sellers, this view shows where buyer demand is strongest relative to available listings. High-demand areas have more interested buyers than available properties — ideal for sellers looking to list. As an agent, this helps you advise clients on pricing strategy and identify the hottest markets.",
        tip: "Pro Tip: List properties in high-demand areas with competitive pricing for the fastest sales. In low-demand areas, focus on unique selling points and consider pricing slightly below market to attract attention."
    },
    liquidity: {
        title: "💧 Liquidity Score (Agent View)",
        description: "This shows how quickly properties tend to sell in each neighborhood. High liquidity means properties move fast — listings don't stay on the market long. Low liquidity indicates slower sales cycles where properties take longer to find buyers. This is crucial for setting realistic expectations with sellers about timeline.",
        tip: "Pro Tip: High liquidity areas are great for quick flips and investment properties. Low liquidity areas may require longer marketing periods but often have better margins for patient investors or buyers willing to wait."
    },
    saturation: {
        title: "🔴 Market Saturation (Agent View)",
        description: "This reveals the competition level among agents and listings in each area. Highly saturated areas have many agents competing for buyers, making it harder to stand out. Low saturation means less competition, giving you a better chance to capture market share and attract clients.",
        tip: "Pro Tip: The golden opportunity is low saturation + rising demand — you can establish yourself as the go-to agent before competition increases. Avoid highly saturated areas unless you have a strong unique value proposition."
    }
};

/* ── Map Tile Layers ── */
const TILE_LAYERS = {
    dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", label: "Dark" },
    light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", label: "Light" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", label: "Satellite" }
};

/* ════════════════════════════════════════
   MAP MODAL COMPONENT
   ════════════════════════════════════════ */
function MapModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const isAgent = user?.role === "AGENT" || user?.role === "ADMIN";

    const [geoData, setGeoData] = useState(null);
    const [heatmapData, setHeatmapData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Mini Property Panel
    const [selectedPincode, setSelectedPincode] = useState(null);
    const [miniProperties, setMiniProperties] = useState([]);
    const [loadingMini, setLoadingMini] = useState(false);

    // Filters
    const [selectedCity, setSelectedCity] = useState("Ahmedabad");
    const [selectedType, setSelectedType] = useState("Apartment");
    const [heatmapMode, setHeatmapMode] = useState("price");

    // Map style
    const [tileLayer, setTileLayer] = useState("dark");

    // Property Pins Toggle
    const [showPins, setShowPins] = useState(false);
    const [allProperties, setAllProperties] = useState([]);
    const [loadingPins, setLoadingPins] = useState(false);

    // Legend collapsed state
    const [legendOpen, setLegendOpen] = useState(true);

    const propertyTypes = ["Apartment", "Villa", "House", "Penthouse", "Studio", "Plot", "Commercial"];

    useEffect(() => { setSelectedPincode(null); }, [selectedCity]);

    const currentCity = useMemo(() => cities.find(c => c.name === selectedCity) || cities[0], [selectedCity]);
    const palette = DYNAMIC_PALETTES[heatmapMode] || DYNAMIC_PALETTES.price;

    // Dynamic bins
    const [dynamicBins, setDynamicBins] = useState(null);

    useEffect(() => {
        if (!heatmapData || Object.keys(heatmapData).length === 0) { setDynamicBins(null); return; }
        const values = [];
        Object.values(heatmapData).forEach(data => {
            if (data.activeListings > 10) {
                let val = heatmapMode === 'price' ? data.medianPrice : data.score;
                if (val != null) values.push(val);
            }
        });
        if (values.length === 0) { setDynamicBins(null); return; }
        values.sort((a, b) => a - b);
        const getP = (p) => values[Math.max(0, Math.floor((p / 100) * (values.length - 1)))];
        setDynamicBins([getP(20), getP(40), getP(60), getP(80)]);
    }, [heatmapData, heatmapMode]);

    // Modes
    const modes = [
        { value: "price", label: "Price Heatmap", icon: "💰" },
        { value: "inventory", label: "Inventory", icon: "📦" },
        { value: "market_activity", label: "Activity", icon: "🔥" },
        { value: "buyer_opportunity", label: "Opportunity", icon: "🏠" },
        ...(isAgent ? [
            { value: "demand", label: "Demand", icon: "📈" },
            { value: "liquidity", label: "Liquidity", icon: "💧" },
            { value: "saturation", label: "Saturation", icon: "🔴" }
        ] : [])
    ];

    // Fetch GeoJSON + heatmap
    useEffect(() => {
        if (!isOpen || !currentCity) return;
        setLoading(true);
        setGeoData(null);
        setHeatmapData({});

        const fetchGeo = fetch(`/geo/${currentCity.geoFile}`)
            .then(res => { if (!res.ok) throw new Error("GeoJSON not found"); return res.json(); })
            .then(data => setGeoData(data))
            .catch(err => { console.error(`Failed to load GeoJSON for ${currentCity.name}:`, err); setGeoData(null); });

        const fetchHeatmap = analyticsApi.get(`/heatmap/${encodeURIComponent(selectedCity)}`, {
            params: { mode: heatmapMode, type: selectedType }
        })
            .then(res => {
                const json = res.data;
                const items = Array.isArray(json) ? json : (json.data || []);
                const dataMap = {};
                items.forEach(item => { if (item.pincode) dataMap[String(item.pincode).trim()] = item; });
                setHeatmapData(dataMap);
            })
            .catch(err => console.error("Heatmap fetch error:", err));

        Promise.all([fetchGeo, fetchHeatmap]).finally(() => setLoading(false));
    }, [isOpen, selectedCity, heatmapMode, selectedType]);

    // Fetch property pins when toggle is on
    useEffect(() => {
        if (!showPins || !isOpen) { setAllProperties([]); return; }
        setLoadingPins(true);
        propertyApi.get(`/`, { params: { city: selectedCity } })
            .then(res => setAllProperties(res.data || []))
            .catch(() => setAllProperties([]))
            .finally(() => setLoadingPins(false));
    }, [showPins, selectedCity, isOpen]);

    // Color logic
    const getColor = (feature) => {
        const geoPincode = String(feature.properties?.pin_code || feature.properties?.pincode || feature.properties?.PINCODE || "").trim();
        const data = heatmapData[geoPincode];
        if (!data || data.activeListings === 0 || data.activeListings == null) return "#ffffff";
        if (data.activeListings > 0 && data.activeListings <= 10) return "#9ca3af";
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

    // Fetch mini properties
    const fetchMiniProperties = async (pincode) => {
        if (!pincode) return;
        setLoadingMini(true);
        setSelectedPincode(pincode);
        try {
            const res = await propertyApi.get(`/top?pincode=${pincode}&mode=${heatmapMode}`);
            setMiniProperties(res.data);
        } catch { console.error("Failed to fetch mini properties"); }
        finally { setLoadingMini(false); }
    };

    const defaultStyle = (feature) => {
        const color = getColor(feature);
        const geoPincode = String(feature.properties?.pin_code || feature.properties?.pincode || feature.properties?.PINCODE || "").trim();
        const hasData = !!heatmapData[geoPincode];
        return { color: "#1e293b", weight: 1.5, fillColor: color, fillOpacity: hasData ? 0.7 : 0.3 };
    };

    const onEachFeature = (feature, layer) => {
        const geoPincode = String(feature.properties?.pin_code || feature.properties?.pincode || feature.properties?.PINCODE || "").trim();
        const area = feature.properties?.area_name || feature.properties?.name || "Unknown Area";
        const data = heatmapData[geoPincode];
        const activeListings = data?.activeListings ?? "—";
        const score = data?.score != null ? Math.round(data.score) : "N/A";
        const price = data?.medianPrice != null ? `₹${Math.round(data.medianPrice).toLocaleString('en-IN')}` : "N/A";

        layer.bindTooltip(
            `<div style="font-family:'Inter',sans-serif;padding:8px 10px;min-width:160px;">
                <h4 style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:700;">${area}</h4>
                <div style="font-size:12px;color:#374151;line-height:1.8;">
                    <strong>Pincode:</strong> ${geoPincode || "—"}<br/>
                    <strong>Avg Price:</strong> ${price}/sq.ft<br/>
                    <strong>Active Listings:</strong> ${activeListings}
                </div>
                ${!data ? '<div style="color:#9ca3af;font-size:11px;margin-top:4px;">No data available</div>' : ''}
            </div>`,
            { sticky: true, opacity: 1 }
        );

        layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 3, color: "#ffffff", fillOpacity: 0.9 }); e.target.bringToFront(); },
            mouseout: (e) => { e.target.setStyle(defaultStyle(feature)); },
            click: (e) => { L.DomEvent.stopPropagation(e); if (geoPincode) fetchMiniProperties(geoPincode); },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="map-modal" onClick={onClose}>
            <div className="map-container" onClick={(e) => e.stopPropagation()}>

                {/* ─── Top Toolbar ─── */}
                <div className="map-toolbar">
                    <div className="toolbar-left">
                        {/* City pills */}
                        <div className="city-pills">
                            {cities.map(city => (
                                <button
                                    key={city.name}
                                    className={`city-pill ${selectedCity === city.name ? "active" : ""}`}
                                    onClick={() => setSelectedCity(city.name)}
                                >
                                    📍 {city.name}
                                </button>
                            ))}
                        </div>

                        <div className="toolbar-divider" />

                        {/* Mode selector */}
                        <select className="toolbar-select" value={heatmapMode} onChange={(e) => setHeatmapMode(e.target.value)}>
                            {modes.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                        </select>

                        <div className="toolbar-divider" />

                        {/* Type selector */}
                        <select className="toolbar-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                            {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="toolbar-right">
                        {/* Pin toggle */}
                        <div className="pin-toggle" onClick={() => setShowPins(!showPins)}>
                            <div className={`toggle-track ${showPins ? "on" : ""}`}>
                                <div className="toggle-thumb" />
                            </div>
                            <span className="toggle-label">Pins</span>
                        </div>

                        {/* Map style toggle */}
                        <div className="tile-pills">
                            {Object.entries(TILE_LAYERS).map(([key, val]) => (
                                <button
                                    key={key}
                                    className={`tile-pill ${tileLayer === key ? "active" : ""}`}
                                    onClick={() => setTileLayer(key)}
                                >
                                    {val.label}
                                </button>
                            ))}
                        </div>

                        {/* Info button */}
                        <button className={`toolbar-icon-btn info-btn ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)} title="What does this mean?">
                            ℹ️ <span className="info-text">About Score</span>
                        </button>

                        {/* Close */}
                        <button className="toolbar-icon-btn close-btn-map" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* ─── Score Info Panel ─── */}
                {showInfo && SCORE_DESCRIPTIONS[heatmapMode] && (
                    <div className="score-info-panel">
                        <button className="score-info-close" onClick={() => setShowInfo(false)}>✕</button>
                        <h3 className="score-info-title">{SCORE_DESCRIPTIONS[heatmapMode].title}</h3>
                        <p className="score-info-desc">{SCORE_DESCRIPTIONS[heatmapMode].description}</p>
                        <div className="score-info-tip">
                            <span>💡</span>
                            <p>{SCORE_DESCRIPTIONS[heatmapMode].tip}</p>
                        </div>
                    </div>
                )}

                {/* ─── Mini Property Panel ─── */}
                {selectedPincode && (
                    <div className="mini-property-panel">
                        <div className="mini-panel-header">
                            <h3 className="mini-panel-title">Properties in {selectedPincode}</h3>
                            <button className="mini-panel-close" onClick={() => setSelectedPincode(null)}>✕</button>
                        </div>
                        {loadingMini ? (
                            <div className="mini-loading">Loading...</div>
                        ) : (
                            <div className="mini-property-list">
                                {miniProperties.length > 0 ? (
                                    miniProperties.map(p => (
                                        <div key={p.id} className="mini-property-card" onClick={() => { onClose(); navigate(`/property/${p.id}`); }}>
                                            <img
                                                src={parsePropertyImages(p.photos)[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"}
                                                alt="Property"
                                                className="mini-card-img"
                                                onError={(e) => e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"}
                                            />
                                            <div className="mini-card-info">
                                                <div className="mini-card-price">{formatPrice(p.price)}</div>
                                                <div className="mini-card-title">{p.title}</div>
                                                <div className="mini-card-meta">{p.type} · {p.bhk} BHK · {p.area} sqft</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-properties-msg">No properties found in this area.</div>
                                )}
                                <button className="view-all-btn" onClick={() => { onClose(); navigate(`/properties?pincode=${selectedPincode}`); }}>
                                    View All in this Area →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Legend (Expandable) ─── */}
                <div className={`map-legend ${legendOpen ? "open" : "collapsed"}`}>
                    <div className="legend-header" onClick={() => setLegendOpen(!legendOpen)}>
                        <span className="legend-title">{palette.title}</span>
                        <span className="legend-toggle">{legendOpen ? "▾" : "▸"}</span>
                    </div>
                    {legendOpen && (
                        <div className="legend-items">
                            <div className="legend-item">
                                <span className="legend-color" style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}></span>
                                <span>0 properties</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color" style={{ background: "#9ca3af" }}></span>
                                <span>1-10 properties</span>
                            </div>
                            {dynamicBins ? (
                                [
                                    { color: palette.colors[0], label: `< ${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[0] / 1000) + 'K' : Math.round(dynamicBins[0])}` },
                                    { color: palette.colors[1], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[0] / 1000) + 'K' : Math.round(dynamicBins[0])}–${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[1] / 1000) + 'K' : Math.round(dynamicBins[1])}` },
                                    { color: palette.colors[2], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[1] / 1000) + 'K' : Math.round(dynamicBins[1])}–${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[2] / 1000) + 'K' : Math.round(dynamicBins[2])}` },
                                    { color: palette.colors[3], label: `${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[2] / 1000) + 'K' : Math.round(dynamicBins[2])}–${heatmapMode === 'price' ? '₹' + Math.round(dynamicBins[3] / 1000) + 'K' : Math.round(dynamicBins[3])}` },
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
                    )}
                </div>

                {/* ─── Leaflet Map ─── */}
                <MapContainer
                    center={currentCity.coords}
                    zoom={currentCity.zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={selectedCity}
                >
                    <TileLayer
                        url={TILE_LAYERS[tileLayer].url}
                        attribution='&copy; OpenStreetMap &copy; CARTO'
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

                    {/* Property Pin Markers */}
                    {showPins && allProperties.map(p => {
                        if (!p.latitude || !p.longitude) return null;
                        return (
                            <CircleMarker
                                key={p.id}
                                center={[p.latitude, p.longitude]}
                                radius={6}
                                pathOptions={{
                                    color: "#2563eb",
                                    fillColor: "#3b82f6",
                                    fillOpacity: 0.85,
                                    weight: 2
                                }}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedPincode(null);
                                        setMiniProperties([p]);
                                        setSelectedPincode(p.pinCode || "Pin");
                                    }
                                }}
                            >
                                <Popup>
                                    <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 150 }}>
                                        <strong>{p.title}</strong><br />
                                        <span style={{ color: '#2563eb', fontWeight: 700 }}>{formatPrice(p.price)}</span><br />
                                        <small>{p.type} · {p.bhk} BHK</small>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>

                {/* Loading overlay */}
                {(loading || loadingPins) && <div className="map-loading">Loading...</div>}
            </div>
        </div>
    );
}

export default MapModal;