import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/ProfileDrawer.css";

function ProfileDrawer({ isOpen, onClose, user, onUserUpdate }) {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogout = () => {
    // Clear client-side auth state
    localStorage.removeItem('user');
    // Close the drawer
    onClose();
    // Redirect to home page with full refresh to update navbar
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
      const response = await api.put("/update-name", {
        email: user.email,
        name: newName.trim()
      });

      // Update localStorage with new user data
      const updatedUser = { ...user, name: newName.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Notify parent component about the update
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
      setError("Failed to update name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock stats - in real app, fetch from backend
  const userStats = {
    propertiesSold: user.role === "AGENT" ? 15 : 0,
    propertiesBought: user.role === "BUYER" ? 3 : 0,
    propertiesListed: user.role === "AGENT" ? 12 : 0,
    rating: 4.5,
    reviews: 28
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose}></div>

      {/* Drawer */}
      <div className="drawer">
        <div className="drawer-header">
          <img
            src="/src/assets/profile.png"
            alt="Profile"
            className="drawer-avatar"
          />

          {/* Editable Name Section */}
          <div className="name-section">
            {isEditingName ? (
              <div className="edit-name-container">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="edit-name-input"
                  placeholder="Enter your name"
                  autoFocus
                />
                <div className="edit-name-actions">
                  <button
                    className="save-name-btn"
                    onClick={handleSaveName}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-name-btn"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className="edit-error">{error}</p>}
              </div>
            ) : (
              <div className="display-name-container">
                <h3>{user.name}</h3>
                <button className="edit-name-btn" onClick={handleEditName} title="Edit name">
                  ✏️
                </button>
              </div>
            )}
          </div>

          <p className="user-email">{user.email}</p>
          <span className="user-role-badge">{user.role}</span>
        </div>

        {/* User Stats Section */}
        <div className="drawer-stats">
          {user.role === "AGENT" ? (
            <>
              <div className="stat-item">
                <span className="stat-value">{userStats.propertiesSold}</span>
                <span className="stat-label">Properties Sold</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userStats.propertiesListed}</span>
                <span className="stat-label">Listed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">⭐ {userStats.rating}</span>
                <span className="stat-label">{userStats.reviews} Reviews</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-value">{userStats.propertiesBought}</span>
                <span className="stat-label">Properties Bought</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">5</span>
                <span className="stat-label">Saved Properties</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12</span>
                <span className="stat-label">Enquiries</span>
              </div>
            </>
          )}
        </div>

        <div className="drawer-menu">
          <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          <button>Profile</button>
          {user.role === "AGENT" && <button>My Properties</button>}
          {user.role === "BUYER" && <button>Favourites</button>}
        </div>

        <div className="drawer-content">
          {user.role === "AGENT" ? (
            <>
              <h4>My Properties</h4>
              <div className="property-card">Luxury Villa – Bangalore</div>
              <div className="property-card">2BHK Apartment – Pune</div>
              <div className="property-card">Commercial Space – Mumbai</div>
            </>
          ) : (
            <>
              <h4>Favourite Properties</h4>
              <div className="property-card">3BHK Flat – Hyderabad</div>
              <div className="property-card">Independent House – Chennai</div>
            </>
          )}
        </div>

        {/* Logout Button at Bottom */}
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
