import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PropertyDetail.css";
import {
  FiMapPin,
  FiHome,
  FiMaximize,
  FiUser,
  FiPhone,
  FiMail,
  FiHeart,
  FiShare2,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { propertyApi } from "../api/api";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await propertyApi.get(`/properties/${id}`);

        // Fetch agent's property count safely
        let agentPropertyCount = 0;
        try {
          const { data: agentProps } = await propertyApi.get(
              `/agent/${data.agentId}/properties`
          );
          agentPropertyCount = agentProps?.length || 0;
        } catch (e) {
          console.log("Could not fetch agent properties:", e.message);
        }

        // Transform property to handle defaults
        const transformedProperty = {
          id: data.id,
          title: data.title,
          description:
              data.description ||
              `Beautiful ${data.bhk} BHK ${data.type} available for sale. This property offers ${data.area} sq.ft of living space.`,
          type: data.type,
          purpose: "Sale",
          price: data.price,
          pricePerSqft: data.area ? Math.round(data.price / data.area) : 0,
          area: data.area,
          bhk: data.bhk,
          bathrooms: data.bathrooms || data.bhk,
          balconies: Math.max(1, data.bhk - 1),
          floor: data.floor || "Ground Floor",
          facing: data.facing || "East",
          furnishing: data.furnishing || "Semi-Furnished",
          age: data.age || "Ready to Move",
          city: data.city || "India",
          location: data.location || "Prime Location",
          address: data.address || "Contact agent for address details",
          images: data.photos
              ? data.photos.includes(",")
                  ? data.photos.split(",")
                  : [data.photos]
              : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"],
          amenities: data.amenities || [
            "Parking",
            "Security",
            "Power Backup",
            "Lift",
            "Water Supply",
            "Gym",
            "Garden",
          ],
          isVerified: data.isVerified ?? true,
          isRERA: data.isRERA ?? false,
          reraId: data.reraId || "",
          agent: {
            name: data.agentName || "Agent",
            company: data.agentCompany || "Real Estate Agent",
            phone: data.agentPhone || "+91 98765 43210",
            email: data.agentEmail || "agent@realestate.com",
            image:
                data.agentImage ||
                "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
            rating: data.agentRating ?? 4.5,
            reviews: data.agentReviews ?? Math.floor(Math.random() * 100) + 10,
            propertiesListed: agentPropertyCount,
          },
          agentId: data.agentId,
          postedDate: data.postedDate || "Recently",
          views: data.views ?? Math.floor(Math.random() * 500) + 100,
          enquiries: data.enquiries ?? Math.floor(Math.random() * 20) + 5,
        };

        setProperty(transformedProperty);
      } catch (error) {
        console.error("Error fetching property:", error.message);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Price formatting: show number only with commas, no L or Cr
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "Price on Request";
    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const nextImage = () =>
      setCurrentImageIndex((prev) =>
          prev === property.images.length - 1 ? 0 : prev + 1
      );

  const prevImage = () =>
      setCurrentImageIndex((prev) =>
          prev === 0 ? property.images.length - 1 : prev - 1
      );

  if (loading) {
    return (
        <div className="property-detail-page">
          <Navbar />
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading property details...</p>
          </div>
        </div>
    );
  }

  if (!property) {
    return (
        <div className="property-detail-page">
          <Navbar />
          <div className="not-found">
            <h2>Property Not Found</h2>
            <button onClick={() => navigate("/properties")}>
              Browse Properties
            </button>
          </div>
          <Footer />
        </div>
    );
  }

  return (
      <div className="property-detail-page">
        <Navbar />

        <div className="property-detail-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span onClick={() => navigate("/")}>Home</span> /{" "}
            <span onClick={() => navigate("/properties")}>Properties</span> /{" "}
            <span className="current">{property.title}</span>
          </div>

          {/* Image Gallery */}
          <div className="image-gallery">
            <div className="main-image">
              <img src={property.images[currentImageIndex]} alt={property.title} />
              <button className="gallery-nav prev" onClick={prevImage}>
                <FiChevronLeft />
              </button>
              <button className="gallery-nav next" onClick={nextImage}>
                <FiChevronRight />
              </button>
              <div className="image-counter">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>
            <div className="thumbnail-strip">
              {property.images.map((img, idx) => (
                  <div
                      key={idx}
                      className={`thumbnail ${idx === currentImageIndex ? "active" : ""}`}
                      onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt={`View ${idx + 1}`} />
                  </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="property-content">
            <div className="main-content">
              {/* Title & Price */}
              <div className="property-header">
                <div className="title-section">
                  <div className="badges">
                    {property.isVerified && <span className="badge verified">✓ Verified</span>}
                    {property.isRERA && <span className="badge rera">RERA</span>}
                    <span className="badge type">{property.purpose}</span>
                  </div>
                  <h1>{property.title}</h1>
                  <p className="location">
                    <FiMapPin /> {property.address}
                  </p>
                </div>
                <div className="price-section">
                  <h2 className="price">{formatPrice(property.price)}</h2>
                  <p className="price-per-sqft">
                    ₹{property.pricePerSqft.toLocaleString("en-IN")}/sq.ft
                  </p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="quick-info">
                <div className="info-item">
                  <FiHome /> <span>{property.bhk} BHK</span>
                </div>
                <div className="info-item">
                  <FiMaximize /> <span>{property.area} sq.ft</span>
                </div>
                <div className="info-item">🚿 <span>{property.bathrooms} Baths</span></div>
                <div className="info-item">🏢 <span>{property.floor}</span></div>
                <div className="info-item">🧭 <span>{property.facing} Facing</span></div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                    className={`action-btn ${isSaved ? "saved" : ""}`}
                    onClick={() => setIsSaved(!isSaved)}
                >
                  <FiHeart /> {isSaved ? "Saved" : "Save"}
                </button>
                <button className="action-btn">
                  <FiShare2 /> Share
                </button>
              </div>

              {/* Description */}
              <div className="section">
                <h3>Description</h3>
                <p>{property.description}</p>
              </div>

              {/* Property Details */}
              <div className="section">
                <h3>Property Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Property Type</span>
                    <span className="value">{property.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Bedrooms</span>
                    <span className="value">{property.bhk}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Bathrooms</span>
                    <span className="value">{property.bathrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Balconies</span>
                    <span className="value">{property.balconies}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Area</span>
                    <span className="value">{property.area} sq.ft</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Floor</span>
                    <span className="value">{property.floor}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Facing</span>
                    <span className="value">{property.facing}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Furnishing</span>
                    <span className="value">{property.furnishing}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Age</span>
                    <span className="value">{property.age}</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="section">
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {property.amenities.map((amenity, idx) => (
                      <div key={idx} className="amenity-item">
                        <FiCheck /> {amenity}
                      </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div className="agent-card">
                <div className="agent-header">
                  <div className="agent-avatar">
                    <img src={property.agent.image} alt={property.agent.name} />
                  </div>
                  <div>
                    <h4>{property.agent.name}</h4>
                    <p>{property.agent.company}</p>
                    <div className="agent-rating">
                      ⭐ {property.agent.rating} ({property.agent.reviews} reviews)
                    </div>
                  </div>
                </div>
                <div className="agent-stats">
                  <div className="stat">
                    <span className="value">{property.agent.propertiesListed}</span>
                    <span className="label">Properties</span>
                  </div>
                </div>
                <div className="agent-actions">
                  <a href={`tel:${property.agent.phone}`} className="contact-btn phone">
                    <FiPhone /> Call
                  </a>
                  <a href={`mailto:${property.agent.email}`} className="contact-btn email">
                    <FiMail /> Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
  );
}

export default PropertyDetail;
