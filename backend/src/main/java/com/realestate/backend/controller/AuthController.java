package com.realestate.backend.controller;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Handles authentication: signup and login.
 * Separated from UserController to follow single-responsibility principle.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.realestate.backend.service.EmailService emailService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private boolean isValidEmail(String email) {
        return email != null && (email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$") ||
                email.matches("^[a-zA-Z0-9._%+-]+@urbannest\\.com$"));
    }

    /**
     * POST /api/auth/register
     * Register a new user (BUYER or AGENT). ADMIN creation is blocked.
     */
    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> signup(@RequestBody AppUser user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
            }

            if (!isValidEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Only valid Gmail or UrbanNest addresses are allowed"));
            }

            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Email already exists"));
            }

            // Block ADMIN creation via the public signup endpoint
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Invalid role"));
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

            // Send Welcome Email to newly registered Buyers
            if ("BUYER".equalsIgnoreCase(user.getRole())) {
                emailService.sendBuyerWelcomeEmail(user.getEmail(), user.getName());
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Signup successful"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * POST /api/auth/login
     * Authenticate user. Returns user data WITHOUT password.
     */
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody AppUser user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
            }

            if (!isValidEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Only Gmail or UrbanNest login allowed"));
            }

            AppUser dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            // Check if password matches hash
            if (encoder.matches(user.getPassword(), dbUser.getPassword())) {
                // Good match
            } else if (dbUser.getPassword().equals(user.getPassword())) {
                // Fallback: Plain text match (Legacy user) — migrate to hash
                dbUser.setPassword(encoder.encode(user.getPassword()));
                userRepository.save(dbUser);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            // Block unverified agents from logging in
            if ("AGENT".equalsIgnoreCase(dbUser.getRole()) && !dbUser.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Agent account pending admin approval"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(dbUser.getId(), dbUser.getEmail(), dbUser.getRole());

            // Return user data WITHOUT password + JWT token
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", dbUser.getId());
            response.put("name", dbUser.getName());
            response.put("email", dbUser.getEmail());
            response.put("role", dbUser.getRole());
            response.put("profilePicture", dbUser.getProfilePicture());
            response.put("city", dbUser.getCity());
            response.put("phone", dbUser.getPhone());
            response.put("pincode", dbUser.getPincode());
            response.put("bio", dbUser.getBio());
            response.put("agencyName", dbUser.getAgencyName());
            response.put("experience", dbUser.getExperience());
            response.put("specialties", dbUser.getSpecialties());
            response.put("verified", dbUser.isVerified());
            response.put("deletionRequested", dbUser.isDeletionRequested());

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }
}
