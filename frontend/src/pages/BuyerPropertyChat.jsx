import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatApi, propertyApi, userApi } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import AppointmentActionPanel from "../components/AppointmentActionPanel";
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
    const [feedbackSent, setFeedbackSent] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Detect sold status from property OR from system messages
    const isSold = property?.sold || messages.some(m =>
        m.message && (m.message.includes("officially SOLD") || m.message.includes("has been sold"))
    );

    // Check if feedback already sent
    const hasFeedback = messages.some(m => m.sender === "BUYER" && m.message?.startsWith("⭐ FEEDBACK:"));

    // ---------------- FETCH DATA ----------------
    const fetchMessages = () => {
        chatApi
            .get("/messages", {
                params: { propertyId, buyerId, agentId }
            })
            .then(res => {
                setMessages(res.data);
                // Mark agent messages as seen
                chatApi.post("/seen", {
                    propertyId,
                    buyerId,
                    agentId,
                    userRole: "BUYER"
                }).catch(err => console.error("Mark seen error:", err));
            })
            .catch(err => console.error("Chat fetch error:", err));
    };

    useEffect(() => {
        if (!buyerId) {
            navigate("/login");
            return;
        }

        // Initial fetches
        propertyApi.get(`/${propertyId}?userId=${buyerId}&role=BUYER`).then(res => setProperty(res.data)).catch(err => console.error("Property error:", err));
        userApi.get(`/${agentId}`).then(res => setAgent(res.data)).catch(err => console.error("Agent error:", err));

        // Fetch conversation & stop loading
        chatApi
            .get("/messages", {
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

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [propertyId, buyerId, agentId, navigate]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        try {
            const res = await chatApi.post("/messages", {
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

    const sendFeedback = async (type) => {
        const emoji = type === "positive" ? "👍" : "👎";
        const label = type === "positive" ? "Positive" : "Negative";
        try {
            const res = await chatApi.post("/messages", {
                propertyId,
                buyerId,
                agentId,
                sender: "BUYER",
                message: `⭐ FEEDBACK: ${emoji} ${label} - The buyer rated this experience as ${label.toLowerCase()}.`
            });
            setMessages(prev => [...prev, res.data]);
            setFeedbackSent(true);
        } catch (err) {
            alert("Failed to send feedback.");
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
            <div className="chat-container">
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading your chat...</p>
                </div>
            </div>
        );
    }

    const commissionAmount = property?.price ? property.price * 0.01 : 0;

    return (
        <div className="chat-container">
            {/* ================= HEADER ================= */}
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate("/chats")} title="Back">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <img
                    src={agent?.profileImage || profileImg}
                    alt="agent"
                    className="property-chat-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = profileImg; }}
                />

                <div className="property-info">
                    <h4>{agent?.name || "Property Agent"}</h4>
                    <p>{property?.title || `Property #${propertyId}`} · {property?.price ? `₹${(property.price / 100000).toFixed(2)} L` : "Price on Request"}</p>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isSold ? (
                        <span className="sold-header-badge">SOLD</span>
                    ) : (
                        propertyId && buyerId && agentId && (
                            <AppointmentActionPanel
                                propertyId={propertyId}
                                buyerId={buyerId}
                                agentId={agentId}
                                userRole="BUYER"
                                isHeader={true}
                            />
                        )
                    )}
                </div>
            </div>

            {/* ================= CHAT BODY ================= */}
            <div className="chat-body">
                {messages.length === 0 && (
                    <div className="no-messages">
                        <div className="icon">💬</div>
                        <p>Start a conversation with the agent. You can ask about the property or book an appointment!</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`chat-row ${msg.sender === "BUYER" ? "me" : "other"}`}
                    >
                        {msg.sender !== "BUYER" && (
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

                        <div className={`chat-bubble ${msg.sender === "BUYER" ? "sent" : "received"}`}>
                            <div className="msg-text">{msg.message}</div>
                            <div className="msg-meta">
                                <small className="time">{formatTime(msg.createdAt)}</small>
                                {msg.sender === "BUYER" && (
                                    <span className="seen-status">
                                        {msg.seen ? "✓✓" : "✓"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div ref={bottomRef} style={{ height: "1px" }} />
            </div>

            {/* ================= INPUT AREA ================= */}
            {isSold ? (
                <div className="chat-sold-container">
                    <div className="chat-sold-banner">
                        <div className="sold-icon">🏠</div>
                        <div className="sold-text">
                            <strong>This property has been sold</strong>
                            <span>Regular messaging is disabled.</span>
                        </div>
                    </div>

                    <div className="buyer-post-sold-actions">
                        <div className="commission-notice">
                            <div className="notice-header">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Commission Notice
                            </div>
                            <p>As per the agreement, you have to pay <strong>1% commission</strong> to the agent for this deal.</p>
                            {property?.price > 0 && (
                                <div className="commission-amount">
                                    Property Price: <span>{formatPrice(property.price)}</span>
                                </div>
                            )}
                            <div className="commission-amount highlight">
                                Commission (1%): <span>{formatPrice(commissionAmount)}</span>
                            </div>
                        </div>

                        <div className="feedback-section">
                            <div className="feedback-title">Rate Your Experience</div>
                            {feedbackSent || hasFeedback ? (
                                <div className="feedback-sent-msg">
                                    ✅ Thank you for your feedback!
                                </div>
                            ) : (
                                <div className="feedback-buttons">
                                    <button
                                        className="feedback-btn positive"
                                        onClick={() => sendFeedback("positive")}
                                    >
                                        <span className="fb-icon">👍</span>
                                        <span>Positive</span>
                                    </button>
                                    <button
                                        className="feedback-btn negative"
                                        onClick={() => sendFeedback("negative")}
                                    >
                                        <span className="fb-icon">👎</span>
                                        <span>Negative</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="chat-input-wrapper">
                    <div className="chat-input-container">
                        <button className="icon-btn" title="Attach file">📎</button>
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                        />
                        <div className="actions">
                            <button className="icon-btn" title="Emojis">😊</button>
                            <button className="send-btn" onClick={sendMessage} title="Send Message">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
