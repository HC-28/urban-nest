package com.realestate.backend.service;

import com.realestate.backend.entity.Appointment;
import com.realestate.backend.repository.AgentSlotRepository;
import com.realestate.backend.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Scheduled background job managing appointment workflow lifecycle.
 * - Transitions past confirmed appointments to awaiting buyer confirmation.
 * - Auto-expires abandoned confirmation cycles and unlocks reserved agent slots.
 */
@Component
public class AppointmentScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentScheduler.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AgentSlotRepository agentSlotRepository;

    /**
     * Runs every hour to transition appointment states.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void processEscrowTimers() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime time = now.toLocalTime();

        // 1. Task A: Activate Appointments (confirmed -> awaiting_buyer)
        List<Appointment> confirmedAppointments = appointmentRepository.findByStatus("confirmed");
        for (Appointment appt : confirmedAppointments) {
            LocalDate apptDate = appt.getAppointmentDate();
            LocalTime apptTime = appt.getAppointmentTime();

            if (apptDate == null || apptTime == null) {
                continue;
            }

            // If the appointment time has passed
            if (apptDate.isBefore(today) || (apptDate.isEqual(today) && apptTime.isBefore(time))) {
                appt.setStatus("awaiting_buyer");
                // Buyer gets 7 days from visit to confirm purchase intention
                appt.setConfirmationDeadline(now.plusDays(7));
                appointmentRepository.save(appt);
                logger.info("[Scheduler] Appointment ID {} moved to 'awaiting_buyer'", appt.getId());
            }
        }

        // 2. Task B: Expire Appointments (awaiting_buyer -> expired) and release booked slot
        List<Appointment> awaitingConfirmations = appointmentRepository.findByStatusAndConfirmationDeadlineBefore(
                "awaiting_buyer", now);

        for (Appointment appt : awaitingConfirmations) {
            appt.setStatus("expired");
            appointmentRepository.save(appt);

            // Unlock slot so other prospective buyers can book it
            if (appt.getSlotId() != null) {
                agentSlotRepository.findById(appt.getSlotId()).ifPresent(slot -> {
                    slot.setBooked(false);
                    agentSlotRepository.save(slot);
                    logger.info("[Scheduler] Released slot ID {} from expired appointment ID {}", slot.getId(), appt.getId());
                });
            }
            logger.info("[Scheduler] Appointment ID {} expired due to buyer confirmation inactivity", appt.getId());
        }
    }
}
