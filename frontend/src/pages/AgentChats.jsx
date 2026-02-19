import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi, propertyApi } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AgentChats.css";

// Fallback image
import fallbackImg from "../assets/delhi.jpg";

export default function AgentChats() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [propertyMap, setPropertyMap] = useState({});
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const agentId = user?.id;

    useEffect(() => {
        if (!agentId) {
            navigate("/login");
            return;
        }

        chatApi.get(`/agent/${agentId}`)
            .then(res => {
                setChats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching chats:", err);
                setLoading(false);
            });
    }, [agentId, navigate]);

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

    if (loading) {
        return (
            <div className="agent-chats-page">
                <Navbar />
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your conversations...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="agent-chats-page">
            <Navbar />

            <div className="chats-container">
                <div className="chats-header">
                    <h1>💬 Messages</h1>
                    <p>
                        Manage your {Object.keys(grouped).length} property conversation
                        {Object.keys(grouped).length !== 1 ? "s" : ""}
                    </p>
                </div>

                {Object.keys(grouped).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✉️</div>
                        <h3>No Messages Yet</h3>
                        <p>Buyer inquiries will appear here as soon as they message you.</p>
                    </div>
                ) : (
                    <div className="chats-list">
                        {Object.keys(grouped).map(pid => {
                            const messages = grouped[pid];
                            const lastMsg = messages[messages.length - 1];
                            const property = propertyMap[pid];

                            return (
                                <div
                                    key={pid}
                                    className="chat-card"
                                    onClick={() =>
                                        navigate(`/agent/chat/${pid}/${lastMsg.buyerId}`)
                                    }
                                >
                                    <div className="chat-property-img">
                                        <img
                                            src={getPropertyImage(property?.photos)}
                                            alt="property"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = fallbackImg;
                                            }}
                                        />
                                    </div>

                                    <div className="chat-details">
                                        <div className="chat-top">
                                            <h3 className="property-title">
                                                {property?.title || `Property #${pid}`}
                                            </h3>
                                            <span className="chat-time">{formatTime(lastMsg.createdAt)}</span>
                                        </div>

                                        <div className="chat-location">
                                            📍 {property?.city || "Unknown City"}
                                        </div>

                                        <div className="chat-bottom">
                                            <p className="last-message">
                                                {lastMsg.sender === "AGENT" ? "You: " : "Buyer: "}
                                                {lastMsg.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
