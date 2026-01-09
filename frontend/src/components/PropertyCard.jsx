import { FiHeart, FiMapPin, FiHome, FiMaximize } from "react-icons/fi";
import "../styles/PropertyCard.css";

function PropertyCard({ property, viewMode, formatPrice, onClick }) {
  return (
    <div className={`property-card ${viewMode}`} onClick={onClick}>
      <div className="property-image">
        <img src={property.image} alt={property.title} />
        {property.isFeatured && <span className="featured-badge">Featured</span>}
        {property.isVerified && <span className="verified-badge">✓ Verified</span>}
        <button className="save-btn" onClick={(e) => { e.stopPropagation(); }}>
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
          <FiMapPin /> {property.location}, {property.city}
        </p>

        <div className="property-features">
          <span><FiHome /> {property.bhk} BHK</span>
          <span><FiMaximize /> {property.area} sq.ft</span>
          <span>🚿 {property.bathrooms} Bath</span>
        </div>

        <div className="property-footer">
          <span className="posted-by">{property.postedBy}</span>
          <span className="posted-date">{property.postedDate}</span>
        </div>

        {viewMode === "list" && (
          <div className="property-amenities">
            {property.amenities.slice(0, 4).map((amenity, index) => (
              <span key={index} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;

