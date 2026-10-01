import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";

import { analyticsApi, propertyApi } from "../../services/api";
import { PURPOSES } from "../../utils/constants";
import { useSearch } from "../../context/SearchContext";
import { getStorageUser } from "../../utils/storageUtils";

// Modular Heatmap Feature Subcomponents
import {
    CITIES,
    DYNAMIC_PALETTES,
    STATIC_BINS_MAP,
    TILE_LAYERS
} from "./map/heatmapConstants";
import {
    extractFeatureName,
    extractFeaturePincode,
    getPolygonCentroid,
    getZoneColor
} from "./map/geoUtils";
import RecenterMap from "./map/RecenterMap";
import MapToolbar from "./map/MapToolbar";
import HeatmapLegend from "./map/HeatmapLegend";
import MiniPropertyPanel from "./map/MiniPropertyPanel";
import MapScoreGuide from "./map/MapScoreGuide";
import PropertyPins from "./map/PropertyPins";

export default function MapModal({ isOpen, onClose, initialProperty }) {
    const navigate = useNavigate();
    const { searchParams: globalSearch, updateSearch } = useSearch();
    const user = getStorageUser();
    const isAgent = user?.role === "AGENT" || user?.role === "ADMIN";

    // Geospatial & Heatmap Analytics States
    const [geoData, setGeoData] = useState(null);
    const [heatmapData, setHeatmapData] = useState({});
    const [loading, setLoading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Mini Property Panel States
    const [selectedPincode, setSelectedPincode] = useState(null);
    const [miniProperties, setMiniProperties] = useState([]);
    const [loadingMini, setLoadingMini] = useState(false);

    // Filters Synced with SearchContext
    const [selectedCity, setSelectedCity] = useState(globalSearch.city || "Ahmedabad");
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedType, setSelectedType] = useState(globalSearch.type || "All");
    const [selectedPurpose, setSelectedPurpose] = useState(globalSearch.purpose || PURPOSES.BUY);
    const [heatmapMode, setHeatmapMode] = useState("price");

    // Map Presentation States
    const [showPins, setShowPins] = useState(false);
    const [allProperties, setAllProperties] = useState([]);
    const [loadingPins, setLoadingPins] = useState(false);
    const [tileLayer, setTileLayer] = useState("dark");
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(null);
    const [legendOpen, setLegendOpen] = useState(true);

    // Synchronize filters when modal opens or initialProperty changes
    useEffect(() => {
        if (!isOpen) return;

        if (globalSearch.city) setSelectedCity(globalSearch.city);
        if (globalSearch.purpose) setSelectedPurpose(globalSearch.purpose);
        if (globalSearch.type) setSelectedType(globalSearch.type);

        if (initialProperty) {
            if (initialProperty.city) {
                const match = CITIES.find((c) => c.name.toLowerCase() === initialProperty.city.toLowerCase());
                if (match) setSelectedCity(match.name);
            }
            if (initialProperty.pinCode) {
                setSelectedPincode(initialProperty.pinCode);
                setMiniProperties([initialProperty]);
            } else if (initialProperty.latitude && initialProperty.longitude) {
                setSelectedPincode("Selected Property");
                setMiniProperties([initialProperty]);
            }
        }
    }, [isOpen, initialProperty, globalSearch.city, globalSearch.purpose, globalSearch.type]);

    const handleCityChange = (city) => {
        setSelectedCity(city);
        updateSearch({ city });
        setSelectedPincode(null);
        setSelectedArea("");
        setMapCenter(null);
        setMapZoom(null);
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        updateSearch({ type });
    };

    const handlePurposeChange = (purpose) => {
        setSelectedPurpose(purpose);
        updateSearch({ purpose });
    };

    // Resolve current active city config
    const currentCity = useMemo(() => {
        const cityObj = CITIES.find((c) => c.name === selectedCity) || CITIES[0];
        if (initialProperty?.latitude && initialProperty?.longitude) {
            const match = CITIES.find((c) => c.name.toLowerCase() === (initialProperty.city || "").toLowerCase());
            if (match && match.name === selectedCity) {
                return {
                    name: match.name,
                    coords: [initialProperty.latitude, initialProperty.longitude],
                    zoom: 15,
                    geoFile: match.geoFile
                };
            }
        }
        return cityObj;
    }, [selectedCity, initialProperty]);

    const palette = DYNAMIC_PALETTES[heatmapMode] || DYNAMIC_PALETTES.price;

    // Fetch GeoJSON boundaries and Heatmap metrics concurrently
    useEffect(() => {
        if (!isOpen || !currentCity || !currentCity.geoFile) {
            setGeoData(null);
            setHeatmapData({});
            return;
        }

        setLoading(true);
        setGeoData(null);
        setHeatmapData({});

        const geoUrl = `${import.meta.env.BASE_URL || "/"}geo/${currentCity.geoFile}`;
        const fetchGeo = fetch(geoUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`GeoJSON not found: ${geoUrl}`);
                return res.json();
            })
            .then((data) => setGeoData(data))
            .catch((err) => {
                console.error(`Failed to load GeoJSON for ${currentCity.name}:`, err);
                setGeoData(null);
            });

        const fetchHeatmap = analyticsApi
            .get(`/heatmap/${encodeURIComponent(currentCity.name)}`, {
                params: {
                    mode: heatmapMode,
                    type: selectedType,
                    purpose: selectedPurpose === PURPOSES.ALL ? null : selectedPurpose
                }
            })
            .then((res) => {
                const items = Array.isArray(res.data?.data) ? res.data.data : [];
                const dataMap = {};
                items.forEach((item) => {
                    if (item.pincode) dataMap[String(item.pincode).trim()] = item;
                });
                setHeatmapData(dataMap);
            })
            .catch((err) => {
                console.error("Heatmap fetch error:", err);
                setHeatmapData({});
            });

        Promise.all([fetchGeo, fetchHeatmap]).finally(() => setLoading(false));
    }, [isOpen, selectedCity, heatmapMode, selectedType, selectedPurpose]);

    // Fetch property pins when toggle is active
    useEffect(() => {
        if (!showPins || !isOpen) {
            setAllProperties([]);
            return;
        }
        setLoadingPins(true);
        const params = { city: currentCity.name, type: selectedType };
        if (selectedPurpose !== PURPOSES.ALL) params.purpose = selectedPurpose;

        propertyApi
            .get("", { params })
            .then((res) => setAllProperties(res.data || []))
            .catch(() => setAllProperties([]))
            .finally(() => setLoadingPins(false));
    }, [showPins, selectedCity, selectedType, selectedPurpose, isOpen]);

    // Fetch properties for clicked area drawer
    const fetchMiniProperties = async (pincode) => {
        if (!pincode) return;
        setLoadingMini(true);
        setSelectedPincode(pincode);
        try {
            const params = new URLSearchParams({
                pincode: String(pincode),
                mode: heatmapMode,
                purpose: selectedPurpose
            });
            const res = await propertyApi.get(`/top?${params}`);
            setMiniProperties(res.data || []);
        } catch (e) {
            console.error("Failed to fetch mini properties:", e);
            setMiniProperties([]);
        } finally {
            setLoadingMini(false);
        }
    };

    // Extract sorted list of available areas from GeoJSON
    const availableAreas = useMemo(() => {
        if (!geoData || !geoData.features) return [];
        const areasMap = new Map();
        geoData.features.forEach((f) => {
            const name = extractFeatureName(f);
            const pincode = extractFeaturePincode(f);
            if (name && !areasMap.has(name)) {
                areasMap.set(name, { name, pincode, feature: f });
            }
        });
        return Array.from(areasMap.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }, [geoData]);

    const handleAreaChange = (areaName) => {
        setSelectedArea(areaName);
        if (!areaName) {
            setMapCenter(null);
            setMapZoom(null);
            return;
        }
        const areaObj = availableAreas.find((a) => a.name === areaName);
        if (areaObj) {
            const centroid = getPolygonCentroid(
                areaObj.feature.geometry.coordinates,
                areaObj.feature.geometry.type
            );
            if (centroid) {
                setMapCenter(centroid);
                setMapZoom(14);
                if (areaObj.pincode) fetchMiniProperties(String(areaObj.pincode).trim());
            }
        }
    };

    // Styling & Tooltip bindings for GeoJSON polygons
    const defaultStyle = (feature) => {
        const color = getZoneColor(feature, heatmapData, heatmapMode, palette, STATIC_BINS_MAP);
        const pincode = extractFeaturePincode(feature);
        const hasData = Boolean(heatmapData[pincode]);
        return {
            color: "#1e293b",
            weight: 1.5,
            fillColor: color,
            fillOpacity: hasData ? 0.7 : 0.3
        };
    };

    const onEachFeature = (feature, layer) => {
        const pincode = extractFeaturePincode(feature);
        const area = extractFeatureName(feature);
        const data = heatmapData[pincode];
        const activeListings = data?.activeListings ?? "—";
        const score = data?.score != null ? Math.round(data.score) : "N/A";
        const price = data?.medianPrice != null ? `₹${Math.round(data.medianPrice).toLocaleString("en-IN")}` : "N/A";
        const color = getZoneColor(feature, heatmapData, heatmapMode, palette, STATIC_BINS_MAP);

        layer.bindTooltip(
            `<div class="map-tooltip-card">
                <div class="map-tooltip-header">
                    <span class="map-tooltip-area">${area}</span>
                    <span class="map-tooltip-pincode">${pincode || "—"}</span>
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
                    ${data?.score != null && heatmapMode !== "price" ? `
                    <div class="map-tooltip-stat">
                        <span class="map-tooltip-label">Market Score</span>
                        <div class="map-tooltip-score-bar">
                            <div class="map-tooltip-score-fill" style="width: ${score}%; background: ${color}"></div>
                        </div>
                        <span class="map-tooltip-value">${score}%</span>
                    </div>` : ""}
                </div>
                ${!data ? '<div class="map-tooltip-no-data">No active properties</div>' : ""}
                ${data && data.activeListings < 5 ? '<div class="map-tooltip-no-data">⚠️ Low data (&lt;5 listings)</div>' : ""}
            </div>`,
            { sticky: true, opacity: 1, direction: "top", offset: [0, -10] }
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
                L.DomEvent.stopPropagation(e);
                if (pincode) fetchMiniProperties(pincode);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="map-modal"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Interactive Property Heatmap"
        >
            <div className="map-container" onClick={(e) => e.stopPropagation()}>
                {/* 1. Header Toolbar */}
                <MapToolbar
                    selectedCity={selectedCity}
                    onCityChange={handleCityChange}
                    selectedArea={selectedArea}
                    onAreaChange={handleAreaChange}
                    availableAreas={availableAreas}
                    heatmapMode={heatmapMode}
                    onModeChange={setHeatmapMode}
                    selectedType={selectedType}
                    onTypeChange={handleTypeChange}
                    selectedPurpose={selectedPurpose}
                    onPurposeChange={handlePurposeChange}
                    showPins={showPins}
                    onTogglePins={() => setShowPins(!showPins)}
                    tileLayer={tileLayer}
                    onTileLayerChange={setTileLayer}
                    showInfo={showInfo}
                    onToggleInfo={() => setShowInfo(!showInfo)}
                    isAgent={isAgent}
                />

                {/* 2. Absolute Close Button */}
                <button
                    className="map-absolute-close"
                    onClick={onClose}
                    title="Close Map"
                    aria-label="Close map"
                >
                    ✕
                </button>

                {/* 3. Market Score Guide Overlay */}
                <MapScoreGuide
                    heatmapMode={heatmapMode}
                    isOpen={showInfo}
                    onClose={() => setShowInfo(false)}
                />

                {/* 4. Mini Property Drawer */}
                <MiniPropertyPanel
                    selectedPincode={selectedPincode}
                    onClose={() => setSelectedPincode(null)}
                    loading={loadingMini}
                    properties={miniProperties}
                    onSelectProperty={(propId) => {
                        onClose();
                        navigate(`/property/${propId}`);
                    }}
                />

                {/* 5. Heatmap Palette Legend */}
                <HeatmapLegend
                    isOpen={legendOpen}
                    onToggle={() => setLegendOpen(!legendOpen)}
                    palette={palette}
                    heatmapMode={heatmapMode}
                    heatmapData={heatmapData}
                    loading={loading}
                />

                {/* 6. Leaflet Map Engine */}
                <MapContainer
                    center={mapCenter || currentCity.coords}
                    zoom={mapZoom || currentCity.zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={selectedCity}
                >
                    <TileLayer
                        url={TILE_LAYERS[tileLayer].url}
                        attribution={TILE_LAYERS[tileLayer].attribution}
                    />

                    <RecenterMap
                        coords={mapCenter || currentCity.coords}
                        zoom={mapZoom || currentCity.zoom}
                    />

                    {geoData && (
                        <GeoJSON
                            key={`geojson-${selectedCity}-${heatmapMode}-${Object.keys(heatmapData).length}`}
                            data={geoData}
                            style={defaultStyle}
                            onEachFeature={onEachFeature}
                        />
                    )}

                    <PropertyPins
                        showPins={showPins}
                        properties={allProperties}
                        geoData={geoData}
                        onSelectPin={(p) => {
                            if (p.pinCode) {
                                fetchMiniProperties(p.pinCode);
                            } else {
                                setSelectedPincode("Pin");
                                setMiniProperties([p]);
                            }
                        }}
                    />
                </MapContainer>

                {/* 7. Loading Status Indicator */}
                {(loading || loadingPins) && (
                    <div className="map-loading" role="status" aria-live="polite">
                        <div className="map-loading-spinner" />
                        <span>Loading map data...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
