import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  FiMessageSquare,
  FiSend,
  FiMaximize2
} from "react-icons/fi";
import { propertyApi, favoritesApi, chatApi, agentsApi } from "../api/api";
import { parsePropertyImages } from "../utils/imageUtils";
import { formatPrice } from "../utils/priceUtils";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [miniMessages, setMiniMessages] = useState([]);
  const [miniText, setMiniText] = useState("");
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const miniChatBodyRef = useRef(null);

  // Scroll bottom chat to bottom
  useEffect(() => {
    const chatBody = document.querySelector('.chat-bar-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [miniMessages]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await propertyApi.get(`/${id}`);

        // Fetch real agent profile (image + property count) from /api/agents/{agentId}
        let agentProfile = null;
        if (data.agentId) {
          try {
            const { data: agentData } = await agentsApi.get(`/${data.agentId}`);
            agentProfile = agentData;
          } catch (e) {
            console.log("Could not fetch agent profile:", e.message);
          }
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
          images: parsePropertyImages(data.photos).length > 0
            ? parsePropertyImages(data.photos)
            : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"],
          amenities: data.amenities
            ? data.amenities.split(',').map(a => a.trim()).filter(a => a.length > 0)
            : [],
          isVerified: data.isVerified ?? true,
          isRERA: data.isRERA ?? false,
          reraId: data.reraId || "",
          agent: {
            name: agentProfile?.name || data.agentName || "Agent",
            company: agentProfile?.company || data.agentCompany || "Real Estate Agent",
            phone: agentProfile?.phone || data.agentPhone || "+91 98765 43210",
            email: agentProfile?.email || data.agentEmail || "agent@realestate.com",
            // ✅ Use real profile picture from /api/agents/{id}
            image:
              agentProfile?.profilePicture ||
              data.agentImage ||
              "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
            rating: agentProfile?.rating ?? data.agentRating ?? 4.5,
            reviews: agentProfile?.reviews ?? data.agentReviews ?? Math.floor(Math.random() * 50) + 10,
            // ✅ Use real property count from /api/agents/{id}
            propertiesListed: agentProfile?.propertiesListed ?? 0,
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

  // Check saved status
  useEffect(() => {
    if (user?.id && id) {
      favoritesApi.get(`/check?userId=${user.id}&propertyId=${id}`)
        .then(res => setIsSaved(res.data.isFavorite))
        .catch(err => console.error(err));
    }
  }, [user?.id, id]);

  // Auto-scroll images every 3.5 seconds, pause on hover
  useEffect(() => {
    if (!property || property.images.length <= 1 || isHoveringCarousel) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }, 3500); // 3.5 seconds

    return () => clearInterval(interval);
  }, [property, isHoveringCarousel]);

  // Mini-Chat Logic
  useEffect(() => {
    if (user && property && user.role !== "AGENT") {
      const fetchMessages = async () => {
        try {
          const res = await chatApi.get("/conversation", {
            params: {
              propertyId: property.id,
              buyerId: user.id,
              agentId: property.agentId
            }
          });
          if (Array.isArray(res.data)) {
            setMiniMessages(res.data);
          } else {
            console.error("Chat response is not an array:", res.data);
            setMiniMessages([]);
          }
        } catch (err) {
          console.error("Mini-chat fetch error:", err);
        }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 10000); // Sync with 10s refresh
      return () => clearInterval(interval);
    }
  }, [user, property]);

  const sendMiniMessage = async () => {
    if (!miniText.trim()) return;
    try {
      const res = await chatApi.post("/send", {
        propertyId: property.id,
        buyerId: user.id,
        agentId: property.agentId,
        sender: "BUYER",
        message: miniText
      });
      setMiniMessages(prev => [...prev, res.data]);
      setMiniText("");
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  useEffect(() => {
    if (miniChatBodyRef.current) {
      miniChatBodyRef.current.scrollTop = miniChatBodyRef.current.scrollHeight;
    }
  }, [miniMessages]);

  const toggleFavorite = async () => {
    if (!user) {
      alert("Please login to save properties");
      navigate("/login");
      return;
    }
    try {
      if (isSaved) {
        await favoritesApi.delete(`/remove?userId=${user.id}&propertyId=${id}`);
        setIsSaved(false);
      } else {
        await favoritesApi.post(`/add?userId=${user.id}&propertyId=${id}`, {});
        setIsSaved(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data);
      } else {
        alert("Failed to update favorite");
      }
    }
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
          <span className="current" style={{ color: '#e2e8f0' }}>{property.title}</span>
        </div>

        {/* Image Gallery / Carousel Section */}
        <div className="property-gallery-container">
          <div
            className="main-carousel"
            onMouseEnter={() => setIsHoveringCarousel(true)}
            onMouseLeave={() => setIsHoveringCarousel(false)}
          >
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {property.images.map((img, idx) => (
                <div key={idx} className="carousel-slide">
                  <img src={img} alt={`${property.title} - View ${idx + 1}`} />
                </div>
              ))}
            </div>

            <button className="carousel-control prev" onClick={prevImage}>
              <FiChevronLeft />
            </button>
            <button className="carousel-control next" onClick={nextImage}>
              <FiChevronRight />
            </button>

            <div className="carousel-indicator">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            <div className="carousel-badges">
              {property.isVerified && <span className="premium-badge verified">Verified</span>}
              <span className="premium-badge type">{property.type}</span>
            </div>
          </div>

          <div className="carousel-thumbnails">
            {property.images.map((img, idx) => (
              <div
                key={idx}
                className={`thumb-item ${idx === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
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
                onClick={toggleFavorite}
                style={{
                  color: isSaved ? "#ef4444" : "inherit",
                  borderColor: isSaved ? "#ef4444" : "#e2e8f0"
                }}
              >
                <FiHeart fill={isSaved ? "#ef4444" : "rgba(255, 255, 255, 0.2)"} stroke="white" strokeWidth={2.5} /> {isSaved ? "Saved" : "Save"}
              </button>
              <button className="action-btn share" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}>
                <FiShare2 /> Share
              </button>

              {user?.role !== "AGENT" && (
                <button
                  className={`action-btn chat ${activeTab === "chat" ? "active" : ""}`}
                  onClick={() => {
                    if (!user) {
                      alert("Please login to chat");
                      navigate("/login");
                    } else {
                      setActiveTab("chat");
                      document.querySelector('.tabbed-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <FiMessageSquare /> Chat
                </button>
              )}
            </div>

            {/* Tabbed Content Section */}
            <div className="section tabbed-section">
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
                  onClick={() => setActiveTab("description")}
                >
                  Description
                </button>
                {user?.role !== "AGENT" && (
                  <button
                    className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
                    onClick={() => {
                      if (!user) {
                        alert("Please login to chat");
                        navigate("/login");
                      } else {
                        setActiveTab("chat");
                      }
                    }}
                  >
                    Chat with Agent
                  </button>
                )}
              </div>

              <div className="tab-content">
                {activeTab === "description" ? (
                  <div className="description-content">
                    <p>{property.description}</p>
                  </div>
                ) : (
                  <div className="embedded-chat-container">
                    <div className="chat-area-header">
                      <h4>Chatting with {property.agent.name}</h4>
                      <Link
                        to={`/buyer/chat/${property.id}/${property.agentId}`}
                        className="full-chat-link"
                        title="Open Dedicated Chat Page"
                      >
                        <FiMaximize2 /> Open Full Chat
                      </Link>
                    </div>
                    <div className="chat-area-body" ref={miniChatBodyRef}>
                      {miniMessages.length === 0 ? (
                        <div className="empty-chat-state">
                          <FiMessageSquare />
                          <p>Start a conversation about this property.</p>
                        </div>
                      ) : (
                        miniMessages.map((msg, idx) => (
                          <div key={idx} className={`chat-bubble ${msg.sender === "BUYER" ? "me" : "them"}`}>
                            {msg.message}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="chat-area-input">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={miniText}
                        onChange={(e) => setMiniText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMiniMessage()}
                      />
                      <button onClick={sendMiniMessage} disabled={!miniText.trim()} title="Send Message">
                        <FiSend size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

            {/* Amenities - Only show if amenities exist */}
            {property.amenities && property.amenities.length > 0 && (
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
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="agent-card">
              <Link to={`/agent/${property.agentId}`} className="agent-header-link">
                <div className="agent-header">
                  <div className="agent-avatar">
                    <img src={property.agent.image} alt={property.agent.name}
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200" }} />
                  </div>
                  <div>
                    <h4>{property.agent.name}</h4>
                    <p>{property.agent.company}</p>
                    <div className="agent-rating">
                      ⭐ {property.agent.rating} ({property.agent.reviews} reviews)
                    </div>
                  </div>
                </div>
              </Link>
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
    </div >
  );
}

export default PropertyDetail;
