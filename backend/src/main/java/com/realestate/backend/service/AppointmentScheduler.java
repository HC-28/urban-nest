package com.realestate.backend.service;

import com.realestate.backend.entity.Appointment;
import com.realestate.backend.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class AppointmentScheduler {

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Runs every hour to transition appointment states.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void processEscrowTimers() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime time = now.toLocalTime();

        // 1. Task A: Activate Appointments (pending -> awaiting_buyer_confirmation)
        List<Appointment> pendingAppointments = appointmentRepository.findByStatus("pending");
        for (Appointment appt : pendingAppointments) {
            LocalDate apptDate = appt.getAppointmentDate();
            LocalTime apptTime = appt.getAppointmentTime();

            // If the appointment time has passed
            if (apptDate.isBefore(today) || (apptDate.isEqual(today) && apptTime.isBefore(time))) {
                appt.setStatus("awaiting_buyer_confirmation");
                // Buyer gets 7 days from now to confirm
                appt.setConfirmationDeadline(now.plusDays(7));
                appointmentRepository.save(appt);
                System.out.println("Appointment " + appt.getId() + " moved to awaiting_buyer_confirmation");
            }
        }

        // 2. Task B: Expire Appointments (awaiting_buyer_confirmation -> expired)
        List<Appointment> awaitingConfirmations = appointmentRepository.findByStatusAndConfirmationDeadlineBefore(
                "awaiting_buyer_confirmation", now);

        for (Appointment appt : awaitingConfirmations) {
            appt.setStatus("expired");
            appointmentRepository.save(appt);
            System.out.println("Appointment " + appt.getId() + " expired due to buyer inactivity");
        }
    }
}
