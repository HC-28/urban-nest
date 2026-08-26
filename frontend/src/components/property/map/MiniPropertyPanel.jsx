import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../../utils/priceUtils";
import { parsePropertyImages } from "../../../utils/imageUtils";

export default function MiniPropertyPanel({
    selectedPincode,
    onClose,
    loading,
    properties,
    onSelectProperty
}) {
    const navigate = useNavigate();

    if (!selectedPincode) return null;

    return (
        <div className="mini-property-panel">
            <div className="mini-panel-header">
                <h3 className="mini-panel-title">Properties in {selectedPincode}</h3>
                <button
                    className="mini-panel-close"
                    onClick={onClose}
                    aria-label="Close panel"
                >
                    ✕
                </button>
            </div>

            {loading ? (
                <div className="mini-loading" role="status" aria-label="Loading properties">
                    <div className="mini-skeleton" />
                    <div className="mini-skeleton" />
                    <div className="mini-skeleton" />
                </div>
            ) : (
                <div className="mini-property-list">
                    {properties.length > 0 ? (
                        properties.map((p) => (
                            <div
                                key={p.id}
                                className="mini-property-card"
                                onClick={() => onSelectProperty(p.id)}
                                role="button"
                                tabIndex={0}
                            >
                                <img
                                    src={parsePropertyImages(p.photos)[0] || "/placeholder.jpg"}
                                    alt={p.title || "Property"}
                                    className="mini-card-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/placeholder.jpg";
                                    }}
                                />
                                <div className="mini-card-info">
                                    <div className="mini-card-price">{formatPrice(p.price)}</div>
                                    <div className="mini-card-title">{p.title}</div>
                                    <div className="mini-card-meta">
                                        {p.type} · {p.bhk} BHK · {p.area} sqft
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-properties-msg">No properties found in this area.</div>
                    )}

                    {properties.length > 0 && (
                        <button
                            className="view-all-btn"
                            onClick={() => {
                                onClose();
                                navigate(`/properties?pincode=${encodeURIComponent(selectedPincode)}`);
                            }}
                        >
                            View All in this Area →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
