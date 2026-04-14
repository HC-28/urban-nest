package com.realestate.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private AppUser buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private AppUser agent;

    @Column(name = "appointment_date", nullable = true)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = true)
    private LocalTime appointmentTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "status")
    private String status = "pending"; // pending, confirmed, cancelled, completed

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // --- Sale Confirmation Fields ---

    // The agent_slots.id that was booked
    @Column(name = "slot_id")
    private Long slotId;

    // 5 days after the appointment date — buyer must confirm by then
    @Column(name = "confirmation_deadline")
    private java.time.LocalDateTime confirmationDeadline;

    // null = not yet answered, YES = bought, NO = did not buy
    @Column(name = "buyer_confirmed", length = 10)
    private String buyerConfirmed;

    // null = not yet answered, YES = confirms sale, NO = denies
    @Column(name = "agent_confirmed", length = 10)
    private String agentConfirmed;

    // Set when both confirm YES
    @Column(name = "sold_at")
    private java.time.LocalDateTime soldAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Appointment() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }

    public java.time.LocalDateTime getConfirmationDeadline() {
        return confirmationDeadline;
    }

    public void setConfirmationDeadline(java.time.LocalDateTime confirmationDeadline) {
        this.confirmationDeadline = confirmationDeadline;
    }

    public String getBuyerConfirmed() {
        return buyerConfirmed;
    }

    public void setBuyerConfirmed(String buyerConfirmed) {
        this.buyerConfirmed = buyerConfirmed;
    }

    public String getAgentConfirmed() {
        return agentConfirmed;
    }

    public void setAgentConfirmed(String agentConfirmed) {
        this.agentConfirmed = agentConfirmed;
    }

    public java.time.LocalDateTime getSoldAt() {
        return soldAt;
    }

    public void setSoldAt(java.time.LocalDateTime soldAt) {
        this.soldAt = soldAt;
    }

    /** Convenience: returns buyer's email without null checks in controllers */
    public String getBuyerEmail() {
        return buyer != null ? buyer.getEmail() : null;
    }

    // ── Convenience ID accessors used by controllers ──────────────────────────

    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    public Long getBuyerId() {
        return buyer != null ? buyer.getId() : null;
    }

    public Long getPropertyId() {
        return property != null ? property.getId() : null;
    }

    public String getBuyerName() {
        return buyer != null ? buyer.getName() : null;
    }

    public String getBuyerPhone() {
        return buyer != null ? buyer.getPhone() : null;
    }

    public void setBuyerPhone(String buyerPhone) {
        if (this.buyer == null) {
            this.buyer = new AppUser();
        }
        this.buyer.setPhone(buyerPhone);
    }

    public void setBuyerName(String buyerName) {
        if (this.buyer == null) {
            this.buyer = new AppUser();
        }
        this.buyer.setName(buyerName);
    }

    public void setAgentId(Long agentId) {
        if (this.agent == null) {
            this.agent = new AppUser();
        }
        this.agent.setId(agentId);
    }

    public void setBuyerEmail(String buyerEmail) {
        if (this.buyer == null) {
            this.buyer = new AppUser();
        }
        this.buyer.setEmail(buyerEmail);
    }

    public void setBuyerId(Long buyerId) {
        if (this.buyer == null) {
            this.buyer = new AppUser();
        }
        this.buyer.setId(buyerId);
    }

    public void setPropertyId(Long propertyId) {
        if (this.property == null) {
            this.property = new Property();
        }
        this.property.setId(propertyId);
    }
}
