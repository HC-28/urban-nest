package com.realestate.backend.dto;

import com.realestate.backend.entity.Appointment;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class AppointmentDTO {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long buyerId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    private Long agentId;
    private String agentName;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String status;
    private String message;
    private Long slotId;
    private LocalDateTime confirmationDeadline;
    private String buyerConfirmed;
    private String agentConfirmed;
    private LocalDateTime createdDate;

    public AppointmentDTO() {}

    public static AppointmentDTO from(Appointment appt) {
        if (appt == null) return null;
        AppointmentDTO dto = new AppointmentDTO();
        dto.id = appt.getId();
        dto.propertyId = appt.getPropertyId();
        dto.buyerId = appt.getBuyerId();
        dto.buyerName = appt.getBuyerName();
        dto.buyerEmail = appt.getBuyerEmail();
        dto.buyerPhone = appt.getBuyerPhone();
        dto.agentId = appt.getAgentId();
        dto.appointmentDate = appt.getAppointmentDate();
        dto.appointmentTime = appt.getAppointmentTime();
        dto.status = appt.getStatus();
        dto.message = appt.getMessage();
        dto.slotId = appt.getSlotId();
        dto.confirmationDeadline = appt.getConfirmationDeadline();
        dto.buyerConfirmed = appt.getBuyerConfirmed();
        dto.agentConfirmed = appt.getAgentConfirmed();
        dto.createdDate = appt.getCreatedAt();
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }
    public String getBuyerPhone() { return buyerPhone; }
    public void setBuyerPhone(String buyerPhone) { this.buyerPhone = buyerPhone; }
    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public LocalDateTime getConfirmationDeadline() { return confirmationDeadline; }
    public void setConfirmationDeadline(LocalDateTime confirmationDeadline) { this.confirmationDeadline = confirmationDeadline; }
    public String getBuyerConfirmed() { return buyerConfirmed; }
    public void setBuyerConfirmed(String buyerConfirmed) { this.buyerConfirmed = buyerConfirmed; }
    public String getAgentConfirmed() { return agentConfirmed; }
    public void setAgentConfirmed(String agentConfirmed) { this.agentConfirmed = agentConfirmed; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
