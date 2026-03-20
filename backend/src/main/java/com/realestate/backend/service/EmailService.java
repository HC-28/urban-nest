package com.realestate.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for sending transactional emails using Brevo REST API.
 * Bypasses SMTP port blocking on free cloud tiers.
 */
@Service
public class EmailService {

    @Value("${BREVO_API_KEY:dummy}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String FROM_EMAIL = "realestateddu@gmail.com";
    private static final String APP_NAME = "Urban Nest";
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private void sendBrevoEmail(List<String> toEmails, String subject, String htmlContent) {
        if (apiKey == null || apiKey.equals("dummy")) {
            System.err.println("⚠️ [EmailService] BREVO_API_KEY is not set. Email won't send.");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);
            headers.set("accept", "application/json");

            Map<String, Object> body = new HashMap<>();
            
            Map<String, String> sender = new HashMap<>();
            sender.put("name", APP_NAME);
            sender.put("email", FROM_EMAIL);
            body.put("sender", sender);

            List<Map<String, String>> toList = new ArrayList<>();
            for (String email : toEmails) {
                Map<String, String> to = new HashMap<>();
                to.put("email", email);
                toList.add(to);
            }
            body.put("to", toList);
            
            body.put("subject", subject);
            body.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(BREVO_URL, HttpMethod.POST, request, String.class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                System.err.println("⚠️ [EmailService] Brevo API returned error: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send email via Brevo: " + e.getMessage());
        }
    }

    private void sendBrevoEmail(String toEmail, String subject, String htmlContent) {
        sendBrevoEmail(List.of(toEmail), subject, htmlContent);
    }

    private String textToHtml(String text) {
        return "<html><body style='font-family: sans-serif; color: #334155; line-height: 1.6;'>" +
               text.replace("\n", "<br>") +
               "</body></html>";
    }

    /**
     * Sent to the buyer when they successfully book an appointment.
     */
    public void sendAppointmentConfirmation(String buyerEmail, String buyerName,
            String propertyTitle, String date, String time) {
        String text = "Hi " + buyerName + ",\n\n" +
                "Your appointment to view \"" + propertyTitle + "\" has been confirmed.\n\n" +
                "📅 Date: " + date + "\n" +
                "⏰ Time: " + time + "\n\n" +
                "After your visit, you will be asked to confirm whether you wish to proceed with the purchase.\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(buyerEmail, "[" + APP_NAME + "] Appointment Confirmed — " + propertyTitle, textToHtml(text));
    }

    /**
     * Sent to the agent after buyer says YES — asking them to confirm the sale.
     */
    public void sendSaleConfirmationRequestToAgent(String agentEmail, String agentName,
            String buyerName, String buyerEmail,
            String propertyTitle, Long appointmentId,
            String frontendUrl) {
        String text = "Hi " + agentName + ",\n\n" +
                "The buyer " + buyerName + " (" + buyerEmail + ") has indicated they wish to purchase:\n" +
                "🏠 Property: " + propertyTitle + "\n\n" +
                "Please log in to your dashboard to CONFIRM or DENY this sale:\n" +
                frontendUrl + "/dashboard\n\n" +
                "(Appointment ID: " + appointmentId + ")\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(agentEmail, "[" + APP_NAME + "] Sale Confirmation Required — " + propertyTitle, textToHtml(text));
    }

    /**
     * Sent to all buyers who had inquiries / appointments on a now-sold property.
     */
    public void sendSoldNotificationToInquirers(List<String> emails, String propertyTitle) {
        if (emails == null || emails.isEmpty()) return;
        String text = "Hello,\n\n" +
                "We wanted to let you know that the property you expressed interest in:\n" +
                "🏠 \"" + propertyTitle + "\"\n\n" +
                "...has been SOLD and is no longer available.\n\n" +
                "We hope you find your perfect home soon on " + APP_NAME + "!\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(emails, "[" + APP_NAME + "] Property No Longer Available — " + propertyTitle, textToHtml(text));
    }

    /**
     * Sent to the buyer when the sale is fully confirmed by the agent.
     */
    public void sendPurchaseConfirmationToBuyer(String buyerEmail, String buyerName, String propertyTitle) {
        String text = "Hi " + buyerName + ",\n\n" +
                "🎉 Congratulations! Your purchase of:\n" +
                "🏠 \"" + propertyTitle + "\"\n\n" +
                "...has been confirmed by the agent.\n\n" +
                "You can view this property in your 'Bought Properties' section on your dashboard.\n\n" +
                "Welcome home!\n\n" +
                APP_NAME + " Team";
        sendBrevoEmail(buyerEmail, "[" + APP_NAME + "] 🎉 Congratulations! Purchase Confirmed — " + propertyTitle, textToHtml(text));
    }

    /**
     * Sent to an agent when their account is approved by admin.
     */
    public void sendAgentApprovalEmail(String toEmail, String name) {
        String text = "Hi " + name + ",\n\n" +
                "Great news! Your agent account on " + APP_NAME + " has been approved by our administrators.\n\n" +
                "You can now log in to your dashboard to start listing properties and managing your appointments.\n\n" +
                "Login here: " + APP_NAME + " Portal\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(toEmail, "[" + APP_NAME + "] Account Approved — Welcome onboard!", textToHtml(text));
    }

    /**
     * Sent to a buyer when they register on the platform.
     * Includes a verification link.
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        String verificationUrl = "http://localhost:5173/verify-email?token=" + token;
        String text = "Hi " + name + ",\n\n" +
                "Welcome to " + APP_NAME + "! We are thrilled to have you here.\n\n" +
                "To complete your registration, please click the link below to verify your email address:\n\n" +
                verificationUrl + "\n\n" +
                "Once verified, you can explore thousands of properties and connect with agents.\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(toEmail, "[" + APP_NAME + "] Please verify your email", textToHtml(text));
    }

    /**
     * Sent to a buyer when they register on the platform.
     */
    public void sendBuyerWelcomeEmail(String toEmail, String name) {
        String htmlContent = "<html><body style='font-family: sans-serif; color: #334155;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>" +
                "<h1 style='color: #2563eb;'>✨ Welcome to " + APP_NAME + "!</h1>" +
                "<p>Hi <b>" + name + "</b>,</p>" +
                "<p>We're thrilled to have you join our premium real estate community. Whether you're looking for your dream home or a smart investment, Urban Nest is here to simplify your journey.</p>" +
                "<h3>What's Next?</h3>" +
                "<ul>" +
                "  <li><b>Explore:</b> Browse thousands of verified listings in Mumbai, Bangalore, and Ahmedabad.</li>" +
                "  <li><b>Save:</b> Add properties to your favorites to track price changes.</li>" +
                "  <li><b>Connect:</b> Chat directly with professional agents in real-time.</li>" +
                "</ul>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "  <a href='http://localhost:5173' style='background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Start Exploring Now</a>" +
                "</div>" +
                "<p>Happy hunting!</p>" +
                "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'>" +
                "<p style='font-size: 0.8rem; color: #64748b;'>Best regards,<br>The Urban Nest Team</p>" +
                "</div></body></html>";
        sendHtmlEmail(toEmail, "✨ Welcome to Urban Nest - Start Your Journey!", htmlContent);
    }

    /**
     * Sent to an agent when they register but need admin approval.
     */
    public void sendAgentRegistrationPendingEmail(String toEmail, String name) {
        String htmlContent = "<html><body style='font-family: sans-serif; color: #334155;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>" +
                "<h1 style='color: #2563eb;'>🤝 Welcome, Agent " + name + "!</h1>" +
                "<p>Thank you for choosing to partner with <b>" + APP_NAME + "</b>.</p>" +
                "<p>Your registration is currently <b>awaiting administrator approval</b>. Our team will verify your details shortly to ensure a high-quality ecosystem for our buyers.</p>" +
                "<h3>What happens next?</h3>" +
                "<p>1. <b>Verification:</b> We review your agency details.<br>" +
                "2. <b>Approval:</b> You'll receive a confirmation email once your account is active.<br>" +
                "3. <b>Onboarding:</b> You can then log in and start listing your properties.</p>" +
                "<p>Thank you for your patience.</p>" +
                "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'>" +
                "<p style='font-size: 0.8rem; color: #64748b;'>Best regards,<br>The Urban Nest Team</p>" +
                "</div></body></html>";
        sendHtmlEmail(toEmail, "🤝 Your Agent Registration is Pending Approval", htmlContent);
    }

    /**
     * Sent to an agent when their account is rejected/deleted by admin.
     */
    public void sendAgentRejectionEmail(String toEmail, String name) {
        String text = "Hi " + name + ",\n\n" +
                "Thank you for your interest in joining " + APP_NAME + ".\n\n" +
                "After reviewing your application, we regret to inform you that we cannot approve your agent account at this time.\n\n" +
                "Your registration data has been removed from our system. Feel free to contact us if you have any questions.\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(toEmail, "[" + APP_NAME + "] Account Registration Update", textToHtml(text));
    }

    /**
     * Sent to the admin when a user submits a query via the Contact Us page.
     */
    public void sendContactQueryEmail(String name, String email, String subject, String message) {
        String text = "New message from " + APP_NAME + " Contact Us Form:\n\n" +
                "Name: " + name + "\n" +
                "Email: " + email + "\n" +
                "Subject: " + subject + "\n\n" +
                "Message:\n" + message + "\n\n" +
                "---\n" +
                "To reply to the user, simply click 'Reply' in your email client.";
        // Sending to admin
        sendBrevoEmail(FROM_EMAIL, "[" + APP_NAME + " Contact Form] " + subject, textToHtml(text));
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        sendBrevoEmail(to, subject, htmlContent);
    }

    /**
     * Sends an OTP verification code.
     */
    public void sendOtp(String email, String otp) {
        String text = "Hello,\n\n" +
                "Your verification code for " + APP_NAME + " is:\n\n" +
                "👉 " + otp + "\n\n" +
                "This code will expire in 5 minutes.\n\n" +
                "If you did not request this code, please ignore this email.\n\n" +
                "Best regards,\n" + APP_NAME + " Team";
        sendBrevoEmail(email, "[" + APP_NAME + "] Your Verification Code", textToHtml(text));
    }
}
