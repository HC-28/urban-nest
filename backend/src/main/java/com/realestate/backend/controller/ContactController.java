package com.realestate.backend.controller;

import com.realestate.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<?> submitContactQuery(@RequestBody ContactRequest request) {
        System.out.println("Processing contact query from: " + request.getEmail());
        emailService.sendContactQueryEmail(
                request.getName(),
                request.getEmail(),
                request.getSubject(),
                request.getMessage());
        return ResponseEntity.ok(java.util.Map.of("message", "Contact query sent successfully"));
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
