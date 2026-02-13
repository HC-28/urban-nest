import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { propertyApi } from "../api.js";
import "../styles/Dashboard.css";
import { FiMessageCircle } from "react-icons/fi";


import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiHome
} from "react-icons/fi";


const IMAGE_BASE_URL = "http://localhost:8085/uploads/";

const resolveImage = (photos) => {
  if (!photos || !photos.trim()) {
    return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100";
  }

  const first = photos.split(",")[0];

  if (first.startsWith("http")) {
    return first;
  }

  return IMAGE_BASE_URL + encodeURIComponent(first);
};


function Dashboard() {
  // make `user` stateful so changes to localStorage (login/logout) can be reflected
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  });
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

  // re-run fetch when `user` changes (login/logout) so dashboard shows correct data
  useEffect(() => {
    if (user && user.role === "AGENT") {
      fetchMyProperties();
    } else {
      // if not agent or not logged in, stop loader
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyProperties = async () => {
    // guard: don't run when user is not available
    if (!user) {
      setMyProperties([]);
      setStats({ total: 0, active: 0, inactive: 0 });
      setLoading(false);
      return;
    }
    try {
      // Use agent/all endpoint so agents can see unlisted properties (owner view)
      const response = await propertyApi.get(`/agent/all/${user.id}`);
      const properties = response.data;
      setMyProperties(properties);
      setStats({
        total: properties.length,
        active: properties.filter(p => p.listed).length,
        inactive: properties.filter(p => !p.listed).length
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMyProperties([]);
      setLoading(false);
    }
  };

  // Listen for cross-tab `localStorage` changes and a same-tab custom event.
  // Posting page should set: localStorage.setItem('propertyPosted','1') and/or
  // dispatch a same-tab event: window.dispatchEvent(new Event('property-posted'))
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (e.key === 'propertyPosted' && e.newValue) {
          fetchMyProperties();
          // do not call removeItem here because storage event runs in other tabs only;
          // posting tab can clear the key after handling if desired
        }
        if (e.key === 'user') {
          // reflect login/logout across tabs
          try {
            setUser(e.newValue ? JSON.parse(e.newValue) : null);
          } catch (err) {
            setUser(null);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    const onCustom = (ev) => {
      if (ev && ev.type === 'property-posted') {
        fetchMyProperties();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('property-posted', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('property-posted', onCustom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      await propertyApi.delete(`/${propertyId}`, { params: { agentId: user.id } });
      alert("Property deleted successfully!");
      fetchMyProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property. Please try again.");
    }
  };

  const handleToggleActive = async (property) => {
    try {
      if (property.listed) {
        // Unlist property
        await propertyApi.put(`/${property.id}/unlist`, null, { params: { agentId: user.id } });
        alert("Property unlisted successfully!");
      } else {
        // Re-list property
        await propertyApi.put(`/${property.id}/list`, null, { params: { agentId: user.id } });
        alert("Property relisted successfully!");
      }
      fetchMyProperties();
    } catch (error) {
      console.error("Error toggling property listing:", error);
      alert("Failed to change property listing status. Please try again.");
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property.id);
    setEditForm({
      title: property.title,
      type: property.type,
      price: property.price,
      area: property.area,
      // initialize purpose: prefer stored value, otherwise infer from title or default to 'For Sale'
      purpose: property.purpose || ((property.title || '').toLowerCase().includes('rent') ? 'For Rent' : 'For Sale'),
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
           <button
             className="action-btn"
             onClick={() => navigate("/properties")}
           >
             🏠 Browse Properties
           </button>

           {user.role === "AGENT" && (
             <>
               <button
                 className="action-btn"
                 onClick={() => navigate("/agent/chats")}
               >
                 💬 Chats
               </button>

               <button
                 className="action-btn primary"
                 onClick={() => navigate("/post-property")}
               >
                 <FiPlus /> Post New Property
               </button>
             </>
           )}
         </div>
       </div>


        {/* My Properties Section - Only for Agents */}
        {user.role === "AGENT" && (
          <div className="my-properties-section">
            <div className="section-header">
              <h2>My Properties</h2>
              <button className="add-property-btn" onClick={() => navigate("/post-property") }>
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
                <button className="action-btn primary" onClick={() => navigate("/post-property") }>
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
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProperties.map(property => (
                      <tr key={property.id} className={!property.listed ? 'inactive-row' : ''}>
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
                              <select
                                value={editForm.purpose}
                                onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                                className="edit-input"
                              >
                                <option value="For Sale">For Sale</option>
                                <option value="For Rent">For Rent</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Project">Project</option>
                              </select>
                            </td>
                            <td>
                              <span className={`status-badge ${property.listed ? 'active' : 'inactive'}`}>
                                {property.listed ? 'Active' : 'Unlisted'}
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
                                  src={resolveImage(property.photos)}
                                  alt={property.title}
                                  className="property-thumb"
                                />

                                <span className="property-title">{property.title}</span>
                              </div>
                            </td>
                            <td>{property.type}</td>
                            <td>{formatPrice(property.price)}</td>
                            <td>{property.area} sq.ft</td>
                            <td>{property.purpose || ((property.title || '').toLowerCase().includes('rent') ? 'For Rent' : 'For Sale')}</td>
                            <td>
                              <span className={`status-badge ${property.listed ? 'active' : 'inactive'}`}>
                                {property.listed ? 'Active' : 'Unlisted'}
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
                                title={property.listed ? 'Unlist' : 'List'}
                              >
                                {property.listed ? <FiEyeOff /> : <FiEye />}
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
