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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

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

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** POST /api/appointments — Book an appointment */
    @PostMapping
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> request) {
        try {
            Object slotIdObj = request.get("slotId");
            Object buyerIdObj = request.get("buyerId");

            if (buyerIdObj == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required field: buyerId."));
            }

            Long buyerId = Long.valueOf(buyerIdObj.toString());
            Long slotId = (slotIdObj != null) ? Long.valueOf(slotIdObj.toString()) : null;

            // 1. Validate slot
            AgentSlot slot = null;
            if (slotId != null) {
                slot = agentSlotRepository.findById(slotId).orElse(null);
                if (slot == null)
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Slot not found"));
                if (slot.isBooked())
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "This slot is already booked"));
            }

            // Get propertyId from request or slot
            Long propertyId = null;
            if (request.containsKey("propertyId") && request.get("propertyId") != null) {
                propertyId = Long.valueOf(request.get("propertyId").toString());
            } else if (slotId != null) {
                propertyId = slot.getPropertyId();
            }

            // Get AgentId
            Long agentId = null;
            if (slotId != null) {
                agentId = slot.getAgentId();
            } else if (propertyId != null) {
                Property p = propertyRepository.findById(propertyId).orElse(null);
                if (p != null)
                    agentId = p.getAgentId();
            }

            if (agentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Agent ID could not be determined."));
            }

            if (propertyId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Property ID is required (slot is global but no propertyId provided)."));
            }

            // 2. Validate property
            Property property = propertyRepository.findById(propertyId).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            if (property.isSold())
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "This property has already been sold"));

            // 3. Buyer time-conflict check (if slot provided)
            if (slotId != null) {
                List<Appointment> conflicts = appointmentRepository.findConflictingBuyerAppointments(
                        buyerId, slot.getSlotDate(), slot.getSlotTime());
                if (!conflicts.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error",
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
                        .body(Map.of("error",
                                "You already have an active appointment/confirmation cycle for this property."));
            }

            // 5. Get buyer info
            AppUser buyer = userRepository.findById(buyerId).orElse(null);
            if (buyer == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Buyer not found"));

            // 6. Create appointment
            Appointment appointment = new Appointment();
            appointment.setPropertyId(propertyId);
            appointment.setBuyerId(buyerId);
            appointment.setAgentId(agentId);
            appointment.setBuyerName(buyer.getName());
            appointment.setBuyerEmail(buyer.getEmail());
            appointment.setBuyerPhone(buyer.getPhone());

            if (slotId != null) {
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
            if (slotId != null) {
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

            return ResponseEntity.ok(Map.of(
                    "message", slotId != null ? "Appointment booked successfully" : "Appointment request sent",
                    "appointmentId", saved.getId(),
                    "status", saved.getStatus(),
                    "confirmationDeadline",
                    saved.getConfirmationDeadline() != null ? saved.getConfirmationDeadline().toString() : "N/A"));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
    }

    /**
     * POST /api/appointments/{id}/assign-slot — Agent assigns a slot to a pending
     * request
     */
    @PostMapping("/{id}/assign-slot")
    public ResponseEntity<?> assignSlot(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Object slotIdObj = request.get("slotId");
            if (slotIdObj == null)
                return ResponseEntity.badRequest().body(Map.of("error", "slotId required"));

            Appointment appt = appointmentRepository.findById(id).orElse(null);
            if (appt == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Appt not found"));
            if (!"pending".equals(appt.getStatus()))
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only pending requests can be assigned/confirmed."));

            Long slotId = Long.valueOf(slotIdObj.toString());
            AgentSlot slot = agentSlotRepository.findById(slotId).orElse(null);
            if (slot == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
            if (slot.isBooked())
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Slot already taken"));

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

            return ResponseEntity.ok(Map.of("message", "Slot assigned successfully", "status", "confirmed"));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Error assigning slot: " + ex.getMessage()));
        }
    }

    /** POST /api/appointments/{id}/visit — Agent marks appointment as "Shown" */
    @PostMapping("/{id}/visit")
    public ResponseEntity<?> simulateVisit(@PathVariable Long id) {
        try {
            Appointment appt = appointmentRepository.findById(id).orElse(null);
            if (appt == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Appointment not found"));

            if (!"confirmed".equals(appt.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Appointment must be in confirmed status"));
            }

            appt.setStatus("awaiting_buyer");
            appt.setConfirmationDeadline(LocalDateTime.now().plusDays(5));
            appointmentRepository.save(appt);

            return ResponseEntity.ok(Map.of("message", "Property marked as shown. 5-day timer started for buyer."));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
    }

    /**
     * PUT /api/appointments/{id}/buyer-confirmation — Buyer confirms purchase
     * (YES/NO)
     */
    @PutMapping("/{id}/buyer-confirmation")
    public ResponseEntity<?> buyerConfirm(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String answer = body.getOrDefault("answer", "").toUpperCase();
            if (!answer.equals("YES") && !answer.equals("NO")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Answer must be YES or NO"));
            }

            Appointment appt = appointmentRepository.findById(id).orElse(null);
            if (appt == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Appointment not found"));
            if (!"confirmed".equals(appt.getStatus()) && !"awaiting_buyer".equals(appt.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "This appointment is not awaiting buyer confirmation"));
            }

            appt.setBuyerConfirmed(answer);

            if ("NO".equals(answer)) {
                appt.setStatus("expired");
                unlockSlot(appt.getSlotId());
                appointmentRepository.save(appt);
                return ResponseEntity
                        .ok(Map.of("message", "Appointment marked as no purchase. Slot is now available again."));
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
                    .ok(Map.of("message", "Buyer confirmed interest. Agent has been notified to confirm the sale."));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
    }

    /**
     * PUT /api/appointments/{id}/agent-confirmation — Agent confirms sale (YES/NO)
     */
    @PutMapping("/{id}/agent-confirmation")
    public ResponseEntity<?> agentConfirm(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String answer = body.getOrDefault("answer", "").toUpperCase();
            if (!answer.equals("YES") && !answer.equals("NO")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Answer must be YES or NO"));
            }

            Appointment appt = appointmentRepository.findById(id).orElse(null);
            if (appt == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Appointment not found"));
            if (!"awaiting_agent".equals(appt.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "This appointment is not awaiting agent confirmation"));
            }

            appt.setAgentConfirmed(answer);

            if ("NO".equals(answer)) {
                appt.setStatus("expired");
                unlockSlot(appt.getSlotId());
                appointmentRepository.save(appt);
                return ResponseEntity.ok(Map.of("message", "Sale denied. Property remains listed."));
            }

            // Agent said YES — finalize sale
            appt.setStatus("sold");
            appt.setSoldAt(LocalDateTime.now());
            appointmentRepository.save(appt);

            Property property = propertyRepository.findById(appt.getPropertyId()).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));

            // Mark property as SOLD
            property.setSold(true);
            property.setSoldToUserId(appt.getBuyerId());
            property.setSoldAt(LocalDateTime.now());
            property.setActive(false);
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

            return ResponseEntity.ok(Map.of(
                    "message", "Sale confirmed! Property is now marked as SOLD.",
                    "propertyId", property.getId(),
                    "soldAt", appt.getSoldAt().toString()));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
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
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<?> getBuyerAppointments(@PathVariable Long buyerId) {
        try {
            List<Appointment> appts = appointmentRepository.findByBuyerId(buyerId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Appointment a : appts) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("propertyId", a.getPropertyId());
                map.put("buyerId", a.getBuyerId());
                map.put("agentId", a.getAgentId());
                map.put("appointmentDate", a.getAppointmentDate());
                map.put("appointmentTime", a.getAppointmentTime());
                map.put("durationMinutes", a.getDurationMinutes());
                map.put("buyerName", a.getBuyerName());
                map.put("buyerEmail", a.getBuyerEmail());
                map.put("buyerPhone", a.getBuyerPhone());
                map.put("status", a.getStatus());
                map.put("message", a.getMessage());
                map.put("slotId", a.getSlotId());
                map.put("confirmationDeadline", a.getConfirmationDeadline());
                map.put("buyerConfirmed", a.getBuyerConfirmed());
                map.put("agentConfirmed", a.getAgentConfirmed());
                map.put("soldAt", a.getSoldAt());
                map.put("createdAt", a.getCreatedAt());
                map.put("updatedAt", a.getUpdatedAt());

                // Fetch property title & agent name
                propertyRepository.findById(a.getPropertyId()).ifPresent(p -> {
                    map.put("propertyTitle", p.getTitle());
                    map.put("agentName", p.getAgentName());
                    map.put("propertyImage", p.getPhotos());
                });
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
    }

    /** GET /api/appointments/agent/{agentId} — Agent's appointments */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAgentAppointments(@PathVariable Long agentId) {
        try {
            List<Appointment> appts = appointmentRepository.findByAgentId(agentId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Appointment a : appts) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("propertyId", a.getPropertyId());
                map.put("buyerId", a.getBuyerId());
                map.put("agentId", a.getAgentId());
                map.put("appointmentDate", a.getAppointmentDate());
                map.put("appointmentTime", a.getAppointmentTime());
                map.put("durationMinutes", a.getDurationMinutes());
                map.put("buyerName", a.getBuyerName());
                map.put("buyerEmail", a.getBuyerEmail());
                map.put("buyerPhone", a.getBuyerPhone());
                map.put("status", a.getStatus());
                map.put("message", a.getMessage());
                map.put("slotId", a.getSlotId());
                map.put("confirmationDeadline", a.getConfirmationDeadline());
                map.put("buyerConfirmed", a.getBuyerConfirmed());
                map.put("agentConfirmed", a.getAgentConfirmed());
                map.put("soldAt", a.getSoldAt());
                map.put("createdAt", a.getCreatedAt());
                map.put("updatedAt", a.getUpdatedAt());

                // Fetch property title & buyer name (already in appt) & image
                propertyRepository.findById(a.getPropertyId()).ifPresent(p -> {
                    map.put("propertyTitle", p.getTitle());
                    map.put("propertyImage", p.getPhotos());
                });
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
    }

    /** DELETE /api/appointments/{appointmentId} — Cancel appointment */
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId) {
        try {
            Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
            if (appt == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Appointment not found"));
            appt.setStatus("cancelled");
            appointmentRepository.save(appt);
            unlockSlot(appt.getSlotId());
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + ex.getMessage()));
        }
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
