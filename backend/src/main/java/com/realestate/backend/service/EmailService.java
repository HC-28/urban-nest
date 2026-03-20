package com.realestate.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for sending transactional emails.
 * Configured via spring.mail.* in application.properties (SMTP / Gmail).
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    private static final String FROM = "realestateddu@gmail.com";
    private static final String APP_NAME = "Urban Nest";

    /**
     * Sent to the buyer when they successfully book an appointment.
     */
    public void sendAppointmentConfirmation(String buyerEmail, String buyerName,
            String propertyTitle, String date, String time) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(buyerEmail);
            msg.setSubject("[" + APP_NAME + "] Appointment Confirmed — " + propertyTitle);
            msg.setText(
                    "Hi " + buyerName + ",\n\n" +
                            "Your appointment to view \"" + propertyTitle + "\" has been confirmed.\n\n" +
                            "📅 Date: " + date + "\n" +
                            "⏰ Time: " + time + "\n\n" +
                            "After your visit, you will be asked to confirm whether you wish to proceed with the purchase.\n\n"
                            +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send appointment confirmation: " + e.getMessage());
        }
    }

    /**
     * Sent to the agent after buyer says YES — asking them to confirm the sale.
     */
    public void sendSaleConfirmationRequestToAgent(String agentEmail, String agentName,
            String buyerName, String buyerEmail,
            String propertyTitle, Long appointmentId,
            String frontendUrl) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(agentEmail);
            msg.setSubject("[" + APP_NAME + "] Sale Confirmation Required — " + propertyTitle);
            msg.setText(
                    "Hi " + agentName + ",\n\n" +
                            "The buyer " + buyerName + " (" + buyerEmail + ") has indicated they wish to purchase:\n" +
                            "🏠 Property: " + propertyTitle + "\n\n" +
                            "Please log in to your dashboard to CONFIRM or DENY this sale:\n" +
                            frontendUrl + "/dashboard\n\n" +
                            "(Appointment ID: " + appointmentId + ")\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send agent sale request: " + e.getMessage());
        }
    }

    /**
     * Sent to all buyers who had inquiries / appointments on a now-sold property.
     */
    public void sendSoldNotificationToInquirers(List<String> emails, String propertyTitle) {
        if (emails == null || emails.isEmpty())
            return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(emails.toArray(new String[0]));
            msg.setSubject("[" + APP_NAME + "] Property No Longer Available — " + propertyTitle);
            msg.setText(
                    "Hello,\n\n" +
                            "We wanted to let you know that the property you expressed interest in:\n" +
                            "🏠 \"" + propertyTitle + "\"\n\n" +
                            "...has been SOLD and is no longer available.\n\n" +
                            "We hope you find your perfect home soon on " + APP_NAME + "!\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send sold notification: " + e.getMessage());
        }
    }

    /**
     * Sent to the buyer when the sale is fully confirmed by the agent.
     */
    public void sendPurchaseConfirmationToBuyer(String buyerEmail, String buyerName, String propertyTitle) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(buyerEmail);
            msg.setSubject("[" + APP_NAME + "] 🎉 Congratulations! Purchase Confirmed — " + propertyTitle);
            msg.setText(
                    "Hi " + buyerName + ",\n\n" +
                            "🎉 Congratulations! Your purchase of:\n" +
                            "🏠 \"" + propertyTitle + "\"\n\n" +
                            "...has been confirmed by the agent.\n\n" +
                            "You can view this property in your 'Bought Properties' section on your dashboard.\n\n" +
                            "Welcome home!\n\n" +
                            APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send purchase confirmation: " + e.getMessage());
        }
    }

    /**
     * Sent to an agent when their account is approved by admin.
     */
    public void sendAgentApprovalEmail(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(toEmail);
            msg.setSubject("[" + APP_NAME + "] Account Approved — Welcome onboard!");
            msg.setText(
                    "Hi " + name + ",\n\n" +
                            "Great news! Your agent account on " + APP_NAME
                            + " has been approved by our administrators.\n\n" +
                            "You can now log in to your dashboard to start listing properties and managing your appointments.\n\n"
                            +
                            "Login here: " + APP_NAME + " Portal\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send agent approval email: " + e.getMessage());
        }
    }

    /**
     * Sent to a buyer when they register on the platform.
     * Includes a verification link.
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(toEmail);
            msg.setSubject("[" + APP_NAME + "] Please verify your email");

            // In a real app, this would be your production URL
            // String verificationUrl = "https://urban-nest.com/verify-email?token=" +
            // token;
            String verificationUrl = "http://localhost:5173/verify-email?token=" + token;

            msg.setText(
                    "Hi " + name + ",\n\n" +
                            "Welcome to " + APP_NAME + "! We are thrilled to have you here.\n\n" +
                            "To complete your registration, please click the link below to verify your email address:\n\n"
                            +
                            verificationUrl + "\n\n" +
                            "Once verified, you can explore thousands of properties and connect with agents.\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");

            // Console log for easy testing if SMTP fails
            System.out.println("----------------------------------------------------------------");
            System.out.println("?? [EmailService] Verification Link for " + toEmail + ":");
            System.out.println("?? " + verificationUrl);
            System.out.println("----------------------------------------------------------------");

            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send verification email: " + e.getMessage());
        }
    }

    /**
     * Sent to a buyer when they register on the platform.
     */
    public void sendBuyerWelcomeEmail(String toEmail, String name) {
        try {
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
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send buyer welcome email: " + e.getMessage());
        }
    }

    /**
     * Sent to an agent when they register but need admin approval.
     */
    public void sendAgentRegistrationPendingEmail(String toEmail, String name) {
        try {
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
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send agent pending email: " + e.getMessage());
        }
    }

    /**
     * Sent to an agent when their account is rejected/deleted by admin.
     */
    public void sendAgentRejectionEmail(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(toEmail);
            msg.setSubject("[" + APP_NAME + "] Account Registration Update");
            msg.setText(
                    "Hi " + name + ",\n\n" +
                            "Thank you for your interest in joining " + APP_NAME + ".\n\n" +
                            "After reviewing your application, we regret to inform you that we cannot approve your agent account at this time.\n\n"
                            +
                            "Your registration data has been removed from our system. Feel free to contact us if you have any questions.\n\n"
                            +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send agent rejection email: " + e.getMessage());
        }
    }

    /**
     * Sent to the admin when a user submits a query via the Contact Us page.
     */
    public void sendContactQueryEmail(String name, String email, String subject, String message) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(FROM); // Send to admin themselves
            msg.setReplyTo(email);
            msg.setSubject("[" + APP_NAME + " Contact Form] " + subject);
            msg.setText(
                    "New message from " + APP_NAME + " Contact Us Form:\n\n" +
                            "Name: " + name + "\n" +
                            "Email: " + email + "\n" +
                            "Subject: " + subject + "\n\n" +
                            "Message:\n" + message + "\n\n" +
                            "---\n" +
                            "To reply to the user, simply click 'Reply' in your email client.");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send contact query email: " + e.getMessage());
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(FROM);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send HTML email: " + e.getMessage());
        }
    }

    /**
     * Sends an OTP verification code.
     */
    public void sendOtp(String email, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(email);
            msg.setSubject("[" + APP_NAME + "] Your Verification Code");
            msg.setText(
                    "Hello,\n\n" +
                            "Your verification code for " + APP_NAME + " is:\n\n" +
                            "👉 " + otp + "\n\n" +
                            "This code will expire in 5 minutes.\n\n" +
                            "If you did not request this code, please ignore this email.\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send OTP: " + e.getMessage());
        }
    }
}
