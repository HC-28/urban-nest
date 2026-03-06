import React from 'react';
import { useCompare } from '../context/CompareContext';
import { FiX, FiCheck, FiMapPin } from 'react-icons/fi';
import { formatPrice } from '../utils/priceUtils';
import { useNavigate } from 'react-router-dom';
import '../styles/CompareTool.css';

const CompareModal = () => {
    const { compareList, showCompareModal, closeCompareModal, removeFromCompare } = useCompare();
    const navigate = useNavigate();

    if (!showCompareModal || compareList.length < 2) return null;

    // Helper to get amenities safely
    const hasAmenity = (property, amenityName) => {
        return property.amenities?.some(a => a.toLowerCase().includes(amenityName.toLowerCase())) ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />;
    };

    const commonAmenities = ["Parking", "Security", "Power Backup", "Gym", "Lift"];

    return (
        <div className="compare-modal-overlay">
            <div className="compare-modal">
                <button className="compare-modal-close" onClick={closeCompareModal}>
                    <FiX />
                </button>

                <h2 className="compare-title">Compare Properties</h2>

                <div className="compare-table-wrapper">
                    <table className="compare-table">
                        <thead>
                            <tr>
                                <th className="feature-col">Features</th>
                                {compareList.map(property => (
                                    <th key={property.id} className="property-col">
                                        <div className="compare-card-header">
                                            <button className="remove-col-btn" onClick={() => {
                                                removeFromCompare(property.id);
                                                if (compareList.length === 2) closeCompareModal();
                                            }}>Remove</button>
                                            <img src={property.images?.[0] || 'https://via.placeholder.com/300'} alt={property.title} />
                                            <h3>{property.title}</h3>
                                            <p className="compare-price">{formatPrice(property.priceRaw || property.price)}</p>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Location</td>
                                {compareList.map(p => <td key={p.id}><FiMapPin className="inline-icon" /> {p.location || p.city || p.address || p.pinCode || 'N/A'}</td>)}
                            </tr>
                            <tr>
                                <td>Property Type</td>
                                {compareList.map(p => <td key={p.id}>{p.type || 'N/A'}</td>)}
                            </tr>
                            <tr>
                                <td>Purpose</td>
                                {compareList.map(p => <td key={p.id}><span className="compare-badge">{p.purpose || 'Sale'}</span></td>)}
                            </tr>
                            <tr>
                                <td>BHK</td>
                                {compareList.map(p => <td key={p.id}><strong>{p.bhk || 'N/A'}</strong></td>)}
                            </tr>
                            <tr>
                                <td>Area (sq.ft)</td>
                                {compareList.map(p => <td key={p.id}>{p.area || 'N/A'}</td>)}
                            </tr>
                            <tr>
                                <td>Bathrooms</td>
                                {compareList.map(p => <td key={p.id}>{p.bathrooms || 'N/A'}</td>)}
                            </tr>

                            <tr className="section-row"><td colSpan={compareList.length + 1}>Top Amenities</td></tr>

                            {commonAmenities.map(amenity => (
                                <tr key={amenity}>
                                    <td>{amenity}</td>
                                    {compareList.map(p => <td key={p.id} className="amenity-cell">{hasAmenity(p, amenity)}</td>)}
                                </tr>
                            ))}

                            <tr>
                                <td>Action</td>
                                {compareList.map(p => (
                                    <td key={p.id}>
                                        <button
                                            className="view-btn"
                                            onClick={() => {
                                                closeCompareModal();
                                                navigate(`/property/${p.id}`);
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompareModal;
