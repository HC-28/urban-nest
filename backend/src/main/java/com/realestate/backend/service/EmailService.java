package com.realestate.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
     */
    public void sendBuyerWelcomeEmail(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(toEmail);
            msg.setSubject("[" + APP_NAME + "] Welcome to " + APP_NAME + "!");
            msg.setText(
                    "Hi " + name + ",\n\n" +
                            "Welcome to " + APP_NAME + "! We are thrilled to have you here.\n\n" +
                            "You can now explore thousands of properties, add them to your favorites, chat directly with agents, and book property tours.\n\n"
                            +
                            "Start your journey today: " + APP_NAME + " Portal\n\n" +
                            "Best regards,\n" + APP_NAME + " Team");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ [EmailService] Failed to send buyer welcome email: " + e.getMessage());
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
}
