import React from "react";
import { CITIES, TILE_LAYERS, getModes } from "./heatmapConstants";
import { PURPOSES, PROPERTY_TYPES } from "../../../utils/constants";

export default function MapToolbar({
    selectedCity,
    onCityChange,
    selectedArea,
    onAreaChange,
    availableAreas,
    heatmapMode,
    onModeChange,
    selectedType,
    onTypeChange,
    selectedPurpose,
    onPurposeChange,
    showPins,
    onTogglePins,
    tileLayer,
    onTileLayerChange,
    showInfo,
    onToggleInfo,
    isAgent
}) {
    const modes = getModes(isAgent);

    return (
        <div className="map-toolbar">
            <div className="toolbar-left">
                {/* City Section */}
                <div className="toolbar-section">
                    <div className="city-selector">
                        {CITIES.map((city) => (
                            <button
                                key={city.name}
                                className={`city-btn ${selectedCity === city.name ? "active" : ""}`}
                                onClick={() => onCityChange(city.name)}
                                aria-pressed={selectedCity === city.name}
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
                            onChange={(e) => onAreaChange(e.target.value)}
                            aria-label="Filter by neighborhood"
                        >
                            <option value="">All Areas</option>
                            {availableAreas.map((a) => (
                                <option key={a.name} value={a.name}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <select
                        className="toolbar-select mode-select"
                        value={heatmapMode}
                        onChange={(e) => onModeChange(e.target.value)}
                        aria-label="Heatmap analytics mode"
                    >
                        {modes.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.icon} {m.label}
                            </option>
                        ))}
                    </select>

                    <select
                        className="toolbar-select type-select"
                        value={selectedType}
                        onChange={(e) => onTypeChange(e.target.value)}
                        aria-label="Property type"
                    >
                        {PROPERTY_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    <div className="tile-pills purpose-pills">
                        <button
                            className={`tile-pill ${selectedPurpose === PURPOSES.BUY ? "active" : ""}`}
                            onClick={() => onPurposeChange(PURPOSES.BUY)}
                        >
                            BUY
                        </button>
                        <button
                            className={`tile-pill ${selectedPurpose === PURPOSES.RENT ? "active" : ""}`}
                            onClick={() => onPurposeChange(PURPOSES.RENT)}
                        >
                            RENT
                        </button>
                    </div>
                </div>
            </div>

            <div className="toolbar-right">
                {/* Map Settings Section */}
                <div className="toolbar-section">
                    <div
                        className="pin-toggle"
                        onClick={onTogglePins}
                        title="Toggle Property Markers"
                        role="switch"
                        aria-checked={showPins}
                    >
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
                                onClick={() => onTileLayerChange(key)}
                                title={`${val.label} Mode`}
                                aria-pressed={tileLayer === key}
                            >
                                {val.label.charAt(0)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="toolbar-divider" />

                {/* Guide Button */}
                <div className="toolbar-section map-actions-section">
                    <button
                        className={`toolbar-icon-btn info-btn-pill ${showInfo ? "active" : ""}`}
                        onClick={onToggleInfo}
                        title="Market Score Guide"
                        aria-expanded={showInfo}
                    >
                        <span className="btn-icon">ℹ️</span>
                        <span className="btn-text">Guide</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
