import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import ProfileDrawer from "./ProfileDrawer";
import logo from "../assets/logo.png";
import profile from "../assets/profile.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const isActive = (path) => location.pathname === path;

  const getPropertiesType = () => {
    try {
      const params = new URLSearchParams(location.search);
      return (params.get("type") || "").toLowerCase();
    } catch (e) {
      return "";
    }
  };

  const currentPropType = getPropertiesType();

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* Brand */}
          <div
            className="brand"
            role="button"
            onClick={() => (window.location.href = "/")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                window.location.href = "/";
            }}
            tabIndex={0}
          >
            <img src={logo} alt="logo" className="brand-logo" />
            <span className="brand-title">RealEstateIndia</span>
          </div>

          <nav className="main-nav">
            {/* ✅ FIXED: Buy only active when type=buy */}
            <Link
              to="/properties?type=buy"
              className={
                location.pathname === "/properties" &&
                currentPropType === "buy"
                  ? "active"
                  : ""
              }
            >
              Buy
            </Link>

            <Link
              to="/properties?type=rent"
              className={
                location.pathname === "/properties" &&
                currentPropType === "rent"
                  ? "active"
                  : ""
              }
            >
              Rent
            </Link>

            <Link
              to="/properties?type=projects"
              className={
                location.pathname === "/properties" &&
                currentPropType === "projects"
                  ? "active"
                  : ""
              }
            >
              Projects
            </Link>

            <Link to="/agents" className={isActive("/agents") ? "active" : ""}>
              Agents
            </Link>

            <Link
              to="/properties?type=commercial"
              className={
                location.pathname === "/properties" &&
                currentPropType === "commercial"
                  ? "active"
                  : ""
              }
            >
              Commercial
            </Link>
          </nav>

          <div className="header-actions">
            {user && user.role === "AGENT" && (
              <button
                className="post-btn"
                onClick={() => navigate("/post-property")}
              >
                Post Property
              </button>
            )}

            {user ? (
              <img
                src={profile}
                alt="profile"
                className="nav-profile"
                onClick={() => setOpen(true)}
              />
            ) : (
              <>
                <Link to="/signup" className="signup-link">
                  Sign up
                </Link>
                <Link to="/login" className="login-btn">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </>
  );
}

export default Navbar;
