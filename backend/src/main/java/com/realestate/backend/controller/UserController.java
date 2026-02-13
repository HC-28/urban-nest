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

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    // ===================== UTILITY =====================

    private boolean isValidGmail(String email) {
        return email != null && email.matches("^[a-zA-Z0-9._%+-]+@gmail\\.com$");
    }

    // ===================== SIGNUP =====================

    @PostMapping(
            value = "/signup",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            if (user == null) {
                return ResponseEntity.badRequest().body("Invalid request body");
            }

            if (!isValidGmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Only valid Gmail addresses are allowed");
            }

            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Email already exists");
            }

            userRepository.save(user);
            return ResponseEntity.ok("Signup successful");

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ===================== LOGIN =====================

    @PostMapping(
            value = "/login",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            if (user == null || user.getEmail() == null || user.getPassword() == null) {
                return ResponseEntity.badRequest()
                        .body("Email and password are required");
            }

            if (!isValidGmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Only Gmail login allowed");
            }

            User dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email");
            }

            if (!Objects.equals(dbUser.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid password");
            }

            return ResponseEntity.ok(dbUser);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ===================== ADD PROPERTY =====================

    @PostMapping(
            value = "/add-property",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> addProperty(@RequestBody Property property) {
        try {
            if (property == null) {
                return ResponseEntity.badRequest()
                        .body("Invalid property data");
            }

            propertyRepository.save(property);
            return ResponseEntity.ok("Property added successfully");

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ===================== UPDATE USER NAME =====================

    @PutMapping(
            value = "/update-name",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> updateName(@RequestBody User user) {
        try {
            if (user == null || user.getEmail() == null || user.getName() == null) {
                return ResponseEntity.badRequest()
                        .body("Invalid request - email and name are required");
            }

            User dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);

            if (dbUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found");
            }

            dbUser.setName(user.getName());
            userRepository.save(dbUser);

            return ResponseEntity.ok(dbUser);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ===================== GET ALL AGENTS =====================

    @GetMapping(
            value = "/agents",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> getAllAgents() {
        try {
            List<User> agents = userRepository.findByRole("AGENT");
            return ResponseEntity.ok(agents);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ===================== ⭐ GET USER BY ID (CHAT FIX) ⭐ =====================

    @GetMapping(
            value = "/{id}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with id: " + id);
            }

            return ResponseEntity.ok(user);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }
}
