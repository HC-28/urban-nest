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

/* ── Color palettes (3 gradient colors per mode) ── */
const DYNAMIC_PALETTES = {
    price: { title: "Price per sq.ft (₹)", colors: ["#22c55e", "#fb923c", "#dc2626"] },
    inventory: { title: "Inventory Level", colors: ["#93c5fd", "#3b82f6", "#1e3a8a"] },
    buyer_opportunity: { title: "Buyer Opportunity", colors: ["#a5f3fc", "#06b6d4", "#0e7490"] },
    demand: { title: "Demand (Agent)", colors: ["#fde68a", "#fbbf24", "#92400e"] },
    liquidity: { title: "Liquidity Score", colors: ["#bbf7d0", "#4ade80", "#14532d"] }
};

/* ── Score info descriptions ── */
const SCORE_DESCRIPTIONS = {
    price: {
        title: "💰 Price Index",
        description: "Median price per square foot across neighborhoods. Warmer colors = higher-priced areas, cooler = more affordable. Click any area to see listings.",
        tip: "Pro Tip: Compare with Inventory — low price + high inventory = great deals with negotiation room."
    },
    inventory: {
        title: "📦 Inventory Level",
        description: "Active property listings per area. More listings = more buyer choices and negotiation room. Fewer = tighter market, faster sales.",
        tip: "Pro Tip: High inventory gives you leverage. Low inventory + high demand means rising prices and competition."
    },
    buyer_opportunity: {
        title: "🏠 Buyer Opportunity",
        description: "Combines price, inventory, and demand to highlight areas favoring buyers. High scores = good conditions for buying.",
        tip: "Pro Tip: Best starting point for first-time buyers! Focus on high-opportunity areas for the best deals."
    },
    demand: {
        title: "📈 Demand Score (Agent View)",
        description: "Buyer demand relative to available listings. High demand = more buyers than properties — ideal for agents looking to list.",
        tip: "Pro Tip: List in high-demand areas with competitive pricing for fastest sales."
    },
    liquidity: {
        title: "💧 Liquidity Score (Agent View)",
        description: "How quickly properties sell in each area. High liquidity = fast sales. Low = longer cycles.",
        tip: "Pro Tip: High liquidity = quick flips. Low liquidity = longer marketing but often better margins."
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

    // Static bins configuration per mode
    const staticBinsMap = {
        price: [10000, 20000],          // Below 10k = Low, 10k-20k = Medium, >20k = High
        inventory: [15, 30],            // Below 15 = Low, 15-30 = Medium, >30 = High
        buyer_opportunity: [40, 70],    // Score out of 100
        demand: [30, 60],               // Score out of 100
        liquidity: [40, 75]             // Score out of 100
    };

    // Modes
    const modes = [
        { value: "price", label: "Price Heatmap", icon: "💰" },
        { value: "inventory", label: "Inventory", icon: "📦" },
        { value: "buyer_opportunity", label: "Opportunity", icon: "🏠" },
        ...(isAgent ? [
            { value: "demand", label: "Demand", icon: "📈" },
            { value: "liquidity", label: "Liquidity", icon: "💧" }
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
        propertyApi.get(`/`, { params: { city: selectedCity, type: selectedType } })
            .then(res => setAllProperties(res.data || []))
            .catch(() => setAllProperties([]))
            .finally(() => setLoadingPins(false));
    }, [showPins, selectedCity, selectedType, isOpen]);

    // Color logic
    const getColor = (feature) => {
        const geoPincode = String(feature.properties?.pin_code || feature.properties?.pincode || feature.properties?.PINCODE || "").trim();
        const data = heatmapData[geoPincode];
        if (!data || data.activeListings === 0 || data.activeListings == null) return "#f0f0f0";
        if (data.activeListings > 0 && data.activeListings <= 5) return "#9ca3af";
        let val = heatmapMode === 'price' ? (data.medianPrice ?? null) : (data.score ?? null);
        if (val === null || val === undefined) return "#6b7280";
        const [p33, p66] = staticBinsMap[heatmapMode] || [33, 66];
        if (val <= p33) return palette.colors[0];
        if (val <= p66) return palette.colors[1];
        return palette.colors[2];
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
                                                src={parsePropertyImages(p.photos)[0] || "/placeholder.jpg"}
                                                alt="Property"
                                                className="mini-card-img"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.jpg"; }}
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
                                <span className="legend-color" style={{ background: "#f0f0f0", border: "1px solid rgba(255,255,255,0.3)" }}></span>
                                <span>No properties</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color" style={{ background: "#9ca3af" }}></span>
                                <span>1–5 properties</span>
                            </div>
                            {Object.keys(heatmapData).length > 0 ? (
                                (() => {
                                    const staticBins = staticBinsMap[heatmapMode] || [33, 66];
                                    return [
                                        { color: palette.colors[0], label: `Low${heatmapMode === 'price' ? ' (< ₹' + Math.round(staticBins[0] / 1000) + 'K)' : ''}` },
                                        { color: palette.colors[1], label: `Medium${heatmapMode === 'price' ? ' (₹' + Math.round(staticBins[0] / 1000) + 'K–₹' + Math.round(staticBins[1] / 1000) + 'K)' : ''}` },
                                        { color: palette.colors[2], label: `High${heatmapMode === 'price' ? ' (> ₹' + Math.round(staticBins[1] / 1000) + 'K)' : ''}` }
                                    ].map((item, i) => (
                                        <div key={i} className="legend-item">
                                            <span className="legend-color" style={{ background: item.color }}></span>
                                            <span>{item.label}</span>
                                        </div>
                                    ));
                                })()
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
                                        if (p.pinCode) {
                                            fetchMiniProperties(p.pinCode);
                                        } else {
                                            setSelectedPincode("Pin");
                                            setMiniProperties([p]);
                                        }
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