import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatApi, propertyApi, userApi } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PropertyChat.css";

// Local fallback images
import profileImg from "../assets/profile.png";
import delhiImg from "../assets/delhi.jpg";

export default function BuyerPropertyChat() {
    const { propertyId, agentId } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const buyerId = user?.id;

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [property, setProperty] = useState(null);
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false); // Default to focused view

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ---------------- FETCH DATA ----------------
    const fetchMessages = () => {
        chatApi
            .get("/conversation", {
                params: { propertyId, buyerId, agentId }
            })
            .then(res => {
                setMessages(res.data);
            })
            .catch(err => console.error("Chat fetch error:", err));
    };

    useEffect(() => {
        if (!buyerId) {
            navigate("/login");
            return;
        }

        // Initial fetches
        propertyApi.get(`/${propertyId}`).then(res => setProperty(res.data)).catch(err => console.error("Property error:", err));
        userApi.get(`/${agentId}`).then(res => setAgent(res.data)).catch(err => console.error("Agent error:", err));

        // Fetch conversation & stop loading
        chatApi
            .get("/conversation", {
                params: { propertyId, buyerId, agentId }
            })
            .then(res => {
                setMessages(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Chat error:", err);
                setLoading(false);
            });

        // 🔄 AUTO-REFRESH EVERY 10 SECONDS
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [propertyId, buyerId, agentId, navigate]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        try {
            const res = await chatApi.post("/send", {
                propertyId,
                buyerId,
                agentId,
                sender: "BUYER",
                message: text
            });

            setMessages(prev => [...prev, res.data]);
            setText("");
        } catch (err) {
            console.error("Send message failed:", err);
            alert("Failed to send message");
        }
    };

    const getFirstPhoto = (photos) => {
        if (photos) {
            if (Array.isArray(photos)) return photos[0];
            if (typeof photos === "string") return photos.split(",")[0];
        }
        return delhiImg;
    };

    const formatTime = (time) => {
        if (!time) return "";
        const date = new Date(time);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="property-chat-page">
                <Navbar />
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading your chat...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="property-chat-page">
            <Navbar />

            <div className={`chat-main-wrapper ${!showSidebar ? "focused-view" : ""}`}>
                {/* 🏠 PROPERTY DETAILS SIDEBAR (Integrated) */}
                <div className={`property-sidebar-context ${showSidebar ? "show-on-mobile" : ""}`}>
                    <img
                        src={getFirstPhoto(property?.photos)}
                        alt="property"
                        className="sidebar-prop-img"
                    />
                    <div className="sidebar-prop-info">
                        <h3>{property?.title}</h3>
                        <p className="sidebar-price">₹{property?.price?.toLocaleString()}</p>
                        <hr />
                        <div className="sidebar-specs">
                            <span>🛏️ {property?.bhk} BHK</span>
                            <span>🚿 {property?.bathrooms} Baths</span>
                            <span>📐 {property?.area} sqft</span>
                        </div>
                        <p className="sidebar-loc">📍 {property?.location || "Prime Location"}</p>

                        <div className="agent-small-card">
                            <img src={agent?.profileImage || profileImg} alt="agent" />
                            <div>
                                <h5>{agent?.name}</h5>
                                <p>Premium Agent</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chat-container">
                    <div className="chat-header">
                        <button className="back-btn" onClick={() => navigate("/chats")}>
                            ← Back
                        </button>
                        <div className="header-user">
                            <img src={agent?.profileImage || profileImg} alt="agent" />
                            <div className="property-info">
                                <h4>Chatting with {agent?.name}</h4>
                                <p>Property ID: #{propertyId}</p>
                            </div>
                        </div>
                        <button
                            className="toggle-sidebar-btn"
                            onClick={() => setShowSidebar(!showSidebar)}
                            title={showSidebar ? "Hide Details" : "Show Details"}
                        >
                            {showSidebar ? "👁️ Hide Details" : "ℹ️ Details"}
                        </button>
                    </div>

                    <div className="chat-body">
                        {messages.length === 0 && (
                            <p className="no-messages">Send a message to start dealing!</p>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`chat-row ${msg.sender === "BUYER" ? "agent" : "buyer"
                                    }`}
                            >
                                {msg.sender === "AGENT" && (
                                    <img
                                        src={agent?.profileImage || profileImg}
                                        className="avatar"
                                        alt="agent"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = profileImg;
                                        }}
                                    />
                                )}

                                <div className={`chat-bubble ${msg.sender.toLowerCase()}`}>
                                    <span>{msg.message}</span>
                                    <small className="time">{formatTime(msg.createdAt)}</small>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    <div className="chat-input">
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type a message to the agent..."
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
