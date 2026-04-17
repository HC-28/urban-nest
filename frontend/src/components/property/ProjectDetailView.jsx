import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import MapModal from "./MapModal";
import { formatPrice } from "../../utils/priceUtils";
import { Helmet } from "react-helmet-async";
import "./ProjectDetailView.css";
import { IMAGE_URL } from "../../services/api";

import {
  FiMapPin,
  FiShare2,
  FiHeart,
  FiMaximize,
  FiCalendar,
  FiInfo,
  FiCheckCircle,
  FiMessageSquare,
  FiPhone,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiHome
} from "react-icons/fi";

const ProjectDetailView = ({
  property,
  user,
  isSaved,
  toggleSave,
  showSlots,
  setShowSlots,
  availableSlots,
  bookSlot,
  handleShowSlots,
  handleShare,
  showChat,
  setShowChat,
  chatMessage,
  setChatMessage,
  chatMessages,
  sendMessage,
  chatMessagesRef,
  formatTime
}) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const heroImage = property.images && property.images.length > 0 ? property.images[0] : "/property-placeholder.jpg";
  const galleryImages = property.images && property.images.length > 1 ? property.images.slice(1, 4) : [];

  const nextImage = () => setCurrentImageIndex((i) => (i === property.images.length - 1 ? 0 : i + 1));
  const prevImage = () => setCurrentImageIndex((i) => (i === 0 ? property.images.length - 1 : i - 1));

  return (
    <div className="project-premium-page">
      <Helmet>
        <title>{`${property.title} | Project Details`}</title>
      </Helmet>
      
      <Navbar />

      {/* Lightbox */}
      {showLightbox && (
        <div className="lightbox-overlay animate-in" onClick={() => setShowLightbox(false)}>
          <button className="lightbox-close" onClick={() => setShowLightbox(false)}>
            <FiX size={24} />
          </button>
          <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            <FiChevronLeft size={24} />
          </button>
          <img src={property.images[currentImageIndex]} alt="Fullscreen view" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            <FiChevronRight size={24} />
          </button>
          <div className="lightbox-counter">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="project-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="project-hero-overlay"></div>
        <div className="project-hero-content">
          <div className="project-labels">
            <span className="project-badge status-badge">{property.sold ? "Sold Out" : "Under Construction"}</span>
            <span className="project-badge type-badge">{property.bhk} BHK Premium Residences</span>
          </div>
          <h1 className="project-title">{property.title}</h1>
          <p className="project-location"><FiMapPin /> {property.address || property.location}</p>
          <div className="project-builder">
            <p>By <strong>{property.agent?.name || "Premium Builder"}</strong></p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="project-main-container">
        <div className="project-left-col">
          
          {/* Quick Stats Bar */}
          <div className="project-quick-stats">
            <div className="p-stat">
              <span className="p-stat-label">Starting Price</span>
              <span className="p-stat-value highlight">{formatPrice(property.priceRaw)}</span>
            </div>
            <div className="p-stat">
              <span className="p-stat-label">Total Area</span>
              <span className="p-stat-value"><FiMaximize /> {property.area} sq.ft</span>
            </div>
            <div className="p-stat">
              <span className="p-stat-label">Configurations</span>
              <span className="p-stat-value"><FiHome /> {property.bhk} BHK</span>
            </div>
            <div className="p-stat">
              <span className="p-stat-label">Status</span>
              <span className="p-stat-value"><FiCalendar /> {property.age || "Off-Plan"}</span>
            </div>
          </div>

          {/* Overview */}
          <div className="project-section">
            <h2 className="section-title"><FiInfo className="section-icon" /> Project Overview</h2>
            <div className="project-description">
              <p>{property.description}</p>
            </div>
          </div>

          {/* New: Available Units & Pricing Table */}
          <div className="project-section">
            <h2 className="section-title"><FiHome className="section-icon" /> Pricing & Availability</h2>
            <div className="project-inventory-card">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Unit Type</th>
                    <th>Area (sq.ft)</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{property.bhk} BHK Premium</td>
                    <td>{property.area}</td>
                    <td className="price-cell">{formatPrice(property.priceRaw)}</td>
                    <td><span className="status-label available">Available</span></td>
                    <td><button className="inquire-btn" onClick={() => setShowChat(true)}>Select</button></td>
                  </tr>
                  <tr>
                    <td>{property.bhk + 1} BHK Luxury</td>
                    <td>{Math.round(property.area * 1.3)}</td>
                    <td className="price-cell">{formatPrice(property.priceRaw * 1.45)}</td>
                    <td><span className="status-label limited">Limited</span></td>
                    <td><button className="inquire-btn" onClick={() => setShowChat(true)}>View</button></td>
                  </tr>
                  <tr>
                    <td>{property.bhk + 2} BHK Elite</td>
                    <td>{Math.round(property.area * 1.6)}</td>
                    <td className="price-cell">{formatPrice(property.priceRaw * 1.8)}</td>
                    <td><span className="status-label standby">Waiting List</span></td>
                    <td><button className="inquire-btn outline" onClick={() => setShowChat(true)}>Notify</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* High-End Gallery Grid */}
          {galleryImages.length > 0 && (
            <div className="project-section">
              <h2 className="section-title">Gallery</h2>
              <div className="project-gallery-grid">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="gallery-grid-item" onClick={() => { setCurrentImageIndex(idx + 1); setShowLightbox(true); }}>
                    <img src={img} alt={`Gallery ${idx}`} />
                    {idx === 2 && property.images.length > 4 && (
                      <div className="gallery-more-overlay">
                        <span>+{property.images.length - 4} Photos</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="project-section">
              <h2 className="section-title">World Class Amenities</h2>
              <div className="premium-amenities-grid">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="premium-amenity-item">
                    <FiCheckCircle className="amenity-icon" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map Location */}
          <div className="project-section">
            <h2 className="section-title">Location Map</h2>
            <div className="project-map-placeholder" onClick={() => setShowMap(true)}>
              <div className="map-overlay">
                <button className="map-view-btn"><FiMapPin /> View Dynamic Map</button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className="project-right-col">
          <div className="premium-contact-card sticky">
            <div className="card-header">
              <h3>Interested in this project?</h3>
              <p>Get in touch with the builder directly.</p>
            </div>
            
            <div className="builder-profile">
              {property.agent?.profilePicture ? (
                <img src={property.agent.profilePicture.startsWith('http') ? property.agent.profilePicture : `${IMAGE_URL}${property.agent.profilePicture}`} alt={property.agent.name} className="builder-avatar" />
              ) : (
                <div className="builder-avatar-placeholder">{property.agent?.name?.charAt(0) || "B"}</div>
              )}
              <div className="builder-info">
                <h4>{property.agent?.name || "Premium Builder"}</h4>
                <span>Authorized Agent</span>
              </div>
            </div>

            <div className="premium-actions">
              <button className="premium-btn primary" onClick={() => {
                if (!user) return alert("Please login first to chat");
                setShowChat(true);
              }}>
                <FiMessageSquare /> Chat with Builder
              </button>
              
              <button className="premium-btn outline" onClick={handleShowSlots}>
                <FiCalendar /> Schedule Site Visit
              </button>

              <div className="secondary-actions">
                <button className={`icon-btn ${isSaved ? 'active' : ''}`} onClick={toggleSave}>
                  <FiHeart className={isSaved ? "fill-icon" : ""} /> {isSaved ? "Saved" : "Save"}
                </button>
                <button className="icon-btn" onClick={handleShare}>
                  <FiShare2 /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Slots Drawer */}
      {showSlots && user?.role === "BUYER" && (
        <div className="premium-drawer-overlay animate-in" onClick={() => setShowSlots(false)}>
          <div className="premium-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Schedule a Site Visit</h3>
              <button className="close-btn" onClick={() => setShowSlots(false)}><FiX size={24} /></button>
            </div>
            <div className="drawer-body">
              {availableSlots.length === 0 ? (
                <div className="slots-empty" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ color: "#94a3b8" }}>No available slots for this project.</p>
                </div>
              ) : (
                <div className="slots-calendar">
                  {Object.keys(
                    availableSlots.reduce((acc, s) => {
                      if (!acc[s.slotDate]) acc[s.slotDate] = [];
                      acc[s.slotDate].push(s);
                      return acc;
                    }, {})
                  ).sort().map(date => {
                    const slotsForDate = availableSlots.filter(s => s.slotDate === date);
                    return (
                      <div key={date} className="date-group" style={{ marginBottom: "20px" }}>
                        <h4 style={{ color: "#e2e8f0", marginBottom: "12px", fontSize: "1.1rem" }}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric'})}</h4>
                        <div className="time-pills" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {slotsForDate.sort((a,b) => a.slotTime.localeCompare(b.slotTime)).map(slot => (
                            <button
                              key={slot.id}
                              className="premium-time-pill"
                              style={{ padding: "10px 16px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", color: "#60a5fa", cursor: "pointer", fontWeight: "600" }}
                              onClick={() => {
                                if (window.confirm(`Book site visit on ${date} at ${slot.slotTime}?`)) bookSlot(slot.id);
                              }}
                            >
                              {slot.slotTime.substring(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Box for Projects */}
      {showChat && user?.role === "BUYER" && (
        <div className="premium-chat-box animate-in">
          <div className="chat-header">
            <h4>Chat with {property.agent?.name}</h4>
            <button className="chat-close" onClick={() => setShowChat(false)}><FiX /></button>
          </div>
          <div className="chat-messages premium-scroll" ref={chatMessagesRef}>
            <p className="chat-context">Regarding: <strong>{property.title}</strong></p>
            {(!chatMessages || chatMessages.length === 0) ? (
              <p className="empty-chat">Start the conversation...</p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.sender === "BUYER" ? "buyer" : "agent"} ${msg.sender === "SYSTEM" ? "system" : ""}`}>
                  <div className="msg-bubble">
                    {msg.message}
                    {!msg.sender.includes("SYSTEM") && <span className="time">{formatTime(msg.createdAt)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type message..." 
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={!chatMessage.trim()}>Send</button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && <MapModal isOpen={showMap} initialProperty={property} onClose={() => setShowMap(false)} />}
      
      <Footer />
    </div>
  );
};

export default ProjectDetailView;



