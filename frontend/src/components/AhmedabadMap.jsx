import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";

function AhmedabadMap({ onClose }) {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch("/geo/Ahmedabad.json")
            .then((res) => res.json())
            .then((data) => setGeoData(data))
            .catch((err) => console.error("Error loading GeoJSON:", err));
    }, []);

    const style = {
        fillColor: "#ffffff", // white fill
        weight: 2,
        color: "#007bff", // blue border
        fillOpacity: 0.5,
    };

    const onEachFeature = (feature, layer) => {
        layer.bindTooltip(
            `<div>
        <strong>${feature.properties.name || "Area"}</strong><br/>
        Pincode: ${feature.properties.pincode || "N/A"}
      </div>`,
            { sticky: true }
        );

        layer.on({
            mouseover: (e) => e.target.setStyle({ fillOpacity: 0.7, color: "#ff9800" }),
            mouseout: (e) => e.target.setStyle({ fillOpacity: 0.5, color: "#007bff" }),
        });
    };

    return (
        <div className="map-modal">
            <div className="map-container">
                <button className="map-close-btn" onClick={onClose}>
                    Close
                </button>

                {geoData ? (
                    <MapContainer
                        center={[23.0225, 72.5714]} // Ahmedabad center
                        zoom={12}
                        scrollWheelZoom={true}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                        />
                        <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />
                    </MapContainer>
                ) : (
                    <p style={{ textAlign: "center", marginTop: "50%" }}>Loading map...</p>
                )}
            </div>
        </div>
    );
}

export default AhmedabadMap;
