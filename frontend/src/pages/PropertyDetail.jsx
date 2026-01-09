import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PropertyDetail.css";
import { FiMapPin, FiHome, FiMaximize, FiCalendar, FiUser, FiPhone, FiMail, FiHeart, FiShare2, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Fetch real property data from API
    const fetchProperty = async () => {
      try {
        const response = await fetch(`http://localhost:8082/api/properties/${id}`);
        if (!response.ok) {
          throw new Error("Property not found");
        }
        const data = await response.json();

        // Fetch agent's property count
        let agentPropertyCount = 0;
        try {
          const agentPropsResponse = await fetch(`http://localhost:8082/api/properties/agent/${data.agentId}`);
          if (agentPropsResponse.ok) {
            const agentProps = await agentPropsResponse.json();
            agentPropertyCount = agentProps.length;
          }
        } catch (e) {
          console.log("Could not fetch agent properties");
        }

        // Transform backend data to frontend format
        const transformedProperty = {
          id: data.id,
          title: data.title,
          description: data.description || `Beautiful ${data.bhk} BHK ${data.type} available for sale. This property offers ${data.area} sq.ft of living space with modern amenities and great connectivity.`,
          type: data.type,
          purpose: "Sale",
          price: data.price,
          pricePerSqft: data.area > 0 ? Math.round(data.price / data.area) : 0,
          area: data.area,
          bhk: data.bhk,
          bathrooms: data.bhk,
          balconies: Math.max(1, data.bhk - 1),
          floor: "Ground Floor",
          facing: "East",
          furnishing: "Semi-Furnished",
          age: "Ready to Move",
          city: data.city || "India",
          location: data.location || "Prime Location",
          address: data.address || "Contact agent for address details",
          images: data.photos ? data.photos.split(",") : [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"
          ],
          amenities: [
            "Parking", "Security", "Power Backup", "Lift",
            "Water Supply", "Gym", "Garden"
          ],
          isVerified: true,
          isRERA: false,
          reraId: "",
          agent: {
            name: data.agentName || "Agent",
            company: "Real Estate Agent",
            phone: "+91 98765 43210",
            email: data.agentEmail || "agent@realestate.com",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
            rating: 4.5,
            reviews: Math.floor(Math.random() * 100) + 10,
            propertiesListed: agentPropertyCount
          },
          agentId: data.agentId,
          postedDate: "Recently",
          views: Math.floor(Math.random() * 500) + 100,
          enquiries: Math.floor(Math.random() * 20) + 5
        };

        setProperty(transformedProperty);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching property:", error);
        setProperty(null);
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

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
          <button onClick={() => navigate("/properties")}>Browse Properties</button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail-page">
      <Navbar />

      <div className="property-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>Home</span>
          <span>/</span>
          <span onClick={() => navigate("/properties")}>Properties</span>
          <span>/</span>
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
            {property.images.map((img, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img src={img} alt={`View ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="property-content">
          <div className="main-content">
            {/* Title and Price */}
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
                <p className="price-per-sqft">₹{property.pricePerSqft.toLocaleString()}/sq.ft</p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="quick-info">
              <div className="info-item">
                <FiHome />
                <span>{property.bhk} BHK</span>
              </div>
              <div className="info-item">
                <FiMaximize />
                <span>{property.area} sq.ft</span>
              </div>
              <div className="info-item">
                <span>🚿</span>
                <span>{property.bathrooms} Baths</span>
              </div>
              <div className="info-item">
                <span>🏢</span>
                <span>{property.floor}</span>
              </div>
              <div className="info-item">
                <span>🧭</span>
                <span>{property.facing} Facing</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className={`action-btn ${isSaved ? 'saved' : ''}`}
                onClick={() => setIsSaved(!isSaved)}
              >
                <FiHeart /> {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="action-btn">
                <FiShare2 /> Share
              </button>
              <button className="action-btn primary" onClick={() => setShowContactForm(true)}>
                <FiPhone /> Contact Agent
              </button>
            </div>

            {/* Description */}
            <div className="section">
              <h3>Description</h3>
              <p className="description">{property.description}</p>
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
                  <span className="label">Super Built-up Area</span>
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
                  <span className="label">Property Age</span>
                  <span className="value">{property.age}</span>
                </div>
                {property.isRERA && (
                  <div className="detail-item">
                    <span className="label">RERA ID</span>
                    <span className="value">{property.reraId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <FiCheck /> {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Agent Info */}
          <div className="sidebar">
            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar">
                  <FiUser size={40} />
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
                <div className="stat">
                  <span className="value">{property.agent.reviews}</span>
                  <span className="label">Reviews</span>
                </div>
              </div>
              <div className="agent-actions">
                <a href={`tel:${property.agent.phone}`} className="contact-btn phone">
                  <FiPhone /> Call Now
                </a>
                <a href={`mailto:${property.agent.email}`} className="contact-btn email">
                  <FiMail /> Email
                </a>
              </div>
            </div>

            {/* Enquiry Form */}
            <div className="enquiry-form">
              <h4>Interested in this property?</h4>
              <form>
                <input type="text" placeholder="Your Name" required />
                <input type="email" placeholder="Email Address" required />
                <input type="tel" placeholder="Phone Number" required />
                <textarea placeholder="I am interested in this property. Please contact me with more details." rows="4"></textarea>
                <button type="submit" className="submit-btn">Send Enquiry</button>
              </form>
            </div>

            {/* Property Stats */}
            <div className="property-stats">
              <div className="stat-item">
                <FiCalendar />
                <span>Posted {property.postedDate}</span>
              </div>
              <div className="stat-item">
                <FiUser />
                <span>{property.views} views</span>
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

