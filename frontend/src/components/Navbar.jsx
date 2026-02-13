import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import ProfileDrawer from "./ProfileDrawer";
import MapModal from "./MapModal";
import logo from "../assets/logo.png";
import profile from "../assets/profile.png";

function Navbar() {
    const [open, setOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const navigate = useNavigate();
    const location = useLocation();

    const handleUserUpdate = (updatedUser) => setUser(updatedUser);
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="site-header">
                <div className="header-inner">
                    <div
                        className="brand"
                        role="button"
                        onClick={() => (window.location.href = "/")}
                        tabIndex={0}
                    >
                        <img src={logo} alt="logo" className="brand-logo" />
                        <span className="brand-title">Urban-Nest</span>
                    </div>

                    <nav className="main-nav">
                        <Link
                            to="/properties?purpose=Sale"
                            className={isActive("/properties") ? "active" : ""}
                        >
                            Buy
                        </Link>
                        <Link to="/properties?purpose=Rent">Rent</Link>
                        <Link to="/properties?type=Projects">Projects</Link>
                        <Link
                            to="/agents"
                            className={isActive("/agents") ? "active" : ""}
                        >
                            Agents
                        </Link>
                        {user && (
                            <Link
                                to="/favorites"
                                className={isActive("/favorites") ? "active" : ""}
                            >
                                Favourites
                            </Link>
                        )}
                        <button className="map-btn" onClick={() => setMapOpen(true)}>
                            🗺️ Map
                        </button>
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
                                src={user.profilePicture || profile}
                                alt="profile"
                                className="nav-profile"
                                onClick={() => setOpen(true)}
                                onError={(e) => { e.target.src = profile; }}
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
            <MapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />
        </>
    );
}

export default Navbar;
