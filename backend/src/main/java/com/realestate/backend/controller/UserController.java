package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${app.frontend-url}", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    private boolean isValidGmail(String email) {
        return email != null && email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$");
    }

    // SIGNUP API

    @PostMapping(value = "/signup", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid request body");
            }

            if (!isValidGmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only valid Gmail addresses are allowed");
            }

            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
            }

            userRepository.save(user);
            return ResponseEntity.ok("Signup successful");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // LOGIN API

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid request body");
            }

            if (!isValidGmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only Gmail login allowed");
            }

            User dbUser = userRepository.findByEmail(user.getEmail())
                    .orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email");
            }

            if (!dbUser.getPassword().equals(user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password");
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
    public ResponseEntity<?> updateName(@RequestBody User user) {
        try {
            if (user == null || user.getEmail() == null || user.getName() == null) {
                return ResponseEntity.badRequest().body("Invalid request - email and name are required");
            }

            User dbUser = userRepository.findByEmail(user.getEmail())
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

            User dbUser = userRepository.findByEmail(email)
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
    public ResponseEntity<?> updateProfile(@RequestBody User user) {
        try {
            if (user == null || user.getEmail() == null) {
                return ResponseEntity.badRequest().body("Invalid request - email is required");
            }

            User dbUser = userRepository.findByEmail(user.getEmail())
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
}
