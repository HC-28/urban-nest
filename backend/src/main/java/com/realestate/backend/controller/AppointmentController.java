package com.realestate.backend.controller;

import com.realestate.backend.entity.AgentSlot;
import com.realestate.backend.entity.Appointment;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.ChatMessage;
import com.realestate.backend.repository.AgentSlotRepository;
import com.realestate.backend.repository.AppointmentRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.repository.ChatMessageRepository;
import com.realestate.backend.service.AnalyticsService;
import com.realestate.backend.service.EmailService;
import com.realestate.backend.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.AppointmentDTO;

/**
 * Appointment booking and confirmation workflow.
 * Admin appointment operations are in AdminController.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private AgentSlotRepository agentSlotRepository;
    @Autowired
    private PropertyRepository propertyRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AnalyticsService analyticsService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SecurityUtils securityUtils;

    private boolean isAdmin() {
        return securityUtils.hasRole("ADMIN");
    }

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** POST /api/appointments — Book an appointment */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> bookAppointment(@RequestBody Map<String, Object> request) {
        Object slotIdObj = request.get("slotId");
        Long buyerId = SecurityUtils.getAuthenticatedUserId();
        if (buyerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        Long slotId = (slotIdObj != null) ? Long.valueOf(slotIdObj.toString()) : null;

        // 1. Validate slot
        AgentSlot slot = null;
        if (slotId != null) {
            slot = agentSlotRepository.findById(slotId).orElse(null);
            if (slot == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Slot not found"));
            if (slot.isBooked())
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("This slot is already booked"));
        }

        // Get propertyId from request or slot
        Long propertyId = null;
        if (request.containsKey("propertyId") && request.get("propertyId") != null) {
            propertyId = Long.valueOf(request.get("propertyId").toString());
        } else if (slotId != null && slot != null) {
            propertyId = slot.getPropertyId();
        }
        // Get AgentId
        Long agentId = null;
        if (slotId != null && slot != null) {
            agentId = slot.getAgentId();
        } else if (propertyId != null) {
            Property p = propertyRepository.findById(propertyId).orElse(null);
            if (p != null)
                agentId = p.getAgentId();
        }

        if (agentId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Agent ID could not be determined."));
        }

        if (propertyId == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Property ID is required (slot is global but no propertyId provided)."));
        }

        // 2. Validate property
        Property property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Property not found"));
        if (property.getSold())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("This property is already SOLD"));

        // 3. Buyer time-conflict check (if slot provided)
        if (slotId != null && slot != null) { // Ensure slot is not null before accessing its methods
            List<Appointment> conflicts = appointmentRepository.findConflictingBuyerAppointments(
                    buyerId, slot.getSlotDate(), slot.getSlotTime());
            if (!conflicts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error(
                                "You already have an appointment at " + slot.getSlotTime() + " on "
                                        + slot.getSlotDate()
                                        +
                                        " for another property. Please choose a different time."));
            }
        }

        // 4. Duplicate appointment check
        List<Appointment> existing = appointmentRepository.findByBuyerIdAndPropertyId(buyerId,
                propertyId);
        boolean hasActive = existing.stream().anyMatch(a -> "confirmed".equals(a.getStatus())
                || "awaiting_buyer".equals(a.getStatus()) || "awaiting_agent".equals(a.getStatus()));
        if (hasActive) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(
                            "You already have an active appointment/confirmation cycle for this property."));
        }

        // 5. Get buyer info
        AppUser buyer = userRepository.findById(buyerId).orElse(null);
        if (buyer == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Buyer not found"));

        // 6. Create appointment
        Appointment appointment = new Appointment();
        appointment.setPropertyId(propertyId);
        appointment.setBuyerId(buyerId);
        appointment.setAgentId(agentId);
        appointment.setBuyerName(buyer.getName());
        appointment.setBuyerEmail(buyer.getEmail());
        appointment.setBuyerPhone(buyer.getPhone());

        if (slotId != null && slot != null) {
            appointment.setSlotId(slotId);
            appointment.setAppointmentDate(slot.getSlotDate());
            appointment.setAppointmentTime(slot.getSlotTime());
            appointment.setDurationMinutes(slot.getDurationMinutes());
            appointment.setStatus("confirmed");
            appointment.setConfirmationDeadline(slot.getSlotDate().atTime(23, 59).plusDays(5));
        } else {
            appointment.setStatus("pending");
        }

        if (request.containsKey("message")) {
            appointment.setMessage(request.get("message").toString());
        }

        Appointment saved = appointmentRepository.save(appointment);

        // 7. Lock the slot & tracking & notifications
        if (slotId != null && slot != null) {
            slot.setBooked(true);
            agentSlotRepository.save(slot);

            // 8. Track as inquiry
            analyticsService.trackInquiry(slot.getPropertyId());

            // 9. Send confirmation email
            emailService.sendAppointmentConfirmation(
                    buyer.getEmail(), buyer.getName(), property.getTitle(),
                    slot.getSlotDate().toString(), slot.getSlotTime().toString());
        }

        // 10. Automated Chat Message
        ChatMessage autoMsg = new ChatMessage();
        autoMsg.setPropertyId(propertyId);
        autoMsg.setAgentId(agentId);
        autoMsg.setBuyerId(buyerId);
        autoMsg.setSender("BUYER");
        autoMsg.setSeen(false);
        autoMsg.setMessage(slotId != null
                ? "🗓️ **Appointment Booked!** at " + (slot != null ? slot.getSlotTime() : "") + " on "
                        + (slot != null ? slot.getSlotDate() : "")
                : "🗓️ **I want to book an appointment**. Please assign a time slot.");
        chatMessageRepository.save(autoMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("message", slotId != null ? "Appointment booked successfully" : "Appointment request sent");
        result.put("appointmentId", saved.getId());
        result.put("status", saved.getStatus());
        result.put("confirmationDeadline", saved.getConfirmationDeadline() != null ? saved.getConfirmationDeadline().toString() : "N/A");
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * POST /api/appointments/{id}/assign-slot — Agent assigns a slot to a pending
     * request
     */
    @PostMapping("/{id}/assign-slot")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignSlot(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Object slotIdObj = request.get("slotId");
        if (slotIdObj == null)
            return ResponseEntity.badRequest().body(ApiResponse.error("slotId required"));

        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Appt not found"));

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!appt.getAgentId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("You are not the agent for this appointment"));
        }

        if (!"pending".equals(appt.getStatus()))
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only pending requests can be assigned/confirmed."));

        Long slotId = Long.valueOf(slotIdObj.toString());
        AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
        if (slot == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Slot not found"));
        if (slot.isBooked())
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Slot already taken"));

        // Update appt
        appt.setSlotId(slotId);
        appt.setAppointmentDate(slot.getSlotDate());
        appt.setAppointmentTime(slot.getSlotTime());
        appt.setDurationMinutes(slot.getDurationMinutes());
        appt.setStatus("confirmed");
        appt.setConfirmationDeadline(slot.getSlotDate().atTime(23, 59).plusDays(5));
        appointmentRepository.save(appt);

        // Lock slot
        slot.setBooked(true);
        agentSlotRepository.save(slot);

        // Notify
        Property p = propertyRepository.findById(appt.getPropertyId()).orElse(null);
        emailService.sendAppointmentConfirmation(
                appt.getBuyerEmail(), appt.getBuyerName(), (p != null ? p.getTitle() : "Property"),
                slot.getSlotDate().toString(), slot.getSlotTime().toString());

        // Chat Msg
        ChatMessage sysMsg = new ChatMessage();
        sysMsg.setPropertyId(appt.getPropertyId());
        sysMsg.setAgentId(appt.getAgentId());
        sysMsg.setBuyerId(appt.getBuyerId());
        sysMsg.setSender("AGENT");
        sysMsg.setMessage("🗓️ **Slot Assigned!** Your appointment is fixed at " + slot.getSlotTime() + " on "
                + slot.getSlotDate());
        chatMessageRepository.save(sysMsg);

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Slot assigned successfully", "status", "confirmed")));
    }

    /** POST /api/appointments/{id}/visit — Agent marks appointment as "Shown" */
    @PostMapping("/{id}/visit")
    public ResponseEntity<ApiResponse<Map<String, String>>> simulateVisit(@PathVariable Long id) {
        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Appointment not found"));

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!appt.getAgentId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (!"confirmed".equals(appt.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Appointment must be in confirmed status"));
        }

        appt.setStatus("awaiting_buyer");
        appt.setConfirmationDeadline(LocalDateTime.now().plusDays(5));
        appointmentRepository.save(appt);

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Property marked as shown. 5-day timer started for buyer.")));
    }

    /**
     * PUT /api/appointments/{id}/buyer-confirmation — Buyer confirms purchase
     * (YES/NO)
     */
    @PutMapping("/{id}/buyer-confirmation")
    public ResponseEntity<ApiResponse<Map<String, String>>> buyerConfirm(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String answer = body.getOrDefault("answer", "").toUpperCase();
        if (!answer.equals("YES") && !answer.equals("NO")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Answer must be YES or NO"));
        }

        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Appointment not found"));

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!appt.getBuyerId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (!"confirmed".equals(appt.getStatus()) && !"awaiting_buyer".equals(appt.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This appointment is not awaiting buyer confirmation"));
        }

        appt.setBuyerConfirmed(answer);

        if ("NO".equals(answer)) {
            appt.setStatus("expired");
            unlockSlot(appt.getSlotId());
            appointmentRepository.save(appt);
            return ResponseEntity
                    .ok(ApiResponse.success(Map.of("message", "Appointment marked as no purchase. Slot is now available again.")));
        }

        // Buyer said YES — notify agent
        appt.setStatus("awaiting_agent");
        appointmentRepository.save(appt);

        Property property = propertyRepository.findById(appt.getPropertyId()).orElse(null);
        AppUser agent = (appt.getAgentId() != null) ? userRepository.findById(appt.getAgentId()).orElse(null)
                : null;

        if (agent != null && property != null) {
            emailService.sendSaleConfirmationRequestToAgent(
                    agent.getEmail(), agent.getName(),
                    appt.getBuyerName(), appt.getBuyerEmail(),
                    property.getTitle(), appt.getId(), frontendUrl);
        }

        return ResponseEntity
                .ok(ApiResponse.success(Map.of("message", "Buyer confirmed interest. Agent has been notified to confirm the sale.")));
    }

    /**
     * PUT /api/appointments/{id}/agent-confirmation — Agent confirms sale (YES/NO)
     */
    @PutMapping("/{id}/agent-confirmation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> agentConfirm(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String answer = body.getOrDefault("answer", "").toUpperCase();
        if (!answer.equals("YES") && !answer.equals("NO")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Answer must be YES or NO"));
        }

        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Appointment not found"));

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!appt.getAgentId().equals(authId) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (!"awaiting_agent".equals(appt.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This appointment is not awaiting agent confirmation"));
        }

        appt.setAgentConfirmed(answer);

        if ("NO".equals(answer)) {
            appt.setStatus("expired");
            unlockSlot(appt.getSlotId());
            appointmentRepository.save(appt);
            return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Sale denied. Property remains listed.")));
        }

        // Agent said YES — finalize sale
        appt.setStatus("sold");
        appt.setSoldAt(LocalDateTime.now());
        appointmentRepository.save(appt);

        Property property = propertyRepository.findById(appt.getPropertyId()).orElse(null);
        if (property == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Property not found"));

        // Mark property as SOLD
        property.setSold(true);
        property.setSoldToUserId(appt.getBuyerId());
        property.setSoldAt(LocalDateTime.now());
        property.setActive(false);
        property.setFeatured(false); // Clear spotlight when sold through appointment
        propertyRepository.save(property);

        if (property.getCity() != null) {
            analyticsService.computeScoresForCity(property.getCity());
        }

        // Cancel other pending appointments
        List<String> activeStatuses = Arrays.asList("pending", "confirmed", "awaiting_buyer");
        List<Appointment> otherAppointments = appointmentRepository
                .findByPropertyIdAndStatusIn(appt.getPropertyId(), activeStatuses);

        List<String> inquirerEmails = new ArrayList<>();
        for (Appointment other : otherAppointments) {
            if (!other.getId().equals(appt.getId())) {
                other.setStatus("cancelled");
                appointmentRepository.save(other);
                if (other.getSlotId() != null) {
                    unlockSlot(other.getSlotId());
                }
                if (other.getBuyerEmail() != null) {
                    inquirerEmails.add(other.getBuyerEmail());
                }
            }
        }

        if (!inquirerEmails.isEmpty()) {
            emailService.sendSoldNotificationToInquirers(inquirerEmails, property.getTitle());
        }

        AppUser buyer = userRepository.findById(appt.getBuyerId()).orElse(null);
        if (buyer != null) {
            emailService.sendPurchaseConfirmationToBuyer(buyer.getEmail(), buyer.getName(), property.getTitle());
        }

        analyticsService.trackInquiry(appt.getPropertyId());
        broadcastSaleNotifications(property, appt.getBuyerId());

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "Sale confirmed! Property is now marked as SOLD.",
                "propertyId", property.getId(),
                "soldAt", appt.getSoldAt().toString())));
    }

    private void broadcastSaleNotifications(Property property, Long winnerId) {
        try {
            Set<Long> notifiedBuyerIds = new HashSet<>();
            List<String> notificationEmails = new ArrayList<>();

            List<ChatMessage> chats = chatMessageRepository.findByPropertyId(property.getId());
            for (ChatMessage chat : chats) {
                if (!chat.getBuyerId().equals(winnerId)) {
                    notifiedBuyerIds.add(chat.getBuyerId());
                }
            }

            List<Appointment> appts = appointmentRepository.findByPropertyId(property.getId());
            for (Appointment a : appts) {
                if (!a.getBuyerId().equals(winnerId)) {
                    notifiedBuyerIds.add(a.getBuyerId());
                }
            }

            for (Long buyerId : notifiedBuyerIds) {
                ChatMessage systemMsg = new ChatMessage();
                systemMsg.setPropertyId(property.getId());
                systemMsg.setAgentId(property.getAgentId());
                systemMsg.setBuyerId(buyerId);
                systemMsg.setSender("SYSTEM");
                systemMsg.setMessage("🚨 UPDATE: The property \"" + property.getTitle()
                        + "\" has been officially SOLD to a verified buyer. It is no longer available.");
                chatMessageRepository.save(systemMsg);

                userRepository.findById(buyerId).ifPresent(u -> {
                    if (u.getEmail() != null) {
                        notificationEmails.add(u.getEmail());
                    }
                });
            }

            if (!notificationEmails.isEmpty()) {
                emailService.sendSoldNotificationToInquirers(notificationEmails, property.getTitle());
            }

        } catch (Exception e) {
            // Non-critical — don't fail the main request
        }
    }

    /** GET /api/appointments/buyer/{buyerId} — Buyer's appointments */
    @GetMapping("/buyer/me")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getMyBuyerAppointments() {
        Long buyerId = SecurityUtils.getAuthenticatedUserId();
        if (buyerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        List<Appointment> appts = appointmentRepository.findByBuyerId(buyerId);
        List<AppointmentDTO> result = new ArrayList<>();
        for (Appointment a : appts) {
            AppointmentDTO dto = AppointmentDTO.from(a);

            // Fetch property title & agent name safely
            propertyRepository.findById(a.getPropertyId()).ifPresent(p -> {
                dto.setPropertyTitle(p.getTitle());
                dto.setAgentName(p.getAgent() != null ? p.getAgent().getName() : null);
            });
            result.add(dto);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** GET /api/appointments/agent/me — Agent's appointments */
    @GetMapping("/agent/me")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getMyAgentAppointments() {
        Long agentId = SecurityUtils.getAuthenticatedUserId();
        if (agentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        List<Appointment> appts = appointmentRepository.findByAgentId(agentId);
        List<AppointmentDTO> result = new ArrayList<>();
        for (Appointment a : appts) {
            AppointmentDTO dto = AppointmentDTO.from(a);

            // Fetch property title & agent name safely
            propertyRepository.findById(a.getPropertyId()).ifPresent(p -> {
                dto.setPropertyTitle(p.getTitle());
                dto.setAgentName(p.getAgent() != null ? p.getAgent().getName() : null);
            });
            result.add(dto);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** DELETE /api/appointments/{appointmentId} — Cancel appointment */
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> cancelAppointment(@PathVariable Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Appointment not found"));

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (!appt.getBuyerId().equals(authId) && !appt.getAgentId().equals(authId) && !isAdmin()) {
             return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }
        
        appt.setStatus("cancelled");
        appointmentRepository.save(appt);
        unlockSlot(appt.getSlotId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Appointment cancelled")));
    }

    /** Helper: Unlock a slot when appointment is cancelled/expired */
    private void unlockSlot(Long slotId) {
        if (slotId == null)
            return;
        agentSlotRepository.findById(slotId).ifPresent(s -> {
            s.setBooked(false);
            agentSlotRepository.save(s);
        });
    }
}
