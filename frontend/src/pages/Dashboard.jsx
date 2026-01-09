import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { propertyApi } from "../api";
import "../styles/Dashboard.css";
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus, FiHome, FiDollarSign, FiMapPin } from "react-icons/fi";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    if (user && user.role === "AGENT") {
      fetchMyProperties();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMyProperties = async () => {
    try {
      const response = await propertyApi.get(`/agent/${user.id}`);
      const properties = response.data;
      setMyProperties(properties);
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
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

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
        // Unlist the property
        await propertyApi.put(`/${property.id}/sold?agentId=${user.id}`);
        alert("Property unlisted successfully!");
      } else {
        // Re-list the property
        const updatedProperty = { ...property, active: true };
        await propertyApi.put(`/${property.id}?agentId=${user.id}`, updatedProperty);
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

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user.name}!</h1>
          <p className="sub-text">Your real estate dashboard</p>
        </div>

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
            <p className="role-badge">{user.role}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => navigate("/properties")}>
              🏠 Browse Properties
            </button>
            {user.role === "AGENT" && (
              <button className="action-btn primary" onClick={() => navigate("/post-property")}>
                <FiPlus /> Post New Property
              </button>
            )}
          </div>
        </div>

        {/* My Properties Section - Only for Agents */}
        {user.role === "AGENT" && (
          <div className="my-properties-section">
            <div className="section-header">
              <h2>My Properties</h2>
              <button className="add-property-btn" onClick={() => navigate("/post-property")}>
                <FiPlus /> Add New
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <p>Loading your properties...</p>
              </div>
            ) : myProperties.length === 0 ? (
              <div className="empty-state">
                <FiHome size={48} />
                <h3>No Properties Yet</h3>
                <p>You haven't posted any properties yet. Start by posting your first property!</p>
                <button className="action-btn primary" onClick={() => navigate("/post-property")}>
                  <FiPlus /> Post Your First Property
                </button>
              </div>
            ) : (
              <div className="properties-table-container">
                <table className="properties-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Area</th>
                      <th>BHK</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProperties.map(property => (
                      <tr key={property.id} className={!property.active ? 'inactive-row' : ''}>
                        {editingProperty === property.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <select
                                value={editForm.type}
                                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                                className="edit-input"
                              >
                                <option value="Apartment">Apartment</option>
                                <option value="Villa">Villa</option>
                                <option value="House">House</option>
                                <option value="Plot">Plot</option>
                                <option value="Commercial">Commercial</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.area}
                                onChange={(e) => setEditForm({...editForm, area: parseFloat(e.target.value)})}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.bhk}
                                onChange={(e) => setEditForm({...editForm, bhk: parseInt(e.target.value)})}
                                className="edit-input"
                                min="1"
                                max="10"
                              />
                            </td>
                            <td>
                              <span className={`status-badge ${property.active ? 'active' : 'inactive'}`}>
                                {property.active ? 'Active' : 'Unlisted'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button className="save-btn" onClick={() => handleSaveEdit(property.id)}>
                                Save
                              </button>
                              <button className="cancel-btn" onClick={handleCancelEdit}>
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <div className="property-info">
                                <img
                                  src={property.photos || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100"}
                                  alt={property.title}
                                  className="property-thumb"
                                />
                                <span className="property-title">{property.title}</span>
                              </div>
                            </td>
                            <td>{property.type}</td>
                            <td>{formatPrice(property.price)}</td>
                            <td>{property.area} sq.ft</td>
                            <td>{property.bhk} BHK</td>
                            <td>
                              <span className={`status-badge ${property.active ? 'active' : 'inactive'}`}>
                                {property.active ? 'Active' : 'Unlisted'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="action-icon edit"
                                onClick={() => handleEdit(property)}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                className="action-icon toggle"
                                onClick={() => handleToggleActive(property)}
                                title={property.active ? 'Unlist' : 'List'}
                              >
                                {property.active ? <FiEyeOff /> : <FiEye />}
                              </button>
                              <button
                                className="action-icon delete"
                                onClick={() => handleDelete(property.id)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Dashboard;
