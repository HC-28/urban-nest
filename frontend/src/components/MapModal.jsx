import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";

/* --- Helper to fix the "Blank Map" resize issue --- */
function RecenterMap() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') {
                map.invalidateSize();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function MapModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [geoData, setGeoData] = useState(null);
    const [properties, setProperties] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedPurpose, setSelectedPurpose] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedCity, setSelectedCity] = useState("Ahmedabad");

    // API URL for property counts only
    const API_URL = import.meta.env.VITE_API_URL;

    // City configurations with coordinates and GeoJSON files
    const cities = [
        { name: "Ahmedabad", coords: [23.0225, 72.5714], zoom: 12, geoFile: "ahmedabad.geojson" },
        { name: "Mumbai", coords: [19.0760, 72.8777], zoom: 11, geoFile: "mumbai.geojson" },
        { name: "Delhi", coords: [28.7041, 77.1025], zoom: 11, geoFile: "delhi.geojson" },
        { name: "Bangalore", coords: [12.9716, 77.5946], zoom: 11, geoFile: "bangalore.geojson" },
        { name: "Pune", coords: [18.5204, 73.8567], zoom: 12, geoFile: "pune.geojson" }
    ];

    const currentCity = cities.find(c => c.name === selectedCity) || cities[0];

    useEffect(() => {
        if (isOpen) {
            setLoading(true);

            // 1. FETCH FROM PUBLIC FOLDER (Frontend Static Asset) - Dynamic city
            fetch(`/geo/${currentCity.geoFile}`)
                .then((res) => {
                    if (!res.ok) {
                        console.warn(`GeoJSON for ${selectedCity} not found, falling back to Ahmedabad`);
                        // Fallback to Ahmedabad if city GeoJSON not available
                        return fetch("/geo/ahmedabad.geojson");
                    }
                    return res.json();
                })
                .then((data) => {
                    console.log(`GeoJSON Loaded for ${selectedCity}:`, data);
                    setGeoData(data);
                })
                .catch((err) => console.error("Error loading map:", err))
                .finally(() => setLoading(false));

            // 2. FETCH PROPERTY COUNTS with city, purpose and type filters
            const params = new URLSearchParams();
            if (selectedCity !== "All") {
                params.append("city", selectedCity);
            }
            if (selectedPurpose !== "All") {
                params.append("purpose", selectedPurpose);
            }
            if (selectedType !== "All") {
                params.append("type", selectedType);
            }
            const queryString = params.toString();
            const filterParam = queryString ? `?${queryString}` : "";

            fetch(`${API_URL}/properties/countByPincode${filterParam}`)
                .then((res) => (res.ok ? res.json() : {}))
                .then((data) => {
                    console.log(`Property data for ${selectedCity}:`, data);
                    setProperties(data);
                })
                .catch(() => setProperties({}));
        }
    }, [isOpen, API_URL, selectedCity, selectedPurpose, selectedType, currentCity]);

    // Enhanced Dynamic Pricing Color Scale (Green -> Yellow -> Orange -> Red)
    const getColor = (price) => {
        if (!price || price === 0) return "#e5e7eb"; // Light gray for no data

        // More granular color scale for better visualization
        if (price > 15000) return "#7f1d1d"; // Very Dark Red - Ultra Premium
        if (price > 12000) return "#991b1b"; // Dark Red - Premium
        if (price > 10000) return "#b91c1c"; // Red - High
        if (price > 8000) return "#dc2626";  // Bright Red
        if (price > 6000) return "#f97316";  // Orange
        if (price > 5000) return "#fb923c";  // Light Orange
        if (price > 4000) return "#fbbf24";  // Yellow-Orange
        if (price > 3000) return "#facc15";  // Yellow
        if (price > 2000) return "#a3e635";  // Lime
        if (price > 1000) return "#4ade80";  // Light Green
        return "#22c55e"; // Green - Affordable
    };

    const defaultStyle = (feature) => {
        const geoPincode = String(feature.properties?.pin_code || "");
        const data = properties[geoPincode];
        const avgPrice = data?.avgPrice || 0;

        return {
            color: "#374151", // Darker Gray border for high contrast
            weight: 2,        // Thicker boundary for better visibility
            fillColor: getColor(avgPrice),
            fillOpacity: data ? 0.7 : 0.3, // Slightly higher opacity for empty areas
        };
    };

    const highlightStyle = {
        color: "#000", // Black border on hover
        weight: 3,
        fillOpacity: 0.9,
    };

    const onEachFeature = (feature, layer) => {
        const geoPincode = String(feature.properties?.pin_code || "");
        const area = feature.properties?.area_name || "Unknown Area";
        const data = properties[geoPincode];

        const count = data?.count || 0;
        const avgPrice = data?.avgPrice || 0;

        layer.bindTooltip(
            `<div style="font-family: Arial, sans-serif; padding: 5px;">
                <h4 style="margin: 0 0 5px 0; color: #1e293b;">${area}</h4>
                <div style="font-size: 13px;">
                    <strong>Pincode:</strong> ${geoPincode}<br/>
                    <strong>Properties:</strong> ${count}
                    ${count > 0 ? `<br/><strong>Avg Price:</strong> ₹${avgPrice}/sq.ft` : ""}
                </div>
            </div>`,
            { sticky: true, opacity: 1 }
        );

        layer.on({
            mouseover: (e) => {
                e.target.setStyle(highlightStyle);
                e.target.bringToFront();
            },
            mouseout: (e) => {
                // Reset to default style (dynamic based on price)
                e.target.setStyle(defaultStyle(feature));
            },
            click: (e) => {
                // Navigate to properties page filtered by this pincode
                const geoPincode = String(feature.properties?.pin_code || "");
                if (geoPincode) {
                    onClose(); // Close the map modal
                    navigate(`/properties?pincode=${geoPincode}`);
                }
            },
        });
    };

    if (!isOpen) return null;

    const purposeOptions = [
        { label: "All Purpose", value: "All" },
        { label: "For Sale", value: "Sale" },
        { label: "For Rent", value: "Rent" }
    ];

    const typeOptions = [
        { label: "All Types", value: "All" },
        { label: "Apartment", value: "Apartment" },
        { label: "Villa", value: "Villa" },
        { label: "House", value: "House" },
        { label: "Penthouse", value: "Penthouse" },
        { label: "Studio", value: "Studio" },
        { label: "Plot", value: "Plot" },
        { label: "Commercial", value: "Commercial" }
    ];

    return (
        <div className="map-modal" onClick={onClose}>
            <div className="map-container" onClick={(e) => e.stopPropagation()}>
                <button className="map-close-btn" onClick={onClose}>Close</button>

                {/* Filter Bar with Three Dropdowns: City, Purpose, Type */}
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
                        value={selectedPurpose}
                        onChange={(e) => setSelectedPurpose(e.target.value)}
                    >
                        {purposeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <div className="filter-divider-vertical"></div>

                    <select
                        className="type-dropdown"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Enhanced Dynamic Pricing Legend */}
                <div className="map-legend">
                    <div className="legend-title">💰 Price per sq.ft (₹)</div>
                    <div className="legend-items">
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#22c55e' }}></span>
                            <span>₹0-1K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#4ade80' }}></span>
                            <span>₹1K-2K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#a3e635' }}></span>
                            <span>₹2K-3K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#facc15' }}></span>
                            <span>₹3K-4K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#fbbf24' }}></span>
                            <span>₹4K-5K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#fb923c' }}></span>
                            <span>₹5K-6K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#f97316' }}></span>
                            <span>₹6K-8K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#dc2626' }}></span>
                            <span>₹8K-10K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#b91c1c' }}></span>
                            <span>₹10K-12K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#991b1b' }}></span>
                            <span>₹12K-15K</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#7f1d1d' }}></span>
                            <span>₹15K+</span>
                        </div>
                    </div>
                </div>

                <MapContainer
                    center={currentCity.coords}
                    zoom={currentCity.zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={selectedCity} // Force re-render when city changes
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />

                    <RecenterMap />

                    {geoData && (
                        <GeoJSON
                            key={`geojson-${selectedCity}-${selectedPurpose}-${selectedType}-${Object.keys(properties).length}`}
                            data={geoData}
                            style={defaultStyle}
                            onEachFeature={onEachFeature}
                        />
                    )}
                </MapContainer>

                {loading && <div className="map-loading">Loading Map Data...</div>}
            </div>
        </div>
    );
}

export default MapModal;