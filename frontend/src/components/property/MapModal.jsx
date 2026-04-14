import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import { analyticsApi, propertyApi } from "../../services/api";
import { parsePropertyImages } from "../../utils/imageUtils";
import { formatPrice } from "../../utils/priceUtils";
import { AMENITIES_LIST, PURPOSES, PROPERTY_TYPES } from "../../utils/constants";
import { useSearch } from "../../context/SearchContext";

function RecenterMap({ coords, zoom }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') map.invalidateSize();
            if (coords) map.setView(coords, zoom || map.getZoom());
        }, 300);
        return () => clearTimeout(timer);
    }, [map, coords, zoom]);
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
    dark: { url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png", label: "Dark" },
    light: { url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png", label: "Light" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", label: "Satellite" }
};

/* ════════════════════════════════════════
   MAP MODAL COMPONENT
   ════════════════════════════════════════ */
function MapModal({ isOpen, onClose, initialProperty }) {
    const navigate = useNavigate();
    const { searchParams: globalSearch, updateSearch } = useSearch();
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

    // Filters synced with SearchContext
    const [selectedCity, setSelectedCity] = useState(globalSearch.city || "Ahmedabad");
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedType, setSelectedType] = useState(globalSearch.type || "All");
    const [selectedPurpose, setSelectedPurpose] = useState(globalSearch.purpose || PURPOSES.BUY);
    const [heatmapMode, setHeatmapMode] = useState("price");
    const [showPins, setShowPins] = useState(false);
    const [allProperties, setAllProperties] = useState([]);
    const [loadingPins, setLoadingPins] = useState(false);
    const [tileLayer, setTileLayer] = useState("dark");
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(null);
    const [legendOpen, setLegendOpen] = useState(true);

    const propertyPurposes = [PURPOSES.ALL, PURPOSES.BUY, PURPOSES.RENT];
    const propertyTypes = PROPERTY_TYPES;

    // Handle initialProperty when modal opens
    useEffect(() => {
        if (isOpen) {
            // Update local state from global context whenever modal opens
            if (globalSearch.city) setSelectedCity(globalSearch.city);
            if (globalSearch.purpose) setSelectedPurpose(globalSearch.purpose);
            if (globalSearch.type) setSelectedType(globalSearch.type);

            if (initialProperty) {
                if (initialProperty.city) {
                    const cityMatch = cities.find(c => c.name.toLowerCase() === initialProperty.city.toLowerCase());
                    if (cityMatch) setSelectedCity(cityMatch.name);
                }
                if (initialProperty.pinCode) {
                    setSelectedPincode(initialProperty.pinCode);
                    setMiniProperties([initialProperty]);
                } else if (initialProperty.latitude && initialProperty.longitude) {
                    setSelectedPincode("Selected Property");
                    setMiniProperties([initialProperty]);
                }
            }
        }
    }, [isOpen, initialProperty, globalSearch.city, globalSearch.purpose, globalSearch.type]);

    // Sync local changes back to global context (Optional but recommended for consistency)
    const handleCityChange = (city) => {
        setSelectedCity(city);
        updateSearch({ city });
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        updateSearch({ type });
    };

    const handlePurposeChange = (purpose) => {
        setSelectedPurpose(purpose);
        updateSearch({ purpose });
    };

    useEffect(() => {
        setSelectedPincode(null);
        setSelectedArea("");
        setMapCenter(null);
        setMapZoom(null);
    }, [selectedCity]);

    const currentCity = useMemo(() => {
        if (initialProperty?.latitude && initialProperty?.longitude) {
            // Find if property city is in our list to get proper geoFile, otherwise default zoom/coords
            const cityMatch = cities.find(c => c.name.toLowerCase() === initialProperty.city?.toLowerCase());
            return {
                name: initialProperty.city || "Custom",
                coords: [initialProperty.latitude, initialProperty.longitude],
                zoom: 15,
                geoFile: cityMatch?.geoFile || null
            };
        }
        return cities.find(c => c.name === selectedCity) || cities[0];
    }, [selectedCity, initialProperty]);
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
            params: { mode: heatmapMode, type: selectedType, purpose: selectedPurpose === PURPOSES.ALL ? null : selectedPurpose }
        })
            .then(res => {
                const json = res.data;
                const items = (json.data && json.data.data) ? json.data.data : (json.data || []);
                const dataMap = {};
                items.forEach(item => { if (item.pincode) dataMap[String(item.pincode).trim()] = item; });
                setHeatmapData(dataMap);
            })
            .catch(err => console.error("Heatmap fetch error:", err));

        Promise.all([fetchGeo, fetchHeatmap]).finally(() => setLoading(false));
    }, [isOpen, selectedCity, heatmapMode, selectedType, selectedPurpose]);

    // Fetch property pins when toggle is on
    useEffect(() => {
        if (!showPins || !isOpen) { setAllProperties([]); return; }
        setLoadingPins(true);
        const params = { city: selectedCity, type: selectedType };
        if (selectedPurpose !== PURPOSES.ALL) params.purpose = selectedPurpose;

        propertyApi.get(``, { params })
            .then(res => setAllProperties(res.data || []))
            .catch(() => setAllProperties([]))
            .finally(() => setLoadingPins(false));
    }, [showPins, selectedCity, selectedType, selectedPurpose, isOpen]);

    // Color logic
    const getColor = (feature) => {
        const geoPincode = String(feature.properties?.pin_code || feature.properties?.pincode || feature.properties?.PINCODE || "").trim();
        const data = heatmapData[geoPincode];
        if (!data || data.activeListings === 0 || data.activeListings == null) return "#f0f0f0";

        let val = heatmapMode === 'price' ? (data.medianPrice ?? null) : (data.score ?? null);
        if (val === null || val === undefined) return "#f0f0f0";

        // If count is very low (1-2), use a faint version of the base color instead of grey
        if (data.activeListings > 0 && data.activeListings <= 2) {
            return palette.colors[0] + "44"; // Adding transparency for low density
        }

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
            const res = await propertyApi.get(`/top?pincode=${pincode}&mode=${heatmapMode}&purpose=${selectedPurpose}`);
            setMiniProperties(res.data || []);
        } catch { console.error("Failed to fetch mini properties"); }
        finally { setLoadingMini(false); }
    };

    const availableAreas = useMemo(() => {
        if (!geoData || !geoData.features) return [];
        const areasMap = new Map();
        geoData.features.forEach(f => {
            const name = f.properties.area_name || f.properties.name || f.properties.AREA || f.properties.PINCODE;
            const pincode = f.properties.pin_code || f.properties.pincode || f.properties.PINCODE;
            if (name && !areasMap.has(name)) {
                areasMap.set(name, { name, pincode, feature: f });
            }
        });
        return Array.from(areasMap.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }, [geoData]);

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
            `<div class="map-tooltip-card">
                <div class="map-tooltip-header">
                    <span class="map-tooltip-area">${area}</span>
                    <span class="map-tooltip-pincode">${geoPincode || "—"}</span>
                </div>
                <div class="map-tooltip-body">
                    <div class="map-tooltip-stat">
                        <span class="map-tooltip-label">Avg Price</span>
                        <span class="map-tooltip-value">${price}/sq.ft</span>
                    </div>
                    <div class="map-tooltip-stat">
                        <span class="map-tooltip-label">Active Listings</span>
                        <span class="map-tooltip-value">${activeListings}</span>
                    </div>
                    ${data?.score != null ? `
                    <div class="map-tooltip-stat">
                        <span class="map-tooltip-label">Market Score</span>
                        <div class="map-tooltip-score-bar">
                            <div class="map-tooltip-score-fill" style="width: ${score}%; background: ${getColor(feature)}"></div>
                        </div>
                        <span class="map-tooltip-value">${score}%</span>
                    </div>` : ''}
                </div>
                ${!data ? '<div class="map-tooltip-no-data">No active properties</div>' : ''}
            </div>`,
            { sticky: true, opacity: 1, direction: 'top', offset: [0, -10] }
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
                        {/* City Section */}
                        <div className="toolbar-section">
                            <div className="city-selector">
                                {cities.map(city => (
                                    <button
                                        key={city.name}
                                        className={`city-btn ${selectedCity === city.name ? "active" : ""}`}
                                        onClick={() => handleCityChange(city.name)}
                                    >
                                        <span className="city-marker">📍</span>
                                        {city.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Filter Section */}
                        <div className="toolbar-section">
                            {availableAreas.length > 0 && (
                                <select
                                    className="toolbar-select area-select"
                                    value={selectedArea}
                                    onChange={(e) => {
                                        const areaName = e.target.value;
                                        setSelectedArea(areaName);
                                        if (!areaName) {
                                            setMapCenter(null);
                                            setMapZoom(null);
                                        } else {
                                            const areaObj = availableAreas.find(a => a.name === areaName);
                                            if (areaObj) {
                                                let coords = areaObj.feature.geometry.coordinates;
                                                if (areaObj.feature.geometry.type === 'Polygon') coords = coords[0][0];
                                                else if (areaObj.feature.geometry.type === 'MultiPolygon') coords = coords[0][0][0];

                                                if (coords && coords.length >= 2) {
                                                    setMapCenter([coords[1], coords[0]]);
                                                    setMapZoom(14);
                                                    if (areaObj.pincode) fetchMiniProperties(String(areaObj.pincode).trim());
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <option value="">All Areas</option>
                                    {availableAreas.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                </select>
                            )}

                            <select className="toolbar-select mode-select" value={heatmapMode} onChange={(e) => setHeatmapMode(e.target.value)}>
                                {modes.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                            </select>

                            <select className="toolbar-select type-select" value={selectedType} onChange={(e) => handleTypeChange(e.target.value)}>
                                {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <div className="tile-pills purpose-pills">
                                <button
                                    className={`tile-pill ${selectedPurpose === PURPOSES.BUY ? "active" : ""}`}
                                    onClick={() => handlePurposeChange(PURPOSES.BUY)}
                                >
                                    BUY
                                </button>
                                <button
                                    className={`tile-pill ${selectedPurpose === PURPOSES.RENT ? "active" : ""}`}
                                    onClick={() => handlePurposeChange(PURPOSES.RENT)}
                                >
                                    RENT
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="toolbar-right">
                        {/* Map Settings Section */}
                        <div className="toolbar-section">
                            <div className="pin-toggle" onClick={() => setShowPins(!showPins)} title="Toggle Property Markers">
                                <div className={`toggle-track ${showPins ? "on" : ""}`}>
                                    <div className="toggle-thumb" />
                                </div>
                                <span className="toggle-label">Pins</span>
                            </div>

                            <div className="tile-pills">
                                {Object.entries(TILE_LAYERS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        className={`tile-pill ${tileLayer === key ? "active" : ""}`}
                                        onClick={() => setTileLayer(key)}
                                        title={`${val.label} Mode`}
                                    >
                                        {val.label.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Actions Section */}
                        <div className="toolbar-section">
                            <button className={`toolbar-icon-btn info-btn ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)} title="Market Score Guide">
                                ℹ️
                            </button>
                            <button className="toolbar-icon-btn close-btn-map" onClick={onClose} title="Close Map">✕</button>
                        </div>
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
                                <span className="legend-color" style={{ background: palette.colors[0] + "44", border: "1px solid rgba(255,255,255,0.1)" }}></span>
                                <span>Low Density (1-2)</span>
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
                    center={mapCenter || currentCity.coords}
                    zoom={mapZoom || currentCity.zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={selectedCity}
                >
                    <TileLayer
                        url={TILE_LAYERS[tileLayer].url}
                        attribution='&copy; OpenStreetMap &copy; CARTO'
                    />
                    <RecenterMap coords={mapCenter || currentCity.coords} zoom={mapZoom || currentCity.zoom} />

                    {geoData && (
                        <GeoJSON
                            key={`geojson-${selectedCity}-${heatmapMode}-${Object.keys(heatmapData).length}`}
                            data={geoData}
                            style={defaultStyle}
                            onEachFeature={onEachFeature}
                        />
                    )}

                    {/* Property Pin Markers */}
                    {showPins && allProperties.map((p, index) => {
                        let lat = p.latitude;
                        let lng = p.longitude;

                        if (!lat || !lng) {
                            if (geoData && p.pinCode) {
                                const feature = geoData.features.find(f => 
                                    String(f.properties?.pin_code || f.properties?.pincode || f.properties?.PINCODE).trim() === String(p.pinCode).trim()
                                );
                                if (feature && feature.geometry) {
                                    let coords = feature.geometry.coordinates;
                                    if (feature.geometry.type === 'Polygon') coords = coords[0][0];
                                    else if (feature.geometry.type === 'MultiPolygon') coords = coords[0][0][0];
                                    
                                    if (coords && coords.length >= 2) {
                                        const offsetLat = (index % 5 - 2) * 0.001;
                                        const offsetLng = ((index * 3) % 5 - 2) * 0.001;
                                        lng = coords[0] + offsetLng;
                                        lat = coords[1] + offsetLat;
                                    }
                                }
                            }
                        }

                        if (!lat || !lng) return null;

                        const priceIcon = L.divIcon({
                            className: 'price-marker-icon',
                            html: `
                                <div class="price-marker-pill">
                                    <span class="price-marker-text">${formatPrice(p.price)}</span>
                                    <div class="price-marker-tip"></div>
                                </div>
                            `,
                            iconSize: [70, 30],
                            iconAnchor: [35, 30]
                        });

                        return (
                            <Marker
                                key={p.id}
                                position={[lat, lng]}
                                icon={priceIcon}
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
                            </Marker>
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


