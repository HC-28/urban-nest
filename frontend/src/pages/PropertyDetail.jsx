import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MapModal from "../components/MapModal";
import AppointmentActionPanel from "../components/AppointmentActionPanel";
import "../styles/PropertyDetail.css";
import { propertyApi, favoritesApi, userApi, chatApi, slotsApi, appointmentApi, BASE_URL, IMAGE_URL } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import { parsePropertyImages } from "../utils/imageUtils";
import { addToRecentlyViewed } from "../utils/recentlyViewed";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

import { 
  FiEye, FiHeart, FiShare2, FiHome, FiMaximize, 
  FiCalendar, FiMapPin, FiUser, FiCheck, FiMail, 
  FiPhone, FiX, FiChevronLeft, FiChevronRight 
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";

/* ─── SVG Icon Wrappers (Migrated to React-Icons) ─── */
const StarIcon = ({ filled = false, onClick, size = 18, className }) => (
  <FaStar 
    className={className} 
    onClick={onClick} 
    size={size}
    style={{ 
      cursor: onClick ? 'pointer' : 'default', 
      color: filled ? '#F59E0B' : '#64748b', 
      transition: 'color 0.2s' 
    }} 
  />
);

const EyeIcon = ({ className }) => <FiEye className={className} size={18} />;

const HeartIcon = ({ className }) => <FiHeart className={className} size={18} style={{ display: 'block' }} />;

const ShareIcon = ({ className, style }) => <FiShare2 className={className} style={style} size={18} />;

const HomeIcon = () => <FiHome size={18} />;

const MaximizeIcon = () => <FiMaximize size={18} />;

const CalendarIcon = ({ className, style, size = 18 }) => <FiCalendar className={className} style={style} size={size} />;

const MapPinIcon = ({ className }) => <FiMapPin className={className} size={18} />;

const UserIcon = () => <FiUser size={18} />;

const CheckIcon = () => <FiCheck size={16} />;

const MailIcon = ({ className }) => <FiMail className={className} size={18} />;

const PhoneIcon = () => <FiPhone size={18} />;

const CloseIcon = () => <FiX size={24} />;

const ChevronLeftIcon = () => <FiChevronLeft size={24} style={{ display: 'block' }} />;

const ChevronRightIcon = () => <FiChevronRight size={24} style={{ display: 'block' }} />;

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const [showSlots, setShowSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const chatMessagesRef = useRef(null);

  // Agent Review State
  const [agentStats, setAgentStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const resp = await propertyApi.get(`/${id}?userId=${user?.id || ""}&role=${user?.role || ""}`);
        const data = resp.data;

        const transformedProperty = {
          id: data.id,
          title: data.title,
          purpose: data.purpose,
          description:
            data.description ||
            `Beautiful ${data.bhk} BHK ${data.type}. This property offers ${data.area} sq.ft.`,
          priceRaw: data.price,
          price: Math.round(data.price / 100000),
          pricePerSqft: data.area ? Math.round(data.price / data.area) : 0,
          area: data.area,
          bhk: data.bhk,
          age: "Ready to Move",
          address: data.address ? `${data.address}` : (data.location || "Prime Location"),
          images: parsePropertyImages(data.photos || data.images).length > 0
            ? parsePropertyImages(data.photos || data.images).map(p =>
              p.startsWith("data:") || p.startsWith("http")
                ? p
                : `${IMAGE_URL}${encodeURIComponent(p)}`
            )
            : ["/property-placeholder.jpg"],
          amenities: data.amenities
            ? data.amenities.split(",").map(a => a.trim()).filter(Boolean)
            : ["Parking", "Security", "Power Backup", "Lift", "Water Supply"],
          agentId: data.agentId,
          agent: {
            name: data.agentName || "Agent",
            email: data.agentEmail || "agent@email.com"
          },
          views: data.views || 0,
          favorites: data.favorites || 0,
          inquiries: data.inquiries || 0,
          listedDate: data.listedDate || null,
          sold: data.sold || false,
          soldToUserId: data.soldToUserId || null,
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          pinCode: data.pinCode
        };

        let propertyData = { ...transformedProperty };

        if (data.agentId) {
          try {
            const agentRes = await userApi.get(`/${data.agentId}`);
            propertyData.agent = {
              name: agentRes.data.name || data.agentName,
              email: agentRes.data.email || data.agentEmail,
              profilePicture: agentRes.data.profilePicture
            };
          } catch (e) {
            console.error("Agent detail fetch failed:", e);
          }
        }

        setProperty(propertyData);
        addToRecentlyViewed(data);

        if (user) {
          try {
            const res = await favoritesApi.get("/status", {
              params: { userId: user.id, propertyId: data.id }
            });
            setIsSaved(res.data.isFavorite);
          } catch (e) {
            console.error(e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Property fetch failed:", err);
        setProperty(null);
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  /* ================= HANDLE AUTO-CHAT ================= */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("chat") === "true") {
      setShowChat(true);
    }
  }, [location.search]);

  /* ================= FETCH CHAT HISTORY ================= */
  useEffect(() => {
    if (!showChat) return;
    if (!user) return;
    if (!property?.id) return;
    if (!property?.agentId) return;

    const fetchChats = async () => {
      try {
        const res = await chatApi.get(`/messages`, {
          params: { propertyId: property.id, buyerId: user.id, agentId: property.agentId }
        });

        if (Array.isArray(res.data)) {
          setChatMessages(res.data);
        } else {
          setChatMessages([]);
        }

        await chatApi.post(`/seen`, {
          propertyId: property.id,
          buyerId: user.id,
          agentId: property.agentId,
          userRole: "BUYER"
        });

      } catch (err) {
        console.error("Chat fetch failed", err);
      }
    };

    fetchChats();
  }, [showChat, property, user]);

  /* ================= FETCH AGENT STATS ================= */
  useEffect(() => {
    if (!property?.agentId) return;
    const fetchStats = async () => {
      try {
        const res = await reviewsApi.get(`/agent/${property.agentId}/stats`);
        setAgentStats(res.data);
      } catch (err) {
        console.error("Agent stats fetch failed", err);
      }
    };
    fetchStats();
  }, [property?.agentId]);

  /* ================= SUBMIT AGENT REVIEW ================= */
  const submitReview = async () => {
    if (reviewRating === 0) return toast.error("Please select a star rating");
    
    setIsSubmittingReview(true);
    try {
      await reviewsApi.post("/", {
        agentId: property.agentId,
        buyerId: user.id,
        propertyId: property.id,
        rating: reviewRating,
        reviewText: reviewText
      });
      toast.success("Review submitted! Thank you.");
      setHasReviewed(true);
      
      const res = await reviewsApi.get(`/agent/${property.agentId}/stats`);
      setAgentStats(res.data);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("You have already reviewed this interaction");
        setHasReviewed(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to submit review");
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleShowSlots = async () => {
    if (!user) {
      toast.error("Please login first to book an appointment");
      return;
    }
    if (property.sold) {
      toast.error("This property is already sold. Appointments are no longer available.");
      return;
    }
    if (user.role !== "BUYER") {
      toast.error("Only buyers can book appointments");
      return;
    }

    setShowSlots(!showSlots);
    if (!showSlots) {
      try {
        const res = await slotsApi.get(`/property/${property.id}`);
        setAvailableSlots(res.data);
      } catch (e) {
        console.error("Failed to fetch slots", e);
      }
    }
  };

  const bookSlot = async (slotId) => {
    try {
      await appointmentApi.post("", {
        slotId: slotId,
        buyerId: user.id,
        propertyId: property.id
      });

      toast.success("Appointment request sent successfully!");
      setShowSlots(false);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to book appointment");
    }
  };

  const nextImage = () =>
    setCurrentImageIndex(i =>
      i === property.images.length - 1 ? 0 : i + 1
    );

  const prevImage = () =>
    setCurrentImageIndex(i =>
      i === 0 ? property.images.length - 1 : i - 1
    );

  const toggleSave = async (e) => {
    e?.stopPropagation();
    if (!user) return toast.error("Please login to save property");

    try {
      if (isSaved) {
        await favoritesApi.delete("/", {
          params: { userId: user.id, propertyId: property.id }
        });
        setIsSaved(false);
      } else {
        await favoritesApi.post("/", null, {
          params: { userId: user.id, propertyId: property.id }
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
      if (err.response?.data) {
        toast.error(err.response.data);
      } else {
        toast.error("Failed to update favorites");
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  const sendMessage = async () => {
    if (!user) {
      toast.error("Please login first to chat");
      return;
    }

    if (user.role !== "BUYER") {
      toast.error("Only buyers can chat with agents");
      return;
    }

    if (!property?.id || !property?.agentId) {
      toast.error("Chat not ready. Please refresh page.");
      return;
    }

    if (!chatMessage.trim()) return;

    const payload = {
      propertyId: property.id,
      buyerId: user.id,
      agentId: property.agentId,
      sender: "BUYER",
      message: chatMessage
    };

    try {
      const res = await chatApi.post(`/messages`, payload);
      setChatMessages(prev => [...prev, res.data]);
      setChatMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Message not sent");
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="property-detail-page">
        <Navbar />
        <div className="loading-state">
          <div className="loader"></div>
          <p>Fetching property details...</p>
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
          <p>The property you are looking for might have been removed or is unavailable.</p>
          <button className="action-btn primary" onClick={() => navigate("/properties")} style={{ marginTop: "20px" }}>
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail-page">
      <Helmet>
        <title>{property ? `${property.title} | Urban Nest` : "Property Details | Urban Nest"}</title>
        <meta name="description" content={property?.description?.substring(0, 160) || "View details for this property on Urban Nest."} />
      </Helmet>
      <Navbar />

      {showLightbox && (
        <div className="lightbox-overlay animate-in" onClick={() => setShowLightbox(false)}>
          <button className="lightbox-close" onClick={() => setShowLightbox(false)}>
            <CloseIcon />
          </button>

          <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            <ChevronLeftIcon />
          </button>

          <img src={property.images[currentImageIndex]} alt="Fullscreen view" className="lightbox-img" onClick={(e) => e.stopPropagation()} />

          <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            <ChevronRightIcon />
          </button>

          <div className="lightbox-counter">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      )}

      <div className="property-detail-container">
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>Home</span>
          <span>/</span>
          <span onClick={() => navigate("/properties")}>Properties</span>
          <span>/</span>
          <span className="current">{property.title}</span>
        </div>

        <div className="property-gallery-container">
          <div className="main-carousel">
            <div className="carousel-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
              {property.images.map((img, idx) => (
                <div key={idx} className="carousel-slide" onClick={() => setShowLightbox(true)} style={{ cursor: "zoom-in" }}>
                  <img src={img} alt={`${property.title} view ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>

            <button className="carousel-control prev" onClick={prevImage} aria-label="Previous image">
              <ChevronLeftIcon />
            </button>
            <button className="carousel-control next" onClick={nextImage} aria-label="Next image">
              <ChevronRightIcon />
            </button>

            <div className="carousel-indicator">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            <div className="carousel-badges">
              {property.sold ? (
                <span className="premium-badge type" style={{ background: '#ef4444' }}>SOLD</span>
              ) : (
                <span className="premium-badge verified">Verified</span>
              )}
              <span className="premium-badge type">{property.bhk} BHK</span>
            </div>
          </div>

          <div className="carousel-thumbnails">
            {property.images.map((img, idx) => (
              <div
                key={idx}
                className={`thumb-item ${currentImageIndex === idx ? "active" : ""}`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="property-content">
          <div className="main-content">
            <div className="property-header">
              <div>
                <h1>{property.title}</h1>
                <p className="location">
                  <MapPinIcon /> {property.address}{property.city ? `, ${property.city}` : ''}{property.pinCode ? ` - ${property.pinCode}` : ''}
                </p>
                {(property.latitude && property.longitude) && (
                  <small style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", fontSize: "0.85rem" }}>
                    🌍 {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                  </small>
                )}
              </div>

              <div className="price-section">
                <div className="price">
                  {formatPrice(property.priceRaw)}
                </div>
                <div className="price-per-sqft">
                  ₹{property.pricePerSqft}/sq.ft
                </div>
              </div>
            </div>

            <div className="quick-info">
              <div className="info-item"><HomeIcon /> {property.bhk} BHK</div>
              <div className="info-item"><MaximizeIcon /> {property.area} sq.ft</div>
              <div className="info-item"><CalendarIcon /> {property.age}</div>
            </div>

            <div className="property-stats-bar">
              <div className="stat-item">
                <EyeIcon className="stat-icon" />
                <span className="stat-value">{property.views}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <HeartIcon className="stat-icon" />
                <span className="stat-value">{property.favorites}</span>
                <span className="stat-label">Favorites</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <MailIcon className="stat-icon" />
                <span className="stat-value">{property.inquiries}</span>
                <span className="stat-label">Inquiries</span>
              </div>
              {property.listedDate && (
                <>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <CalendarIcon className="stat-icon" />
                    <span className="stat-value">{new Date(property.listedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="stat-label">Listed</span>
                  </div>
                </>
              )}
            </div>

            <div className="action-buttons">
              <button
                className={`action-btn ${isSaved ? "saved" : ""}`}
                onClick={toggleSave}
              >
                <HeartIcon /> {isSaved ? "Saved" : "Save"}
              </button>

              <button
                className="action-btn"
                onClick={handleShare}
              >
                <ShareIcon /> Share
              </button>

              <button
                className="action-btn primary"
                onClick={() => document.querySelector(".sidebar")?.scrollIntoView({ behavior: "smooth" })}
              >
                <PhoneIcon /> Contact Agent
              </button>

              <button
                className="action-btn"
                onClick={() => {
                  if (!user) {
                    toast.error("Please login first to chat with agent");
                    return;
                  }

                  if (user.role !== "BUYER") {
                    toast.error("Only buyers can chat with agents");
                    return;
                  }

                  if (!property?.agentId) {
                    toast.error("Agent not available");
                    return;
                  }

                  setShowChat(true);
                }}
              >
                💬 Chat with Agent
              </button>

              <button
                className={`action-btn ${property.sold ? 'disabled' : ''}`}
                onClick={property.sold ? () => toast.error("Property is sold") : handleShowSlots}
                style={{
                  background: showSlots ? 'var(--primary-color)' : (property.sold ? '#334155' : ''),
                  color: (showSlots || property.sold) ? 'white' : '',
                  cursor: property.sold ? 'not-allowed' : 'pointer',
                  opacity: property.sold ? 0.7 : 1
                }}
                disabled={property.sold}
              >
                <CalendarIcon style={{ marginRight: '8px' }} /> {property.sold ? "Sold" : "Book Appointment"}
              </button>

              <button
                className="action-btn"
                onClick={() => setShowMap(true)}
              >
                <MapPinIcon /> Show in Map
              </button>
            </div>

            {showSlots && user?.role === "BUYER" && (
              <div className="slots-section animate-in">
                <div className="slots-header">
                  <h3><CalendarIcon style={{ marginRight: '8px' }} /> Schedule a Visit</h3>
                  <button className="slots-close" onClick={() => setShowSlots(false)}><CloseIcon /></button>
                </div>
                {availableSlots.length === 0 ? (
                  <div className="slots-empty">
                    <CalendarIcon size={32} style={{ color: '#64748b', marginBottom: '8px' }} />
                    <p>No available time slots for this property yet.</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>The agent hasn't added viewing slots. Try contacting them via chat.</p>
                  </div>
                ) : (() => {
                  const grouped = {};
                  availableSlots.forEach(s => {
                    if (!grouped[s.slotDate]) grouped[s.slotDate] = [];
                    grouped[s.slotDate].push(s);
                  });
                  const dates = Object.keys(grouped).sort();
                  return (
                    <div className="slots-calendar">
                      <div className="slots-dates-row">
                        {dates.map(date => {
                          const d = new Date(date + 'T00:00:00');
                          const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                          const dayNum = d.getDate();
                          const month = d.toLocaleDateString('en-IN', { month: 'short' });
                          return (
                            <div key={date} className="date-column">
                              <div className="date-label">
                                <span className="day-name">{dayName}</span>
                                <span className="day-num">{dayNum}</span>
                                <span className="day-month">{month}</span>
                              </div>
                              <div className="time-pills">
                                {grouped[date].sort((a, b) => a.slotTime.localeCompare(b.slotTime)).map(slot => (
                                  <button
                                    key={slot.id}
                                    className="time-pill"
                                    onClick={() => {
                                      if (window.confirm(`Book appointment on ${date} at ${slot.slotTime} (${slot.durationMinutes} min)?`)) {
                                        bookSlot(slot.id);
                                      }
                                    }}
                                  >
                                    <span className="pill-time">{slot.slotTime.substring(0, 5)}</span>
                                    <span className="pill-duration">{slot.durationMinutes}m</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {showChat && user?.role === "BUYER" && (
              <div className="chat-box-compact animate-in">
                <div className="chat-header">
                  <div className="agent-info-mini">
                    {property.agent.profilePicture ? (
                      <img src={property.agent.profilePicture.startsWith('http') ? property.agent.profilePicture : `${IMAGE_URL}${property.agent.profilePicture}`} alt={property.agent.name} />
                    ) : (
                      <div className="chat-avatar-small"><UserIcon /></div>
                    )}
                    <div className="chat-status-info">
                      <h4>{property.agent.name}</h4>
                      <p className="status-text"><span className="online-indicator"></span> Online</p>
                    </div>
                  </div>
                  <button className="close-chat-btn" onClick={() => setShowChat(false)}>
                    <CloseIcon />
                  </button>
                </div>

                <div className="chat-messages" ref={chatMessagesRef}>
                  <div className="chat-notice">
                    <p>Regarding: <strong>{property.title}</strong></p>
                  </div>
                  {!Array.isArray(chatMessages) || chatMessages.length === 0 ? (
                    <div className="empty-chat-state">
                      <p>Start the conversation by sending a message below.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isAppointment = msg.message && (msg.message.includes("Appointment Booked") || msg.message.includes("🗓️"));
                      const isSystem = msg.sender === "SYSTEM";

                      return (
                        <div
                          key={i}
                          className={`chat-message ${isSystem ? 'system-msg' : (msg.sender === "BUYER" ? "buyer" : "agent")} ${isAppointment ? "appointment-msg" : ""}`}
                        >
                          <div className={`msg-bubble ${isAppointment ? "appointment" : ""} ${isSystem ? "system" : ""}`}>
                            <div className="msg-text">
                              {msg.message.split('**').map((part, idx) =>
                                idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
                              )}
                            </div>
                            {!isSystem && <div className="msg-meta">
                              <span className="time">{formatTime(msg.createdAt)}</span>
                              {msg.sender === "BUYER" && (
                                <span className={`status ${msg.seen ? "seen" : ""}`}>
                                  {msg.seen ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {property.sold ? (
                  <div className="chat-sold-overlay">
                    <p>Messaging disabled for sold properties</p>
                  </div>
                ) : (
                  <div className="chat-input">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button className="send-btn" onClick={sendMessage} disabled={!chatMessage.trim()}>
                      <ShareIcon style={{ transform: 'rotate(-45deg)', marginLeft: '4px' }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="section">
              <h3>Description</h3>
              <p className="description">{property.description}</p>
            </div>

            <div className="section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {property.amenities.map((a, i) => (
                  <div key={i} className="amenity-item">
                    <CheckIcon /> {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar"><UserIcon /></div>
                <div>
                  <h4>{property.agent.name}</h4>
                  <p>{property.agent.email}</p>
                  {agentStats.reviewCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '14px', color: '#cbd5e1' }}>
                      <StarIcon size={14} filled={true} />
                      <span style={{ fontWeight: 'bold', color: '#f1f5f9' }}>{agentStats.averageRating.toFixed(1)}</span>
                      <span>({agentStats.reviewCount} Reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="agent-actions">
                <a href={`mailto:${property.agent.email}`} className="contact-btn email">
                  <MailIcon /> Email
                </a>
                <a href="tel:+919999999999" className="contact-btn phone">
                  <PhoneIcon /> Call
                </a>
              </div>
            </div>

            {user && (
              <div className="agent-card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Appointment Status</h4>
                <AppointmentActionPanel
                  propertyId={property.id}
                  buyerId={user.id}
                  agentId={property.agentId}
                  userRole={user.role}
                />
              </div>
            )}

            {property.sold && property.soldToUserId === user?.id && !hasReviewed && (
              <div className="agent-card review-card" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <h4 style={{ marginBottom: '0.8rem', color: '#f59e0b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <StarIcon size={16} filled={true} /> Rate Your Experience
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>You successfully bought this property. How was your experience with {property.agent.name}?</p>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon 
                      key={star} 
                      size={28} 
                      filled={star <= (reviewHover || reviewRating)} 
                      onClick={() => setReviewRating(star)}
                      className="rating-star"
                    />
                  ))}
                </div>
                
                <textarea 
                  placeholder="Leave a short review (optional)" 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white', minHeight: '60px', marginBottom: '1rem', fontSize: '0.9rem' }}
                />
                
                <button 
                  className="action-btn primary" 
                  style={{ width: '100%', padding: '10px' }} 
                  onClick={submitReview}
                  disabled={isSubmittingReview || reviewRating === 0}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}

            <div className="property-stats">
              <div className="stat-item">
                <EyeIcon /> {property.views} Views
              </div>
              <div className="stat-item">
                <HeartIcon /> {property.favorites} Favorites
              </div>
              <div className="stat-item">
                <MailIcon /> {property.inquiries} Inquiries
              </div>
            </div>
          </div>
        </div>

        <MapModal isOpen={showMap} onClose={() => setShowMap(false)} initialProperty={property} />
      </div>

      <Footer />
    </div>
  );
}

export default PropertyDetail;
