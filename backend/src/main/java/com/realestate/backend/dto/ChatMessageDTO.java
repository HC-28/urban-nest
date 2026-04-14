package com.realestate.backend.dto;

import com.realestate.backend.entity.ChatMessage;
import java.time.LocalDateTime;

public class ChatMessageDTO {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long agentId;
    private Long buyerId;
    private String sender;
    private String message;
    private boolean seen;
    private LocalDateTime createdAt;

    public ChatMessageDTO() {}

    public static ChatMessageDTO from(ChatMessage msg) {
        if (msg == null) return null;
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.id = msg.getId();
        dto.propertyId = msg.getPropertyId();
        dto.agentId = msg.getAgentId();
        dto.buyerId = msg.getBuyerId();
        dto.sender = msg.getSender();
        dto.message = msg.getMessage();
        dto.seen = msg.getSeen();
        dto.createdAt = msg.getCreatedAt();
        // Titles are usually fetched separately or added via a Join in more complex scenarios,
        // but for now, we leave it for the controller to populate if needed or just return raw fields.
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }
    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isSeen() { return seen; }
    public void setSeen(boolean seen) { this.seen = seen; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
