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
import { propertyApi } from "../api";

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

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const storageKey = user ? `savedProperties_${user.id}` : null;

  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const resp = await propertyApi.get(`/${id}`);
        const data = resp.data;

        const transformedProperty = {
          id: data.id,
          title: data.title,
          description:
            data.description ||
            `Beautiful ${data.bhk} BHK ${data.type}. This property offers ${data.area} sq.ft.`,
          price: data.price,
          pricePerSqft: data.area ? Math.round(data.price / data.area) : 0,
          area: data.area,
          bhk: data.bhk,
          age: "Ready to Move",
          address: data.pinCode || "Prime Location",
          images:
            data.photos
              ? data.photos
                  .split(",")
                  .filter(p => p && !p.startsWith("blob:"))
                  .map(p =>
                    p.startsWith("http")
                      ? p
                      : `http://localhost:8085/uploads/${encodeURIComponent(p)}`
                  )
              : [
                  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"
                ],


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

        setProperty(transformedProperty);

        if (storageKey) {
          const saved = JSON.parse(localStorage.getItem(storageKey)) || [];
          setIsSaved(saved.some(p => p.id === transformedProperty.id));
        }

        setLoading(false);
      } catch {
        setProperty(null);
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  /* ================= FETCH CHAT HISTORY ================= */
useEffect(() => {
  if (!showChat) return;
  if (!user) return;
  if (!property?.id) return;
  if (!property?.agentId) return;

  const fetchChats = async () => {
    try {
      const res = await fetch(
        `http://localhost:8085/api/chat/conversation?propertyId=${property.id}&buyerId=${user.id}&agentId=${property.agentId}`
      );

      if (!res.ok) return;

      const data = await res.json();
      setChatMessages(data);
    } catch (err) {
      console.error("Chat fetch failed", err);
    }
  };

  fetchChats();
}, [showChat, property, user]);



  /* ================= HELPERS ================= */
  const nextImage = () =>
    setCurrentImageIndex(i =>
      i === property.images.length - 1 ? 0 : i + 1
    );

  const prevImage = () =>
    setCurrentImageIndex(i =>
      i === 0 ? property.images.length - 1 : i - 1
    );

  const toggleSave = () => {
    if (!user) return alert("Please login to save property");

    let saved = JSON.parse(localStorage.getItem(storageKey)) || [];
    if (isSaved) saved = saved.filter(p => p.id !== property.id);
    else saved.push(property);

    localStorage.setItem(storageKey, JSON.stringify(saved));
    setIsSaved(!isSaved);
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
    const res = await fetch("http://localhost:8085/api/chat/send", {
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
      `http://localhost:8085/api/chat/conversation?propertyId=${property.id}&buyerId=${user.id}&agentId=${property.agentId}`
    );

    const data = await res.json();
    setChatMessages(data);
  } catch (err) {
    console.error("Failed to load chat history", err);
  }
};



  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="property-detail-page">
        <Navbar />
        <div className="not-found">Loading property...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail-page">
        <Navbar />
        <div className="not-found">Property not available</div>
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
        </div>

        <div className="property-content">
          <div className="main-content">
            {/* Header */}
            <div className="property-header">
              <div>
                <div className="badges">
                  <span className="badge verified">Verified</span>
                  <span className="badge type">{property.bhk} BHK</span>
                </div>
                <h1>{property.title}</h1>
                <p className="location">
                  <FiMapPin /> {property.address}
                </p>
              </div>

              <div className="price-section">
                <div className="price">
                  ₹{(property.price / 100000).toFixed(2)} L
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

              <button className="action-btn primary">
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
                  fetchChatHistory();

                }}
              >
                💬 Chat with Agent
              </button>

            </div>

            {/* CHAT BOX */}
            {showChat && user?.role === "BUYER" && (
              <div className="agent-card chat-box">
                <h4>Chat with {property.agent.name}</h4>

                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <p className="chat-empty">Start the conversation</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`chat-message ${
                          msg.sender === "BUYER" ? "buyer" : "agent"
                        }`}
                      >
                        {msg.message}
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

                <button className="close-chat" onClick={() => setShowChat(false)}>
                  Close
                </button>
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
