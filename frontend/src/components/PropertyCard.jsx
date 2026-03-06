import { useState, useEffect } from "react";
import { FiMapPin, FiHome, FiMaximize } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../styles/PropertyCard.css";
import { favoritesApi } from "../api/api";
import toast from "react-hot-toast";
import { formatPrice as defaultFormatPrice } from "../utils/priceUtils";
import { parsePropertyImages } from "../utils/imageUtils";
import { useCompare } from "../context/CompareContext";

function PropertyCard({ property, viewMode, formatPrice = defaultFormatPrice, onUnfav, showFeaturedBadge = false }) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const { compareList, toggleCompare } = useCompare();

  const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#1e293b" width="400" height="300"/><path fill="#334155" d="M100 150l75-75 75 75v100h-150z"/><path fill="#475569" d="M150 175h50v75h-50z"/><circle fill="#94a3b8" cx="250" cy="100" r="25"/></svg>`)}`;
  const images = parsePropertyImages(property.photos || property.images);
  const displayImage = images.length > 0 ? images[0] : fallbackSvg;

  const purposeText = property.purpose || "For Sale";
  const purposeClass = (() => {
    const p = String(purposeText).toLowerCase();
    if (p.includes("sale")) return "sale";
    if (p.includes("rent")) return "rent";
    if (p.includes("commercial")) return "commercial";
    if (p.includes("project")) return "project";
    return "sale";
  })();

  const isNew = (() => {
    if (!property.listedDate) return false;
    const authDate = new Date(property.listedDate);
    if (isNaN(authDate)) return false;
    const now = new Date();
    const diffMs = now - authDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays < 7;
  })();

  const propertyId = property.id || property.propertyId;
  const isInCompare = compareList?.some(p => p.id === propertyId);

  // Relative time helper
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const posted = new Date(dateStr);
    if (isNaN(posted)) return dateStr;
    const now = new Date();
    const diffMs = now - posted;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  useEffect(() => {
    if (user?.id) {
      favoritesApi.get(`/status?userId=${user.id}&propertyId=${propertyId}`)
        .then(res => setIsSaved(res.data.isFavorite))
        .catch(err => console.error("Error checking favorite", err));
    }
  }, [user?.id, propertyId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save properties");
      navigate("/login");
      return;
    }
    try {
      if (isSaved) {
        await favoritesApi.delete(`/?userId=${user.id}&propertyId=${propertyId}`);
        setIsSaved(false);
        if (onUnfav) onUnfav(propertyId);
      } else {
        await favoritesApi.post(`/?userId=${user.id}&propertyId=${propertyId}`);
        setIsSaved(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data);
      } else {
        console.error("Error toggling favorite", error);
        toast.error("Error toggling favorite");
      }
    }
  };

  return (
    <div
      className={`property-card ${viewMode || ""}`}
      onClick={() => navigate(`/property/${propertyId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/property/${propertyId}`); }}
      aria-label={`View details for ${property.title}`}
    >
      {/* ─── Image Section ─── */}
      <div className="property-image">
        <img
          src={displayImage}
          alt={property.title}
          loading="lazy"
          onError={(e) => { e.target.src = fallbackSvg; }}
        />

        {/* Gradient overlay for readability */}
        <div className="image-gradient" />

        {/* Purpose badge (top-left) */}
        {property.purpose && (
          <span className={`purpose-badge ${purposeClass}`}>
            {purposeText}
          </span>
        )}

        {/* New badge */}
        {isNew && (
          <span className="new-badge" style={{ position: 'absolute', top: '10px', left: property.purpose ? '100px' : '10px', background: '#34d399', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>NEW</span>
        )}

        {/* Featured badge */}
        {showFeaturedBadge && property.featured && (
          <span className="featured-badge">★ Featured</span>
        )}

        {/* Verified badge */}
        {property.isVerified && (
          <span className="verified-badge">✓ Verified</span>
        )}

        {/* Heart / Save button */}
        <button
          className={`save-btn ${isSaved ? "active" : ""}`}
          onClick={handleToggleFavorite}
          aria-label={isSaved ? "Unsave property" : "Save property"}
        >
          <span className="heart-icon">{isSaved ? "♥" : "♡"}</span>
        </button>

        {/* Compare button */}
        <button
          className={`compare-card-btn ${isInCompare ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleCompare(property); }}
          title={isInCompare ? "Remove from Compare" : "Add to Compare"}
        >
          <span className="compare-icon">⇄</span>
        </button>

        {/* Price overlay on image (Trulia-style) */}
        <div className="price-overlay">
          <span className="price">{formatPrice(property.price)}</span>
        </div>
      </div>

      {/* ─── Info Section ─── */}
      <div className="property-info">
        <h3 className="property-title">{property.title}</h3>

        <p className="property-location">
          <FiMapPin aria-hidden="true" />
          <span className="visually-hidden">Location:</span>
          {property.location || property.city || property.pinCode}
        </p>

        {/* Compact feature row: beds · baths · sqft */}
        <div className="property-features-row">
          <span>{property.bhk ? `${property.bhk} BHK` : purposeText}</span>
          <span className="dot-sep">·</span>
          <span>{property.bathrooms} Bath</span>
          <span className="dot-sep">·</span>
          <span>{property.area} sq.ft</span>
        </div>

        {/* Footer: agent + time */}
        <div className="property-footer">
          <div className="agent-info">
            <div className="agent-avatar">
              {(property.postedBy || property.agentName || "A").charAt(0).toUpperCase()}
            </div>
            <span className="posted-by">
              {property.postedBy || property.agentName || "Agent"}
            </span>
          </div>
          <span className="posted-date">
            {getTimeAgo(property.postedDate || property.createdAt)}
          </span>
        </div>

        {/* Amenities in list view */}
        {viewMode === "list" && (
          <div className="property-amenities">
            {(property.amenities || []).slice(0, 4).map((amenity, index) => (
              <span key={index} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
