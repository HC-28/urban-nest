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
        return email != null && (email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$") ||
                email.matches("^[a-zA-Z0-9._%+-]+@urbannest\\.com$"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            String idToken = payload.get("token");
            String requestedRole = payload.getOrDefault("role", "BUYER");
            GoogleIdToken.Payload googleUser = googleAuthService.verifyToken(idToken);
            
            if (googleUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Google Token"));
            }

            String email = googleUser.getEmail();
            String name = (String) googleUser.get("name");
            String phone = payload.get("phone");
            String city = payload.get("city");
            String pincode = payload.get("pincode");
            String agencyName = payload.get("agencyName");

            AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
                AppUser newUser = new AppUser();
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setRole(requestedRole.toUpperCase());
                newUser.setEmailVerified(true);
                newUser.setPhone(phone);
                newUser.setCity(city);
                newUser.setPincode(pincode);
                newUser.setAgencyName(agencyName);
                
                // Agents still need manual verification if that's the policy
                if ("AGENT".equalsIgnoreCase(requestedRole)) {
                    newUser.setVerified(false);
                    emailService.sendAgentRegistrationPendingEmail(email, name);
                } else {
                    newUser.setVerified(true);
                    emailService.sendBuyerWelcomeEmail(email, name);
                }
                newUser.setPassword(encoder.encode(UUID.randomUUID().toString()));
                return userRepository.save(newUser);
            });

            // Block unverified agents even if they're already in the DB
            if ("AGENT".equalsIgnoreCase(user.getRole()) && !user.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Agent account pending admin approval"));
            }

            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
            return ResponseEntity.ok(prepareUserResponse(user, token));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Google auth failed"));
        }
    }

    @PostMapping("/check-user")
    public ResponseEntity<?> checkUserExists(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User already exists"));
        }
        return ResponseEntity.ok(Map.of("message", "Email available"));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestParam String email) {
        try {
            if (!isValidEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email domain"));
            }
            String otp = otpService.generateOtp(email);
            emailService.sendHtmlEmail(email, "Your Login OTP", "Your login code is: <b>" + otp + "</b>. It expires in 5 minutes.");
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Could not send OTP"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("otp");

        if (otpService.validateOtp(email, code)) {
            AppUser user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
            return ResponseEntity.ok(prepareUserResponse(user, token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired OTP"));
    }

    @PostMapping("/register-otp")
    public ResponseEntity<?> requestRegisterOtp(@RequestParam String email) {
        if (!isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email domain"));
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already exists"));
        }
        String otp = otpService.generateOtp(email);
        emailService.sendHtmlEmail(email, "Your Registration OTP", "Welcome to Urban Nest! Your registration code is: <b>" + otp + "</b>. It expires in 5 minutes.");
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<?> requestResetPasswordOtp(@RequestParam String email) {
        if (!isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email domain"));
        }
        if (userRepository.findByEmail(email).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User with this email not found"));
        }
        String otp = otpService.generateOtp(email);
        emailService.sendHtmlEmail(email, "Your Password Reset OTP", "You requested a password reset. Your code is: <b>" + otp + "</b>. It expires in 5 minutes.");
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
    }

    @PostMapping("/reset-password-verify")
    public ResponseEntity<?> resetPasswordVerify(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (otpService.validateOtp(email, code)) {
            Optional<AppUser> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                AppUser user = userOpt.get();
                user.setPassword(encoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password reset successfully! You can now log in."));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired OTP"));
    }

    private Map<String, Object> prepareUserResponse(AppUser dbUser, String token) {
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
        return response;
    }

    /**
     * POST /api/auth/register
     * Register a new user (BUYER or AGENT). OTP required.
     */
    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> payload) {
        try {
            String email = (String) payload.get("email");
            String otp = (String) payload.get("otp");

            if (!otpService.validateOtp(email, otp)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired OTP"));
            }

            if (!isValidEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Only valid Gmail or UrbanNest addresses are allowed"));
            }

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already exists"));
            }

            AppUser user = new AppUser();
            user.setEmail(email);
            user.setName((String) payload.get("name"));
            user.setPassword(encoder.encode((String) payload.get("password")));
            user.setRole((String) payload.get("role"));
            user.setCity((String) payload.get("city"));
            user.setPhone((String) payload.get("phone"));
            user.setPincode((String) payload.get("pincode"));
            user.setProfilePicture((String) payload.get("profilePicture"));
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
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registration successful!"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error during registration"));
        }
    }

    /**
     * GET /api/auth/verify-email
     * Verifies user email using the token.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            Optional<AppUser> userOpt = userRepository.findByVerificationToken(token);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid or expired verification token"));
            }

            AppUser user = userOpt.get();
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error during verification"));
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

            System.out.println("[Login Debug] Attempting login for email: " + user.getEmail());
            AppUser dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);

            if (dbUser == null) {
                System.out.println("[Login Debug] User not found for email: " + user.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            // Check if password matches hash
            if (encoder.matches(user.getPassword(), dbUser.getPassword())) {
                System.out.println("[Login Debug] Password match successful (hashed)");
            } else if (dbUser.getPassword().equals(user.getPassword())) {
                System.out.println("[Login Debug] Password match successful (plain text fallback)");
                dbUser.setPassword(encoder.encode(user.getPassword()));
                userRepository.save(dbUser);
            } else {
                System.out.println("[Login Debug] Password mismatch for: " + user.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            // Block unapproved agents
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
