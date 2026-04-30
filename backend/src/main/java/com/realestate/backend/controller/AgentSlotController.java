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
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.AgentSlotDTO;
import com.realestate.backend.util.SecurityUtils;

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

    @Autowired
    private SecurityUtils securityUtils;

    private boolean isAdmin() {
        return securityUtils.hasRole("ADMIN");
    }

    /** POST /api/slots — Agent creates a new availability slot */
    @PostMapping
    public ResponseEntity<ApiResponse<AgentSlotDTO>> createSlot(@RequestBody Map<String, Object> body) {
        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (authId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        AgentSlot slot = new AgentSlot();
        slot.setAgentId(authId);
        
        Object propertyIdObj = body.get("propertyId");
        if (propertyIdObj != null && !propertyIdObj.toString().isEmpty() && !propertyIdObj.toString().equals("-1")) {
            Long propertyId = Long.parseLong(propertyIdObj.toString());
            // Verify property ownership
            Property p = propertyRepository.findById(propertyId).orElse(null);
            if (p != null && !p.getAgentId().equals(authId) && !isAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("You are not the agent of this property"));
            }
            slot.setPropertyId(propertyId);
        } else {
            slot.setPropertyId(null); // Global slot
        }
        
        slot.setSlotDate(LocalDate.parse(body.get("slotDate").toString()));
        slot.setSlotTime(java.time.LocalTime.parse(body.get("slotTime").toString()));
        if (body.containsKey("durationMinutes")) {
            slot.setDurationMinutes(Integer.parseInt(body.get("durationMinutes").toString()));
        }
        AgentSlot saved = agentSlotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.success(AgentSlotDTO.from(saved)));
    }

    /** GET /api/slots/property/{propertyId} — Available slots for a property */
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<ApiResponse<List<AgentSlotDTO>>> getAvailableSlotsForProperty(@PathVariable Long propertyId) {
        Property property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Property not found"));
        }
        List<AgentSlot> slots = agentSlotRepository.findAvailableSlots(propertyId, property.getAgentId(),
                LocalDate.now());
        List<AgentSlotDTO> dtos = slots.stream().map(AgentSlotDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/slots/agent/{agentId} — All slots for an agent */
    @GetMapping("/agent/me")
    public ResponseEntity<ApiResponse<List<AgentSlotDTO>>> getMySlots() {
        Long agentId = SecurityUtils.getAuthenticatedUserId();
        if (agentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        List<AgentSlot> slots = agentSlotRepository.findByAgentId(agentId);
        List<AgentSlotDTO> dtos = slots.stream().map(AgentSlotDTO::from).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** DELETE /api/slots/{slotId} — Delete unbooked slot */
    @DeleteMapping("/{slotId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteSlot(@PathVariable Long slotId) {
        AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
        if (slot == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Slot not found"));
        
        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!slot.getAgentId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (slot.isBooked())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Cannot delete a booked slot"));
        agentSlotRepository.delete(slot);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Slot deleted")));
    }

    /** PUT /api/slots/{slotId} — Update unbooked slot */
    @PutMapping("/{slotId}")
    public ResponseEntity<ApiResponse<AgentSlotDTO>> updateSlot(@PathVariable Long slotId, @RequestBody Map<String, Object> body) {
        AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
        if (slot == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Slot not found"));
        
        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!slot.getAgentId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (slot.isBooked())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Cannot edit a booked slot"));

        if (body.containsKey("slotDate")) {
            slot.setSlotDate(LocalDate.parse(body.get("slotDate").toString()));
        }
        if (body.containsKey("slotTime")) {
            slot.setSlotTime(java.time.LocalTime.parse(body.get("slotTime").toString()));
        }
        if (body.containsKey("durationMinutes")) {
            slot.setDurationMinutes(Integer.parseInt(body.get("durationMinutes").toString()));
        }
        if (body.containsKey("propertyId")) {
            Object propertyIdObj = body.get("propertyId");
            if (propertyIdObj != null && !propertyIdObj.toString().isEmpty() && !propertyIdObj.toString().equals("-1")) {
                Long propertyId = Long.parseLong(propertyIdObj.toString());
                // Verify property ownership
                Property p = propertyRepository.findById(propertyId).orElse(null);
                if (p != null && !p.getAgentId().equals(authId) && !isAdmin()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("You are not the agent of this property"));
                }
                slot.setPropertyId(propertyId);
            } else {
                slot.setPropertyId(null);
            }
        }

        AgentSlot updated = agentSlotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.success(AgentSlotDTO.from(updated)));
    }
}
