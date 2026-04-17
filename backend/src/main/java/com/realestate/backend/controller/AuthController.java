package com.realestate.backend.controller;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.security.JwtUtil;
import com.realestate.backend.service.GoogleAuthService;
import com.realestate.backend.service.OtpService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import com.realestate.backend.dto.ApiResponse;

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

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private OtpService otpService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private boolean isValidEmail(String email) {
        // RFC-5322 compatible: accepts any valid email format (not just Gmail/urbannest)
        return email != null && email.matches("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$");
    }

    @PostMapping("/check-user")
    public ResponseEntity<ApiResponse<Map<String, String>>> checkUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email != null) {
            email = email.toLowerCase();
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Email already exists"));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Email is available")));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<Map<String, Object>>> googleLogin(@RequestBody Map<String, String> payload) {
        String idToken = payload.get("token");
        String requestedRole = payload.getOrDefault("role", "BUYER");
        GoogleIdToken.Payload googleUser = googleAuthService.verifyToken(idToken);

        if (googleUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid Google Token"));
        }

        String email = googleUser.getEmail().toLowerCase();
        String name = (String) googleUser.get("name");

        AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
            AppUser newUser = new AppUser();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setRole(requestedRole.toUpperCase());
            newUser.setEmailVerified(true);
            if ("AGENT".equalsIgnoreCase(requestedRole)) {
                newUser.setVerified(false);
            } else {
                newUser.setVerified(true);
            }
            newUser.setPassword(encoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success(prepareUserResponse(user, token)));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestOtp(@RequestParam String email) {
        if (email != null) email = email.toLowerCase();
        if (!isValidEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid email domain"));
        }
        String otp = otpService.generateOtp(email);
        emailService.sendHtmlEmail(email, "Your Login OTP",
                "Your login code is: <b>" + otp + "</b>. It expires in 5 minutes.");
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "OTP sent to your email")));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email != null) email = email.toLowerCase();
        String code = payload.get("otp");

        if (otpService.validateOtp(email, code)) {
            AppUser user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
            }
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
            return ResponseEntity.ok(ApiResponse.success(prepareUserResponse(user, token)));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid or expired OTP"));
    }

    @PostMapping("/register-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestRegisterOtp(@RequestParam String email) {
        if (email != null) email = email.toLowerCase();
        if (!isValidEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid email domain"));
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Email already exists"));
        }
        String otp = otpService.generateOtp(email);
        emailService.sendHtmlEmail(email, "Your Registration OTP",
                "Welcome to Urban Nest! Your registration code is: <b>" + otp + "</b>. It expires in 5 minutes.");
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "OTP sent to your email")));
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestResetPasswordOtp(@RequestParam String email) {
        if (email != null) email = email.toLowerCase();
        if (!isValidEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid email domain"));
        }
        if (userRepository.findByEmail(email).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User with this email not found"));
        }
        String otp = otpService.generateOtp(email);
        emailService.sendHtmlEmail(email, "Your Password Reset OTP",
                "You requested a password reset. Your code is: <b>" + otp + "</b>. It expires in 5 minutes.");
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "OTP sent to your email")));
    }

    @PostMapping("/reset-password-verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPasswordVerify(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (otpService.validateOtp(email, code)) {
            Optional<AppUser> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                AppUser user = userOpt.get();
                user.setPassword(encoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Password reset successfully! You can now log in.")));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid or expired OTP"));
    }

    private Map<String, Object> prepareUserResponse(AppUser dbUser, String token) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id", dbUser.getId());
        response.put("name", dbUser.getName());
        response.put("email", dbUser.getEmail());
        response.put("role", dbUser.getRole());
        response.put("profilePicture", dbUser.getProfilePictureUrl());
        response.put("city", dbUser.getCity());
        response.put("phone", dbUser.getPhone());
        response.put("pincode", dbUser.getPincode());
        response.put("bio", dbUser.getBio());
        response.put("agencyName", dbUser.getAgencyName());
        response.put("experience", dbUser.getExperience());
        response.put("specialties", dbUser.getSpecialties());
        response.put("verified", dbUser.isVerified());
        response.put("deletionRequested", dbUser.isDeletionRequested());
        return response;
    }

    /**
     * POST /api/auth/register
     * Register a new user (BUYER or AGENT). OTP required.
     */
    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> signup(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email != null) email = email.toLowerCase();
        String otp = (String) payload.get("otp");
        String name = (String) payload.get("name");
        String password = (String) payload.get("password");
        String role = (String) payload.get("role");

        // Input validation
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Name is required"));
        }
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Password is required"));
        }
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Role is required"));
        }

        if (!otpService.validateOtp(email, otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid or expired OTP"));
        }

        if (!isValidEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Only valid Gmail or UrbanNest addresses are allowed"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Email already exists"));
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        user.setCity((String) payload.get("city"));
        user.setPhone((String) payload.get("phone"));
        user.setPincode((String) payload.get("pincode"));
        user.setProfilePictureUrl((String) payload.get("profilePicture"));
        user.setAgencyName((String) payload.get("agencyName"));

        // Verification status
        user.setEmailVerified(true);
        if ("AGENT".equalsIgnoreCase(user.getRole())) {
            user.setVerified(false);
        } else {
            user.setVerified(true);
            emailService.sendBuyerWelcomeEmail(email, user.getName());
        }

        userRepository.save(user);

        if (user.isVerified()) {
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
            Map<String, Object> response = prepareUserResponse(user, token);
            response.put("message", "Registration successful!");
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
        } else {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Map.of(
                "message", "Registration successful! Your account is pending admin approval.",
                "requiresApproval", true
            )));
        }
    }

    /**
     * GET /api/auth/verify-email
     * Verifies user email using the token.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyEmail(@RequestParam String token) {
        Optional<AppUser> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid or expired verification token"));
        }

        AppUser user = userOpt.get();
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Email verified successfully! You can now log in.")));
    }

    /**
     * POST /api/auth/login
     * Authenticate user. Returns user data WITHOUT password.
     */
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody AppUser user) {
        if (user == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid request body"));
        }

        String email = user.getEmail();
        if (email != null) email = email.toLowerCase();

        if (!isValidEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Only Gmail or UrbanNest login allowed"));
        }

        AppUser dbUser = userRepository.findByEmail(email).orElse(null);

        if (dbUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials"));
        }

        // Check if password matches hash (secure comparison only)
        if (!encoder.matches(user.getPassword(), dbUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials"));
        }

        // Block unapproved agents
        if ("AGENT".equalsIgnoreCase(dbUser.getRole()) && !dbUser.isVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Agent account pending admin approval"));
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(dbUser.getId(), dbUser.getEmail(), dbUser.getRole());

        // Return user data WITHOUT password + JWT token
        Map<String, Object> response = prepareUserResponse(dbUser, token);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
