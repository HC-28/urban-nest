import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi, propertyApi, userApi, IMAGE_URL } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AgentChats.css";

import fallbackImg from "../assets/delhi.jpg";
import profileImg from "../assets/profile.png";

export default function AgentChats() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [propertyMap, setPropertyMap] = useState({});
    const [userMap, setUserMap] = useState({});
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const agentId = user?.id;

    useEffect(() => {
        if (!agentId) return;

        chatApi.get(`/agent/${agentId}`).then(res => {
            setChats(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [agentId]);

    // fetch details for properties and buyers
    useEffect(() => {
        const uniquePropertyIds = [...new Set(chats.map(c => c.propertyId))];
        const uniqueBuyerIds = [...new Set(chats.map(c => c.buyerId))];

        uniquePropertyIds.forEach(pid => {
            if (!propertyMap[pid]) {
                propertyApi.get(`/${pid}`).then(res => {
                    setPropertyMap(prev => ({ ...prev, [pid]: res.data }));
                }).catch(e => console.error(e));
            }
        });

        uniqueBuyerIds.forEach(bid => {
            if (!userMap[bid]) {
                userApi.get(`/${bid}`).then(res => {
                    setUserMap(prev => ({ ...prev, [bid]: res.data }));
                }).catch(e => console.error(e));
            }
        });
    }, [chats]);

    // Group by Property AND Buyer for unique conversations
    const grouped = chats.reduce((acc, msg) => {
        const key = `${msg.propertyId}_${msg.buyerId}`;
        acc[key] = acc[key] || [];
        acc[key].push(msg);
        return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(grouped[a].slice(-1)[0].createdAt);
        const dateB = new Date(grouped[b].slice(-1)[0].createdAt);
        return dateB - dateA;
    });

    const getProfileImage = (u) => {
        if (u?.profilePicture) {
            return `${IMAGE_URL}${u.profilePicture}`;
        }
        return profileImg;
    };

    return (
        <div className="properties-page">
            <Navbar />
            <div className="chat-inbox">
                <h2>💬 Buyer Inquiries</h2>

                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading inquiries...</p>
                    </div>
                ) : sortedGroups.length === 0 ? (
                    <div className="no-chats">
                        <p>No buyers have contacted you regarding your properties yet.</p>
                        <button
                            className="browse-btn"
                            onClick={() => navigate("/post-property")}
                        >
                            Post More Properties
                        </button>
                    </div>
                ) : (
                    <div className="chat-list">
                        {sortedGroups.map(key => {
                            const lastMsg = grouped[key].slice(-1)[0];
                            const property = propertyMap[lastMsg.propertyId];
                            const buyer = userMap[lastMsg.buyerId];

                            return (
                                <div
                                    key={key}
                                    className="chat-card"
                                    onClick={() =>
                                        navigate(`/agent/chat/${lastMsg.propertyId}/${lastMsg.buyerId}`)
                                    }
                                >
                                    <img
                                        src={getProfileImage(buyer)}
                                        alt="buyer"
                                        className="property-thumb"
                                        style={{ borderRadius: '50%' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = profileImg;
                                        }}
                                    />

                                    <div className="chat-info">
                                        <div className="chat-info-header">
                                            <h4>{buyer?.name || "Interested Buyer"}</h4>
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
                                            {lastMsg.sender === "AGENT" ? "You: " : ""}{lastMsg.message}
                                        </p>
                                    </div>
                                    {lastMsg.seen === false && lastMsg.sender === "BUYER" && (
                                        <span className="unread-badge">New message</span>
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
