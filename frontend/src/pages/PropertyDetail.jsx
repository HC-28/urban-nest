import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PropertyDetail.css";
import {
  FiMapPin,
  FiHome,
  FiMaximize,
  FiCalendar,
  FiUser,
  FiPhone,
  FiMail,
  FiHeart,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEye
} from "react-icons/fi";
import { propertyApi, favoritesApi, userApi, chatApi, slotsApi, appointmentApi, BASE_URL, IMAGE_URL } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import { parsePropertyImages } from "../utils/imageUtils";


function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const [showSlots, setShowSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

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
          // Convert price from rupees to lakhs
          priceRaw: data.price,
          price: Math.round(data.price / 100000),
          pricePerSqft: data.area ? Math.round(data.price / data.area) : 0,
          area: data.area,
          bhk: data.bhk,
          age: "Ready to Move",
          address: data.pinCode || "Prime Location",
          images: parsePropertyImages(data.photos || data.images).length > 0
            ? parsePropertyImages(data.photos || data.images).map(p =>
              p.startsWith("data:") || p.startsWith("http")
                ? p
                : `${IMAGE_URL}${encodeURIComponent(p)}`
            )
            : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"],


          amenities: [
            "Parking",
            "Security",
            "Power Backup",
            "Lift",
            "Water Supply"
          ],
          agentId: data.agentId, // ✅ FIX
          agent: {
            name: data.agentName || "Agent",
            email: data.agentEmail || "agent@email.com"
          },
          views: data.views || 0
        };

        // Create initial property data
        let propertyData = { ...transformedProperty };

        // Attempt to fetch latest agent info if agentId exists
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

        // Record view (don't wait for response)
        propertyApi.post(`/${id}/view`).catch(e => console.error("View tracking failed:", e));

        // Check if saved
        if (user) {
          try {
            const res = await favoritesApi.get("/check", {
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
  }, [id]);

  /* ================= HANDLE AUTO-CHAT ================= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") === "true") {
      setShowChat(true);
    }
  }, []);

  /* ================= FETCH CHAT HISTORY ================= */
  useEffect(() => {
    if (!showChat) return;
    if (!user) return;
    if (!property?.id) return;
    if (!property?.agentId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/chat/conversation?propertyId=${property.id}&buyerId=${user.id}&agentId=${property.agentId}`
        );

        if (!res.ok) return;

        const data = await res.json();
        if (Array.isArray(data)) {
          setChatMessages(data);
        } else {
          setChatMessages([]);
        }

        // Mark AGENT messages as SEEN
        await fetch(`${BASE_URL}/chat/seen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: property.id,
            buyerId: user.id,
            agentId: property.agentId,
            userRole: "BUYER"
          })
        });

      } catch (err) {
        console.error("Chat fetch failed", err);
      }
    };

    fetchChats();
  }, [showChat, property, user]);

  /* ================= HANDLE SLOTS ================= */
  const handleShowSlots = async () => {
    if (!user) {
      alert("Please login first to book an appointment");
      return;
    }
    if (user.role !== "BUYER") {
      alert("Only buyers can book appointments");
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
        buyerId: user.id
      });
      alert("Appointment booked successfully! The agent will be notified.");
      setShowSlots(false);
    } catch (e) {
      alert(e.response?.data || "Failed to book slot");
    }
  };

  /* ================= HELPERS ================= */
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
    if (!user) return alert("Please login to save property");

    try {
      if (isSaved) {
        await favoritesApi.delete("/remove", {
          params: { userId: user.id, propertyId: property.id }
        });
        setIsSaved(false);
      } else {
        await favoritesApi.post("/add", null, {
          params: { userId: user.id, propertyId: property.id }
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
      if (err.response?.data) {
        alert(err.response.data);
      } else {
        alert("Failed to update favorites");
      }
    }
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!user) {
      alert("Please login first to chat");
      return;
    }

    if (user.role !== "BUYER") {
      alert("Only buyers can chat with agents");
      return;
    }

    if (!property?.id || !property?.agentId) {
      alert("Chat not ready. Please refresh page.");
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
      const res = await fetch(`${BASE_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Send failed");

      const savedMsg = await res.json();
      setChatMessages(prev => [...prev, savedMsg]);
      setChatMessage("");
    } catch (err) {
      console.error(err);
      alert("Message not sent");
    }
  };

  const fetchChatHistory = async () => {
    if (!user || user.role !== "BUYER") return;

    try {
      const res = await fetch(
        `${BASE_URL}/chat/conversation?propertyId=${property.id}&buyerId=${user.id}&agentId=${property.agentId}`
      );

      const data = await res.json();
      setChatMessages(data);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };



  /* ================= HELPERS ================= */
  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  /* ================= UI STATES ================= */
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

  /* ================= MAIN UI ================= */
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
        <div className="property-gallery-container">
          <div className="main-carousel">
            <div className="carousel-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
              {property.images.map((img, idx) => (
                <div key={idx} className="carousel-slide">
                  <img src={img} alt={`${property.title} view ${idx + 1}`} />
                </div>
              ))}
            </div>

            <button className="carousel-control prev" onClick={prevImage} aria-label="Previous image">
              <FiChevronLeft />
            </button>
            <button className="carousel-control next" onClick={nextImage} aria-label="Next image">
              <FiChevronRight />
            </button>

            <div className="carousel-indicator">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            <div className="carousel-badges">
              {property.purpose === "Sold" ? (
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
            {/* Header */}
            <div className="property-header">
              <div>
                <div className="badges">
                  {/* Badge logic removed from here as it is moved into the carousel area per UI design */}
                </div>
                <h1>{property.title}</h1>
                <p className="location">
                  <FiMapPin /> {property.address}
                </p>
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

            {/* Quick Info */}
            <div className="quick-info">
              <div className="info-item"><FiHome /> {property.bhk} BHK</div>
              <div className="info-item"><FiMaximize /> {property.area} sq.ft</div>
              <div className="info-item"><FiCalendar /> {property.age}</div>
            </div>

            {/* Actions */}
            <div className="action-buttons">
              <button
                className={`action-btn ${isSaved ? "saved" : ""}`}
                onClick={toggleSave}
              >
                <FiHeart /> {isSaved ? "Saved" : "Save"}
              </button>

              <button
                className="action-btn primary"
                onClick={() => document.querySelector(".sidebar")?.scrollIntoView({ behavior: "smooth" })}
              >
                <FiPhone /> Contact Agent
              </button>

              <button
                className="action-btn"
                onClick={() => {
                  if (!user) {
                    alert("Please login first to chat with agent");
                    return;
                  }

                  if (user.role !== "BUYER") {
                    alert("Only buyers can chat with agents");
                    return;
                  }

                  if (!property?.agentId) {
                    alert("Agent not available");
                    return;
                  }

                  setShowChat(true);
                  // fetchChatHistory();

                }}
              >
                💬 Chat with Agent
              </button>

              <button
                className="action-btn"
                onClick={handleShowSlots}
                style={{ background: showSlots ? 'var(--primary-color)' : '', color: showSlots ? 'white' : '' }}
              >
                📅 Book Appointment
              </button>

            </div>

            {/* SLOTS BOX */}
            {showSlots && user?.role === "BUYER" && (
              <div className="slots-box animate-in" style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <h3>Available Time Slots</h3>
                {availableSlots.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>No available slots found for this property.</p>
                ) : (
                  <div className="slots-grid" style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                    {availableSlots.map(slot => (
                      <div key={slot.id} className="slot-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                        <div>
                          <strong>{slot.slotDate}</strong> at {slot.slotTime}
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Duration: {slot.durationMinutes} mins</div>
                        </div>
                        <button className="action-btn primary" onClick={() => bookSlot(slot.id)}>Book</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHAT BOX */}
            {showChat && user?.role === "BUYER" && (
              <div className="chat-box-compact animate-in">
                <div className="chat-header">
                  <div className="chat-id">
                    <div className="chat-avatar-small">
                      <FiUser />
                    </div>
                    <div>
                      <h4>Chat with {property.agent.name}</h4>
                      <p className="meta">Regarding: {property.title}</p>
                    </div>
                  </div>
                  <button className="close-chat-btn" onClick={() => setShowChat(false)}>
                    <FiCheck style={{ transform: 'rotate(45deg)', fontSize: '1.2rem' }} />
                  </button>
                </div>

                <div className="chat-messages">
                  {!Array.isArray(chatMessages) || chatMessages.length === 0 ? (
                    <p className="chat-empty">Start the conversation by sending a message below.</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`chat-message ${msg.sender === "BUYER" ? "buyer" : "agent"}`}
                      >
                        <div className="msg-text">{msg.message}</div>
                        <div className="msg-meta">
                          <small className="time">{formatTime(msg.createdAt)}</small>
                          {msg.sender === "BUYER" && (
                            <span className={`status ${msg.seen ? "seen" : ""}`}>
                              {msg.seen ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="section">
              <h3>Description</h3>
              <p className="description">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {property.amenities.map((a, i) => (
                  <div key={i} className="amenity-item">
                    <FiCheck /> {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar"><FiUser /></div>
                <div>
                  <h4>{property.agent.name}</h4>
                  <p>{property.agent.email}</p>
                </div>
              </div>

              <div className="agent-actions">
                <a href={`mailto:${property.agent.email}`} className="contact-btn email">
                  <FiMail /> Email
                </a>
                <a href="tel:+919999999999" className="contact-btn phone">
                  <FiPhone /> Call
                </a>
              </div>
            </div>

            <div className="property-stats">
              <div className="stat-item">
                <FiEye /> {property.views} Views
              </div>
              <div className="stat-item">
                <FiCalendar /> Posted Recently
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
