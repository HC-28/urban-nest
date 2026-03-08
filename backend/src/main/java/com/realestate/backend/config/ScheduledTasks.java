package com.realestate.backend.config;

import com.realestate.backend.entity.AgentSlot;
import com.realestate.backend.entity.Appointment;
import com.realestate.backend.repository.AgentSlotRepository;
import com.realestate.backend.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background tasks for handling business logic like auto-expiring appointments.
 */
@Component
public class ScheduledTasks {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AgentSlotRepository agentSlotRepository;

    /**
     * Runs every hour to check for appointments awaiting buyer confirmation
     * that have passed the 5-day deadline.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkExpiredAppointments() {
        System.out.println("🕒 [ScheduledTasks] Checking for expired appointment confirmations...");

        LocalDateTime now = LocalDateTime.now();

        // Find appointments with status 'awaiting_buyer' where deadline has passed
        List<Appointment> expired = appointmentRepository
                .findByStatusAndConfirmationDeadlineBefore("awaiting_buyer", now);

        if (expired.isEmpty())
            return;

        for (Appointment appt : expired) {
            System.out.println("⚠️ [ScheduledTasks] Expiring appointment ID: " + appt.getId());

            appt.setStatus("expired");
            appointmentRepository.save(appt);

            // Unlock the slot so the agent can show the property again
            if (appt.getSlotId() != null) {
                agentSlotRepository.findById(appt.getSlotId()).ifPresent(slot -> {
                    slot.setBooked(false);
                    agentSlotRepository.save(slot);
                    System.out.println("🔓 [ScheduledTasks] Unlocked slot ID: " + slot.getId());
                });
            }
        }

        System.out.println("✅ [ScheduledTasks] Processed " + expired.size() + " expired appointments.");
    }
}
