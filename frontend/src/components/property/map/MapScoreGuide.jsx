import React from "react";
import { SCORE_DESCRIPTIONS } from "./heatmapConstants";

export default function MapScoreGuide({ heatmapMode, isOpen, onClose }) {
    if (!isOpen || !SCORE_DESCRIPTIONS[heatmapMode]) return null;

    const info = SCORE_DESCRIPTIONS[heatmapMode];

    return (
        <div className="score-info-panel" role="region" aria-label="Market Score Guide">
            <button
                className="score-info-close"
                onClick={onClose}
                aria-label="Close guide"
            >
                ✕
            </button>
            <h3 className="score-info-title">{info.title}</h3>
            <p className="score-info-desc">{info.description}</p>
            <div className="score-info-tip">
                <span>💡</span>
                <p>{info.tip}</p>
            </div>
        </div>
    );
}
