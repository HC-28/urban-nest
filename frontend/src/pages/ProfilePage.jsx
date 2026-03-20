import { useState, useEffect } from "react";
import { adminApi, authApi } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { userApi, propertyApi, favoritesApi, analyticsApi } from "../api/api";
import toast from "react-hot-toast";
import "../styles/Profile.css";
import PropertyCard from "../components/PropertyCard";

/* ─── SVG Icons ─── */
const UserIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const HeartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const LogOutIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

const ListIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const LockIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 1.24-2.33M4.93 4.93A10.96 10.96 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const ShieldIcon = ({ size = 16, color = "white" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

const HomeIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const UsersIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const CheckCircleIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const EditIcon = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [activeTab, setActiveTab] = useState("overview"); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [myProperties, setMyProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);

    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const [adminStats, setAdminStats] = useState({ totalProperties: 0, totalUsers: 0, propertiesSold: 0 });

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

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const requestChangePasswordOtp = async () => {
        setPasswordMessage({ type: "", text: "" });
        setChangingPassword(true);
        try {
            await authApi.post(`/request-otp?email=${user.email}`);
            setOtpSent(true);
            toast.success("Verification code sent to your email!");
        } catch (err) {
            setPasswordMessage({ type: "error", text: "Failed to send verification code" });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: "", text: "" });

        if (!otpSent) {
            await requestChangePasswordOtp();
            return;
        }

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
                otp: otp
            });
            setPasswordMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setOtp("");
            setOtpSent(false);
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
        if (reason === null) return; 
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

    if (isAdmin) {
        return (
            <div className="profile-page">
                <Navbar />
                <div style={{ maxWidth: 900, margin: "100px auto 60px", padding: "0 20px" }}>
                    <button
                        onClick={() => navigate("/admin")}
                        style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 28, padding: 0 }}
                    >
                        <ArrowLeftIcon /> Back to Admin Dashboard
                    </button>

                    <div style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #0c1526 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #162d4f 50%, #0f2040 100%)", padding: "40px 40px 0", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", borderRadius: "50%", transform: "translate(80px,-80px)" }} />
                            <div style={{ position: "absolute", bottom: 0, left: "30%", width: 200, height: 200, background: "radial-gradient(circle, rgba(99,160,255,0.07) 0%, transparent 70%)", borderRadius: "50%" }} />

                            <div style={{ display: "flex", alignItems: "flex-end", gap: 28, position: "relative", zIndex: 1 }}>
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <img
                                        src={user.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%231e3a5f' width='120' height='120'/%3E%3Ctext fill='%2360a5fa' font-family='sans-serif' font-size='48' dy='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E" + (user.name?.[0]?.toUpperCase() || "A") + "%3C/text%3E%3C/svg%3E"}
                                        alt={user.name}
                                        style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(59,130,246,0.5)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "block" }}
                                        onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%231e3a5f' width='120' height='120'/%3E%3Ctext fill='%2360a5fa' font-family='sans-serif' font-size='48' dy='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E"; }}
                                    />
                                    <div style={{ position: "absolute", bottom: 4, right: 4, background: "#1d4ed8", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0f1a2e" }}>
                                        <ShieldIcon size={14} color="white" />
                                    </div>
                                </div>

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
                                                <EditIcon size={13} />
                                            </button>
                                        </div>
                                    )}
                                    <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 10px", fontSize: "0.95rem" }}>{user.email}</p>
                                    <span style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 20, padding: "3px 14px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Administrator</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            {[
                                { icon: <HomeIcon size={20} color="#60a5fa" />, label: "Total Properties", value: adminStats.totalProperties },
                                { icon: <UsersIcon size={20} color="#34d399" />, label: "Registered Users", value: adminStats.totalUsers },
                                { icon: <CheckCircleIcon size={20} color="#f59e0b" />, label: "Properties Sold", value: adminStats.propertiesSold },
                            ].map((s, i) => (
                                <div key={i} style={{ padding: "24px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{s.icon}</div>
                                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "white" }}>{s.value}</div>
                                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: "28px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Quick Actions</h3>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button onClick={() => navigate("/admin")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: "12px 20px", color: "#60a5fa", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.12)"}
                                >
                                    <ShieldIcon size={16} color="#60a5fa" /> Admin Dashboard
                                </button>
                                <button onClick={() => navigate("/admin#users")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, padding: "12px 20px", color: "#34d399", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.18)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}
                                >
                                    <UsersIcon size={16} color="#34d399" /> Manage Users
                                </button>
                                <button onClick={() => navigate("/admin#properties")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 20px", color: "#f59e0b", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.18)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.1)"}
                                >
                                    <HomeIcon size={16} color="#f59e0b" /> Manage Properties
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: "28px 40px 36px" }}>
                            <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Security</h3>
                            <div style={{ maxWidth: 420 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                    <LockIcon size={18} color="#60a5fa" />
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
                                            {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
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
                                            {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
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

                        <div style={{ padding: "0 40px 36px" }}>
                            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 24px", color: "#f87171", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                            >
                                <LogOutIcon size={16} /> Sign Out
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
                            <ArrowLeftIcon /> Back to Home
                        </div>
                        <div
                            className={`profile-nav-item ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => setActiveTab("overview")}
                        >
                            <div className="nav-icon"><UserIcon /></div> Edit Profile
                        </div>
                        {isAgent && (
                            <div
                                className={`profile-nav-item ${activeTab === "listings" ? "active" : ""}`}
                                onClick={() => setActiveTab("listings")}
                            >
                                <ListIcon /> My Listings
                            </div>
                        )}
                        <div
                            className={`profile-nav-item ${activeTab === "favorites" ? "active" : ""}`}
                            onClick={() => setActiveTab("favorites")}
                        >
                            <HeartIcon /> Favorites
                        </div>
                        <div
                            className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
                            onClick={() => setActiveTab("settings")}
                        >
                            <SettingsIcon /> Settings
                        </div>
                        <div className="profile-nav-item" onClick={handleLogout} style={{ color: "var(--danger-color)" }}>
                            <LogOutIcon /> Logout
                        </div>
                    </div>
                </div>

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
                                <div style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '20px', background: 'rgba(30,41,59,0.5)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <LockIcon color="var(--primary-color)" />
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
                                                {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
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
                                                {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
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

                                        {otpSent && (
                                            <div style={{ position: 'relative' }}>
                                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Verification Code</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        required
                                                        style={{ flex: 1, padding: '12px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                                        placeholder="6-digit OTP"
                                                    />
                                                    <button type="button" onClick={requestChangePasswordOtp} style={{ padding: '0 15px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                                        Resend
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            className="save-profile-btn"
                                            style={{ marginTop: '4px', width: 'fit-content' }}
                                        >
                                            {changingPassword ? 'Processing...' : (otpSent ? 'Confirm & Change' : 'Request Change OTP')}
                                        </button>
                                        
                                        {otpSent && (
                                            <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                                                ← Edit Details
                                            </button>
                                        )}
                                    </form>
                                </div>

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
