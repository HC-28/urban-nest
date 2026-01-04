import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user.name}!</h1>
          <p className="sub-text">Your real estate overview</p>
        </div>

        <div className="dash-cards">
          <div className="dash-card">
            <h3>Total Properties</h3>
            <p>12</p>
          </div>

          <div className="dash-card">
            <h3>Active Listings</h3>
            <p>8</p>
          </div>

          <div className="dash-card">
            <h3>Leads</h3>
            <p>24</p>
          </div>

          <div className="dash-card">
            <h3>Role</h3>
            <p className="role-badge">{user.role}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.location.href = "/"}>
              🏠 Browse Properties
            </button>
            {user.role === "AGENT" && (
              <button className="action-btn" onClick={() => window.location.href = "/post-property"}>
                ➕ Post New Property
              </button>
            )}
            <button className="action-btn">
              📊 View Analytics
            </button>
            <button className="action-btn">
              💬 Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
