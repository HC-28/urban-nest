import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import "../styles/ProfileDrawer.css";

function ProfileDrawer({ isOpen, onClose, user, onUserUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard";

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ favourites state
  const [favourites, setFavourites] = useState([]);

  // 🔁 load favourites when drawer opens
  useEffect(() => {
    if (user && user.role === "BUYER") {
      const key = `savedProperties_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      setFavourites(saved);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    onClose();
    window.location.href = "/";
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
      await api.put("/update-name", {
        email: user.email,
        name: newName.trim()
      });

      const updatedUser = { ...user, name: newName.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);

      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
      setError("Failed to update name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>

      <div className="drawer">
        {/* HEADER */}
        <div className="drawer-header">
          <img src="/src/assets/profile.png" alt="Profile" className="drawer-avatar" />

          <div className="name-section">
            {isEditingName ? (
              <div className="edit-name-container">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="edit-name-input"
                  autoFocus
                />
                <div className="edit-name-actions">
                  <button className="save-name-btn" onClick={handleSaveName} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button className="cancel-name-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
                {error && <p className="edit-error">{error}</p>}
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

        {/* STATS */}
        <div className="drawer-stats">
          {user.role === "BUYER" ? (
            <>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Properties Bought</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{favourites.length}</span>
                <span className="stat-label">Saved Properties</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Enquiries</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Properties Sold</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Listed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">⭐ 0</span>
                <span className="stat-label">Reviews</span>
              </div>
            </>
          )}
        </div>

        {/* MENU */}
        <div className="drawer-menu">
          {!isOnDashboard && (
            <button onClick={() => { navigate("/dashboard"); onClose(); }}>
              Go to Dashboard
            </button>
          )}
          <button onClick={() => navigate("/properties")}>Browse Properties</button>
          {user.role === "AGENT" && (
            <button onClick={() => navigate("/post-property")}>Post Property</button>
          )}
        </div>

        {/* CONTENT */}
        <div className="drawer-content">
          {user.role === "BUYER" ? (
            <>
              <h4>Favourite Properties</h4>
              {favourites.length === 0 ? (
                <p style={{ color: "#aaa" }}>No favourites yet</p>
              ) : (
                favourites.map((p) => (
                  <div
                    key={p.id}
                    className="property-card"
                    onClick={() => {
                      onClose();
                      navigate(`/property/${p.id}`);
                    }}
                  >
                    {p.title}
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <h4>My Properties</h4>
              <p style={{ color: "#aaa" }}>Coming soon...</p>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="drawer-footer">
          <button className="logout-btn-drawer" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileDrawer;
