import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import ProfileDrawer from "./ProfileDrawer";
import logo from "../assets/logo.png";
import profile from "../assets/profile.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* make brand clickable and reload the page */}
          <div
            className="brand"
            role="button"
            onClick={() => {
              // do a full navigation to root (causes page refresh)
              window.location.href = "/";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") window.location.href = "/";
            }}
            tabIndex={0}
          >
            <img src={logo} alt="logo" className="brand-logo" />
            <span className="brand-title">RealEstateIndia</span>
          </div>

          <nav className="main-nav">
            <Link to="#">Buy</Link>
            <Link to="#">Rent</Link>
            <Link to="#">Projects</Link>
            <Link to="#">Agents</Link>
            <Link to="#">Services</Link>
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
