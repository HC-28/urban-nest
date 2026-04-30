import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import ProfileDrawer from "./ProfileDrawer";
import MapModal from "../property/MapModal";
import logo from "../../assets/logo.png";
import profile from "../../assets/profile.png";

import { FiMenu, FiX, FiSearch, FiMessageSquare } from "react-icons/fi";

/* ─── SVG Icon Wrappers (Migrated to React-Icons) ─── */
const MenuIcon = () => <FiMenu size={24} />;

const CloseIcon = () => <FiX size={24} />;

const SearchIcon = ({ size = 20, color = "currentColor" }) => (
    <FiSearch size={size} color={color} />
);

const MessageIcon = ({ size = 20, color = "currentColor" }) => (
    <FiMessageSquare size={size} color={color} />
);

function Navbar() {
    const [open, setOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const storedUser = localStorage.getItem("user");
            setUser(storedUser ? JSON.parse(storedUser) : null);
        };
        
        checkAuth();
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, [location.pathname]);

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
                        onClick={() => navigate("/")}
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
                            to="/buy"
                            className={isActive("/buy") ? "active" : ""}
                        >
                            Buy
                        </Link>
                        <Link
                            to="/rent"
                            className={isActive("/rent") ? "active" : ""}
                        >
                            Rent
                        </Link>
                        <Link
                            to="/projects"
                            className={isActive("/projects") ? "active" : ""}
                        >
                            Projects
                        </Link>
                        <Link
                            to="/agents"
                            className={isActive("/agents") ? "active" : ""}
                        >
                            Agents
                        </Link>
                        <Link
                            to="/agencies"
                            className={isActive("/agencies") ? "active" : ""}
                        >
                            Agencies
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



