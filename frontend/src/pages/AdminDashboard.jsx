import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { adminApi, chatApi } from "../api/api.js";
import { formatPrice } from "../utils/priceUtils";
import "../styles/AdminDashboard.css";
/* ─── SVG Icons ─── */
const HomeIcon = ({ size = 24, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const MessageCircleIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const UsersIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const EditIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const Trash2Icon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const EyeIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 1.24-2.33M4.93 4.93A10.96 10.96 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const SendIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const CheckCircleIcon = ({ size = 24, style, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const XCircleIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

const TrendingUpIcon = ({ size = 32, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const DollarSignIcon = ({ size = 32, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

const ActivityIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

const PieChartIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

const XIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CalendarIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const SearchIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const FilterIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
);

const AlertTriangleIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const ClockIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const UserIcon = ({ size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const LockIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const ShieldIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const IMAGE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "/uploads/")
    : "http://localhost:8083/uploads/";

function AdminDashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [activeTab, setActiveTab] = useState("overview");
    const [properties, setProperties] = useState([]);
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState([]);
    const [deletedUsers, setDeletedUsers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [soldDeals, setSoldDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProperty, setEditingProperty] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [propertySearch, setPropertySearch] = useState("");
    const [propertyFilter, setPropertyFilter] = useState({ city: "", status: "", type: "" });
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalChats: 0,
        totalUsers: 0,
        activeListings: 0,
        totalCommission: 0,
        totalSales: 0
    });
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [agentAnalysis, setAgentAnalysis] = useState({
        totalSales: 0,
        totalComm: 0,
        propertyCount: 0,
        chartData: []
    });

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);

            const propsRes = await adminApi.get("/properties");
            const allProperties = propsRes.data;

            const chatsRes = await adminApi.get("/chats").catch(() => ({ data: [] }));
            setChats(chatsRes.data);

            const usersRes = await adminApi.get("/users");
            setUsers(usersRes.data);

            const enrichedProperties = allProperties.map(p => {
                const agent = usersRes.data.find(u => u.id == p.agentId);
                return {
                    ...p,
                    agentName: agent?.name || p.agentName || "N/A"
                };
            }).sort((a, b) => b.id - a.id);
            setProperties(enrichedProperties);

            const allApptsRes = await adminApi.get("/appointments").catch(() => ({ data: [] }));
            setAppointments(allApptsRes.data || []);
            const rawDeals = (allApptsRes.data || []).filter(a => a.status === 'sold');

            // Fetch deleted users archive
            const deletedRes = await adminApi.get("/users/deleted").catch(() => ({ data: [] }));
            setDeletedUsers(deletedRes.data || []);

            const existingDeals = rawDeals.map(deal => {
                const prop = enrichedProperties.find(p => p.id == deal.propertyId);
                const finalPrice = deal.finalizePrice || prop?.price || 0;
                const pPurpose = (prop?.purpose || '').toLowerCase();
                const isRent = pPurpose.includes('rent');

                // Fallback to finding feedback in chats if property cache is empty
                let computedReview = prop?.review;
                if (!computedReview) {
                    const fbMsg = chatsRes.data.find(c => c.propertyId == deal.propertyId && c.message?.startsWith('⭐ FEEDBACK:'));
                    if (fbMsg) computedReview = fbMsg.message.includes('Positive') ? 'Positive' : 'Negative';
                }

                const agent = usersRes.data.find(u => u.id == deal.agentId);

                return {
                    ...deal,
                    displayedId: prop?.id || deal.propertyId, // Prefer Property ID for identification
                    propertyName: prop?.title || `Property #${deal.propertyId}`,
                    agentName: agent?.name || `Agent #${deal.agentId}`,
                    finalizePrice: finalPrice,
                    commission: finalPrice * 0.01,
                    review: computedReview
                };
            });

            const dealPropertyIds = new Set(existingDeals.map(d => d.propertyId));
            const manualSold = enrichedProperties
                .filter(p => p.status === 'SOLD' && !dealPropertyIds.has(p.id))
                .map(p => {
                    const price = p.price || 0;

                    // Fallback to finding feedback in chats if property cache is empty
                    let computedReview = p.review;
                    if (!computedReview) {
                        const fbMsg = chatsRes.data.find(c => c.propertyId == p.id && c.message?.startsWith('⭐ FEEDBACK:'));
                        if (fbMsg) computedReview = fbMsg.message.includes('Positive') ? 'Positive' : 'Negative';
                    }

                    return {
                        id: `${p.id}`,
                        displayedId: p.id,
                        propertyId: p.id,
                        buyerName: p.buyerName || 'N/A',
                        agentName: p.agentName || 'N/A',
                        propertyName: p.title || 'N/A',
                        finalizePrice: price,
                        commission: 0, // Direct sales via agent carry no platform commission
                        review: computedReview,
                        updatedAt: p.soldAt || new Date().toISOString()
                    };
                });

            const allSold = [...existingDeals, ...manualSold].map(d => ({ ...d, isSold: true }));
            setSoldDeals(allSold);

            const totalCommission = allSold.reduce((acc, d) => acc + (d.commission || 0), 0);
            const totalSales = allSold.reduce((acc, d) => acc + (d.finalizePrice || 0), 0);

            setStats({
                totalProperties: enrichedProperties.length,
                totalChats: chatsRes.data.length,
                totalUsers: usersRes.data.length,
                activeListings: enrichedProperties.filter(p => p.active).length,
                totalCommission,
                totalSales
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && user.role === "ADMIN") {
            fetchAllData();
        }
    }, [fetchAllData]);

    const handleAgentSelect = (agentId) => {
        setSelectedAgentId(agentId);
        if (!agentId) {
            setAgentAnalysis({ totalSales: 0, totalComm: 0, propertyCount: 0, chartData: [] });
            return;
        }
        const agentDeals = soldDeals.filter(d => String(d.agentId) === String(agentId));
        const totalSales = agentDeals.reduce((s, d) => s + (d.finalizePrice || 0), 0);
        const totalComm = agentDeals.reduce((s, d) => s + (d.commission || 0), 0);
        const grouped = agentDeals.reduce((acc, deal) => {
            const date = new Date(deal.updatedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
            acc[date] = (acc[date] || 0) + deal.finalizePrice;
            return acc;
        }, {});
        const chartData = Object.entries(grouped).map(([name, sales]) => ({ name, sales })).reverse();
        setAgentAnalysis({ totalSales, totalComm, propertyCount: agentDeals.length, chartData });
    };

    const formatCurrency = (amount) => {
        if (!amount) return "₹0";
        const num = Number(amount);
        if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + " Cr";
        if (num >= 100000) return "₹" + (num / 100000).toFixed(2) + " L";
        if (num >= 1000) return "₹" + (num / 1000).toFixed(1) + " K";
        return "₹" + num.toLocaleString("en-IN");
    };

    const handleSaveProperty = async () => {
        try {
            await adminApi.put(`/properties/${editingProperty.id}`, editingProperty);
            setEditingProperty(null);
            fetchAllData();
        } catch (error) {
            alert("Failed to update property");
        }
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm("Delete this property permanently?")) return;
        try {
            await adminApi.delete(`/properties/${propertyId}`);
            fetchAllData();
        } catch { alert("Failed to delete property"); }
    };

    const togglePropertyListing = async (property) => {
        try {
            await adminApi.patch(`/properties/${property.id}`, { listingStatus: !property.active });
            fetchAllData();
        } catch { alert("Failed to toggle listing status"); }
    };

    const handleViewChat = async (chat) => {
        try {
            const response = await chatApi.get(
                `/messages?propertyId=${chat.propertyId}&buyerId=${chat.buyerId}&agentId=${chat.agentId}`
            );
            setChatMessages(response.data);
            setSelectedChat(chat);
        } catch { alert("Failed to load conversation"); }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;
        try {
            await chatApi.post("/messages", {
                propertyId: selectedChat.propertyId,
                buyerId: selectedChat.buyerId,
                agentId: selectedChat.agentId,
                sender: "ADMIN",
                message: newMessage
            });
            const response = await chatApi.get(
                `/messages?propertyId=${selectedChat.propertyId}&buyerId=${selectedChat.buyerId}&agentId=${selectedChat.agentId}`
            );
            setChatMessages(response.data);
            setNewMessage("");
        } catch { alert("Failed to send message"); }
    };

    const handleResolveChat = async () => {
        if (!selectedChat || !window.confirm("Mark this conversation as resolved?")) return;
        try {
            await chatApi.post("/messages", {
                propertyId: selectedChat.propertyId,
                buyerId: selectedChat.buyerId,
                agentId: selectedChat.agentId,
                sender: "ADMIN",
                message: "✅ This issue has been marked as resolved."
            });
            const response = await chatApi.get(
                `/messages?propertyId=${selectedChat.propertyId}&buyerId=${selectedChat.buyerId}&agentId=${selectedChat.agentId}`
            );
            setChatMessages(response.data);
            fetchAllData();
        } catch { alert("Failed to resolve chat"); }
    };

    const handleDeleteUser = async (userId, reason = "ADMIN_ACTION") => {
        if (!window.confirm("Archive and delete this user? Their data will be stored in the deleted users archive.")) return;
        try {
            await adminApi.delete(`/users/${userId}`, { params: { reason, adminId: user.id } });
            alert("User archived and deleted successfully.");
            fetchAllData();
        } catch { alert("Failed to delete user"); }
    };

    const handleVerifyUser = async (u) => {
        try {
            await adminApi.patch(`/users/${u.id}`, { verified: !u.verified });
            fetchAllData();
        } catch { alert("Failed to update verification status"); }
    };

    const handleRejectDeletion = async (userId) => {
        if (!window.confirm("Reject this deletion request?")) return;
        try {
            await adminApi.patch(`/users/${userId}`, { deletionRequested: false });
            fetchAllData();
        } catch { alert("Failed to reject deletion request"); }
    };

    const handleUpdateRole = async (userId, newRole) => {
        const confirmMsg = newRole === "ADMIN"
            ? "Promote this user to ADMIN? They will have full access to this dashboard."
            : `Revoke ADMIN status? The user's role will be set to ${newRole}.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await adminApi.patch(`/users/${userId}`, { role: newRole });
            fetchAllData();
        } catch { alert("Failed to update user role"); }
    };

    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/login" />;
    }

    // Group chats by conversation
    const groupedChats = Object.values(chats.reduce((acc, chat) => {
        const key = `${chat.propertyId}-${chat.buyerId}-${chat.agentId}`;
        const chatTime = new Date(chat.createdAt).getTime();
        if (!acc[key]) {
            const property = properties.find(p => p.id === chat.propertyId);
            const buyer = users.find(u => u.id === chat.buyerId);
            const agent = users.find(u => u.id === chat.agentId);
            acc[key] = {
                propertyId: chat.propertyId,
                propertyName: property?.title || `Property #${chat.propertyId}`,
                buyerId: chat.buyerId,
                buyerName: buyer?.name || `Buyer ${chat.buyerId}`,
                agentId: chat.agentId,
                agentName: agent?.name || `Agent ${chat.agentId}`,
                isSold: property?.status === 'SOLD',
                id: chat.id,
                latestCreatedAt: 0,
                lastRequestTime: 0,
                lastResolutionTime: 0,
                message: "",
                sender: ""
            };
        }
        if (chat.message?.includes("marked as resolved")) {
            if (chatTime > acc[key].lastResolutionTime) acc[key].lastResolutionTime = chatTime;
        }
        if (chat.message?.includes("ADMIN ASSISTANCE REQUESTED")) {
            if (chatTime > acc[key].lastRequestTime) acc[key].lastRequestTime = chatTime;
        }
        if (chatTime >= acc[key].latestCreatedAt) {
            acc[key].latestCreatedAt = chatTime;
            acc[key].message = chat.message;
            acc[key].sender = chat.sender;
            acc[key].id = chat.id;
        }
        return acc;
    }, {})).map(c => {
        if (c.lastRequestTime > c.lastResolutionTime) {
            c.displayMessage = "🚨 Assistance Requested";
            c.statusColor = "#EF4444";
        } else {
            c.displayMessage = c.message;
            c.statusColor = "inherit";
        }
        return c;
    }).sort((a, b) => b.latestCreatedAt - a.latestCreatedAt);

    return (
        <div className="admin-dashboard-page">
            <Navbar />

            <div className="admin-container">
                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p>Manage all properties, chats, and users</p>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <HomeIcon size={32} />
                        <div>
                            <h3>{stats.totalProperties}</h3>
                            <p>Total Properties</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <CheckCircleIcon size={32} style={{ color: 'var(--secondary-color)' }} />
                        <div>
                            <h3>{soldDeals.length}</h3>
                            <p>Properties Sold</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <TrendingUpIcon size={32} style={{ color: 'var(--secondary-color)' }} />
                        <div>
                            <h3>{formatPrice(stats.totalSales)}</h3>
                            <p>Total Sales</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <DollarSignIcon size={32} style={{ color: 'var(--secondary-color)' }} />
                        <div>
                            <h3>{formatPrice(stats.totalCommission)}</h3>
                            <p>Total Commission</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    {[
                        { id: "overview", icon: <ActivityIcon />, label: "Overview" },
                        { id: "properties", icon: <HomeIcon />, label: "Properties" },
                        { id: "chats", icon: <MessageCircleIcon />, label: "Chats" },
                        { id: "users", icon: <UsersIcon />, label: "Users" },
                        { id: "appointments", icon: <CalendarIcon />, label: "Appointments" },
                        { id: "sold", icon: <TrendingUpIcon />, label: "Sold" },
                        { id: "analysis", icon: <PieChartIcon />, label: "Analysis" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={activeTab === tab.id ? "active" : ""}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="admin-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading admin data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === "overview" && (
                                <div className="overview-tab">
                                    <h2>Dashboard Overview</h2>

                                    {/* Pending Actions */}
                                    <div className="pending-actions">
                                        {users.filter(u => u.role === 'AGENT' && !u.verified).length > 0 && (
                                            <div className="pending-card warning" onClick={() => setActiveTab('users')}>
                                                <AlertTriangleIcon size={24} />
                                                <div>
                                                    <h4>{users.filter(u => u.role === 'AGENT' && !u.verified).length} Pending Agent Approvals</h4>
                                                    <p>Agents waiting for verification</p>
                                                </div>
                                            </div>
                                        )}
                                        {users.filter(u => u.deletionRequested).length > 0 && (
                                            <div className="pending-card danger" onClick={() => setActiveTab('users')}>
                                                <Trash2Icon size={24} />
                                                <div>
                                                    <h4>{users.filter(u => u.deletionRequested).length} Deletion Requests</h4>
                                                    <p>Users requesting account deletion</p>
                                                </div>
                                            </div>
                                        )}
                                        {(() => {
                                            const assistanceCount = Object.values(chats.reduce((acc, c) => {
                                                const key = `${c.propertyId}-${c.buyerId}-${c.agentId}`;
                                                if (!acc[key]) acc[key] = { req: 0, res: 0 };
                                                if (c.message?.includes('ADMIN ASSISTANCE REQUESTED')) acc[key].req = Math.max(acc[key].req, new Date(c.createdAt).getTime());
                                                if (c.message?.includes('marked as resolved')) acc[key].res = Math.max(acc[key].res, new Date(c.createdAt).getTime());
                                                return acc;
                                            }, {})).filter(v => v.req > v.res).length;
                                            return assistanceCount > 0 && (
                                                <div className="pending-card info" onClick={() => setActiveTab('chats')}>
                                                    <MessageCircleIcon size={24} />
                                                    <div>
                                                        <h4>{assistanceCount} Chats Need Attention</h4>
                                                        <p>Admin assistance requested</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {users.filter(u => u.deletionRequested).length === 0 &&
                                            users.filter(u => u.role === 'AGENT' && !u.verified).length === 0 && (
                                                <div className="pending-card success">
                                                    <CheckCircleIcon size={24} />
                                                    <div>
                                                        <h4>All Clear!</h4>
                                                        <p>No pending actions require attention</p>
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    {/* Platform Stats Grid */}
                                    <div className="overview-stats-grid">
                                        <div className="o-stat"><UsersIcon size={20} /><div><h4>{users.filter(u => u.role === 'BUYER').length}</h4><p>Buyers</p></div></div>
                                        <div className="o-stat"><UserIcon size={20} /><div><h4>{users.filter(u => u.role === 'AGENT').length}</h4><p>Agents</p></div></div>
                                        <div className="o-stat"><HomeIcon size={20} /><div><h4>{stats.activeListings}</h4><p>Active Listings</p></div></div>
                                        <div className="o-stat"><CalendarIcon size={20} /><div><h4>{appointments.filter(a => a.status === 'booked').length}</h4><p>Upcoming Visits</p></div></div>
                                        <div className="o-stat"><Trash2Icon size={20} /><div><h4>{deletedUsers.length}</h4><p>Archived Users</p></div></div>
                                        <div className="o-stat"><TrendingUpIcon size={20} /><div><h4>{soldDeals.length}</h4><p>Deals Closed</p></div></div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="overview-sections">
                                        <div className="overview-section">
                                            <h3>🏠 Recent Listings</h3>
                                            {properties.slice(0, 5).map(p => (
                                                <div key={p.id} className="activity-item">
                                                    <span className="activity-title">{p.title}</span>
                                                    <span className="activity-meta">{p.location} · {formatPrice(p.price)}</span>
                                                </div>
                                            ))}
                                            {properties.length === 0 && <p className="empty-note">No properties yet</p>}
                                        </div>
                                        <div className="overview-section">
                                            <h3>👤 Recent Signups</h3>
                                            {users.slice(-5).reverse().map(u => (
                                                <div key={u.id} className="activity-item">
                                                    <span className="activity-title">{u.name}</span>
                                                    <span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role}</span>
                                                </div>
                                            ))}
                                            {users.length === 0 && <p className="empty-note">No users yet</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Properties Tab */}
                            {activeTab === "properties" && (
                                <div className="properties-table">
                                    <h2>All Properties ({properties.length})</h2>

                                    {/* Search & Filter Bar */}
                                    <div className="property-filters">
                                        <div className="search-box">
                                            <SearchIcon />
                                            <input
                                                type="text"
                                                placeholder="Search by title, location, or agent..."
                                                value={propertySearch}
                                                onChange={(e) => setPropertySearch(e.target.value)}
                                            />
                                        </div>
                                        <select value={propertyFilter.status} onChange={(e) => setPropertyFilter({ ...propertyFilter, status: e.target.value })}>
                                            <option value="">All Status</option>
                                            <option value="listed">Listed</option>
                                            <option value="unlisted">Unlisted</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                        <select value={propertyFilter.type} onChange={(e) => setPropertyFilter({ ...propertyFilter, type: e.target.value })}>
                                            <option value="">All Types</option>
                                            <option value="Apartment">Apartment</option>
                                            <option value="Villa">Villa</option>
                                            <option value="House">House</option>
                                            <option value="Penthouse">Penthouse</option>
                                            <option value="Studio">Studio</option>
                                            <option value="Plot">Plot</option>
                                            <option value="Commercial">Commercial</option>
                                        </select>
                                        <select value={propertyFilter.city} onChange={(e) => setPropertyFilter({ ...propertyFilter, city: e.target.value })}>
                                            <option value="">All Cities</option>
                                            {[...new Set(properties.map(p => p.city).filter(Boolean))].sort().map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Title</th>
                                                    <th>Type</th>
                                                    <th>Price</th>
                                                    <th>Location</th>
                                                    <th>Agent</th>
                                                    <th>Status</th>
                                                    <th>Views</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const q = propertySearch.toLowerCase();
                                                    return properties.filter(prop => {
                                                        if (q && !prop.title?.toLowerCase().includes(q) && !prop.location?.toLowerCase().includes(q) && !prop.agentName?.toLowerCase().includes(q) && !prop.city?.toLowerCase().includes(q)) return false;
                                                        if (propertyFilter.status) {
                                                            if (propertyFilter.status === 'sold' && prop.status !== 'SOLD') return false;
                                                            if (propertyFilter.status === 'listed' && (prop.status === 'SOLD' || !prop.active)) return false;
                                                            if (propertyFilter.status === 'unlisted' && (prop.status === 'SOLD' || prop.active)) return false;
                                                        }
                                                        if (propertyFilter.type && prop.type !== propertyFilter.type) return false;
                                                        if (propertyFilter.city && prop.city !== propertyFilter.city) return false;
                                                        return true;
                                                    }).map((prop) => (
                                                        <tr key={prop.id}>
                                                            <td>{prop.id}</td>
                                                            <td>{prop.title}</td>
                                                            <td>{prop.type}</td>
                                                            <td>{formatPrice(prop.price)}</td>
                                                            <td>{prop.location}</td>
                                                            <td>{prop.agentName}</td>
                                                            <td>
                                                                <span className={`status-badge ${prop.status === 'SOLD' ? 'sold' : (prop.active ? 'active' : 'inactive')}`}>
                                                                    {prop.status === 'SOLD' ? 'Sold' : (prop.active ? 'Listed' : 'Unlisted')}
                                                                </span>
                                                            </td>
                                                            <td>{prop.views || 0}</td>
                                                            <td className="action-btns">
                                                                <button
                                                                    onClick={() => setEditingProperty(prop)}
                                                                    disabled={prop.status === 'SOLD'}
                                                                    title="Edit"
                                                                >
                                                                    <EditIcon />
                                                                </button>
                                                                <button
                                                                    onClick={() => togglePropertyListing(prop)}
                                                                    disabled={prop.status === 'SOLD'}
                                                                    title="Toggle Listing"
                                                                >
                                                                    {prop.active ? <EyeOffIcon /> : <EyeIcon />}
                                                                </button>
                                                                <button onClick={() => handleDeleteProperty(prop.id)} className="delete-btn" title="Delete">
                                                                    <Trash2Icon />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Chats Tab */}
                            {activeTab === "chats" && (
                                <div className="chats-table">
                                    <h2>All Conversations ({groupedChats.length})</h2>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Property</th>
                                                    <th>Buyer</th>
                                                    <th>Agent</th>
                                                    <th>Last Message</th>
                                                    <th>Time</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedChats.map((chat) => (
                                                    <tr key={chat.id}>
                                                        <td>{chat.id}</td>
                                                        <td>{chat.propertyName}</td>
                                                        <td>{chat.buyerName}</td>
                                                        <td>{chat.agentName}</td>
                                                        <td className="message-preview">
                                                            <span style={{ color: chat.statusColor }}>
                                                                {chat.displayMessage}
                                                            </span>
                                                        </td>
                                                        <td>{chat.latestCreatedAt ? new Date(chat.latestCreatedAt).toLocaleString() : 'N/A'}</td>
                                                        <td>
                                                            <button className="reply-btn" onClick={() => handleViewChat(chat)}>
                                                                💬 Reply
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === "users" && (
                                <div className="users-view">
                                    {/* Deletion Requests */}
                                    {users.filter(u => u.deletionRequested).length > 0 && (
                                        <div className="users-section" style={{ marginBottom: '40px' }}>
                                            <h2 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Trash2Icon /> Account Deletion Requests ({users.filter(u => u.deletionRequested).length})
                                            </h2>
                                            <div className="table-wrapper">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.filter(u => u.deletionRequested).map(u => (
                                                            <tr key={u.id}>
                                                                <td>{u.id}</td>
                                                                <td>{u.name}</td>
                                                                <td>{u.email}</td>
                                                                <td><span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role}</span></td>
                                                                <td className="action-btns">
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="approve-delete-btn" title="Approve Deletion">
                                                                        <CheckCircleIcon size={18} /> Approve
                                                                    </button>
                                                                    <button onClick={() => handleRejectDeletion(u.id)} className="reject-delete-btn" title="Reject Request">
                                                                        <XCircleIcon size={18} /> Reject
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending Agent Approvals */}
                                    <div className="users-section" style={{ marginBottom: '40px' }}>
                                        <h2 style={{ color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <ActivityIcon /> Pending Agent Approvals ({users.filter(u => u.role === 'AGENT' && !u.verified).length})
                                        </h2>
                                        <div className="table-wrapper">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Agency</th><th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.filter(u => u.role === 'AGENT' && !u.verified).length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                                                No pending approvals
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        users.filter(u => u.role === 'AGENT' && !u.verified).map(u => (
                                                            <tr key={u.id}>
                                                                <td>{u.id}</td>
                                                                <td>{u.name}</td>
                                                                <td>{u.email}</td>
                                                                <td>{u.phone || 'N/A'}</td>
                                                                <td>{u.agencyName || 'N/A'}</td>
                                                                <td className="action-btns">
                                                                    <button onClick={() => handleVerifyUser(u)} title="Approve Agent" style={{ color: 'var(--secondary-color)' }}>
                                                                        <CheckCircleIcon size={20} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="delete-btn" title="Reject & Delete">
                                                                        <Trash2Icon />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Approved Users */}
                                    <div className="users-section">
                                        <h2>All Users ({users.filter(u => !(u.role === 'AGENT' && !u.verified)).length})</h2>
                                        <div className="table-wrapper">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Phone</th><th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.filter(u => !(u.role === 'AGENT' && !u.verified)).map(u => (
                                                        <tr key={u.id}>
                                                            <td>{u.id}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {u.profilePicture
                                                                        ? <img src={`${IMAGE_URL}${u.profilePicture}`} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                        : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: '700', fontSize: '0.9rem' }}>{u.name?.charAt(0)}</div>
                                                                    }
                                                                    {u.name}
                                                                </div>
                                                            </td>
                                                            <td>{u.email}</td>
                                                            <td><span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role}</span></td>
                                                            <td>
                                                                {u.role === "AGENT"
                                                                    ? <span className="status-badge active">Verified</span>
                                                                    : <span className="status-badge active">Active</span>
                                                                }
                                                            </td>
                                                            <td>{u.phone || 'N/A'}</td>
                                                            <td className="action-btns">
                                                                {u.role === "AGENT" && (
                                                                    <button onClick={() => handleVerifyUser(u)} title="Revoke Verification" style={{ color: 'var(--secondary-color)' }}>
                                                                        <XCircleIcon />
                                                                    </button>
                                                                )}

                                                                {/* Dynamic Role Management */}
                                                                {u.role !== "ADMIN" ? (
                                                                    <button
                                                                        onClick={() => handleUpdateRole(u.id, "ADMIN")}
                                                                        title="Promote to Admin"
                                                                        className="promote-btn"
                                                                        style={{ color: 'var(--secondary-color)' }}
                                                                    >
                                                                        <CheckCircleIcon />
                                                                    </button>
                                                                ) : (
                                                                    // Only show revoke if not the current logged-in user
                                                                    u.id !== user.id && (
                                                                        <button
                                                                            onClick={() => handleUpdateRole(u.id, "BUYER")}
                                                                            title="Revoke Admin"
                                                                            style={{ color: 'var(--danger-color)' }}
                                                                        >
                                                                            <XCircleIcon />
                                                                        </button>
                                                                    )
                                                                )}

                                                                {u.id !== user.id && (
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="delete-btn" title="Delete User">
                                                                        <Trash2Icon />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Deleted Users Archive */}
                                    {deletedUsers.length > 0 && (
                                        <div className="users-section" style={{ marginTop: '40px' }}>
                                            <h2 style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Trash2Icon /> Deleted Users Archive ({deletedUsers.length})
                                            </h2>
                                            <div className="table-wrapper">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Original ID</th><th>Name</th><th>Email</th><th>Role</th><th>Reason</th><th>Deleted At</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {deletedUsers.map(du => (
                                                            <tr key={du.id} style={{ opacity: 0.7 }}>
                                                                <td>{du.originalUserId}</td>
                                                                <td>{du.name}</td>
                                                                <td>{du.email}</td>
                                                                <td><span className={`role-badge ${du.role?.toLowerCase()}`}>{du.role}</span></td>
                                                                <td>
                                                                    <span className={`status-badge ${du.deletionReason === 'USER_REQUEST' ? 'inactive' : du.deletionReason === 'POLICY_VIOLATION' ? 'sold' : 'active'}`}>
                                                                        {du.deletionReason || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>{du.deletedAt ? new Date(du.deletedAt).toLocaleString() : 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Appointments Tab */}
                            {activeTab === "appointments" && (
                                <div className="appointments-table">
                                    <h2>All Appointments ({appointments.length})</h2>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th><th>Property</th><th>Buyer</th><th>Agent</th><th>Date</th><th>Time</th><th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {appointments.length === 0 ? (
                                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No appointments yet</td></tr>
                                                ) : (
                                                    appointments.map(appt => {
                                                        const prop = properties.find(p => p.id === appt.propertyId);
                                                        const buyer = users.find(u => u.id === appt.buyerId);
                                                        const agent = users.find(u => u.id === appt.agentId);
                                                        return (
                                                            <tr key={appt.id}>
                                                                <td>{appt.id}</td>
                                                                <td>{prop?.title || `Property #${appt.propertyId}`}</td>
                                                                <td>{buyer?.name || appt.buyerName || `#${appt.buyerId}`}</td>
                                                                <td>{agent?.name || appt.agentName || `#${appt.agentId}`}</td>
                                                                <td>{appt.date || 'N/A'}</td>
                                                                <td>{appt.time || appt.startTime || 'N/A'}</td>
                                                                <td>
                                                                    <span className={`status-badge ${appt.status === 'sold' ? 'sold' : appt.status === 'booked' ? 'active' : 'inactive'}`}>
                                                                        {appt.status || 'pending'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Deleted Users Archive (after Users tab) */}

                            {/* Sold Tab */}
                            {activeTab === "sold" && (
                                <div className="sold-table">
                                    <h2>Sold Properties & Transactions ({soldDeals.length})</h2>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th><th>Property</th><th>Buyer</th><th>Agent</th><th>Final Price</th><th>Commission</th><th>Review</th><th>Date</th><th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {soldDeals.map((deal, idx) => (
                                                    <tr key={`${deal.id}-${deal.propertyId}-${idx}`}>
                                                        <td>{deal.displayedId}</td>
                                                        <td>{deal.propertyName || deal.propertyId}</td>
                                                        <td>{deal.buyerName || deal.buyerId}</td>
                                                        <td>{deal.agentName || deal.agentId}</td>
                                                        <td>{formatPrice(deal.finalizePrice)}</td>
                                                        <td style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>
                                                            {formatPrice(deal.commission)}
                                                        </td>
                                                        <td>
                                                            {deal.review ? (
                                                                <span className={`status-badge ${deal.review.toLowerCase() === 'positive' ? 'active' : 'inactive'}`} style={{
                                                                    background: deal.review.toLowerCase() === 'positive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                    color: deal.review.toLowerCase() === 'positive' ? '#10b981' : '#ef4444',
                                                                    border: `1px solid ${deal.review.toLowerCase() === 'positive' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                                                }}>
                                                                    {deal.review}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>N/A</span>
                                                            )}
                                                        </td>
                                                        <td>{new Date(deal.updatedAt).toLocaleDateString()}</td>
                                                        <td className="action-btns">
                                                            {deal.buyerId && deal.agentId && (
                                                                <button className="reply-btn" onClick={() => handleViewChat(deal)} title="View Conversation">
                                                                    <MessageCircleIcon /> Chat
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Tab */}
                            {activeTab === "analysis" && (
                                <div className="analysis-view">
                                    <div className="analysis-controls">
                                        <div className="agent-selector-wrapper">
                                            <ActivityIcon />
                                            <select
                                                value={selectedAgentId}
                                                onChange={(e) => handleAgentSelect(e.target.value)}
                                                className="agent-dropdown"
                                            >
                                                <option value="">Select an Agent for Analysis</option>
                                                {users.filter(u => u.role === 'AGENT').map(agent => (
                                                    <option key={agent.id} value={agent.id}>
                                                        {agent.name} ({agent.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {selectedAgentId ? (
                                        <div className="agent-stats-display">
                                            <div className="agent-quick-stats">
                                                <div className="a-stat">
                                                    <span>Total Sales</span>
                                                    <h4>{formatCurrency(agentAnalysis.totalSales)}</h4>
                                                </div>
                                                <div className="a-stat">
                                                    <span>Total Commission</span>
                                                    <h4 style={{ color: 'var(--secondary-color)' }}>{formatCurrency(agentAnalysis.totalComm)}</h4>
                                                </div>
                                                <div className="a-stat">
                                                    <span>Deals Closed</span>
                                                    <h4>{agentAnalysis.propertyCount}</h4>
                                                </div>
                                            </div>

                                            <div className="agent-chart-container">
                                                <h3>📊 Performance Trend</h3>
                                                <div style={{ height: '350px', width: '100%' }}>
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                        <AreaChart data={agentAnalysis.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="var(--secondary-color)" stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor="var(--secondary-color)" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                                                            <Tooltip
                                                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px' }}
                                                                formatter={(value) => formatCurrency(value)}
                                                            />
                                                            <Area type="monotone" dataKey="sales" stroke="var(--secondary-color)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-selection-state">
                                            <PieChartIcon size={60} />
                                            <h3>Select an Agent</h3>
                                            <p>Choose an agent from the dropdown to see their detailed sales analysis and performance metrics.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "profile" && (
                                <div className="admin-profile-tab" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                    <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Admin Profile Settings</h2>

                                    <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: '1fr 1fr' }}>
                                        {/* Profile Edit */}
                                        <div className="profile-section" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
                                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserIcon /> Public Info</h3>
                                            {profileMessage.text && (
                                                <div className={`message ${profileMessage.type}`} style={{ padding: '10px', borderRadius: '4px', marginBottom: '16px', backgroundColor: profileMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: profileMessage.type === 'error' ? '#ef4444' : '#22c55e' }}>
                                                    {profileMessage.text}
                                                </div>
                                            )}
                                            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.name}
                                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone Number</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.phone}
                                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Bio / Admin Notes</label>
                                                    <textarea
                                                        value={profileData.bio}
                                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                        rows="3"
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <button type="submit" className="save-btn" disabled={savingProfile} style={{ marginTop: '8px' }}>
                                                    {savingProfile ? "Saving..." : "Save Profile"}
                                                </button>
                                            </form>
                                        </div>

                                        {/* Password Change */}
                                        <div className="password-section" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
                                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><LockIcon /> Security</h3>
                                            {passwordMessage.text && (
                                                <div className={`message ${passwordMessage.type}`} style={{ padding: '10px', borderRadius: '4px', marginBottom: '16px', backgroundColor: passwordMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: passwordMessage.type === 'error' ? '#ef4444' : '#22c55e' }}>
                                                    {passwordMessage.text}
                                                </div>
                                            )}
                                            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Current Password</label>
                                                    <input
                                                        type={showCurrentPw ? "text" : "password"}
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>New Password</label>
                                                    <input
                                                        type={showNewPw ? "text" : "password"}
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        required
                                                        minLength="6"
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Confirm Password</label>
                                                    <input
                                                        type={showNewPw ? "text" : "password"}
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white' }}
                                                    />
                                                </div>
                                                <button type="submit" className="save-btn" style={{ marginTop: '8px' }}>
                                                    Update credentials
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Property Modal */}
            {editingProperty && (
                <div className="modal-overlay" onClick={() => setEditingProperty(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Property</h2>
                        <div className="edit-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={editingProperty.title || ''}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input
                                    type="number"
                                    value={editingProperty.price || ''}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, price: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={editingProperty.location || ''}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Area (sq.ft)</label>
                                <input
                                    type="number"
                                    value={editingProperty.area || ''}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, area: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>BHK</label>
                                <select
                                    value={editingProperty.bhk || ''}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, bhk: e.target.value })}
                                >
                                    <option value="1">1 BHK</option>
                                    <option value="2">2 BHK</option>
                                    <option value="3">3 BHK</option>
                                    <option value="4">4 BHK</option>
                                    <option value="5">5+ BHK</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setEditingProperty(null)}>Cancel</button>
                                <button className="btn-save" onClick={handleSaveProperty}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {selectedChat && (
                <div className="modal-overlay" onClick={() => { setSelectedChat(null); setChatMessages([]); }}>
                    <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="chat-modal-header">
                            <div>
                                <h2>💬 Conversation</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    {selectedChat.propertyName} · {selectedChat.buyerName} ↔ {selectedChat.agentName}
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedChat(null); setChatMessages([]); }}>
                                <XIcon />
                            </button>
                        </div>

                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div className="no-messages">
                                    <p>No messages in this conversation yet.</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, i) => {
                                    const isMe = msg.sender === 'ADMIN';
                                    const senderClass = msg.sender?.toLowerCase();

                                    return (
                                        <div key={i} className={`chat-bubble-wrap ${isMe ? 'right' : 'left'}`}>
                                            <div className="chat-sender">
                                                {msg.sender === 'BUYER' ? <><UserIcon /> Buyer</> :
                                                    msg.sender === 'ADMIN' ? <><ShieldIcon /> Admin</> :
                                                        <><HomeIcon /> Agent</>}
                                            </div>
                                            <div className={`chat-bubble ${senderClass}`}>
                                                <div className="msg-content">{msg.message}</div>
                                                <div className="chat-time">
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedChat.isSold ? (
                            <div className="chat-sold-overlay" style={{
                                padding: '1.5rem',
                                textAlign: 'center',
                                background: 'rgba(0,0,0,0.1)',
                                borderTop: '1px solid var(--border-light)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                <LockIcon size={20} style={{ marginBottom: '0.5rem', color: '#64748b' }} />
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Messaging disabled for sold properties</p>
                            </div>
                        ) : (
                            <div className="chat-input-wrap">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Write a response as Admin..."
                                />
                                <button className="send-btn" onClick={handleSendMessage}>
                                    <SendIcon /> Send
                                </button>
                            </div>
                        )}

                        <div className="chat-modal-footer">
                            {!selectedChat.isSold && (
                                <button className="resolve-btn" onClick={handleResolveChat}>✅ Mark as Resolved</button>
                            )}
                            <button className="btn-cancel" onClick={() => { setSelectedChat(null); setChatMessages([]); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default AdminDashboard;
