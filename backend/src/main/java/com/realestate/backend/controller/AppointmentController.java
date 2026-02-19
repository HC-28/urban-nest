package com.realestate.backend.controller;

import com.realestate.backend.entity.Appointment;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.AppointmentRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * BOOK AN APPOINTMENT
     * Creates a new appointment and tracks it as an inquiry
     */
    @PostMapping
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> request) {
        try {
            Long propertyId = Long.parseLong(request.get("propertyId").toString());
            Long buyerId = Long.parseLong(request.get("buyerId").toString());

            // Validate property exists
            Optional<Property> propertyOpt = propertyRepository.findById(propertyId);
            if (propertyOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Property not found");
            }

            Property property = propertyOpt.get();

            // Create appointment
            Appointment appointment = new Appointment();
            appointment.setPropertyId(propertyId);
            appointment.setBuyerId(buyerId);
            appointment.setAgentId(property.getAgentId());
            appointment.setAppointmentDate(LocalDate.parse(request.get("date").toString()));
            appointment.setAppointmentTime(java.time.LocalTime.parse(request.get("time").toString()));
            appointment.setBuyerName(request.get("buyerName").toString());
            appointment.setBuyerEmail(request.get("buyerEmail").toString());

            if (request.containsKey("buyerPhone")) {
                appointment.setBuyerPhone(request.get("buyerPhone").toString());
            }

            if (request.containsKey("message")) {
                appointment.setMessage(request.get("message").toString());
            }

            if (request.containsKey("durationMinutes")) {
                appointment.setDurationMinutes(Integer.parseInt(request.get("durationMinutes").toString()));
            }

            // Save appointment
            Appointment saved = appointmentRepository.save(appointment);

            // Track as inquiry for analytics
            analyticsService.trackInquiry(propertyId);

            return ResponseEntity.ok(Map.of(
                    "message", "Appointment booked successfully",
                    "appointmentId", saved.getId(),
                    "status", saved.getStatus()));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error booking appointment: " + ex.getMessage());
        }
    }

    /**
     * GET BUYER'S APPOINTMENTS
     */
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<?> getBuyerAppointments(@PathVariable Long buyerId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByBuyerId(buyerId);
            return ResponseEntity.ok(appointments);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching appointments: " + ex.getMessage());
        }
    }

    /**
     * GET AGENT'S APPOINTMENTS
     */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAgentAppointments(@PathVariable Long agentId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByAgentId(agentId);
            return ResponseEntity.ok(appointments);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching appointments: " + ex.getMessage());
        }
    }

    /**
     * GET PROPERTY'S APPOINTMENTS
     */
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getPropertyAppointments(@PathVariable Long propertyId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByPropertyId(propertyId);
            return ResponseEntity.ok(appointments);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching appointments: " + ex.getMessage());
        }
    }

    /**
     * UPDATE APPOINTMENT STATUS
     * Agent can confirm/cancel appointments
     */
    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestParam String status) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();
            appointment.setStatus(status);
            appointmentRepository.save(appointment);

            return ResponseEntity.ok(Map.of(
                    "message", "Appointment status updated",
                    "status", status));

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating appointment: " + ex.getMessage());
        }
    }

    /**
     * GET AVAILABLE TIME SLOTS
     * Returns available slots for a property on a specific date
     */
    @GetMapping("/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long propertyId,
            @RequestParam String date) {
        try {
            LocalDate appointmentDate = LocalDate.parse(date);

            // Get existing appointments for this property on this date
            List<Appointment> existingAppointments = appointmentRepository
                    .findByPropertyIdAndAppointmentDate(propertyId, appointmentDate);

            // Generate available slots (9 AM to 6 PM, 1-hour intervals)
            List<String> allSlots = Arrays.asList(
                    "09:00", "10:00", "11:00", "12:00",
                    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00");

            // Remove booked slots
            Set<String> bookedSlots = new HashSet<>();
            for (Appointment apt : existingAppointments) {
                bookedSlots.add(apt.getAppointmentTime().toString());
            }

            List<String> availableSlots = new ArrayList<>();
            for (String slot : allSlots) {
                if (!bookedSlots.contains(slot)) {
                    availableSlots.add(slot);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "date", date,
                    "availableSlots", availableSlots,
                    "bookedSlots", bookedSlots));

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching available slots: " + ex.getMessage());
        }
    }

    /**
     * DELETE APPOINTMENT
     */
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long appointmentId) {
        try {
            if (!appointmentRepository.existsById(appointmentId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Appointment not found");
            }

            appointmentRepository.deleteById(appointmentId);
            return ResponseEntity.ok("Appointment cancelled successfully");

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error cancelling appointment: " + ex.getMessage());
        }
    }
}
