import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { userApi, propertyApi, favoritesApi } from "../api/api";
import "../styles/Profile.css";
import {
    FiUser,
    FiSettings,
    FiPhone,
    FiMapPin,
    FiBriefcase,
    FiArrowLeft,
    FiGrid,
    FiHeart,
    FiLogOut,
    FiList
} from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [activeTab, setActiveTab] = useState("overview"); // overview, listings, favorites, settings
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Data states
    const [myProperties, setMyProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        city: user?.city || "",
        pincode: user?.pincode || "",
        bio: user?.bio || "",
        agencyName: user?.agencyName || "",
        experience: user?.experience || "",
        specialties: user?.specialties || "",
    });

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (activeTab === "listings" && user.role?.toUpperCase() === "AGENT") {
            fetchMyProperties();
        } else if (activeTab === "favorites") {
            fetchFavorites();
        }
    }, [activeTab, user, navigate]);

    const fetchMyProperties = async () => {
        try {
            const res = await propertyApi.get(`/agent/${user.id}`);
            setMyProperties(res.data);
        } catch (err) {
            console.error("Error fetching properties", err);
        }
    };

    const fetchFavorites = async () => {
        try {
            const res = await favoritesApi.get(`/user/${user.id}`);
            setFavorites(res.data);
        } catch (err) {
            console.error("Error fetching favorites", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await userApi.put("/update-profile", {
                ...formData,
                email: user.email,
                role: user.role,
            });

            const updatedUser = response.data;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            console.error("Profile update error:", error);
            setMessage({ type: "error", text: "Failed to update profile. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    if (!user) return null;

    const isAgent = user.role?.toUpperCase() === "AGENT";

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-sidebar-header">
                        <div className="profile-avatar-container">
                            <img
                                src={formData.profilePicture || user.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23e2e8f0' width='150' height='150'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' dy='5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EUser%3C/text%3E%3C/svg%3E"}
                                alt={user.name}
                                className="profile-sidebar-avatar"
                                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23e2e8f0' width='150' height='150'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' dy='5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EUser%3C/text%3E%3C/svg%3E"; }}
                            />
                            <label htmlFor="avatar-upload" className="avatar-upload-btn">
                                📷
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setFormData(prev => ({ ...prev, profilePicture: reader.result }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <h2 className="profile-sidebar-name">{user.name}</h2>
                        <span className="profile-sidebar-role">{user.role || "User"}</span>
                    </div>
                    <div className="profile-nav">
                        <div
                            className="profile-nav-item"
                            onClick={() => navigate("/")}
                            style={{ color: "var(--primary-color)", fontWeight: "bold" }}
                        >
                            <FiArrowLeft /> Back to Home
                        </div>
                        <div
                            className={`profile-nav-item ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => setActiveTab("overview")}
                        >
                            <div className="nav-icon">👤</div> Edit Profile
                        </div>
                        {isAgent && (
                            <div
                                className={`profile-nav-item ${activeTab === "listings" ? "active" : ""}`}
                                onClick={() => setActiveTab("listings")}
                            >
                                <FiList /> My Listings
                            </div>
                        )}
                        <div
                            className={`profile-nav-item ${activeTab === "favorites" ? "active" : ""}`}
                            onClick={() => setActiveTab("favorites")}
                        >
                            <FiHeart /> Favorites
                        </div>
                        <div
                            className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
                            onClick={() => setActiveTab("settings")}
                        >
                            <FiSettings /> Settings
                        </div>
                        <div className="profile-nav-item" onClick={handleLogout} style={{ color: "#ef4444" }}>
                            <FiLogOut /> Logout
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="profile-content">
                    {activeTab === "overview" && (
                        <div className="profile-section">
                            <h1 className="section-title">
                                {isAgent ? "Professional Details" : "Personal Information"}
                            </h1>

                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g., +91 9876543210"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </div>

                                {isAgent && (
                                    <>
                                        <div className="form-group">
                                            <label>Agency Name</label>
                                            <input
                                                type="text"
                                                name="agencyName"
                                                value={formData.agencyName}
                                                onChange={handleChange}
                                                placeholder="e.g., Prime Realty"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Experience</label>
                                            <input
                                                type="text"
                                                name="experience"
                                                value={formData.experience}
                                                onChange={handleChange}
                                                placeholder="e.g., 5+ Years"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Bio / Description</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                placeholder="Introduce yourself to potential clients..."
                                                rows="4"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Specialties (comma separated)</label>
                                            <input
                                                type="text"
                                                name="specialties"
                                                value={formData.specialties}
                                                onChange={handleChange}
                                                placeholder="e.g., Luxury Villas, Rental, Commercial"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group full-width">
                                    {message.text && (
                                        <div className={`message ${message.type}`} style={{
                                            padding: '10px',
                                            borderRadius: '5px',
                                            marginBottom: '15px',
                                            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                                            color: message.type === 'success' ? '#166534' : '#991b1b',
                                            fontSize: '0.9rem'
                                        }}>
                                            {message.text}
                                        </div>
                                    )}
                                    <button type="submit" className="save-profile-btn" disabled={loading}>
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "listings" && isAgent && (
                        <div className="profile-section">
                            <h1 className="section-title">My Properties</h1>
                            <div className="properties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {myProperties.length > 0 ? (
                                    myProperties.map(p => (
                                        <div key={p.id} style={{ position: 'relative' }}>
                                            <PropertyCard property={p} />
                                            <div style={{ padding: '10px', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginTop: '-10px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                                                <span className={`status-badge ${p.active ? 'active' : 'inactive'}`} style={{
                                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem',
                                                    background: p.active ? '#dcfce7' : '#fee2e2',
                                                    color: p.active ? '#166534' : '#991b1b'
                                                }}>
                                                    {p.active ? 'Active' : 'Unlisted'}
                                                </span>
                                                <Link to="/dashboard" style={{ float: 'right', fontSize: '0.9rem', color: '#3b82f6' }}>Manage in Dashboard</Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No properties listed yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "favorites" && (
                        <div className="profile-section">
                            <h1 className="section-title">My Favorites</h1>
                            <div className="properties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {favorites.length > 0 ? (
                                    favorites.map(p => <PropertyCard key={p.id} property={p} />)
                                ) : (
                                    <p>No favorites yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="profile-section">
                            <h1 className="section-title">Account Settings</h1>
                            <div className="settings-options">
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
                                    <h3>Change Password</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Ensure your account is secure by using a strong password.</p>
                                    <button disabled style={{ padding: '8px 16px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>Change Password (Coming Soon)</button>
                                </div>
                                <div style={{ padding: '20px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fef2f2' }}>
                                    <h3 style={{ color: '#b91c1c' }}>Danger Zone</h3>
                                    <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginBottom: '15px' }}>Once you delete your account, there is no going back. Please be certain.</p>
                                    <button disabled style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>Delete Account</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div >
    );
}

export default ProfilePage;
