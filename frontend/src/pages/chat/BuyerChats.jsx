import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi, propertyApi, userApi, IMAGE_URL } from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./AgentChats.css"; // Reuse the same styles

import fallbackImg from "../../assets/delhi.jpg";
import profileImg from "../../assets/profile.png";

export default function BuyerChats() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [propertyMap, setPropertyMap] = useState({});
    const [userMap, setUserMap] = useState({});
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const buyerId = user?.id;

    useEffect(() => {
        if (!buyerId) return;

        chatApi.get(`/buyer/${buyerId}`)
            .then(res => {
                const data = res.data || [];
                setChats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching buyer chats:", err);
                setLoading(false);
            });
    }, [buyerId]);

    // fetch property and user details
    useEffect(() => {
        const uniquePropertyIds = [...new Set(chats.map(c => c.propertyId))];
        const uniqueAgentIds = [...new Set(chats.map(c => c.agentId))];

        uniquePropertyIds.forEach(pid => {
            if (!propertyMap[pid]) {
                // Include userId+role so sold properties are accessible to the buyer who bought them
                propertyApi.get(`/${pid}?userId=${buyerId}&role=BUYER`).then(res => {
                    // Only store valid property objects, not error response objects
                    if (res.data && res.data.id) {
                        setPropertyMap(prev => ({ ...prev, [pid]: res.data }));
                    }
                }).catch(() => {
                    // Silently ignore — property may be deleted or inaccessible
                });
            }
        });

        uniqueAgentIds.forEach(aid => {
            if (!userMap[aid]) {
                userApi.get(`/${aid}`).then(res => {
                    // Only store valid user objects, not error response objects
                    if (res.data && res.data.id) {
                        setUserMap(prev => ({ ...prev, [aid]: res.data }));
                    }
                }).catch(() => {
                    // Agent may have been deleted — silently ignore
                });
            }
        });
    }, [chats]);

    const grouped = chats.reduce((acc, msg) => {
        const key = `${msg.propertyId}_${msg.agentId}`;
        acc[key] = acc[key] || [];
        acc[key].push(msg);
        return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort((a, b) => {
        if (!grouped[a] || !grouped[b] || !grouped[a][0] || !grouped[b][0]) return 0;
        const dateA = new Date(grouped[a].slice(-1)[0].createdAt || grouped[a][0].createdAt);
        const dateB = new Date(grouped[b].slice(-1)[0].createdAt || grouped[b][0].createdAt);
        return dateB - dateA;
    });

    return (
        <div className="agent-chats-page">
            <Navbar />
            <div className="chats-container">
                <div className="chats-header">
                    <h2>💬 My Conversations</h2>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading your chats...</p>
                    </div>
                ) : sortedGroups.length === 0 ? (
                    <div className="no-chats">
                        <p>You haven't started any conversations with agents yet.</p>
                        <button
                            className="browse-btn"
                            onClick={() => navigate("/properties")}
                        >
                            Browse Verified Properties
                        </button>
                    </div>
                ) : (
                    <div className="chat-list">
                        {sortedGroups.map(key => {
                            const msgs = grouped[key];
                            const lastMsg = msgs.slice(-1)[0] || msgs[0];
                            const property = propertyMap[lastMsg.propertyId];

                            const agentProfile = userMap[lastMsg.agentId];
                            const profilePicUrl = agentProfile?.profilePicture
                                ? `${IMAGE_URL}${agentProfile.profilePicture}`
                                : null;

                            return (
                                <div
                                    key={key}
                                    className="chat-card"
                                    onClick={() =>
                                        navigate(`/buyer/chat/${lastMsg.propertyId}/${lastMsg.agentId}`)
                                    }
                                >
                                    {profilePicUrl ? (
                                        <img
                                            src={profilePicUrl}
                                            alt="agent"
                                            className="property-thumb agent-avatar"
                                            style={{ borderRadius: '50%' }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = profileImg; // fallback added
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={profileImg}
                                            alt="agent placeholder"
                                            className="property-thumb agent-avatar-placeholder"
                                            style={{ borderRadius: '50%' }}
                                        />
                                    )}

                                    <div className="chat-info">
                                        <div className="chat-info-header">
                                            <h4>{agentProfile?.name || property?.agentName || "Real Estate Agent"}</h4>
                                            <span className="chat-date">
                                                {new Date(lastMsg.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="meta">
                                            <span className="agent-label">Regarding:</span>
                                            {property?.title || `Property #${lastMsg.propertyId}`}
                                        </div>
                                        <p className="last-msg">
                                            {lastMsg.sender === "BUYER" ? "You: " : ""}{lastMsg.message}
                                        </p>
                                    </div>
                                    {lastMsg.seen === false && lastMsg.sender === "AGENT" && (
                                        <span className="unread-badge">New Message</span>
                                    )}
                                    {property?.sold && (
                                        <span className="unread-badge" style={{ background: '#ef4444', boxShadow: 'none' }}>Sold</span>
                                    )}
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



