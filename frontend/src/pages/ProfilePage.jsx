import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { userApi } from "../api/api";
import "../styles/Profile.css";
import { FiUser, FiSettings, FiPhone, FiMapPin, FiBriefcase, FiAward, FiInfo } from "react-icons/fi";

function ProfilePage() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
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
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

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

    if (!user) {
        return (
            <div className="profile-page">
                <Navbar />
                <div className="profile-container">
                    <p>Please login to view your profile.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const isAgent = user.role === "AGENT";

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-sidebar-header">
                        <img
                            src={user.profilePicture || "https://via.placeholder.com/150"}
                            alt={user.name}
                            className="profile-sidebar-avatar"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                        />
                        <h2 className="profile-sidebar-name">{user.name}</h2>
                        <span className="profile-sidebar-role">{user.role}</span>
                    </div>

                    <div className="profile-nav">
                        <div
                            className={`profile-nav-item ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => setActiveTab("overview")}
                        >
                            <FiUser /> {isAgent ? "Professional Profile" : "Personal Info"}
                        </div>
                        <div
                            className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
                            onClick={() => setActiveTab("settings")}
                        >
                            <FiSettings /> Account Settings
                        </div>
                    </div>
                </div>

                {/* content Area */}
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

                    {activeTab === "settings" && (
                        <div className="profile-section">
                            <h1 className="section-title">Account Settings</h1>
                            <p style={{ color: '#64748b' }}>Account security and privacy settings coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default ProfilePage;
