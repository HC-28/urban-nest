import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatPrice } from "../../../utils/priceUtils";
import { getPolygonCentroid, extractFeaturePincode } from "./geoUtils";

export default function PropertyPins({
    showPins,
    properties,
    geoData,
    onSelectPin
}) {
    if (!showPins || !properties || properties.length === 0) return null;

    return (
        <>
            {properties.map((p, index) => {
                let lat = p.latitude;
                let lng = p.longitude;

                // Fallback to zone centroid if GPS coordinates are missing on property record
                if (!lat || !lng) {
                    if (geoData && p.pinCode) {
                        const feature = geoData.features?.find(
                            (f) => extractFeaturePincode(f) === String(p.pinCode).trim()
                        );
                        if (feature && feature.geometry) {
                            const centroid = getPolygonCentroid(
                                feature.geometry.coordinates,
                                feature.geometry.type
                            );
                            if (centroid) {
                                const offsetLat = ((index % 5) - 2) * 0.001;
                                const offsetLng = (((index * 3) % 5) - 2) * 0.001;
                                lat = centroid[0] + offsetLat;
                                lng = centroid[1] + offsetLng;
                            }
                        }
                    }
                }

                if (!lat || !lng) return null;

                const priceIcon = L.divIcon({
                    className: "price-marker-icon",
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
                            click: () => onSelectPin(p)
                        }}
                    >
                        <Popup>
                            <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 150 }}>
                                <strong>{p.title}</strong>
                                <br />
                                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                                    {formatPrice(p.price)}
                                </span>
                                <br />
                                <small>
                                    {p.type} · {p.bhk} BHK
                                </small>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}
