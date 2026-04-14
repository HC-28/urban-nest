package com.realestate.backend.dto;

import com.realestate.backend.entity.AgentSlot;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Data Transfer Object for Agent Availability Slots.
 * Prevents circular dependencies with Property and AppUser entities.
 */
public class AgentSlotDTO {
    private Long id;
    private Long agentId;
    private Long propertyId;
    private String propertyTitle;
    private LocalDate slotDate;
    private LocalTime slotTime;
    private Integer durationMinutes;
    private boolean isBooked;

    public AgentSlotDTO() {}

    public static AgentSlotDTO from(AgentSlot slot) {
        if (slot == null) return null;
        AgentSlotDTO dto = new AgentSlotDTO();
        dto.id = slot.getId();
        dto.agentId = slot.getAgentId();
        dto.propertyId = slot.getPropertyId();
        dto.slotDate = slot.getSlotDate();
        dto.slotTime = slot.getSlotTime();
        dto.durationMinutes = slot.getDurationMinutes();
        dto.isBooked = slot.isBooked();
        
        if (slot.getProperty() != null) {
            dto.propertyTitle = slot.getProperty().getTitle();
        }
        
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }
    public LocalDate getSlotDate() { return slotDate; }
    public void setSlotDate(LocalDate slotDate) { this.slotDate = slotDate; }
    public LocalTime getSlotTime() { return slotTime; }
    public void setSlotTime(LocalTime slotTime) { this.slotTime = slotTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public boolean isBooked() { return isBooked; }
    public void setBooked(boolean booked) { isBooked = booked; }
}
