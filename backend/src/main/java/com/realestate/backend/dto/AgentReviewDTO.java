package com.realestate.backend.dto;

import com.realestate.backend.entity.AgentReview;
import java.time.LocalDateTime;

public class AgentReviewDTO {
    private Long id;
    private Long agentId;
    private Long buyerId;
    private String buyerName;
    private Long propertyId;
    private String propertyTitle;
    private int rating;
    private String reviewText;
    private LocalDateTime createdAt;

    public AgentReviewDTO() {}

    public static AgentReviewDTO from(AgentReview review) {
        if (review == null) return null;
        AgentReviewDTO dto = new AgentReviewDTO();
        dto.id = review.getId();
        dto.agentId = review.getAgent() != null ? review.getAgent().getId() : null;
        dto.buyerId = review.getBuyer() != null ? review.getBuyer().getId() : null;
        dto.buyerName = review.getBuyer() != null ? review.getBuyer().getName() : "Unknown";
        dto.propertyId = review.getProperty() != null ? review.getProperty().getId() : null;
        dto.propertyTitle = review.getProperty() != null ? review.getProperty().getTitle() : "Property";
        dto.rating = review.getRating();
        dto.reviewText = review.getReviewText();
        dto.createdAt = review.getCreatedAt();
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
