package com.realestate.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * An agent's availability slot for showing a specific property.
 * Buyers can only book appointments from these agent-defined slots.
 */
@Entity
@Table(name = "agent_slots")
public class AgentSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private AppUser agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = true)
    private Property property;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "slot_time", nullable = false)
    private LocalTime slotTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    // false = available, true = booked
    @Column(name = "is_booked", nullable = false)
    private boolean isBooked = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AppUser getAgent() {
        return agent;
    }

    public void setAgent(AppUser agent) {
        this.agent = agent;
    }

    public Property getProperty() {
        return property;
    }

    public void setProperty(Property property) {
        this.property = property;
    }

    public LocalDate getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(LocalDate slotDate) {
        this.slotDate = slotDate;
    }

    public LocalTime getSlotTime() {
        return slotTime;
    }

    public void setSlotTime(LocalTime slotTime) {
        this.slotTime = slotTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public boolean isBooked() {
        return isBooked;
    }

    public void setBooked(boolean booked) {
        isBooked = booked;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    /** Convenience: returns property ID (null for global/agent-level slots) */
    public Long getPropertyId() {
        return property != null ? property.getId() : null;
    }

    public void setPropertyId(Long propertyId) {
        if (propertyId == null) {
            this.property = null;
        } else {
            if (this.property == null) {
                this.property = new Property();
            }
            this.property.setId(propertyId);
        }
    }

    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    public void setAgentId(Long agentId) {
        if (this.agent == null) {
            this.agent = new AppUser();
        }
        this.agent.setId(agentId);
    }
}
