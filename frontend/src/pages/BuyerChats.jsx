import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi, propertyApi } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AgentChats.css";

// Fallback image
import fallbackImg from "../assets/delhi.jpg";

export default function BuyerChats() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [propertyMap, setPropertyMap] = useState({});
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const buyerId = user?.id;

    useEffect(() => {
        if (!buyerId) {
            navigate("/login");
            return;
        }

        chatApi.get(`/buyer/${buyerId}`)
            .then(res => {
                setChats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching chats:", err);
                setLoading(false);
            });
    }, [buyerId, navigate]);

    // Fetch property details for each unique property
    useEffect(() => {
        const uniquePropertyIds = [...new Set(chats.map(c => c.propertyId))];

        uniquePropertyIds.forEach(pid => {
            if (!propertyMap[pid]) {
                propertyApi.get(`/${pid}`)
                    .then(res => {
                        setPropertyMap(prev => ({
                            ...prev,
                            [pid]: res.data
                        }));
                    })
                    .catch(err => console.error(`Error fetching property ${pid}:`, err));
            }
        });
    }, [chats, propertyMap]);

    // Group messages by property
    const grouped = chats.reduce((acc, msg) => {
        acc[msg.propertyId] = acc[msg.propertyId] || [];
        acc[msg.propertyId].push(msg);
        return acc;
    }, {});

    const getPropertyImage = (photos) => {
        if (photos) {
            if (Array.isArray(photos)) return photos[0];
            if (typeof photos === "string") return photos.split(",")[0];
        }
        return fallbackImg;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleChatClick = (propertyId, agentId) => {
        navigate(`/buyer/chat/${propertyId}/${agentId}`);
    };

    return (
        <>
            <Navbar />
            <div className="agent-chats-page">
                <div className="chats-container">
                    <div className="chats-header">
                        <h1>💬 My Conversations</h1>
                        <p>Chat with agents about properties you're interested in</p>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading your conversations...</p>
                        </div>
                    ) : Object.keys(grouped).length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💬</div>
                            <h3>No Conversations Yet</h3>
                            <p>Start chatting with agents about properties you like!</p>
                            <button
                                className="browse-btn"
                                onClick={() => navigate("/properties")}
                            >
                                Browse Properties
                            </button>
                        </div>
                    ) : (
                        <div className="chats-list">
                            {Object.entries(grouped).map(([propertyId, messages]) => {
                                const property = propertyMap[propertyId];
                                const lastMsg = messages[messages.length - 1];
                                const unreadCount = messages.filter(m => !m.isRead && m.senderId !== buyerId).length;

                                return (
                                    <div
                                        key={propertyId}
                                        className="chat-card"
                                        onClick={() => handleChatClick(propertyId, lastMsg.agentId)}
                                    >
                                        <div className="chat-property-img">
                                            <img
                                                src={property ? getPropertyImage(property.photos) : fallbackImg}
                                                alt="Property"
                                                onError={(e) => { e.target.src = fallbackImg; }}
                                            />
                                        </div>

                                        <div className="chat-details">
                                            <div className="chat-top">
                                                <h3 className="property-title">
                                                    {property?.title || "Loading..."}
                                                </h3>
                                                <span className="chat-time">{formatTime(lastMsg.timestamp)}</span>
                                            </div>

                                            <div className="chat-location">
                                                📍 {property?.city || "..."}, {property?.pincode || "..."}
                                            </div>

                                            <div className="chat-bottom">
                                                <p className="last-message">
                                                    {lastMsg.senderId === buyerId ? "You: " : "Agent: "}
                                                    {lastMsg.message}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="unread-badge">{unreadCount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
