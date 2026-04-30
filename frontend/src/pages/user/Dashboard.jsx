import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { propertyApi, appointmentApi, slotsApi, chatApi } from "../../services/api";
import { getFirstImage } from "../../utils/imageUtils";
import { formatPrice } from "../../utils/priceUtils";
import { PropertySkeleton } from "../../components/ui/SkeletonLoaders";
import toast from "react-hot-toast";
import AgencyManagement from "../../components/dashboard/AgencyManagement";
import "./Dashboard.css";
/* ─── SVG Icons ─── */
const EditIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 1.24-2.33M4.93 4.93A10.96 10.96 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const HomeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const StarIcon = ({ size = 18, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const CheckCircleIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircleIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const ShoppingBagIcon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

function Dashboard() {
  // Initialize user from localStorage only once on mount
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });

  // Admin users should always see the admin dashboard
  if (user?.role?.toUpperCase() === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("properties");
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ propertyId: "", date: "", time: "" });
  const [editingSlot, setEditingSlot] = useState(null);
  const [editSlotData, setEditSlotData] = useState({ date: "", time: "", propertyId: "" });
  const [boughtProperties, setBoughtProperties] = useState([]);
  const [soldProperties, setSoldProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [editingProperty, setEditingProperty] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    type: "",
    purpose: "",
    price: 0,
    area: 0,
    bhk: 0,
    bathrooms: 0,
    balconies: 0,
    city: "",
    location: "",
    pinCode: "",
    furnishing: "",
    description: "",
    amenities: "",
    photos: ""
  });

  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sold Modal State
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [propertyToMarkSold, setPropertyToMarkSold] = useState(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [buyersForProperty, setBuyersForProperty] = useState([]);

  useEffect(() => {
    if (user) {
      if (user.role?.toUpperCase() === "AGENT") {
        fetchMyProperties();
        fetchAgentAppointments();
        fetchAgentSlots();
      } else {
        fetchBuyerAppointments();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  const fetchAgentAppointments = async () => {
    try {
      const { data } = await appointmentApi.getAgentAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching agent appointments:", err);
      setAppointments([]);
    }
  };

  const fetchBuyerAppointments = async () => {
    try {
      const { data } = await appointmentApi.getBuyerAppointments();
      setAppointments(data);
      // Filter sold properties for bought properties tab
      setBoughtProperties(data.filter(a => a.status === "sold"));
    } catch (err) {
      console.error("Error fetching buyer appointments:", err);
    }
  };

  const fetchAgentSlots = async () => {
    try {
      const { data } = await slotsApi.getMySlots();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setSlots([]);
    }
  };

  const fetchMyProperties = async () => {
    try {
      const { data: properties } = await propertyApi.getMyProperties();

      // Fallback for missing reviews in cached properties
      try {
        const { data: chats } = await chatApi.getMyChatsAsAgent();
        const chatList = chats || [];
        const enriched = properties.map(p => {
          let computedReview = p.review;
          if (!computedReview && p.sold) {
            const fbMsg = chatList.find(c => String(c.propertyId) === String(p.id) && c.message?.startsWith('⭐ FEEDBACK:'));
            if (fbMsg) computedReview = fbMsg.message.includes('Positive') ? 'Positive' : 'Negative';
          }
          return { ...p, review: computedReview };
        });
        setMyProperties(enriched);
        setSoldProperties(enriched.filter(p => p.sold));
        setStats({
          total: enriched.length,
          active: enriched.filter(p => p.active && !p.sold).length,
          inactive: enriched.filter(p => !p.active && !p.sold).length
        });
      } catch (e) {
        console.error("Error fetching chats for reviews fallback:", e);
        setMyProperties(properties);
        setSoldProperties(properties.filter(p => p.sold));
        setStats({
          total: properties.length,
          active: properties.filter(p => p.active && !p.sold).length,
          inactive: properties.filter(p => !p.active && !p.sold).length
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMyProperties([]);
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const { data } = await propertyApi.toggleFeature(id);
      toast.success(data?.message || "Spotlight status updated!");
      fetchMyProperties();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update spotlight status");
    }
  };

  // Filter properties logic with null safety
  const filteredProperties = (myProperties || []).filter(p => {
    if (!p) return false;
    const searchLower = (searchTerm || "").toLowerCase();
    const titleMatch = (p.title || "").toLowerCase().includes(searchLower);
    const cityMatch = (p.city || "").toLowerCase().includes(searchLower);
    const typeMatch = (p.type || "").toLowerCase().includes(searchLower);
    return titleMatch || cityMatch || typeMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProperties = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm("PERMANENT DELETE: This will remove the property and all related data (chats, appointments). This action cannot be undone. Are you sure?")) return;

    try {
      await propertyApi.hardDelete(propertyId);
      toast.success("Property permanently removed.");
      fetchMyProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error(error.response?.data?.message || "Failed to delete property.");
    }
  };

  const handleToggleActive = async (property) => {
    try {
      if (property.active) {
        // Unlist property (soft delete sets isActive to false without marking as sold)
        await propertyApi.delete(`/${property.id}`);
        toast.success("Property unlisted successfully!");
      } else {
        // Re-list property
        await propertyApi.relist(property.id);
        toast.success("Property listed successfully!");
      }
      fetchMyProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property. Please try again.");
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property.id);
    setEditForm({
      title: property.title || "",
      type: property.type || "",
      purpose: property.purpose || "",
      price: property.price || 0,
      area: property.area || 0,
      bhk: property.bhk || 0,
      bathrooms: property.bathrooms || 0,
      balconies: property.balconies || 0,
      city: property.city || "",
      location: property.location || "",
      pinCode: property.pinCode || "",
      furnishing: property.furnishing || "",
      description: property.description || "",
      amenities: property.amenities || "",
      photos: property.photos || ""
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await propertyApi.put(`/${editingProperty}`, editForm);
      toast.success("Property updated successfully!");
      setShowEditModal(false);
      setEditingProperty(null);
      fetchMyProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error(error.response?.data?.message || "Failed to update property.");
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingProperty(null);
    setEditForm({});
  };

  const handleMarkSoldInit = (property) => {
    setPropertyToMarkSold(property);

    // Extract potential buyers from appointments for this exact property
    const buyers = (appointments || [])
      .filter(a => a && a.propertyId === property.id && a.buyerId)
      .map(a => ({ id: a.buyerId, name: a.buyerName, email: a.buyerEmail }));

    // Deduplicate
    const uniqueBuyers = Array.from(new Set(buyers.map(b => b.id)))
      .map(id => buyers.find(b => b.id === id));

    setBuyersForProperty(uniqueBuyers);
    setSelectedBuyerId("");
    setShowSoldModal(true);
  };

  const handleConfirmMarkSold = async () => {
    try {
      const endpoint = `/${propertyToMarkSold.id}/sold${selectedBuyerId ? `?buyerId=${selectedBuyerId}` : ''}`;
      await propertyApi.put(endpoint);
      toast.success("Property marked as Sold! Interested parties notified.");
      setShowSoldModal(false);
      setPropertyToMarkSold(null);
      fetchMyProperties();
    } catch (err) {
      console.error("Error marking property as sold:", err);
      toast.error("Failed to mark property as sold.");
    }
  };

  const handleCancelMarkSold = () => {
    setShowSoldModal(false);
    setPropertyToMarkSold(null);
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.propertyId || !newSlot.date || !newSlot.time) {
      toast.error("Please fill all slot details");
      return;
    }
    try {
      await slotsApi.post("", {
        propertyId: newSlot.propertyId,
        slotDate: newSlot.date,
        slotTime: newSlot.time
      });
      toast.success("Availability slot added!");
      setNewSlot({ propertyId: "", date: "", time: "" });
      fetchAgentSlots();
    } catch (err) {
      toast.error("Error adding slot: " + err.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this availability slot?")) return;
    try {
      await slotsApi.delete(`/${slotId}`);
      toast.success("Slot deleted");
      fetchAgentSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Error deleting slot");
    }
  };

  const handleStartSlotEdit = (slot) => {
    setEditingSlot(slot);
    setEditSlotData({
      date: slot.slotDate,
      time: slot.slotTime,
      propertyId: slot.propertyId || ""
    });
  };

  const handleCancelSlotEdit = () => {
    setEditingSlot(null);
    setEditSlotData({ date: "", time: "", propertyId: "" });
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      await slotsApi.put(`/${editingSlot.id}`, {
        slotDate: editSlotData.date,
        slotTime: editSlotData.time,
        propertyId: editSlotData.propertyId
      });
      toast.success("Slot updated!");
      setEditingSlot(null);
      fetchAgentSlots();
    } catch (err) {
      toast.error("Error updating slot: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaleConfirmation = async (apptId, answer) => {
    const action = answer === "YES" ? "confirm" : "deny";
    if (!window.confirm(`Are you sure you want to ${action} this sale?`)) return;
    try {
      await appointmentApi.put(`/${apptId}/agent-confirmation`, { answer });
      if (answer === "YES") {
        toast.success("Sale confirmed! Property marked as SOLD.");
      } else {
        toast.error("Sale denied.");
      }
      fetchAgentAppointments();
      fetchMyProperties();
    } catch (err) {
      toast.error("Error processing sale: " + err.message);
    }
  };

  const handleBuyerConfirmation = async (apptId, answer) => {
    try {
      await appointmentApi.put(`/${apptId}/buyer-confirmation`, { answer });
      toast.success(answer === "YES" ? "Interest confirmed. Agent notified." : "Response recorded.");
      fetchBuyerAppointments();
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name || 'User'}!</h1>
          <p className="sub-text">Your real estate dashboard</p>
        </div>

        {/* Stats cards - Different for Agent vs Buyer */}
        {user.role?.toUpperCase() === "AGENT" ? (
          <div className="dash-cards">
            <div className="dash-card">
              <HomeIcon size={24} />
              <h3>Total Properties</h3>
              <p>{stats.total}</p>
            </div>
            <div className="dash-card">
              <EyeIcon size={24} />
              <h3>Active Listings</h3>
              <p>{stats.active}</p>
            </div>
            <div className="dash-card">
              <EyeOffIcon size={24} />
              <h3>Unlisted</h3>
              <p>{stats.inactive}</p>
            </div>
            <div className="dash-card">
              <span className="role-icon">👤</span>
              <h3>Role</h3>
              <p className="role-badge">{user.role?.toUpperCase() || "AGENT"}</p>
            </div>
          </div>
        ) : (
          <div className="dash-cards">
            <div className="dash-card">
              <span className="role-icon">👤</span>
              <h3>Role</h3>
              <p className="role-badge">{user.role?.toUpperCase() || "BUYER"}</p>
            </div>
            <div className="dash-card">
              <span role="img" aria-label="email">📧</span>
              <h3>Email</h3>
              <p className="stat-value secondary">{user?.email || 'N/A'}</p>
            </div>
            <div className="dash-card">
              <span role="img" aria-label="city">🏙️</span>
              <h3>City</h3>
              <p className="stat-value secondary">{user?.city || 'Not set'}</p>
            </div>
            <div className="dash-card">
              <span role="img" aria-label="phone">📱</span>
              <h3>Phone</h3>
              <p className="stat-value secondary">{user?.phone || 'Not set'}</p>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="dash-tabs">
          <button
            className={`tab-link ${activeTab === "properties" ? "active" : ""}`}
            onClick={() => setActiveTab("properties")}
          >
            {user.role === "AGENT" ? "My Properties" : "Dashboard"}
          </button>
          <button
            className={`tab-link ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            {user.role === "AGENT" ? "Manage Sales" : "My Appointments"}
          </button>
          {user.role === "AGENT" && (
            <>
              <button
                className={`tab-link ${activeTab === "availability" ? "active" : ""}`}
                onClick={() => setActiveTab("availability")}
              >
                My Availability
              </button>
              <button
                className={`tab-link ${activeTab === "sold" ? "active" : ""}`}
                onClick={() => setActiveTab("sold")}
              >
                Sold Properties
              </button>
              <button
                className={`tab-link ${activeTab === "agency" ? "active" : ""}`}
                onClick={() => setActiveTab("agency")}
              >
                My Agency
              </button>
            </>
          )}
          {user.role === "BUYER" && (
            <button
              className={`tab-link ${activeTab === "bought" ? "active" : ""}`}
              onClick={() => setActiveTab("bought")}
            >
              Bought Properties
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-container">
          {activeTab === "properties" && (
            <>
              {/* Quick actions */}
              <div className="dashboard-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => navigate("/properties")}>
                    🏠 Browse Properties
                  </button>
                  {user.role?.toUpperCase() === "AGENT" && (
                    <button className="action-btn primary" onClick={() => navigate("/post-property")}>
                      <PlusIcon /> Post New Property
                    </button>
                  )}
                </div>
              </div>

              {/* My Properties - Only for Agents */}
              {user.role?.toUpperCase() === "AGENT" && (
                <div className="my-properties-section">
                  <div className="section-header">
                    <h2>My Properties</h2>
                    <div className="table-controls">
                      <div className="search-bar">
                        <input
                          type="text"
                          placeholder="Search your properties..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                      <button className="add-property-btn" onClick={() => navigate("/post-property")}>
                        <PlusIcon /> Add New
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="properties-grid" style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px'
                    }}>
                      {[1, 2, 3].map(n => <PropertySkeleton key={n} />)}
                    </div>
                  ) : myProperties.length === 0 ? (
                    <div className="empty-state">
                      <HomeIcon size={48} />
                      <h3>No Properties Yet</h3>
                    </div>
                  ) : (
                    <>
                      <div className="properties-table-container">
                        <table className="properties-table">
                          <thead>
                            <tr>
                              <th>Property</th>
                              <th>Purpose</th>
                              <th>Area</th>
                              <th>City</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentProperties.map(property => (
                              <tr key={property.id} className={!property.active ? 'inactive-row' : ''}>
                                    <td>
                                      <div className="property-info">
                                        <img
                                          src={getFirstImage(property.photos, "/property-placeholder.jpg")}
                                          alt="Property"
                                          className="property-thumb"
                                          style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                        <div>
                                          <div className="property-title">{property.title}</div>
                                          <div className="property-meta">
                                            {property.type} • {formatPrice(property.price)}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td><span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>{property.purpose}</span></td>
                                    <td><span style={{ color: '#cbd5e1', fontWeight: '600' }}>{property.area} sq.ft</span></td>
                                    <td><span style={{ color: '#cbd5e1', fontWeight: '600' }}>{property.city}</span></td>
                                    <td>
                                      {property.sold ? (
                                        <span className="status-badge sold">SOLD</span>
                                      ) : (
                                        <span className={`status-badge ${property.active ? 'active' : 'inactive'}`}>
                                          {property.active ? 'Active' : 'Unlisted'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="actions-cell">
                                      {!property.sold && (
                                        <>
                                          <button 
                                            className={`action-icon ${property.featured ? 'active' : ''}`} 
                                            title={property.featured ? "Remove from Spotlight" : "Add to Spotlight"} 
                                            onClick={() => handleToggleFeatured(property.id)}
                                            style={property.featured ? { color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)' } : {}}
                                          >
                                            <StarIcon fill={property.featured ? "currentColor" : "none"} />
                                          </button>
                                          <button className="action-icon edit" onClick={() => handleEdit(property)}><EditIcon /></button>
                                          <button className="action-icon toggle" title={property.active ? "Unlist Property" : "Relist Property"} onClick={() => handleToggleActive(property)}>
                                            {property.active ? <EyeOffIcon /> : <EyeIcon />}
                                          </button>
                                          <button className="action-icon success" title="Mark as Sold" onClick={() => handleMarkSoldInit(property)} style={{ color: '#10b981' }}>
                                            <CheckCircleIcon size={18} color="currentColor" />
                                          </button>
                                          <button className="action-icon delete" onClick={() => handleDelete(property.id)}><TrashIcon /></button>
                                        </>
                                      )}
                                    </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="dashboard-pagination">
                          <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                          >
                            Previous
                          </button>
                          <div className="page-numbers">
                            {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i + 1}
                                className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(i + 1)}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            className="page-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "availability" && user.role === "AGENT" && (
            <div className="availability-section">
              <div className="section-header">
                <h2>Manage Availability</h2>
              </div>

              <form className="slot-form" onSubmit={handleAddSlot}>
                <div className="form-group">
                  <label>Select Property</label>
                  <select
                    value={newSlot.propertyId}
                    onChange={e => setNewSlot({ ...newSlot, propertyId: e.target.value })}
                    required
                  >
                    <option value="">Choose a property...</option>
                    {/* Show all unsold properties so agent can add slots, even if unlisted or pending */}
                    {myProperties
                      .filter(p => !p.sold)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newSlot.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setNewSlot({ ...newSlot, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newSlot.time}
                    onChange={e => setNewSlot({ ...newSlot, time: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="add-btn"><PlusIcon /> Add Slot</button>
              </form>

              <div className="slots-grid">
                {(!slots || slots.length === 0) ? (
                  <p className="empty-msg">No slots added yet. Add your first slot above!</p>
                ) : (
                  slots.map(slot => (
                    <div key={slot?.id} className={`slot-card ${slot?.booked ? 'booked' : ''} ${editingSlot?.id === slot?.id ? 'editing' : ''}`}>
                      {editingSlot?.id === slot?.id ? (
                        <form onSubmit={handleUpdateSlot} className="edit-slot-form">
                          <input 
                            type="date" 
                            value={editSlotData.date} 
                            onChange={e => setEditSlotData({ ...editSlotData, date: e.target.value })}
                            required
                          />
                          <input 
                            type="time" 
                            value={editSlotData.time} 
                            onChange={e => setEditSlotData({ ...editSlotData, time: e.target.value })}
                            required
                          />
                          <select
                            value={editSlotData.propertyId}
                            onChange={e => setEditSlotData({ ...editSlotData, propertyId: e.target.value })}
                          >
                            <option value="">Global Slot</option>
                            {myProperties.filter(p => !p.sold).map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <div className="edit-actions">
                            <button type="submit" className="save-btn">Save</button>
                            <button type="button" className="cancel-btn" onClick={handleCancelSlotEdit}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="slot-info">
                            <CalendarIcon /> {slot?.slotDate}
                            <ClockIcon /> {slot?.slotTime}
                          </div>
                          <div className="slot-property">
                            {slot?.propertyTitle ? slot.propertyTitle : (slot?.propertyId ? `Property ID: ${slot.propertyId}` : "Global Slot")}
                          </div>
                          <div className="slot-actions">
                            {slot?.booked ? (
                              <span className="booked-badge">BOOKED</span>
                            ) : (
                              <>
                                <button className="edit-slot" onClick={() => handleStartSlotEdit(slot)}><EditIcon /></button>
                                <button className="del-slot" onClick={() => handleDeleteSlot(slot?.id)}><TrashIcon /></button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="appointments-section">
              <h2>{user.role === "AGENT" ? "Sale Confirmations" : "My Appointments"}</h2>

              <div className="appointments-list">
                {appointments.length === 0 ? (
                  <p className="empty-msg">No appointments yet.</p>
                ) : (
                  appointments.map(appt => (
                    <div key={appt.id} className={`appt-card ${appt.status}`}>
                      <div className="appt-header">
                        <h3>Appointment #{appt.id}</h3>
                        <span className={`status-pill ${appt.status}`}>{appt.status.toUpperCase()}</span>
                      </div>
                      <div className="appt-details">
                        <p><strong>Property ID:</strong> {appt.propertyId}</p>
                        <p><strong>Date/Time:</strong> {appt.appointmentDate} at {appt.appointmentTime}</p>
                        {user.role === "AGENT" ? (
                          <p><strong>Buyer:</strong> {appt.buyerName} ({appt.buyerEmail})</p>
                        ) : (
                          <p><strong>Status:</strong> {appt.status === 'awaiting_buyer' ? 'Action Required' : appt.status}</p>
                        )}
                      </div>

                      {/* Confirmation Logic for Buyer */}
                      {user.role === "BUYER" && appt.status === "confirmed" && new Date(appt.appointmentDate) < new Date() && (
                        <div className="buyer-action">
                          <p>Did you purchase this property?</p>
                          <div className="action-btns">
                            <button className="yes-btn" onClick={() => handleBuyerConfirmation(appt.id, "YES")}>YES</button>
                            <button className="no-btn" onClick={() => handleBuyerConfirmation(appt.id, "NO")}>NO</button>
                          </div>
                        </div>
                      )}

                      {/* Confirmation Logic for Agent */}
                      {user.role === "AGENT" && appt.status === "awaiting_agent" && (
                        <div className="agent-action">
                          <p>Confirm sale to {appt.buyerName}?</p>
                          <div className="action-btns">
                            <button className="yes-btn" onClick={() => handleSaleConfirmation(appt.id, "YES")}>CONFIRM SALE</button>
                            <button className="no-btn" onClick={() => handleSaleConfirmation(appt.id, "NO")}>DENY</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "agency" && user.role === "AGENT" && (
            <AgencyManagement user={user} onUpdateUser={() => fetchMyProperties()} />
          )}

          {activeTab === "bought" && user.role === "BUYER" && (
            <div className="bought-section">
              <h2><ShoppingBagIcon size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} />Bought Properties</h2>
              <div className="bought-grid">
                {boughtProperties.length === 0 ? (
                  <div className="empty-state">
                    <ShoppingBagIcon size={48} />
                    <h3>No Purchased Properties</h3>
                    <p>Properties you buy will appear here.</p>
                  </div>
                ) : (
                  boughtProperties.map(p => (
                    <div key={p.id} className="bought-card-v2">
                      <div className="bought-card-img">
                        <img
                          src={getFirstImage(p.propertyImage, "/property-placeholder.jpg")}
                          alt={p.propertyTitle || "Property"}
                        />
                          <span className="purchased-badge"><CheckCircleIcon size={16} color="white" /> Purchased</span>
                      </div>
                      <div className="bought-card-body">
                        <h3 className="bought-card-title">{p.propertyTitle || `Property #${p.propertyId}`}</h3>
                          <div className="bought-card-meta">
                            <span className="bought-agent"><StarIcon size={14} /> Agent: <strong>{p.agentName || "Assigned Agent"}</strong></span>
                            <span className="bought-date"><CalendarIcon size={14} /> {new Date(p.soldAt || p.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        <button
                          className="bought-view-btn"
                          onClick={() => navigate(`/property/${p.propertyId}?userId=${user.id}&role=${user.role}`)}
                        >
                          <EyeIcon size={16} /> View Property Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "sold" && user.role === "AGENT" && (
            <div className="sold-section">
              <h2>Sold Properties</h2>
              <div className="properties-table-container">
                {soldProperties.length === 0 ? (
                  <p className="empty-msg">No properties sold yet.</p>
                ) : (
                  <table className="properties-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Purpose</th>
                        <th>Area</th>
                        <th>City</th>
                        <th>Sold Date</th>
                        <th>Review</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldProperties.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div className="property-info">
                              <img
                                src={getFirstImage(p.photos, "/property-placeholder.jpg")}
                                alt="Property"
                                className="property-thumb"
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div>
                                <div className="property-title">{p.title}</div>
                                <div className="property-meta">{p.type} • {formatPrice(p.price)}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>{p.purpose}</span></td>
                          <td><span style={{ color: '#cbd5e1', fontWeight: '600' }}>{p.area} sq.ft</span></td>
                          <td><span style={{ color: '#cbd5e1', fontWeight: '600' }}>{p.city}</span></td>
                          <td>{p.soldAt ? new Date(p.soldAt).toLocaleDateString() : 'Recently'}</td>
                          <td>
                            {p.review ? (
                              <span className={`status-badge ${p.review.toLowerCase() === 'positive' ? 'active' : 'inactive'}`} style={{
                                background: p.review.toLowerCase() === 'positive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: p.review.toLowerCase() === 'positive' ? '#10b981' : '#ef4444',
                                border: `1px solid ${p.review.toLowerCase() === 'positive' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                              }}>
                                {p.review}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Pending</span>
                            )}
                          </td>
                          <td>
                            <button className="view-btn" onClick={() => navigate(`/property/${p.id}?userId=${user?.id || ''}&role=${user?.role || ''}`)}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Property Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}><EditIcon /> Advanced Property Editor</h2>
              <button className="close-x" onClick={handleCancelEdit} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div className="edit-modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Property Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Purpose</label>
                <select value={editForm.purpose} onChange={e => setEditForm({...editForm, purpose: e.target.value})}>
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Project">Project</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Area (sq.ft)</label>
                <input type="number" value={editForm.area} onChange={e => setEditForm({...editForm, area: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Furnishing</label>
                <select value={editForm.furnishing} onChange={e => setEditForm({...editForm, furnishing: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>
              <div className="form-group">
                <label>BHK</label>
                <input type="number" value={editForm.bhk} onChange={e => setEditForm({...editForm, bhk: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <input type="number" value={editForm.bathrooms} onChange={e => setEditForm({...editForm, bathrooms: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Balconies</label>
                <input type="number" value={editForm.balconies} onChange={e => setEditForm({...editForm, balconies: e.target.value})} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Pin Code</label>
                <input type="text" value={editForm.pinCode} onChange={e => setEditForm({...editForm, pinCode: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Facing</label>
                <input type="text" value={editForm.facing} onChange={e => setEditForm({...editForm, facing: e.target.value})} placeholder="e.g. East" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Location / Landmark</label>
                <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Description</label>
                <textarea 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  style={{ width: '100%', minHeight: '100px', background: '#060d18', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', padding: '12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Amenities (Comma separated)</label>
                <input type="text" value={editForm.amenities} onChange={e => setEditForm({...editForm, amenities: e.target.value})} placeholder="Pool, Gym, Parking..." />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Image URLs (Comma separated)</label>
                <input type="text" value={editForm.photos} onChange={e => setEditForm({...editForm, photos: e.target.value})} />
              </div>
            </div>
            
            <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px' }}>
              <button className="cancel-btn" onClick={handleCancelEdit} style={{ width: 'auto', padding: '12px 24px' }}>Discard</button>
              <button className="save-btn" onClick={handleSaveEdit} style={{ width: 'auto', padding: '12px 32px', background: '#3b82f6' }}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Sold Confirmation Modal */}
      {showSoldModal && propertyToMarkSold && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              <CheckCircleIcon color="#10b981" /> Finalize Sale
            </h2>
            <p>
              You are marking <strong>{propertyToMarkSold.title}</strong> as SOLD. This will cancel all pending appointments and notify interested buyers.
            </p>

            <div className="form-group">
              <label>Who purchased this property?</label>
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
              >
                <option value="">Sold outside platform / Unknown Buyer</option>
                {buyersForProperty.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.name} ({buyer.email})
                  </option>
                ))}
              </select>
              {buyersForProperty.length > 0 && (
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  Select the buyer to link this property directly to their user Dashboard.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCancelMarkSold}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleConfirmMarkSold}>
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Dashboard;




