import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import ProfileDrawer from "./ProfileDrawer";
import MapModal from "./MapModal";
import logo from "../assets/logo.png";
import profile from "../assets/profile.png";

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const SearchIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const MessageIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

function Navbar() {
    const [open, setOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const navigate = useNavigate();
    const location = useLocation();

    const handleUserUpdate = (updatedUser) => setUser(updatedUser);
    const isActive = (path, search) => {
        if (search) {
            return location.pathname === path && location.search.includes(search);
        }
        return location.pathname === path;
    };

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

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                    >
                        {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>

                    <nav className={`main-nav ${mobileNavOpen ? 'mobile-open' : ''}`}>
                        <Link
                            to="/properties?purpose=Sale"
                            className={isActive("/properties", "purpose=Sale") ? "active" : ""}
                        >
                            Buy
                        </Link>
                        <Link
                            to="/properties?purpose=Rent"
                            className={isActive("/properties", "purpose=Rent") ? "active" : ""}
                        >
                            Rent
                        </Link>
                        <Link
                            to="/properties?type=Projects"
                            className={isActive("/properties", "type=Projects") ? "active" : ""}
                        >
                            Projects
                        </Link>
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
                                onClick={() => setMobileNavOpen(false)}
                            >
                                Favourites
                            </Link>
                        )}
                        <button
                            className="map-btn"
                            onClick={() => {
                                setMapOpen(true);
                                setMobileNavOpen(false);
                            }}
                        >
                            🗺️ Map
                        </button>
                    </nav>

                    <div className="header-actions">
                        {/* Search Button — redirects to search page */}
                        <button
                            className="search-toggle-btn"
                            onClick={() => navigate("/properties")}
                            title="Search Properties"
                        >
                            <SearchIcon size={20} color="#ffffff" />
                        </button>

                        <button
                            className="messages-btn"
                            onClick={() => navigate(user ? (user.role === "AGENT" ? "/agent/chats" : "/chats") : "/login")}
                            title="Messages"
                        >
                            <MessageIcon size={20} color="#ffffff" />
                        </button>
                        {user && user.role === "AGENT" && (
                            <button
                                className="post-btn"
                                onClick={() => navigate("/post-property")}
                            >
                                <span className="login-btn-text">Post Property</span>
                            </button>
                        )}
                        {user && user.role === "ADMIN" && (
                            <button
                                className="post-btn"
                                onClick={() => navigate("/admin")}
                                style={{ background: 'var(--primary-gradient)' }}
                            >
                                <span className="login-btn-text">🛡️ Admin</span>
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
                                    <span className="login-btn-text">Log in</span>
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
