package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // Import
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${app.frontend-url}", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(); // Initialize encoder

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private EmailService emailService;

    private boolean isValidEmail(String email) {
        return email != null && (email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$") ||
                email.matches("^[a-zA-Z0-9._%+-]+@urbannest\\.com$"));
    }

    // SIGNUP API

    @PostMapping(value = "/signup", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> signup(@RequestBody AppUser user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid request body");
            }

            if (!isValidEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Only valid Gmail or UrbanNest addresses are allowed");
            }

            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
            }

            // Block ADMIN creation via the public signup endpoint
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid role");
            }

            // Set verified=false for new agents (must be approved by admin)
            if ("AGENT".equalsIgnoreCase(user.getRole())) {
                user.setVerified(false);
            } else {
                user.setVerified(true);
            }
            // Hash password before saving
            user.setPassword(encoder.encode(user.getPassword()));
            userRepository.save(user);
            return ResponseEntity.ok("Signup successful");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // LOGIN API

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody AppUser user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid request body");
            }

            if (!isValidEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only Gmail or UrbanNest login allowed");
            }

            AppUser dbUser = userRepository.findByEmail(user.getEmail())
                    .orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            // Check if password matches hash
            if (encoder.matches(user.getPassword(), dbUser.getPassword())) {
                // Good match
            } else if (dbUser.getPassword().equals(user.getPassword())) {
                // Fallback: Plain text match (Legacy user)
                // Migrate to hash immediately
                dbUser.setPassword(encoder.encode(user.getPassword()));
                userRepository.save(dbUser);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            // Block unverified agents from logging in
            if ("AGENT".equalsIgnoreCase(dbUser.getRole()) && !dbUser.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Agent account pending admin approval");
            }

            return ResponseEntity.ok(dbUser);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ADD PROPERTY API

    @PostMapping(value = "/add-property", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProperty(@RequestBody Property property) {
        try {
            if (property == null) {
                return ResponseEntity.badRequest().body("Invalid property data");
            }

            propertyRepository.save(property);
            return ResponseEntity.ok("Property added successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // UPDATE USER NAME API

    @PutMapping(value = "/update-name", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateName(@RequestBody AppUser user) {
        try {
            if (user == null || user.getEmail() == null || user.getName() == null) {
                return ResponseEntity.badRequest().body("Invalid request - email and name are required");
            }

            AppUser dbUser = userRepository.findByEmail(user.getEmail())
                    .orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            dbUser.setName(user.getName());
            userRepository.save(dbUser);

            return ResponseEntity.ok(dbUser);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // UPDATE PROFILE PICTURE API

    @PutMapping(value = "/update-profile-picture", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String profilePicture = request.get("profilePicture");

            if (email == null || profilePicture == null) {
                return ResponseEntity.badRequest().body("Invalid request - email and profilePicture are required");
            }

            // Basic validation for base64 image
            if (!profilePicture.startsWith("data:image/")) {
                return ResponseEntity.badRequest().body("Invalid image format - must be base64 encoded image");
            }

            AppUser dbUser = userRepository.findByEmail(email)
                    .orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            dbUser.setProfilePicture(profilePicture);
            userRepository.save(dbUser);

            return ResponseEntity.ok(dbUser);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // UPDATE FULL PROFILE API
    @PutMapping(value = "/update-profile", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProfile(@RequestBody AppUser user) {
        try {
            if (user == null || user.getEmail() == null) {
                return ResponseEntity.badRequest().body("Invalid request - email is required");
            }

            AppUser dbUser = userRepository.findByEmail(user.getEmail())
                    .orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
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

            // Update professional info if Agent
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // CHANGE PASSWORD API
    @PutMapping(value = "/change-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            if (email == null || currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body("Email, current password, and new password are required");
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body("New password must be at least 6 characters");
            }

            AppUser dbUser = userRepository.findByEmail(email).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            // Verify current password
            boolean isMatch = encoder.matches(currentPassword, dbUser.getPassword());
            if (!isMatch && dbUser.getPassword().equals(currentPassword)) {
                // Fallback for unmigrated users in session (rare but possible)
                isMatch = true;
            }

            if (!isMatch) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Current password is incorrect");
            }

            // Update with new encoded password
            dbUser.setPassword(encoder.encode(newPassword));
            userRepository.save(dbUser);

            return ResponseEntity.ok("Password changed successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ============================================================
    // ADMIN ENDPOINTS
    // ============================================================

    /** GET all users (Admin only) */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userRepository.findAll());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Toggle agent verified status (approve/revoke) */
    @PutMapping("/admin/verify/{id}")
    public ResponseEntity<?> toggleVerifyUser(@PathVariable Long id) {
        if (id == null)
            return ResponseEntity.badRequest().body("ID is required");
        try {
            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            boolean nowVerified = !user.isVerified();
            user.setVerified(nowVerified);
            userRepository.save(user);

            // Send notification if newly verified agent
            if (nowVerified && "AGENT".equalsIgnoreCase(user.getRole())) {
                emailService.sendAgentApprovalEmail(user.getEmail(), user.getName());
            }

            return ResponseEntity.ok(user);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Hard-delete a user (Admin only) */
    @DeleteMapping("/admin/delete/{id}")
    public ResponseEntity<?> adminDeleteUser(@PathVariable Long id) {
        if (id == null)
            return ResponseEntity.badRequest().body("ID is required");
        try {
            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            // Send rejection notification if deleting a pending agent
            if ("AGENT".equalsIgnoreCase(user.getRole()) && !user.isVerified()) {
                emailService.sendAgentRejectionEmail(user.getEmail(), user.getName());
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok("User deleted successfully");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Reject a deletion request (set deletionRequested = false) */
    @PutMapping("/admin/reject-deletion/{id}")
    public ResponseEntity<?> rejectDeletion(@PathVariable Long id) {
        if (id == null)
            return ResponseEntity.badRequest().body("ID is required");
        try {
            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            user.setDeletionRequested(false);
            userRepository.save(user);
            return ResponseEntity.ok("Deletion request rejected");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Request account deletion (User self-requests) */
    @PutMapping("/request-deletion")
    public ResponseEntity<?> requestDeletion(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            AppUser user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            user.setDeletionRequested(true);
            userRepository.save(user);
            return ResponseEntity.ok("Deletion request submitted");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Update user role (Promote to Admin / Revoke Admin) */
    @PutMapping("/admin/update-role/{id}")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String newRole = payload.get("role");
            if (newRole == null || (!newRole.equals("BUYER") && !newRole.equals("AGENT") && !newRole.equals("ADMIN"))) {
                return ResponseEntity.badRequest().body("Invalid role");
            }

            AppUser user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            user.setRole(newRole);
            userRepository.save(user);
            return ResponseEntity.ok("User role updated to " + newRole);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }
}
