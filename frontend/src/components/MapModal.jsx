import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
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
    const [geoData, setGeoData] = useState(null);
    const [properties, setProperties] = useState({});
    const [loading, setLoading] = useState(false);

    // API URL for property counts only
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";

    useEffect(() => {
        if (isOpen) {
            setLoading(true);

            // 1. FETCH FROM PUBLIC FOLDER (Frontend Static Asset)
            // Note the leading slash: /geo/... refers to public/geo/...
            fetch("/geo/Ahmedabad.geojson")
                .then((res) => {
                    if (!res.ok) throw new Error("GeoJSON file not found in public/geo/");
                    return res.json();
                })
                .then((data) => {
                    console.log("Local GeoJSON Loaded:", data);
                    setGeoData(data);
                })
                .catch((err) => console.error("Error loading local map:", err))
                .finally(() => setLoading(false));

            // 2. FETCH PROPERTY COUNTS (Still from Backend)
            fetch(`${API_URL}/properties/countByPincode`)
                .then((res) => (res.ok ? res.json() : {}))
                .then((data) => setProperties(data))
                .catch(() => setProperties({}));
        }
    }, [isOpen, API_URL]);

    const defaultStyle = useMemo(() => ({
        color: "#38bdf8",
        weight: 2,
        fillColor: "#9ca3af",
        fillOpacity: 0.5,
    }), []);

    const highlightStyle = {
        color: "#06b6d4",
        weight: 3,
        fillColor: "#06b6d4",
        fillOpacity: 0.7,
    };

    const onEachFeature = (feature, layer) => {
        // 1. Get pincode from GeoJSON (matches the "pin_code" key you shared)
        const geoPincode = String(feature.properties?.pin_code || "");
        const area = feature.properties?.area_name || "Unknown Area";

        // 2. Get the count from your properties state
        // Make sure we check both string and number versions
        const total = properties[geoPincode] || 0;

        // 3. APPLY STYLING BASED ON DATA
        // If there is at least one property, highlight it immediately
        if (total > 0) {
            layer.setStyle({
                fillColor: "#06b6d4", // Bright Cyan
                fillOpacity: 0.8,
                color: "#0891b2",
                weight: 3
            });
        }

        layer.bindTooltip(
            `<b>${area}</b><br>Pincode: ${geoPincode}<br>Total Properties: ${total}`,
            { sticky: true }
        );

        layer.on({
            mouseover: (e) => {
                if (total === 0) e.target.setStyle(highlightStyle);
            },
            mouseout: (e) => {
                if (total === 0) e.target.setStyle(defaultStyle);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="map-modal" onClick={onClose}>
            <div className="map-container" onClick={(e) => e.stopPropagation()}>
                <button className="map-close-btn" onClick={onClose}>Close</button>

                <MapContainer
                    center={[23.0225, 72.5714]}
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />

                    <RecenterMap />

                    {geoData && (
                        <GeoJSON

                            key={`geojson-${Object.keys(properties).length}`}
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