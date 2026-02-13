import { FiHeart, FiMapPin, FiHome, FiMaximize } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../styles/PropertyCard.css";

function PropertyCard({ property, viewMode, formatPrice }) {
  const navigate = useNavigate();

  // purposeText is the verbatim text the agent entered (e.g. 'For Sale' or 'For Rent')
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
          src={
            property.image ||
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"
          }
          alt={property.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200";
          }}
        />


        {property.purpose && (
          <span className={`purpose-badge ${purposeClass}`}>
            {purposeText}
          </span>
        )}

        {property.isFeatured && (
          <span className="featured-badge">Featured</span>
        )}

        {property.isVerified && (
          <span className="verified-badge">✓ Verified</span>
        )}

        <button
          className="save-btn"
          onClick={(e) => {
            e.stopPropagation(); // prevent card click
            // TODO: handle save logic
          }}
          aria-label="Save property"
        >
          <FiHeart />
        </button>
      </div>

      <div className="property-info">
        <div className="price-row">
          <span className="price">{formatPrice(property.price)}</span>
          <span className="type-badge">{property.type}</span>
        </div>

        <h3 className="property-title">{property.title}</h3>

        <p className="property-location">
          <FiMapPin aria-hidden="true" />{" "}
          <span className="visually-hidden">Location:</span>{" "}
          {property.location || property.pinCode}
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
