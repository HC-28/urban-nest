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

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "buyer_name", nullable = false)
    private String buyerName;

    @Column(name = "buyer_email", nullable = false)
    private String buyerEmail;

    @Column(name = "buyer_phone")
    private String buyerPhone;

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

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
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

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public void setBuyerPhone(String buyerPhone) {
        this.buyerPhone = buyerPhone;
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
}
