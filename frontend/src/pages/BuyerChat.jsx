import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatApi, propertyApi, userApi } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/PropertyChat.css";

// Local fallback images
import profileImg from "../assets/profile.png";
import delhiImg from "../assets/delhi.jpg";

export default function BuyerChat() {
    const { propertyId, agentId } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const buyerId = user?.id;

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [property, setProperty] = useState(null);
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ auto-scroll ref
    const bottomRef = useRef(null);

    // ---------------- AUTO SCROLL ----------------
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ---------------- FETCH DATA ----------------
    useEffect(() => {
        if (!buyerId) {
            navigate("/login");
            return;
        }

        // Fetch property
        propertyApi
            .get(`/${propertyId}`)
            .then(res => {
                setProperty(res.data);
            })
            .catch(err => console.error("Property error:", err));

        // Fetch agent profile
        userApi
            .get(`/${agentId}`)
            .then(res => {
                setAgent(res.data);
            })
            .catch(err => console.error("Agent error:", err));

        // Fetch conversation
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
    }, [propertyId, buyerId, agentId, navigate]);

    // ---------------- SEND MESSAGE ----------------
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

    // ---------------- PROPERTY IMAGE HELPER ----------------
    const getFirstPhoto = (photos) => {
        if (photos) {
            if (Array.isArray(photos)) return photos[0];
            if (typeof photos === "string") return photos.split(",")[0];
        }
        return delhiImg;
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

    if (loading) {
        return (
            <div className="property-chat-page">
                <Navbar />
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading chat...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // ---------------- UI ----------------
    return (
        <div className="property-chat-page">
            <Navbar />

            <div className="chat-container">
                {/* ================= HEADER ================= */}
                <div className="chat-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>

                    <img
                        src={getFirstPhoto(property?.photos)}
                        alt="property"
                        className="property-chat-img"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = delhiImg;
                        }}
                    />

                    <div className="property-info">
                        <h4>{property?.title || "Property"}</h4>
                        <p>
                            {property?.area || "--"} sq.ft · ₹
                            {property?.price?.toLocaleString() || "--"}
                        </p>
                    </div>
                </div>

                {/* ================= AGENT BAR ================= */}
                <div className="buyer-bar">
                    <img
                        src={agent?.profileImage || profileImg}
                        alt="agent"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = profileImg;
                        }}
                    />
                    <div className="buyer-info">
                        <span>{agent?.name || "Agent"}</span>
                        <small className="online">Online</small>
                    </div>
                </div>

                {/* ================= CHAT BODY ================= */}
                <div className="chat-body">
                    {messages.length === 0 && (
                        <p className="no-messages">
                            Start a conversation with the agent about this property
                        </p>
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

                    {/* ✅ REQUIRED FOR AUTO SCROLL */}
                    <div ref={bottomRef} />
                </div>

                {/* ================= INPUT ================= */}
                <div className="chat-input">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
