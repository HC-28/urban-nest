import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { chatApi, propertyApi, userApi, IMAGE_URL } from "../api/api";
import { formatPrice } from "../utils/priceUtils";
import AppointmentActionPanel from "../components/AppointmentActionPanel";
import "../styles/PropertyChat.css";

// Local fallback images
import profileImg from "../assets/profile.png";
import delhiImg from "../assets/delhi.jpg";

export default function PropertyChat() {
    const { propertyId, buyerId, agentId: paramAgentId } = useParams();

    const user = JSON.parse(localStorage.getItem("user"));
    const currentUserRole = user?.role;

    // If agent is logged in, use their ID. If buyer is logged in, get agentId from params or property
    const [agentId, setAgentId] = useState(paramAgentId || (currentUserRole === "AGENT" ? user?.id : null));

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [property, setProperty] = useState(null);
    const [otherUser, setOtherUser] = useState(null);

    // auto-scroll ref
    const bottomRef = useRef(null);

    // ---------------- AUTO SCROLL ----------------
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ---------------- FETCH DATA ----------------
    useEffect(() => {
        // 1. Fetch Property
        propertyApi
            .get(`/${propertyId}?userId=${user?.id || ""}&role=${user?.role || ""}`)
            .then(res => {
                setProperty(res.data);
                if (!agentId) setAgentId(res.data.agentId);
            })
            .catch(err => console.error("Property error:", err));

        // 2. Fetch "Other User" profile
        const targetUserId = currentUserRole === "AGENT" ? buyerId : agentId;
        if (targetUserId) {
            userApi
                .get(`/${targetUserId}`)
                .then(res => setOtherUser(res.data))
                .catch(err => console.error("User profile error:", err));
        }
    }, [propertyId, buyerId, agentId, currentUserRole]);

    // 3. Fetch Conversation
    const fetchMessages = () => {
        if (!agentId || !buyerId) return;
        chatApi
            .get("/messages", {
                params: { propertyId, buyerId, agentId }
            })
            .then(res => {
                if (Array.isArray(res.data)) {
                    setMessages(res.data);
                } else {
                    setMessages([]);
                }
                // Mark messages from OTHER as seen
                chatApi.post("/seen", {
                    propertyId,
                    buyerId,
                    agentId,
                    userRole: currentUserRole
                }).catch(err => console.error("Mark seen error:", err));
            })
            .catch(err => console.error("Chat error:", err));
    };

    useEffect(() => {
        fetchMessages();
        // Auto-refresh every 5 seconds for real-time feel
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [propertyId, buyerId, agentId, currentUserRole]);

    // ---------------- SEND MESSAGE ----------------
    const sendMessage = async () => {
        if (!text.trim() || !agentId || !buyerId) return;

        try {
            const res = await chatApi.post("/messages", {
                propertyId,
                buyerId,
                agentId,
                sender: currentUserRole,
                message: text
            });

            setMessages(prev => [...prev, res.data]);
            setText("");
        } catch (err) {
            console.error("Send message failed:", err);
        }
    };

    const handleCallAdmin = async () => {
        if (!window.confirm("Do you want to notify the Admin for assistance?")) return;

        try {
            const res = await chatApi.post("/messages", {
                propertyId,
                buyerId,
                agentId,
                sender: currentUserRole,
                message: "🚨 **ADMIN ASSISTANCE REQUESTED**"
            });

            setMessages(prev => [...prev, res.data]);
        } catch (err) {
            console.error("Failed to request admin help", err);
            alert("Failed to report issue");
        }
    };

    // ---------------- TIME FORMAT ----------------
    const formatTime = (time) => {
        if (!time) return "";
        const date = new Date(time);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // ---------------- UI ----------------
    return (
        <div className="chat-container">
            {/* ================= HEADER ================= */}
            <div className="chat-header">
                <button className="back-btn" onClick={() => window.history.back()} title="Back">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <img
                    src={property?.photos ? (property.photos.split(',')[0].startsWith('http') ? property.photos.split(',')[0] : `${IMAGE_URL}${property.photos.split(',')[0]}`) : delhiImg}
                    alt="property"
                    className="property-chat-img"
                />

                <div className="property-info">
                    <h4>{property?.title || "Property Inquiry"}</h4>
                    <p>
                        {property?.area || "--"} sq.ft ·
                        {property?.price ? ` ₹${(property.price / 100000).toFixed(2)} L` : " Price on Request"}
                    </p>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {property?.sold ? (
                        <span className="sold-header-badge">SOLD</span>
                    ) : (
                        <>
                            {/* ================= APPOINTMENT PANEL ================= */}
                            {propertyId && buyerId && agentId && (
                                <AppointmentActionPanel
                                    propertyId={propertyId}
                                    buyerId={buyerId}
                                    agentId={agentId}
                                    userRole={currentUserRole}
                                    isHeader={true}
                                />
                            )}

                            <button
                                onClick={handleCallAdmin}
                                className="report-btn"
                                title="Report an issue to Admin"
                            >
                                ⚠️ Report
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ================= OTHER USER BAR ================= */}
            <div className="buyer-bar">
                <img src={otherUser?.profilePicture ? `${IMAGE_URL}${otherUser.profilePicture}` : profileImg} alt="user" />
                <div className="buyer-info">
                    <span>{otherUser?.name || (currentUserRole === "AGENT" ? "Verified Buyer" : "Property Consultant")}</span>
                    <div className="online">Active Now</div>
                </div>
            </div>

            {/* ================= CHAT BODY ================= */}
            <div className="chat-body">
                {messages.length === 0 && (
                    <div className="no-messages">
                        <div className="icon">✨</div>
                        <p>Your conversation starts here. Ask about the property or schedule a visit!</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isAppointment = msg.message && msg.message.includes("Appointment Booked");
                    return (
                        <div
                            key={i}
                            className={`chat-row ${msg.sender === currentUserRole ? "me" : "other"} ${isAppointment ? "system-msg" : ""}`}
                        >
                            {msg.sender !== currentUserRole && !isAppointment && (
                                <img
                                    src={otherUser?.profilePicture ? `${IMAGE_URL}${otherUser.profilePicture}` : profileImg}
                                    className="avatar"
                                    alt="user"
                                />
                            )}

                            <div className={`chat-bubble ${msg.sender === currentUserRole ? "sent" : "received"} ${isAppointment ? "appointment" : ""}`}>
                                <div className="msg-text">{msg.message}</div>
                                <div className="msg-meta">
                                    <small className="time">{formatTime(msg.createdAt)}</small>
                                    {msg.sender === currentUserRole && (
                                        <span className="seen-status">
                                            {msg.seen ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} style={{ height: "1px" }} />
            </div>

            {/* ================= INPUT AREA ================= */}
            {property?.sold && currentUserRole !== "ADMIN" ? (
                <div className="chat-sold-container">
                    <div className="chat-sold-banner">
                        <div className="sold-icon">🏠</div>
                        <div className="sold-text">
                            <strong>This property has been sold</strong>
                            <span>Regular messaging is disabled.</span>
                        </div>
                    </div>

                    {currentUserRole === "BUYER" && (
                        <div className="buyer-post-sold-actions">
                            <div className="commission-notice">
                                <div className="notice-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    Legal Notice: Commission Due
                                </div>
                                <p>As per the agreement, you have to give <strong>1% interest</strong> to the agent for this deal.</p>
                                <div className="commission-amount">
                                    Payable: <span>{formatPrice(property.price * 0.01)}</span>
                                </div>
                            </div>

                            <div className="feedback-section">
                                <div className="feedback-input-wrapper">
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Add your feedback / review for the agent..."
                                        rows="2"
                                    />
                                    <button
                                        className="feedback-submit-btn"
                                        onClick={async () => {
                                            if (!text.trim()) return;
                                            // Send as a special feedback message
                                            const originalText = text;
                                            setText("Sending feedback...");
                                            try {
                                                await chatApi.post("/messages", {
                                                    propertyId,
                                                    buyerId,
                                                    agentId,
                                                    sender: "BUYER",
                                                    message: `⭐ FEEDBACK: ${originalText}`
                                                });
                                                fetchMessages();
                                                setText("");
                                                alert("Thank you for your feedback!");
                                            } catch (err) {
                                                setText(originalText);
                                                alert("Failed to send feedback.");
                                            }
                                        }}
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="chat-input-wrapper">
                    <div className="chat-input-container">
                        <button className="icon-btn" title="Attach file">📎</button>
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Write a message..."
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
