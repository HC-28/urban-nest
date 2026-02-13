import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi, propertyApi } from "../api";
import "../styles/AgentChats.css";

import fallbackImg from "../assets/delhi.jpg";

export default function AgentChats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const agentId = user?.id;

  useEffect(() => {
    if (!agentId) return;

    chatApi.get(`/agent/${agentId}`).then(res => {
      setChats(res.data);
    });
  }, [agentId]);

  // fetch property details once
  useEffect(() => {
    const uniquePropertyIds = [...new Set(chats.map(c => c.propertyId))];

    uniquePropertyIds.forEach(pid => {
      if (!propertyMap[pid]) {
        propertyApi.get(`/${pid}`).then(res => {
          setPropertyMap(prev => ({
            ...prev,
            [pid]: res.data
          }));
        });
      }
    });
  }, [chats]);

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

  return (
    <div className="chat-inbox">
      <h2>💬 Buyer Chats</h2>

      {Object.keys(grouped).map(pid => {
        const lastMsg = grouped[pid].slice(-1)[0];
        const property = propertyMap[pid];

        return (
          <div
            key={pid}
            className="chat-card"
            onClick={() =>
              navigate(`/agent/chat/${pid}/${lastMsg.buyerId}`)
            }
          >
            <img
              src={getPropertyImage(property?.photos)}
              alt="property"
              className="property-thumb"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImg;
              }}
            />

            <div className="chat-info">
              <h4>{property?.title || `Property #${pid}`}</h4>
              <p className="meta">
                {property?.area || "--"} sq.ft · ₹
                {property?.price?.toLocaleString() || "--"}
              </p>
              <p className="last-msg">{lastMsg.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
