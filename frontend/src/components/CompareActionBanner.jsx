import React from 'react';
import { useCompare } from '../context/CompareContext';
import '../styles/CompareTool.css';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CompareActionBanner = () => {
    const { compareList, removeFromCompare, clearCompare, openCompareModal } = useCompare();

    if (compareList.length === 0) return null;

    return (
        <div className="compare-banner animate-slide-up">
            <div className="compare-banner-inner">
                <div className="compare-items">
                    {compareList.map((property) => (
                        <div key={property.id} className="compare-thumb">
                            <button className="remove-thumb-btn" onClick={() => removeFromCompare(property.id)}>
                                <CloseIcon />
                            </button>
                            <img src={property.images?.[0] || 'https://via.placeholder.com/150'} alt={property.title} />
                            <span className="compare-thumb-title">{property.title.substring(0, 15)}...</span>
                        </div>
                    ))}
                    {/* Placeholders for remaining slots */}
                    {[...Array(4 - compareList.length)].map((_, i) => (
                        <div key={`empty-${i}`} className="compare-thumb empty">
                            <span className="empty-text">Add +</span>
                        </div>
                    ))}
                </div>

                <div className="compare-actions">
                    <button className="clear-btn" onClick={clearCompare}>Clear</button>
                    <button
                        className="compare-btn"
                        disabled={compareList.length < 2}
                        onClick={openCompareModal}
                    >
                        Compare {compareList.length}/4
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompareActionBanner;
