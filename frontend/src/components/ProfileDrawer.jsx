import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { userApi, favoritesApi } from "../api/api.js";
import "../styles/ProfileDrawer.css";
import PropertyCard from "./PropertyCard.jsx";
import { formatPrice } from "../utils/priceUtils.js";

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

  // Fetch favorites when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      setLoadingFavs(true);
      favoritesApi.get(`/user/${user.id}`)
        .then(res => setFavorites(res.data))
        .catch(err => console.error("Error fetching favorites", err))
        .finally(() => setLoadingFavs(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
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
      await userApi.put("/update-name", { email: user.email, name: newName.trim() });
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
        await userApi.put("/update-profile-picture", {
          email: user.email,
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
    propertiesListed: user.role === "AGENT" ? 12 : 0,
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={previewImage || user.profilePicture || "/src/assets/profile.png"}
              alt="Profile"
              className="drawer-avatar"
              style={{ opacity: isUploadingPicture ? 0.5 : 1 }}
              onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }}
            />
            <label htmlFor="profile-picture-input" className="camera-icon-label" style={{
              position: 'absolute', bottom: '0', right: '0', background: '#2563eb',
              color: 'white', borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
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
          {!isOnDashboard && <button onClick={() => { navigate("/dashboard"); onClose(); }}>Dashboard</button>}
          <button onClick={() => { navigate("/profile"); onClose(); }}>My Profile</button>
          <button onClick={() => { navigate("/favorites"); onClose(); }}>Favourites</button>
        </div>

        <div className="drawer-content">
          <h4>{user.role === 'AGENT' ? 'Recent Activity' : 'My Favourites'}</h4>
          <div className="drawer-favorites-list">
            {loadingFavs ? <p>Loading...</p> :
              favorites.length > 0 ? (
                favorites.map(p => (
                  <div key={p.id} className="drawer-fav-item" onClick={() => { navigate(`/property/${p.id}`); onClose(); }}>
                    <img src={p.photos ? p.photos[0] : ""} alt="prop" className="fav-thumb" onError={(e) => e.target.src = "https://via.placeholder.com/50"} />
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
          <button className="logout-btn-drawer" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>
    </>
  );
}

export default ProfileDrawer;
