package com.realestate.backend.controller;

import com.realestate.backend.entity.AgentSlot;
import com.realestate.backend.repository.AgentSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Manages agent availability slots.
 * Agents create slots when they are free to show a property.
 * Buyers choose from these slots when booking appointments.
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/slots")
public class AgentSlotController {

    @Autowired
    private AgentSlotRepository agentSlotRepository;

    /**
     * Agent creates a new availability slot for a property.
     * Body: { agentId, propertyId, slotDate (YYYY-MM-DD), slotTime (HH:mm),
     * durationMinutes? }
     */
    @PostMapping
    public ResponseEntity<?> createSlot(@RequestBody Map<String, Object> body) {
        try {
            AgentSlot slot = new AgentSlot();
            slot.setAgentId(Long.parseLong(body.get("agentId").toString()));
            slot.setPropertyId(Long.parseLong(body.get("propertyId").toString()));
            slot.setSlotDate(LocalDate.parse(body.get("slotDate").toString()));
            slot.setSlotTime(java.time.LocalTime.parse(body.get("slotTime").toString()));
            if (body.containsKey("durationMinutes")) {
                slot.setDurationMinutes(Integer.parseInt(body.get("durationMinutes").toString()));
            }
            AgentSlot saved = agentSlotRepository.save(slot);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating slot: " + ex.getMessage());
        }
    }

    /**
     * Get all available (unbooked) slots for a property, from today onwards.
     * Used by buyers to pick a slot.
     */
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getAvailableSlotsForProperty(@PathVariable Long propertyId) {
        try {
            List<AgentSlot> slots = agentSlotRepository
                    .findByPropertyIdAndIsBookedFalseAndSlotDateGreaterThanEqual(propertyId, LocalDate.now());
            return ResponseEntity.ok(slots);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching slots: " + ex.getMessage());
        }
    }

    /**
     * Get all slots (booked + available) for an agent.
     * Used by agent to manage their own availability.
     */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAgentSlots(@PathVariable Long agentId) {
        try {
            List<AgentSlot> slots = agentSlotRepository.findByAgentId(agentId);
            return ResponseEntity.ok(slots);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching slots: " + ex.getMessage());
        }
    }

    /**
     * Agent deletes a slot (only if it hasn't been booked yet).
     */
    @DeleteMapping("/{slotId}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long slotId) {
        try {
            AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
            if (slot == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Slot not found");
            if (slot.isBooked())
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete a booked slot");
            agentSlotRepository.delete(slot);
            return ResponseEntity.ok("Slot deleted");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting slot: " + ex.getMessage());
        }
    }
}
