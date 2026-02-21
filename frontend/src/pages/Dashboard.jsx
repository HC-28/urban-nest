import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { propertyApi } from "../api/api.js";
import { getFirstImage } from "../utils/imageUtils";
import "../styles/Dashboard.css";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiHome,
  FiStar,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiShoppingBag
} from "react-icons/fi";
import { appointmentApi, slotsApi } from "../api/api.js";
import { formatPrice } from "../utils/priceUtils";

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

  const [activeTab, setActiveTab] = useState("properties");
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ propertyId: "", date: "", time: "" });
  const [boughtProperties, setBoughtProperties] = useState([]);
  const [soldProperties, setSoldProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});

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
  }, [user]);

  const fetchAgentAppointments = async () => {
    try {
      const { data } = await appointmentApi.get(`/agent/${user.id}`);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching agent appointments:", err);
    }
  };

  const fetchBuyerAppointments = async () => {
    try {
      const { data } = await appointmentApi.get(`/buyer/${user.id}`);
      setAppointments(data);
      // Filter sold properties for bought properties tab
      const sold = data.filter(a => a.status === "sold").map(a => a.propertyId);
      if (sold.length > 0) {
        // Fetch property details for these IDs (simplified for now)
        setBoughtProperties(data.filter(a => a.status === "sold"));
      }
    } catch (err) {
      console.error("Error fetching buyer appointments:", err);
    }
  };

  const fetchAgentSlots = async () => {
    try {
      const { data } = await slotsApi.get(`/agent/${user.id}`);
      setSlots(data);
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
  };

  const fetchMyProperties = async () => {
    try {
      const response = await propertyApi.get(`/agent/${user.id}`);
      const properties = response.data;
      setMyProperties(properties);
      // Filter sold properties for the "Sold Properties" tab
      setSoldProperties(properties.filter(p => p.sold));
      setStats({
        total: properties.length,
        active: properties.filter(p => p.active).length,
        inactive: properties.filter(p => !p.active).length
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMyProperties([]);
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;

    try {
      await propertyApi.delete(`/${propertyId}?agentId=${user.id}`);
      alert("Property deleted successfully!");
      fetchMyProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property. Please try again.");
    }
  };

  const handleToggleActive = async (property) => {
    try {
      if (property.active) {
        // Unlist property
        await propertyApi.put(`/${property.id}/sold?agentId=${user.id}`);
        alert("Property unlisted successfully!");
      } else {
        // Re-list property
        await propertyApi.put(`/${property.id}/relist?agentId=${user.id}`);
        alert("Property listed successfully!");
      }
      fetchMyProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Failed to update property. Please try again.");
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property.id);
    setEditForm({
      title: property.title,
      type: property.type,
      price: property.price,
      area: property.area,
      bhk: property.bhk,
      photos: property.photos
    });
  };

  const handleSaveEdit = async (propertyId) => {
    try {
      await propertyApi.put(`/${propertyId}?agentId=${user.id}`, editForm);
      alert("Property updated successfully!");
      setEditingProperty(null);
      fetchMyProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Failed to update property. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
    setEditForm({});
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.propertyId || !newSlot.date || !newSlot.time) {
      alert("Please fill all slot details");
      return;
    }
    try {
      await slotsApi.post("", {
        agentId: user.id,
        propertyId: newSlot.propertyId,
        slotDate: newSlot.date,
        slotTime: newSlot.time
      });
      alert("Availability slot added!");
      setNewSlot({ propertyId: "", date: "", time: "" });
      fetchAgentSlots();
    } catch (err) {
      alert("Error adding slot: " + err.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this availability slot?")) return;
    try {
      await slotsApi.delete(`/${slotId}`);
      fetchAgentSlots();
    } catch (err) {
      alert(err.response?.data || "Error deleting slot");
    }
  };

  const handleSaleConfirmation = async (apptId, answer) => {
    const action = answer === "YES" ? "confirm" : "deny";
    if (!window.confirm(`Are you sure you want to ${action} this sale?`)) return;
    try {
      await appointmentApi.put(`/${apptId}/agent-confirm`, { answer });
      alert(answer === "YES" ? "Sale confirmed! Property marked as SOLD." : "Sale denied.");
      fetchAgentAppointments();
      fetchMyProperties();
    } catch (err) {
      alert("Error processing sale: " + err.message);
    }
  };

  const handleBuyerConfirmation = async (apptId, answer) => {
    try {
      await appointmentApi.put(`/${apptId}/buyer-confirm`, { answer });
      alert(answer === "YES" ? "Interest confirmed. Agent notified." : "Response recorded.");
      fetchBuyerAppointments();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user.name}!</h1>
          <p className="sub-text">Your real estate dashboard</p>
        </div>

        {/* Stats cards - Different for Agent vs Buyer */}
        {user.role?.toUpperCase() === "AGENT" ? (
          <div className="dash-cards">
            <div className="dash-card">
              <FiHome size={24} />
              <h3>Total Properties</h3>
              <p>{stats.total}</p>
            </div>
            <div className="dash-card">
              <FiEye size={24} />
              <h3>Active Listings</h3>
              <p>{stats.active}</p>
            </div>
            <div className="dash-card">
              <FiEyeOff size={24} />
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
              <p className="stat-value secondary">{user.email}</p>
            </div>
            <div className="dash-card">
              <span role="img" aria-label="city">🏙️</span>
              <h3>City</h3>
              <p className="stat-value secondary">{user.city || 'Not set'}</p>
            </div>
            <div className="dash-card">
              <span role="img" aria-label="phone">📱</span>
              <h3>Phone</h3>
              <p className="stat-value secondary">{user.phone || 'Not set'}</p>
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
                      <FiPlus /> Post New Property
                    </button>
                  )}
                </div>
              </div>

              {/* My Properties - Only for Agents */}
              {user.role?.toUpperCase() === "AGENT" && (
                <div className="my-properties-section">
                  <div className="section-header">
                    <h2>My Properties</h2>
                    <button className="add-property-btn" onClick={() => navigate("/post-property")}>
                      <FiPlus /> Add New
                    </button>
                  </div>

                  {loading ? (
                    <div className="loading-state"><p>Loading properties...</p></div>
                  ) : myProperties.length === 0 ? (
                    <div className="empty-state">
                      <FiHome size={48} />
                      <h3>No Properties Yet</h3>
                    </div>
                  ) : (
                    <div className="properties-table-container">
                      <table className="properties-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myProperties.map(property => (
                            <tr key={property.id} className={!property.active ? 'inactive-row' : ''}>
                              <td>
                                <div className="property-info">
                                  <img
                                    src={getFirstImage(property.photos, "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100")}
                                    alt=""
                                    className="property-thumb"
                                  />
                                  <div>
                                    <div className="property-title">{property.title}</div>
                                    <div className="property-meta">{property.type} • {formatPrice(property.price)}</div>
                                  </div>
                                </div>
                              </td>
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
                                    <button className="action-icon edit" onClick={() => handleEdit(property)}><FiEdit2 /></button>
                                    <button className="action-icon toggle" onClick={() => handleToggleActive(property)}>
                                      {property.active ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                    <button className="action-icon delete" onClick={() => handleDelete(property.id)}><FiTrash2 /></button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                    {myProperties.map(p => (
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
                <button type="submit" className="add-btn"><FiPlus /> Add Slot</button>
              </form>

              <div className="slots-grid">
                {slots.map(slot => (
                  <div key={slot.id} className={`slot-card ${slot.booked ? 'booked' : ''}`}>
                    <div className="slot-info">
                      <FiCalendar /> {slot.slotDate}
                      <FiClock /> {slot.slotTime}
                    </div>
                    <div className="slot-property">
                      Property ID: {slot.propertyId}
                    </div>
                    <div className="slot-actions">
                      {slot.booked ? (
                        <span className="booked-badge">BOOKED</span>
                      ) : (
                        <button className="del-slot" onClick={() => handleDeleteSlot(slot.id)}><FiTrash2 /></button>
                      )}
                    </div>
                  </div>
                ))}
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

          {activeTab === "bought" && user.role === "BUYER" && (
            <div className="bought-section">
              <h2>Bought Properties</h2>
              <div className="bought-list">
                {boughtProperties.length === 0 ? (
                  <p className="empty-msg">You haven't bought any properties yet.</p>
                ) : (
                  boughtProperties.map(p => (
                    <div key={p.id} className="bought-card property-info" onClick={() => navigate(`/property/${p.propertyId}?userId=${user.id}&role=${user.role}`)}>
                      <FiShoppingBag size={24} />
                      <div className="bought-info">
                        <h3>{p.buyerName ? `Purchase for Property #${p.propertyId}` : "Successfully Purchased"}</h3>
                        <p>Purchased on: {new Date(p.updatedAt).toLocaleDateString()}</p>
                        <span className="view-link">View Documentation →</span>
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
                        <th>Sold Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldProperties.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div className="property-info">
                              <img
                                src={getFirstImage(p.photos, "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100")}
                                alt=""
                                className="property-thumb"
                              />
                              <div>
                                <div className="property-title">{p.title}</div>
                                <div className="property-meta">{p.type}</div>
                              </div>
                            </div>
                          </td>
                          <td>{p.soldAt ? new Date(p.soldAt).toLocaleDateString() : 'Recently'}</td>
                          <td>
                            <button className="view-btn" onClick={() => navigate(`/property/${p.id}?userId=${user.id}&role=${user.role}`)}>
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

      <Footer />
    </div>
  );
}

export default Dashboard;
