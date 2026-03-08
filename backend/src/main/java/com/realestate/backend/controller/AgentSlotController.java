package com.realestate.backend.controller;

import com.realestate.backend.entity.AgentSlot;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.AgentSlotRepository;
import com.realestate.backend.repository.PropertyRepository;
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
@RequestMapping("/api/slots")
public class AgentSlotController {

    @Autowired
    private AgentSlotRepository agentSlotRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** POST /api/slots — Agent creates a new availability slot */
    @PostMapping
    public ResponseEntity<?> createSlot(@RequestBody Map<String, Object> body) {
        try {
            AgentSlot slot = new AgentSlot();
            slot.setAgentId(Long.parseLong(body.get("agentId").toString()));
            Object propertyId = body.get("propertyId");
            if (propertyId != null && !propertyId.toString().isEmpty() && !propertyId.toString().equals("-1")) {
                slot.setPropertyId(Long.parseLong(propertyId.toString()));
            } else {
                slot.setPropertyId(null); // Global slot
            }
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
                    .body(Map.of("error", "Error creating slot: " + ex.getMessage()));
        }
    }

    /** GET /api/slots/property/{propertyId} — Available slots for a property */
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getAvailableSlotsForProperty(@PathVariable Long propertyId) {
        try {
            Property property = propertyRepository.findById(propertyId).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Property not found"));
            }
            List<AgentSlot> slots = agentSlotRepository.findAvailableSlots(propertyId, property.getAgentId(),
                    LocalDate.now());
            return ResponseEntity.ok(slots);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching slots: " + ex.getMessage()));
        }
    }

    /** GET /api/slots/agent/{agentId} — All slots for an agent */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAgentSlots(@PathVariable Long agentId) {
        try {
            List<AgentSlot> slots = agentSlotRepository.findByAgentId(agentId);
            return ResponseEntity.ok(slots);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching slots: " + ex.getMessage()));
        }
    }

    /** DELETE /api/slots/{slotId} — Delete unbooked slot */
    @DeleteMapping("/{slotId}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long slotId) {
        try {
            AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
            if (slot == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Slot not found"));
            if (slot.isBooked())
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Cannot delete a booked slot"));
            agentSlotRepository.delete(slot);
            return ResponseEntity.ok(Map.of("message", "Slot deleted"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting slot: " + ex.getMessage()));
        }
    }
}
