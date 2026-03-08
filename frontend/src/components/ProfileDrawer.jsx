import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { userApi, favoritesApi, propertyApi } from "../api/api.js";
import "../styles/ProfileDrawer.css";
import PropertyCard from "./PropertyCard.jsx";
import { formatPrice } from "../utils/priceUtils.js";
import { FiGrid, FiUser, FiHeart, FiCalendar, FiMessageCircle, FiShield, FiLogOut } from "react-icons/fi";

function ProfileDrawer({ isOpen, onClose, user, onUserUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard";
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Properties count for agents
  const [propertiesCount, setPropertiesCount] = useState(0);

  // Fetch favorites and properties count when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      setLoadingFavs(true);
      favoritesApi.get(`/user/${user.id}`)
        .then(res => setFavorites(res.data))
        .catch(err => console.error("Error fetching favorites", err))
        .finally(() => setLoadingFavs(false));

      // Fetch properties count for agents
      if (user.role === "AGENT") {
        propertyApi.get(`/agent/${user.id}`)
          .then(res => setPropertiesCount(res.data.length))
          .catch(err => console.error("Error fetching properties count", err));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onClose();
    window.location.href = '/';
  };

  const handleEditName = () => {
    setNewName(user.name);
    setIsEditingName(true);
    setError("");
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName(user.name);
    setError("");
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await userApi.put("/me/profile", { name: newName.trim() });
      const updatedUser = { ...user, name: newName.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
      setIsEditingName(false);
    } catch (err) {
      setError("Failed to update name.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setPreviewImage(base64Image);
      setIsUploadingPicture(true);
      setError(""); // Clear any previous errors
      try {
        await userApi.patch("/me/avatar", {
          profilePicture: base64Image
        });
        const updatedUser = { ...user, profilePicture: base64Image };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);
        setPreviewImage(null);
      } catch (err) {
        setError("Failed to update picture. Please try again.");
        setPreviewImage(null);
      } finally {
        setIsUploadingPicture(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const userStats = {
    propertiesSold: user.role === "AGENT" ? 15 : 0,
    propertiesBought: user.role === "BUYER" ? 3 : 0,
    propertiesListed: user.role === "AGENT" ? propertiesCount : 0,
    rating: 4.5,
    reviews: 28
  };

  const handleUnfav = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-header">
          <div className="avatar-wrapper" style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <img
              src={previewImage || user.profilePicture || "/src/assets/profile.png"}
              alt="Profile"
              className="drawer-avatar"
              style={{ opacity: isUploadingPicture ? 0.5 : 1, margin: 0 }}
              onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23e2e8f0' width='100' height='100'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='14' dy='5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EUser%3C/text%3E%3C/svg%3E"; }}
            />
            <label htmlFor="profile-picture-input" className="camera-icon-label" style={{
              position: 'absolute', bottom: '2px', right: '2px', background: '#2563eb',
              color: 'white', borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              border: '2px solid var(--bg-tertiary)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}>
              📷
            </label>
            <input id="profile-picture-input" type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: 'none' }} disabled={isUploadingPicture} />
          </div>

          <div className="name-section">
            {isEditingName ? (
              <div className="edit-name-container">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="edit-name-input" autoFocus />
                <div className="edit-name-actions">
                  <button className="save-name-btn" onClick={handleSaveName} disabled={isLoading}>Save</button>
                  <button className="cancel-name-btn" onClick={handleCancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="display-name-container">
                <h3>{user.name}</h3>
                <button className="edit-name-btn" onClick={handleEditName}>✏️</button>
              </div>
            )}
          </div>
          <p className="user-email">{user.email}</p>
          <span className="user-role-badge">{user.role}</span>
        </div>

        <div className="drawer-stats">
          {/* Same stats logic as before */}
          <div className="stat-item">
            <span className="stat-value">{user.role === 'AGENT' ? userStats.propertiesListed : favorites.length}</span>
            <span className="stat-label">{user.role === 'AGENT' ? 'Listed' : 'Favorites'}</span>
          </div>
        </div>

        <div className="drawer-menu">
          {!isOnDashboard && user.role !== "ADMIN" && <button onClick={() => { navigate("/dashboard"); onClose(); }}><FiGrid size={16} /> Dashboard</button>}
          {location.pathname !== "/admin" && user.role === "ADMIN" && <button onClick={() => { navigate("/admin"); onClose(); }}><FiShield size={16} /> Admin Area</button>}
          <button onClick={() => { navigate("/profile"); onClose(); }}><FiUser size={16} /> My Profile</button>
          {user.role === "BUYER" && <button onClick={() => { navigate("/favorites"); onClose(); }}><FiHeart size={16} /> Favourites</button>}
          {user.role !== "ADMIN" && <button onClick={() => { navigate("/dashboard"); onClose(); }}><FiCalendar size={16} /> My Appointments</button>}
          {user.role !== "ADMIN" && <button onClick={() => { navigate(user.role === 'AGENT' ? "/agent/chats" : "/chats"); onClose(); }}><FiMessageCircle size={16} /> Chats</button>}
        </div>

        <div className="drawer-content">
          <h4>{user.role === 'AGENT' ? 'Recent Activity' : 'My Favourites'}</h4>
          <div className="drawer-favorites-list">
            {loadingFavs ? <p>Loading...</p> :
              favorites.length > 0 ? (
                favorites.map(p => (
                  <div key={p.id} className="drawer-fav-item" onClick={() => { navigate(`/property/${p.id}`); onClose(); }}>
                    <div style={{ position: 'relative' }}>
                      <img src={p.photos ? p.photos[0] : ""} alt="prop" className="fav-thumb" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect fill='%23e2e8f0' width='50' height='50'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='8' dy='3' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EIMG%3C/text%3E%3C/svg%3E"} />
                      <button
                        className="fav-toggle-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfav(p.id);
                          favoritesApi.delete(`/?userId=${user.id}&propertyId=${p.id}`);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          fontSize: '10px'
                        }}
                      >
                        ❤️
                      </button>
                    </div>
                    <div className="fav-info">
                      <span className="fav-title">{p.title}</span>
                      <span className="fav-price">{formatPrice(p.price)}</span>
                    </div>
                  </div>
                ))
              ) : <p className="no-favs">No favorites yet.</p>
            }
          </div>
        </div>

        <div className="drawer-footer">
          <button className="logout-btn-drawer" onClick={handleLogout}><FiLogOut size={16} /> Logout</button>
        </div>
      </div>
    </>
  );
}

export default ProfileDrawer;
