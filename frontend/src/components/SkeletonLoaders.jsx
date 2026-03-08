import React from 'react';
import '../styles/SkeletonLoaders.css';

export const PropertySkeleton = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-img"></div>
            <div className="skeleton-content">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line location"></div>
                <div className="skeleton-features">
                    <div className="skeleton-box"></div>
                    <div className="skeleton-box"></div>
                    <div className="skeleton-box"></div>
                </div>
                <div className="skeleton-footer">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-line date"></div>
                </div>
            </div>
        </div>
    );
};

export const AgentSkeleton = () => {
    return (
        <div className="skeleton-agent-card">
            <div className="skeleton-agent-header">
                <div className="skeleton-avatar lg"></div>
                <div className="skeleton-line title center"></div>
                <div className="skeleton-line subtitle center"></div>
            </div>
            <div className="skeleton-agent-body">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
            </div>
            <div className="skeleton-agent-footer">
                <div className="skeleton-btn"></div>
            </div>
        </div>
    );
};
