package com.realestate.backend.controller;

import com.realestate.backend.dto.AppointmentDTO;
import com.realestate.backend.dto.AgencyDTO;
import com.realestate.backend.dto.ChatMessageDTO;
import com.realestate.backend.dto.PropertyDetailDTO;
import com.realestate.backend.dto.PropertyListDTO;
import com.realestate.backend.dto.UserSummaryDTO;
import com.realestate.backend.dto.DeletedUserDTO;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.DeletedUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.AppointmentRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.repository.DeletedUserRepository;
import com.realestate.backend.repository.FavoriteRepository;
import com.realestate.backend.repository.PropertyViewRepository;
import com.realestate.backend.repository.AgentProfileRepository;
import com.realestate.backend.entity.AgentProfile;
import com.realestate.backend.service.EmailService;
import com.realestate.backend.repository.ChatMessageRepository;
import com.realestate.backend.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

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
    private AgentProfileRepository agentProfileRepository;

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

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private PropertyViewRepository propertyViewRepository;

    @Autowired
    private com.realestate.backend.repository.AgencyRepository agencyRepository;

    // ============================================================
    // ============================================================

    /** GET /api/admin/stats — Quick platform stats for admin profile */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAdminStats() {
        long totalProperties = propertyRepository.count();
        long totalUsers = userRepository.count();
        long propertiesSold = propertyRepository.countBySoldTrue();
        
        Map<String, Long> stats = Map.of(
                "totalProperties", totalProperties,
                "totalUsers", totalUsers,
                "propertiesSold", propertiesSold
        );
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ============================================================
    // USER MANAGEMENT
    // ============================================================

    /** GET /api/admin/users — Get all users (as UserSummaryDTO to avoid leaking passwords/tokens) */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<java.util.List<UserSummaryDTO>>> getAllUsers() {
        java.util.List<UserSummaryDTO> users = userRepository.findAll().stream()
                .map(UserSummaryDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * PATCH /api/admin/users/{id}
     * Standard REST endpoint to update user properties (verification, role,
     * deletion status)
     */
    @PatchMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserSummaryDTO>> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        if (id == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ID is required"));
        }
        AppUser user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

        if (payload.containsKey("verified")) {
            user.setVerified(Boolean.parseBoolean(payload.get("verified").toString()));
        }

        if (payload.containsKey("deletionRequested")) {
            user.setDeletionRequested(Boolean.parseBoolean(payload.get("deletionRequested").toString()));
        }

        if (payload.containsKey("role")) {
            String newRole = payload.get("role").toString();
            if (!newRole.equals("BUYER") && !newRole.equals("AGENT") && !newRole.equals("ADMIN")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid role"));
            }
            user.setRole(newRole);
        }

        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(UserSummaryDTO.from(user)));
    }

    /**
     * DELETE /api/admin/users/{id}
     * Soft-delete: archive user to deleted_users table, mark as deleted.
     * The original user record is preserved in the users table.
     * Accepts optional query params: reason, adminId
     */
    /**
     * DELETE /api/admin/users/{id}
     * Archive & Scramble:
     * 1. Copies data to deleted_users for records.
     * 2. Scrambles identifying info in AppUser to free up email/phone for
     * re-registration.
     * 3. Keeps the record alive so Foreign Keys (Properties, Appointments) remain
     * valid.
     */
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ADMIN_ACTION") String reason,
            @RequestParam(required = false) Long adminId) {
        AppUser user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

        // 1. Archive to deleted_users
        DeletedUser archive = new DeletedUser();
        archive.setOriginalUserId(user.getId());
        archive.setName(user.getName());
        archive.setEmail(user.getEmail());
        archive.setRole(user.getRole());
        archive.setPhone(user.getPhone());
        archive.setCity(user.getCity());

        // Fetch agency name from AgentProfile if available
        agentProfileRepository.findByUser(user)
                .ifPresent(profile -> {
                    if (profile.getAgency() != null) {
                        archive.setAgencyName(profile.getAgency().getName());
                    } else {
                        archive.setAgencyName("Independent");
                    }
                });

        archive.setDeletedAt(LocalDateTime.now());
        archive.setDeletionReason(reason);
        archive.setDeletedBy(adminId);
        deletedUserRepository.save(archive);

        // 2. Scramble identifying info
        String originalEmail = user.getEmail();
        user.setName("Archived User " + user.getId());
        user.setEmail("archived_" + user.getId() + "_" + originalEmail);
        user.setPhone("0000000000");
        user.setPassword("ARCHIVED_" + UUID.randomUUID().toString()); // Unmatchable password
        user.setDeletionRequested(true); // Acts as 'deactivated' flag

        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(
                Map.of("message", "User archived and scrambled successfully. Email freed for re-registration.")));
    }

    /** GET /api/admin/users/deleted — Get all archived (deleted) users */
    @GetMapping("/users/deleted")
    public ResponseEntity<ApiResponse<java.util.List<DeletedUserDTO>>> getDeletedUsers() {
        java.util.List<DeletedUserDTO> dtos = deletedUserRepository.findAllByOrderByDeletedAtDesc()
                .stream().map(DeletedUserDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ============================================================
    // PROPERTY MANAGEMENT
    // ============================================================

    /** GET /api/admin/properties — Get ALL properties including inactive/deleted */
    @GetMapping(value = {"/properties", "/properties/"})
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.List<PropertyListDTO>>> getAllProperties() {
        java.util.List<PropertyListDTO> properties = propertyRepository.findAll().stream()
                .map(PropertyListDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    /** PUT /api/admin/properties/{id} — Admin update any property */
    @PutMapping(value = "/properties/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> updateProperty(@PathVariable Long id, @RequestBody Property updatedProperty) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Property not found"));

        if (updatedProperty.getTitle() != null)
            property.setTitle(updatedProperty.getTitle());
        if (updatedProperty.getPrice() != null && updatedProperty.getPrice() > 0)
            property.setPrice(updatedProperty.getPrice());
        if (updatedProperty.getLocation() != null)
            property.setLocation(updatedProperty.getLocation());
        if (updatedProperty.getArea() != null && updatedProperty.getArea() > 0)
            property.setArea(updatedProperty.getArea());
        if (updatedProperty.getBhk() != null && updatedProperty.getBhk() > 0)
            property.setBhk(updatedProperty.getBhk());

        propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(property)));
    }

    /** DELETE /api/admin/properties/{id} — Soft-delete a property (sets isActive=false) */
    @DeleteMapping("/properties/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteProperty(@PathVariable Long id) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Property not found"));
        }
        // Soft-delete: deactivate instead of hard-delete to preserve referential integrity
        // (appointments, chats, favorites still reference this property's ID)
        property.setActive(false);
        property.setSold(false);
        propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Property deactivated successfully")));
    }

    /**
     * PATCH /api/admin/properties/{id}
     * Admin update property fields (e.g. status)
     */
    @PatchMapping("/properties/{id}")
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> patchProperty(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Property not found"));
        }

        if (payload.containsKey("listingStatus")) {
            property.setActive(Boolean.parseBoolean(payload.get("listingStatus").toString()));
        }

        propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(property)));
    }

    // ============================================================
    // APPOINTMENT MANAGEMENT
    // ============================================================

    /** GET /api/admin/appointments — Get all appointments */
    @GetMapping("/appointments")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.List<AppointmentDTO>>> getAllAppointments() {
        java.util.List<AppointmentDTO> appointments = appointmentRepository.findAll().stream()
                .map(AppointmentDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    // ============================================================
    // CHAT MANAGEMENT
    // ============================================================

    /** GET /api/admin/chats — Get all system chat messages */
    @GetMapping("/chats")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.List<ChatMessageDTO>>> getAllChats() {
        java.util.List<ChatMessageDTO> chats = chatMessageRepository.findAll().stream()
                .map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(chats));
    }

    // ============================================================
    // AGENCY MANAGEMENT
    // ============================================================

    /** GET /api/admin/agencies — Get all agencies for approval */
    @GetMapping("/agencies")
    public ResponseEntity<ApiResponse<java.util.List<AgencyDTO>>> getAllAgencies() {
        java.util.List<AgencyDTO> agencies = agencyRepository.findAll().stream()
                .map(AgencyDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    /** PATCH /api/admin/agencies/{id}/status — Approve/Reject Agency */
    @PatchMapping("/agencies/{id}/status")
    public ResponseEntity<ApiResponse<AgencyDTO>> updateAgencyStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        com.realestate.backend.entity.Agency agency = agencyRepository.findById(id).orElse(null);
        if (agency == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Agency not found"));

        String newStatus = payload.get("status");
        if (newStatus != null) {
            agency.setStatus(newStatus.toUpperCase());
            agencyRepository.save(agency);
        }
        return ResponseEntity.ok(ApiResponse.success(AgencyDTO.from(agency)));
    }
}




