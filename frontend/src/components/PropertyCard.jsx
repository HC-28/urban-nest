import { useState, useEffect } from "react";
import { FiHeart, FiMapPin, FiHome, FiMaximize } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../styles/PropertyCard.css";
import { favoritesApi } from "../api/api";
import { formatPrice as defaultFormatPrice } from "../utils/priceUtils";
import { parsePropertyImages } from "../utils/imageUtils";

function PropertyCard({ property, viewMode, formatPrice = defaultFormatPrice, onUnfav }) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  // Get safe image using the utility
  const images = parsePropertyImages(property.photos || property.images);
  const displayImage = images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200";

  // purposeText is the verbatim text (e.g. 'For Sale' or 'For Rent')
  const purposeText = property.purpose || "For Sale";

  // Map human text to a stable short class for CSS
  const purposeClass = (() => {
    const p = String(purposeText).toLowerCase();
    if (p.includes("sale")) return "sale";
    if (p.includes("rent")) return "rent";
    if (p.includes("commercial")) return "commercial";
    if (p.includes("project")) return "project";
    return "sale";
  })();

  // ⚠️ IMPORTANT: change property.id if your backend uses different key
  const propertyId = property.id || property.propertyId;

  // Check if saved on mount
  useEffect(() => {
    if (user) {
      favoritesApi.get(`/check?userId=${user.id}&propertyId=${propertyId}`)
        .then(res => setIsSaved(res.data.isFavorite))
        .catch(err => console.error("Error checking favorite", err));
    }
  }, [user, propertyId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to save properties");
      navigate("/login");
      return;
    }

    try {
      if (isSaved) {
        await favoritesApi.delete(`/remove?userId=${user.id}&propertyId=${propertyId}`);
        setIsSaved(false);
        if (onUnfav) onUnfav(propertyId);
      } else {
        await favoritesApi.post(`/add?userId=${user.id}&propertyId=${propertyId}`);
        setIsSaved(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data); // Max limit reached message
      } else {
        console.error("Error toggling favorite", error);
      }
    }
  };

  return (
    <div
      className={`property-card ${viewMode}`}
      onClick={() => navigate(`/property/${propertyId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/property/${propertyId}`);
        }
      }}
      aria-label={`View details for ${property.title}`}
    >
      <div className="property-image">
        <img
          src={displayImage}
          alt={property.title}
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"; }}
        />

        {property.purpose && (
          <span className={`purpose-badge ${purposeClass}`}>
            {purposeText}
          </span>
        )}

        {property.featured && (
          <span className="featured-badge">Featured</span>
        )}

        {property.isVerified && (
          <span className="verified-badge">✓ Verified</span>
        )}

        <button
          className={`save-btn ${isSaved ? "active" : ""}`}
          onClick={handleToggleFavorite}
          aria-label={isSaved ? "Unsave property" : "Save property"}
          style={{ color: isSaved ? "#ef4444" : "inherit" }}
        >
          <FiHeart fill={isSaved ? "#ef4444" : "none"} />
        </button>
      </div>

      <div className="property-info">
        <div className="price-row">
          <span className="price">{formatPrice(property.price)}</span>
        </div>

        <h3 className="property-title">{property.title}</h3>

        <p className="property-location">
          <FiMapPin aria-hidden="true" />{" "}
          <span className="visually-hidden">Location:</span>{" "}
          {property.location || property.city || property.pinCode}
        </p>

        <div className="property-features">
          <span>
            <FiHome /> {purposeText || (property.bhk ? `${property.bhk} BHK` : "-")}
          </span>
          <span>
            <FiMaximize /> {property.area} sq.ft
          </span>
          <span aria-hidden>🚿 {property.bathrooms} Bath</span>
        </div>

        <div className="property-footer">
          <span className="posted-by">
            {property.postedBy || property.agentName || "Agent"}
          </span>
          <span className="posted-date">
            {property.postedDate || "Recently"}
          </span>
        </div>

        {viewMode === "list" && (
          <div className="property-amenities">
            {(property.amenities || []).slice(0, 4).map((amenity, index) => (
              <span key={index} className="amenity-tag">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
