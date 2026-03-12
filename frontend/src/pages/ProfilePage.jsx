import { useState, useEffect } from "react";
import { adminApi } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { userApi, propertyApi, favoritesApi, analyticsApi } from "../api/api";
import toast from "react-hot-toast";
import { FiLock, FiEye, FiEyeOff, FiShield, FiUsers, FiHome, FiTrendingUp, FiCheckCircle, FiEdit2 } from "react-icons/fi";
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

    // Admin stats
    const [adminStats, setAdminStats] = useState({ totalProperties: 0, totalUsers: 0, propertiesSold: 0 });

    // Admin inline-name edit
    const [adminEditingName, setAdminEditingName] = useState(false);
    const [adminNewName, setAdminNewName] = useState(user?.name || "");
    const [adminNameLoading, setAdminNameLoading] = useState(false);

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

        // Fetch admin stats once on mount
        if (user.role?.toUpperCase() === "ADMIN") {
            adminApi.get("/stats").then(res => {
                setAdminStats({
                    totalProperties: res.data.totalProperties ?? 0,
                    totalUsers: res.data.totalUsers ?? 0,
                    propertiesSold: res.data.propertiesSold ?? 0,
                });
            }).catch(() => { });
        }

        if (activeTab === "listings" && user.role?.toUpperCase() === "AGENT") {
            fetchMyProperties();
        } else if (activeTab === "favorites") {
            fetchFavorites();
        }
    }, [activeTab, user, navigate]);

    const handleAdminSaveName = async () => {
        if (!adminNewName.trim()) return;
        setAdminNameLoading(true);
        try {
            await userApi.put("/me/profile", { name: adminNewName.trim() });
            const updated = { ...user, name: adminNewName.trim() };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
            setAdminEditingName(false);
            toast.success("Name updated!");
        } catch { toast.error("Failed to update name"); }
        finally { setAdminNameLoading(false); }
    };

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
            await userApi.put("/me/password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data || "Failed to change password";
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
            const response = await userApi.put("/me/profile", {
                ...formData,
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
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    const handleDeleteRequest = async () => {
        const reason = window.prompt("Please tell us why you want to delete your account (optional):");
        if (reason === null) return; // cancelled
        if (!window.confirm("Are you sure you want to request account deletion? An admin will review your request.")) return;
        try {
            await userApi.patch(`/${user.id}`, { deletionRequested: true });
            const updated = { ...user, deletionRequested: true };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
            toast.success("Account deletion requested. An admin will process it shortly.");
        } catch {
            toast.error("Failed to submit deletion request. Please try again.");
        }
    };

    if (!user) return null;

    const isAdmin = user.role?.toUpperCase() === "ADMIN";
    const isAgent = user.role?.toUpperCase() === "AGENT";

    // ===== ADMIN PROFILE PAGE =====
    if (isAdmin) {
        return (
            <div className="profile-page">
                <Navbar />
                <div style={{ maxWidth: 900, margin: "100px auto 60px", padding: "0 20px" }}>

                    {/* Back link */}
                    <button
                        onClick={() => navigate("/admin")}
                        style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 28, padding: 0 }}
                    >
                        <FiArrowLeft /> Back to Admin Dashboard
                    </button>

                    {/* Main Card */}
                    <div style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #0c1526 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>

                        {/* Hero Banner */}
                        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #162d4f 50%, #0f2040 100%)", padding: "40px 40px 0", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", borderRadius: "50%", transform: "translate(80px,-80px)" }} />
                            <div style={{ position: "absolute", bottom: 0, left: "30%", width: 200, height: 200, background: "radial-gradient(circle, rgba(99,160,255,0.07) 0%, transparent 70%)", borderRadius: "50%" }} />

                            {/* Avatar + Info Row */}
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 28, position: "relative", zIndex: 1 }}>
                                {/* Avatar */}
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <img
                                        src={user.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%231e3a5f' width='120' height='120'/%3E%3Ctext fill='%2360a5fa' font-family='sans-serif' font-size='48' dy='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E" + (user.name?.[0]?.toUpperCase() || "A") + "%3C/text%3E%3C/svg%3E"}
                                        alt={user.name}
                                        style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(59,130,246,0.5)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "block" }}
                                        onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%231e3a5f' width='120' height='120'/%3E%3Ctext fill='%2360a5fa' font-family='sans-serif' font-size='48' dy='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E"; }}
                                    />
                                    <div style={{ position: "absolute", bottom: 4, right: 4, background: "#1d4ed8", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0f1a2e" }}>
                                        <FiShield size={14} color="white" />
                                    </div>
                                </div>

                                {/* Name + Email */}
                                <div style={{ paddingBottom: 20 }}>
                                    {adminEditingName ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                            <input
                                                autoFocus
                                                value={adminNewName}
                                                onChange={e => setAdminNewName(e.target.value)}
                                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(59,130,246,0.5)", borderRadius: 8, padding: "6px 12px", color: "white", fontSize: "1.3rem", fontWeight: 700, outline: "none", width: 220 }}
                                                onKeyDown={e => { if (e.key === "Enter") handleAdminSaveName(); if (e.key === "Escape") setAdminEditingName(false); }}
                                            />
                                            <button onClick={handleAdminSaveName} disabled={adminNameLoading} style={{ background: "#2563eb", border: "none", borderRadius: 6, padding: "6px 14px", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>{adminNameLoading ? "Saving..." : "Save"}</button>
                                            <button onClick={() => setAdminEditingName(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", margin: 0 }}>{user.name}</h1>
                                            <button onClick={() => { setAdminNewName(user.name); setAdminEditingName(true); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8" }}>
                                                <FiEdit2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                    <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 10px", fontSize: "0.95rem" }}>{user.email}</p>
                                    <span style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 20, padding: "3px 14px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Administrator</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            {[
                                { icon: <FiHome size={20} color="#60a5fa" />, label: "Total Properties", value: adminStats.totalProperties },
                                { icon: <FiUsers size={20} color="#34d399" />, label: "Registered Users", value: adminStats.totalUsers },
                                { icon: <FiCheckCircle size={20} color="#f59e0b" />, label: "Properties Sold", value: adminStats.propertiesSold },
                            ].map((s, i) => (
                                <div key={i} style={{ padding: "24px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{s.icon}</div>
                                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "white" }}>{s.value}</div>
                                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ padding: "28px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Quick Actions</h3>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button onClick={() => navigate("/admin")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: "12px 20px", color: "#60a5fa", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.12)"}
                                >
                                    <FiShield size={16} /> Admin Dashboard
                                </button>
                                <button onClick={() => navigate("/admin#users")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, padding: "12px 20px", color: "#34d399", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.18)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}
                                >
                                    <FiUsers size={16} /> Manage Users
                                </button>
                                <button onClick={() => navigate("/admin#properties")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 20px", color: "#f59e0b", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.18)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.1)"}
                                >
                                    <FiHome size={16} /> Manage Properties
                                </button>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div style={{ padding: "28px 40px 36px" }}>
                            <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Security</h3>
                            <div style={{ maxWidth: 420 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                    <FiLock size={18} color="#60a5fa" />
                                    <span style={{ color: "white", fontWeight: 600 }}>Change Password</span>
                                </div>
                                {passwordMessage.text && (
                                    <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: passwordMessage.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: passwordMessage.type === "success" ? "#34D399" : "#F87171", fontSize: "0.9rem" }}>
                                        {passwordMessage.text}
                                    </div>
                                )}
                                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showCurrentPw ? "text" : "password"}
                                            placeholder="Current password"
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                                            required
                                            style={{ width: "100%", padding: "12px 44px 12px 16px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#E2E8F0", fontSize: "0.95rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
                                            {showCurrentPw ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            placeholder="New password (min 6 chars)"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                                            required minLength={6}
                                            style={{ width: "100%", padding: "12px 44px 12px 16px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#E2E8F0", fontSize: "0.95rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
                                            {showNewPw ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                        required minLength={6}
                                        style={{ width: "100%", padding: "12px 16px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#E2E8F0", fontSize: "0.95rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                    />
                                    <button type="submit" disabled={changingPassword} style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "fit-content", marginTop: 4, opacity: changingPassword ? 0.6 : 1, transition: "all 0.2s" }}>
                                        {changingPassword ? "Changing..." : "Change Password"}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Logout */}
                        <div style={{ padding: "0 40px 36px" }}>
                            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 24px", color: "#f87171", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                            >
                                <FiLogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

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
                        <div className="profile-nav-item" onClick={handleLogout} style={{ color: "var(--danger-color)" }}>
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
                                        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Change Password</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Ensure your account is secure by using a strong password.</p>

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
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Current Password</label>
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
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>New Password</label>
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
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Confirm New Password</label>
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
                                    {user.deletionRequested ? (
                                        <>
                                            <p style={{ color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '15px' }}>
                                                ⚠️ Your account deletion has been requested and is pending admin review.
                                            </p>
                                            <button disabled style={{ padding: '10px 20px', background: '#991B1B', color: '#FCA5A5', border: 'none', borderRadius: '8px', cursor: 'not-allowed', opacity: 0.6 }}>
                                                Deletion Requested
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '15px' }}>
                                                Once your account is deleted, all your data will be archived. You can sign up again with the same email.
                                            </p>
                                            <button
                                                onClick={handleDeleteRequest}
                                                style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                                                onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                                            >
                                                Request Account Deletion
                                            </button>
                                        </>
                                    )}
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
