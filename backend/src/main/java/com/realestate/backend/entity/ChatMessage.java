package com.realestate.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private AppUser buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id", nullable = false)
    private AppUser agent;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "seen", nullable = false)
    private Boolean seen = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.seen == null)
            this.seen = false;
    }

    // ✅ GETTERS & SETTERS

    public Long getId() {
        return id;
    }

    public Boolean getSeen() {
        return seen;
    }

    public void setSeen(Boolean seen) {
        this.seen = seen;
    }

    public Property getProperty() {
        return property;
    }

    public void setProperty(Property property) {
        this.property = property;
    }

    public AppUser getBuyer() {
        return buyer;
    }

    public void setBuyer(AppUser buyer) {
        this.buyer = buyer;
    }

    public AppUser getAgent() {
        return agent;
    }

    public void setAgent(AppUser agent) {
        this.agent = agent;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // ── Convenience ID accessors used by controllers ──────────────────────────

    public Long getBuyerId() {
        return buyer != null ? buyer.getId() : null;
    }

    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    public Long getPropertyId() {
        return property != null ? property.getId() : null;
    }

    /** Used by controllers that build chat messages with plain IDs (not full objects).
     *  These set transient-style ID fields for serialisation only.
     *  Actual FK is still the @ManyToOne field above.
     */
    public void setBuyerId(Long buyerId) {
        if (this.buyer == null) {
            AppUser u = new AppUser();
            u.setId(buyerId);
            this.buyer = u;
        }
    }

    public void setAgentId(Long agentId) {
        if (this.agent == null) {
            AppUser u = new AppUser();
            u.setId(agentId);
            this.agent = u;
        }
    }

    public void setPropertyId(Long propertyId) {
        if (this.property == null) {
            Property p = new Property();
            p.setId(propertyId);
            this.property = p;
        }
    }
}
