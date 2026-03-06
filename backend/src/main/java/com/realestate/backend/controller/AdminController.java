package com.realestate.backend.controller;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.DeletedUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.AppointmentRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.repository.DeletedUserRepository;
import com.realestate.backend.service.EmailService;
import com.realestate.backend.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Consolidated admin endpoints for users, properties, and appointments.
 * All routes under /api/admin.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private DeletedUserRepository deletedUserRepository;

    // ============================================================
    // USER MANAGEMENT
    // ============================================================

    /** GET /api/admin/users — Get all users */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userRepository.findAll());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * PATCH /api/admin/users/{id}
     * Standard REST endpoint to update user properties (verification, role,
     * deletion status)
     */
    @PatchMapping("/users/{id}")
    public ResponseEntity<?> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        if (id == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID is required"));
        }
        try {
            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            if (payload.containsKey("verified")) {
                boolean newVerified = Boolean.parseBoolean(payload.get("verified").toString());
                boolean wasVerified = user.isVerified();
                user.setVerified(newVerified);

                if (newVerified && !wasVerified && "AGENT".equalsIgnoreCase(user.getRole())) {
                    emailService.sendAgentApprovalEmail(user.getEmail(), user.getName());
                }
            }

            if (payload.containsKey("deletionRequested")) {
                user.setDeletionRequested(Boolean.parseBoolean(payload.get("deletionRequested").toString()));
            }

            if (payload.containsKey("role")) {
                String newRole = payload.get("role").toString();
                if (!newRole.equals("BUYER") && !newRole.equals("AGENT") && !newRole.equals("ADMIN")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
                }
                user.setRole(newRole);
            }

            userRepository.save(user);
            return ResponseEntity.ok(user);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    /**
     * DELETE /api/admin/users/{id}
     * Archive user to deleted_users table, then hard-delete from users.
     * Accepts optional query params: reason, adminId
     */
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ADMIN_ACTION") String reason,
            @RequestParam(required = false) Long adminId) {
        try {
            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            // Archive to deleted_users
            DeletedUser archive = new DeletedUser();
            archive.setOriginalUserId(user.getId());
            archive.setName(user.getName());
            archive.setEmail(user.getEmail());
            archive.setRole(user.getRole());
            archive.setPhone(user.getPhone());
            archive.setCity(user.getCity());
            archive.setAgencyName(user.getAgencyName());
            archive.setDeletedAt(LocalDateTime.now());
            archive.setDeletionReason(reason);
            archive.setDeletedBy(adminId);
            deletedUserRepository.save(archive);

            // Hard-delete from users (frees up the email for re-registration)
            userRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("message", "User archived and deleted successfully"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/admin/users/deleted — Get all archived (deleted) users */
    @GetMapping("/users/deleted")
    public ResponseEntity<?> getDeletedUsers() {
        try {
            return ResponseEntity.ok(deletedUserRepository.findAllByOrderByDeletedAtDesc());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    // ============================================================
    // PROPERTY MANAGEMENT
    // ============================================================

    /** GET /api/admin/properties — Get ALL properties including inactive/deleted */
    @GetMapping("/properties")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllProperties() {
        try {
            return ResponseEntity.ok(propertyRepository.findAll());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** PUT /api/admin/properties/{id} — Admin update any property */
    @PutMapping(value = "/properties/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Property updatedProperty) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));

            if (updatedProperty.getTitle() != null)
                property.setTitle(updatedProperty.getTitle());
            if (updatedProperty.getPrice() > 0)
                property.setPrice(updatedProperty.getPrice());
            if (updatedProperty.getLocation() != null)
                property.setLocation(updatedProperty.getLocation());
            if (updatedProperty.getArea() > 0)
                property.setArea(updatedProperty.getArea());
            if (updatedProperty.getBhk() > 0)
                property.setBhk(updatedProperty.getBhk());

            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** DELETE /api/admin/properties/{id} — Admin hard-delete a property */
    @DeleteMapping("/properties/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long id) {
        try {
            if (!propertyRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }
            propertyRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Property deleted successfully"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * PATCH /api/admin/properties/{id}
     * Admin update property fields (e.g. status)
     */
    @PatchMapping("/properties/{id}")
    public ResponseEntity<?> patchProperty(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }

            if (payload.containsKey("listingStatus")) {
                property.setActive(Boolean.parseBoolean(payload.get("listingStatus").toString()));
            }

            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    // ============================================================
    // APPOINTMENT MANAGEMENT
    // ============================================================

    /** GET /api/admin/appointments — Get all appointments */
    @GetMapping("/appointments")
    public ResponseEntity<?> getAllAppointments() {
        try {
            return ResponseEntity.ok(appointmentRepository.findAll());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    // ============================================================
    // CHAT MANAGEMENT
    // ============================================================

    /** GET /api/admin/chats — Get all system chat messages */
    @GetMapping("/chats")
    public ResponseEntity<?> getAllChats() {
        try {
            return ResponseEntity.ok(chatMessageRepository.findAll());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }
}
