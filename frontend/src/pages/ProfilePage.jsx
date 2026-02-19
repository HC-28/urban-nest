import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { userApi, propertyApi, favoritesApi } from "../api/api";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
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

    // Change password state
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

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
            // Sort: featured first, then by id descending
            const sorted = [...res.data].sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return (b.id || 0) - (a.id || 0);
            });
            setMyProperties(sorted);
        } catch (err) {
            console.error("Error fetching properties", err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: "", text: "" });

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: "New password must be at least 6 characters" });
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        setChangingPassword(true);
        try {
            await userApi.put("/change-password", {
                email: user.email,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            const msg = err.response?.data || "Failed to change password";
            setPasswordMessage({ type: "error", text: typeof msg === 'string' ? msg : "Failed to change password" });
        } finally {
            setChangingPassword(false);
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
                                            backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: message.type === 'success' ? '#34D399' : '#F87171',
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
                                            <PropertyCard property={p} showFeaturedBadge={true} />
                                            <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.5)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginTop: '-10px', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span className={`status-badge ${p.active ? 'active' : 'inactive'}`} style={{
                                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem',
                                                    background: p.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: p.active ? '#34D399' : '#F87171'
                                                }}>
                                                    {p.active ? 'Active' : 'Unlisted'}
                                                </span>
                                                <Link to="/dashboard" style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Manage in Dashboard</Link>
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
                                {/* Change Password */}
                                <div style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '20px', background: 'rgba(30,41,59,0.5)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <FiLock style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }} />
                                        <h3 style={{ color: 'white', margin: 0 }}>Change Password</h3>
                                    </div>
                                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '20px' }}>Ensure your account is secure by using a strong password.</p>

                                    {passwordMessage.text && (
                                        <div style={{
                                            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                                            background: passwordMessage.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: passwordMessage.type === 'success' ? '#34D399' : '#F87171',
                                            fontSize: '0.9rem'
                                        }}>
                                            {passwordMessage.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Current Password</label>
                                            <input
                                                type={showCurrentPw ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                                                required
                                                style={{ width: '100%', padding: '12px 40px 12px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                                placeholder="Enter current password"
                                            />
                                            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}>
                                                {showCurrentPw ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>New Password</label>
                                            <input
                                                type={showNewPw ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                                                required
                                                minLength={6}
                                                style={{ width: '100%', padding: '12px 40px 12px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                                placeholder="Min 6 characters"
                                            />
                                            <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}>
                                                {showNewPw ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                                required
                                                minLength={6}
                                                style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                                placeholder="Re-enter new password"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            className="save-profile-btn"
                                            style={{ marginTop: '4px', width: 'fit-content' }}
                                        >
                                            {changingPassword ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </form>
                                </div>

                                {/* Danger Zone */}
                                <div style={{ padding: '24px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', background: 'rgba(239,68,68,0.08)' }}>
                                    <h3 style={{ color: '#F87171', marginBottom: '8px' }}>Danger Zone</h3>
                                    <p style={{ color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '15px' }}>Once you delete your account, there is no going back. Please be certain.</p>
                                    <button disabled style={{ padding: '8px 16px', background: '#991B1B', color: '#FCA5A5', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>Delete Account</button>
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
