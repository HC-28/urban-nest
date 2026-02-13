import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { chatApi, propertyApi, userApi } from "../api";
import "../styles/PropertyChat.css";

// Local fallback images
import profileImg from "../assets/profile.png";
import delhiImg from "../assets/delhi.jpg";

export default function PropertyChat() {
  const { propertyId, buyerId } = useParams();

  const user = JSON.parse(localStorage.getItem("user"));
  const agentId = user?.id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [property, setProperty] = useState(null);
  const [buyer, setBuyer] = useState(null);

  // ✅ added (does not remove anything)
  const [online] = useState(true);

  // ✅ auto-scroll ref
  const bottomRef = useRef(null);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    if (!agentId) return;

    // Fetch property
    propertyApi
      .get(`/${propertyId}`)
      .then(res => setProperty(res.data))
      .catch(err => console.error("Property error:", err));

    // Fetch buyer profile
    userApi
      .get(`/${buyerId}`)
      .then(res => setBuyer(res.data))
      .catch(err => console.error("Buyer error:", err));

    // Fetch conversation
    chatApi
      .get("/conversation", {
        params: { propertyId, buyerId, agentId }
      })
      .then(res => setMessages(res.data))
      .catch(err => console.error("Chat error:", err));
  }, [propertyId, buyerId, agentId]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await chatApi.post("/send", {
        propertyId,
        buyerId,
        agentId,
        sender: "AGENT",
        message: text
      });

      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Send message failed:", err);
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

  // ---------------- UI ----------------
  return (
    <div className="chat-container">
      {/* ================= HEADER ================= */}
      <div className="chat-header">
        <img
          src={getFirstPhoto(property?.photos)}
          alt="property"
          className="property-chat-img"
        />

        <div className="property-info">
          <h4>{property?.title || "Property"}</h4>
          <p>
            {property?.area || "--"} sq.ft · ₹
            {property?.price?.toLocaleString() || "--"}
          </p>
        </div>
      </div>

      {/* ================= BUYER BAR ================= */}
      <div className="buyer-bar">
        <img src={buyer?.profileImage || profileImg} alt="buyer" />
        <div className="buyer-info">
          <span>{buyer?.name || "Buyer"}</span>
          <small className={online ? "online" : "offline"}>
            {online ? "Online" : "Offline"}
          </small>
        </div>
      </div>

      {/* ================= CHAT BODY ================= */}
      <div className="chat-body">
        {messages.length === 0 && (
          <p className="no-messages">No messages yet</p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-row ${
              msg.sender === "AGENT" ? "agent" : "buyer"
            }`}
          >
            {msg.sender === "BUYER" && (
              <img
                src={buyer?.profileImage || profileImg}
                className="avatar"
                alt="buyer"
              />
            )}

            <div className={`chat-bubble ${msg.sender.toLowerCase()}`}>
              <span>{msg.message}</span>
              <small className="time">{formatTime(msg.createdAt)}</small>
            </div>
          </div>
        ))}

        {/* ✅ REQUIRED FOR AUTO SCROLL (ADDED, NOTHING REMOVED) */}
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
  );
}
