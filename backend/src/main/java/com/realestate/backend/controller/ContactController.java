package com.realestate.backend.controller;

import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> submitContactQuery(@RequestBody ContactRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required for contact query"));
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message content is required"));
        }

        logger.info("[Contact] Received contact query from: {} with subject: {}", request.getEmail(), request.getSubject());
        emailService.sendContactQueryEmail(
                request.getName() != null ? request.getName() : "Anonymous",
                request.getEmail(),
                request.getSubject() != null ? request.getSubject() : "Website Inquiry",
                request.getMessage());

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Contact query sent successfully")));
    }

    public static class ContactRequest {
        private String name;
        private String email;
        private String subject;
        private String message;

        // Getters and Setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
