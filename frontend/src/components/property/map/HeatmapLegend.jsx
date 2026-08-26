import React from "react";
import { STATIC_BINS_MAP } from "./heatmapConstants";

export default function HeatmapLegend({
    isOpen,
    onToggle,
    palette,
    heatmapMode,
    heatmapData,
    loading
}) {
    const hasData = Object.keys(heatmapData || {}).length > 0;
    const staticBins = STATIC_BINS_MAP[heatmapMode] || [33, 66];

    const legendItems = [
        {
            color: palette.colors[0],
            label: `Low${heatmapMode === "price" ? " (< ₹" + Math.round(staticBins[0] / 1000) + "K)" : ""}`
        },
        {
            color: palette.colors[1],
            label: `Medium${heatmapMode === "price" ? " (₹" + Math.round(staticBins[0] / 1000) + "K–₹" + Math.round(staticBins[1] / 1000) + "K)" : ""}`
        },
        {
            color: palette.colors[2],
            label: `High${heatmapMode === "price" ? " (> ₹" + Math.round(staticBins[1] / 1000) + "K)" : ""}`
        }
    ];

    return (
        <div className={`map-legend ${isOpen ? "open" : "collapsed"}`}>
            <div
                className="legend-header"
                onClick={onToggle}
                role="button"
                aria-expanded={isOpen}
            >
                <span className="legend-title">{palette.title}</span>
                <span className="legend-toggle">{isOpen ? "▾" : "▸"}</span>
            </div>

            {isOpen && (
                <div className="legend-items">
                    <div className="legend-item">
                        <span
                            className="legend-color"
                            style={{ background: "#f0f0f0", border: "1px solid rgba(255,255,255,0.3)" }}
                        />
                        <span>No properties</span>
                    </div>

                    <div className="legend-item">
                        <span
                            className="legend-color"
                            style={{ background: (palette.colors?.[0] || "#93c5fd") + "44", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                        <span>Low Density (&lt;5 listings)</span>
                    </div>

                    {loading ? (
                        <div className="legend-item">
                            <span style={{ color: "#64748b", fontSize: "11px" }}>Loading data...</span>
                        </div>
                    ) : hasData ? (
                        legendItems.map((item, i) => (
                            <div key={i} className="legend-item">
                                <span className="legend-color" style={{ background: item.color }} />
                                <span>{item.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: "#6b7280" }} />
                            <span>No data available</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
