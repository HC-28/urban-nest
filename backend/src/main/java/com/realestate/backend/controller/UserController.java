package com.realestate.backend.controller;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.DeletedUser;
import com.realestate.backend.repository.DeletedUserRepository;
import com.realestate.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * User profile management.
 * Auth (login/signup) is in AuthController.
 * Admin user operations are in AdminController.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeletedUserRepository deletedUserRepository;

    @Autowired
    private com.realestate.backend.service.OtpService otpService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Helper to get authenticated user email
     */
    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String email) {
            return email;
        }
        return null;
    }

    /**
     * GET /api/users/{id}
     * Get public basic profile info
     */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            AppUser dbUser = userRepository.findById(id).orElse(null);
            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }
            return ResponseEntity.ok(Map.of(
                    "id", dbUser.getId(),
                    "name", dbUser.getName() != null ? dbUser.getName() : "Agent",
                    "email", dbUser.getEmail(),
                    "profilePicture", dbUser.getProfilePicture() != null ? dbUser.getProfilePicture() : "",
                    "phone", dbUser.getPhone() != null ? dbUser.getPhone() : "",
                    "agencyName", dbUser.getAgencyName() != null ? dbUser.getAgencyName() : ""));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    /**
     * PUT /api/users/me/profile
     * Update own profile
     */
    @PutMapping(value = "/me/profile", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProfile(@RequestBody AppUser user) {
        try {
            String email = getAuthenticatedEmail();
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }

            AppUser dbUser = userRepository.findByEmail(email).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            // Update basic info
            if (user.getName() != null)
                dbUser.setName(user.getName());
            if (user.getPhone() != null)
                dbUser.setPhone(user.getPhone());
            if (user.getCity() != null)
                dbUser.setCity(user.getCity());
            if (user.getPincode() != null)
                dbUser.setPincode(user.getPincode());

            // Professional info if Agent
            if ("AGENT".equalsIgnoreCase(dbUser.getRole())) {
                if (user.getBio() != null)
                    dbUser.setBio(user.getBio());
                if (user.getAgencyName() != null)
                    dbUser.setAgencyName(user.getAgencyName());
                if (user.getExperience() != null)
                    dbUser.setExperience(user.getExperience());
                if (user.getSpecialties() != null)
                    dbUser.setSpecialties(user.getSpecialties());
            }

            userRepository.save(dbUser);
            return ResponseEntity.ok(dbUser);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    /**
     * PATCH /api/users/me/avatar
     * Update profile picture separately (base64 image).
     */
    @PatchMapping(value = "/me/avatar", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> request) {
        try {
            String email = getAuthenticatedEmail();
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }

            String profilePicture = request.get("profilePicture");

            if (profilePicture == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "profilePicture is required"));
            }

            if (!profilePicture.startsWith("data:image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid image format - must be base64 encoded image"));
            }

            AppUser dbUser = userRepository.findByEmail(email).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            dbUser.setProfilePicture(profilePicture);
            userRepository.save(dbUser);

            return ResponseEntity.ok(dbUser);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * PUT /api/users/me/password
     * Change own password. requires current password AND OTP.
     */
    @PutMapping(value = "/me/password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        try {
            String email = getAuthenticatedEmail();
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }

            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            String otp = request.get("otp");

            if (currentPassword == null || newPassword == null || otp == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Current password, new password, and OTP code are required"));
            }

            if (!otpService.validateOtp(email, otp)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired OTP"));
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "New password must be at least 6 characters"));
            }

            AppUser dbUser = userRepository.findByEmail(email).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            // Verify current password
            boolean isMatch = encoder.matches(currentPassword, dbUser.getPassword());
            if (!isMatch && dbUser.getPassword().equals(currentPassword)) {
                isMatch = true; // Fallback for unmigrated users
            }

            if (!isMatch) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Current password is incorrect"));
            }

            dbUser.setPassword(encoder.encode(newPassword));
            userRepository.save(dbUser);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    /**
     * POST /api/users/me/deletion-request
     * BUYER  → Instantly archived to deleted_users + soft-deleted (no admin needed)
     * AGENT  → Flagged for admin approval (agents have listings, chats, appointments)
     */
    @PostMapping("/me/deletion-request")
    public ResponseEntity<?> requestDeletion() {
        try {
            String email = getAuthenticatedEmail();
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }

            AppUser dbUser = userRepository.findByEmail(email).orElse(null);
            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            if ("AGENT".equalsIgnoreCase(dbUser.getRole())) {
                // Agents → admin approval required (has active listings/chats/appointments)
                dbUser.setDeletionRequested(true);
                userRepository.save(dbUser);
                return ResponseEntity.ok(Map.of(
                        "message", "Deletion request submitted for admin review",
                        "status", "PENDING_APPROVAL"
                ));
            } else {
                // Buyers → instant archive + soft-delete
                DeletedUser archive = new DeletedUser();
                archive.setOriginalUserId(dbUser.getId());
                archive.setName(dbUser.getName());
                archive.setEmail(dbUser.getEmail());
                archive.setRole(dbUser.getRole());
                archive.setPhone(dbUser.getPhone());
                archive.setCity(dbUser.getCity());
                archive.setAgencyName(dbUser.getAgencyName());
                archive.setDeletedAt(LocalDateTime.now());
                archive.setDeletionReason("USER_REQUEST");
                archive.setDeletedBy(null); // Self-requested
                deletedUserRepository.save(archive);

                dbUser.setDeletionRequested(true);
                userRepository.save(dbUser);

                return ResponseEntity.ok(Map.of(
                        "message", "Your account has been deleted successfully",
                        "status", "DELETED"
                ));
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }
}
