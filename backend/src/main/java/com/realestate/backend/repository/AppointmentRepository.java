package com.realestate.backend.repository;

import com.realestate.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

        List<Appointment> findByPropertyId(Long propertyId);

        List<Appointment> findByBuyerId(Long buyerId);

        List<Appointment> findByAgentId(Long agentId);

        List<Appointment> findByBuyerIdAndPropertyId(Long buyerId, Long propertyId);

        List<Appointment> findByStatus(String status);

        List<Appointment> findByAgentIdAndAppointmentDate(Long agentId, LocalDate date);

        List<Appointment> findByPropertyIdAndAppointmentDate(Long propertyId, LocalDate date);

        long countByPropertyId(Long propertyId);

        // Find all active appointments for a property (for cancellation when sold)
        List<Appointment> findByPropertyIdAndStatusIn(Long propertyId, List<String> statuses);

        // Buyer time-conflict check: same buyer, same date, same time, different
        // property
        @Query("SELECT a FROM Appointment a WHERE a.buyerId = :buyerId " +
                        "AND a.appointmentDate = :date AND a.appointmentTime = :time " +
                        "AND a.status NOT IN ('cancelled', 'expired')")
        List<Appointment> findConflictingBuyerAppointments(
                        @Param("buyerId") Long buyerId,
                        @Param("date") LocalDate date,
                        @Param("time") LocalTime time);

        // Find appointments awaiting buyer confirmation that are past deadline (for
        // scheduler)
        List<Appointment> findByStatusAndConfirmationDeadlineBefore(String status, LocalDateTime deadline);

        // Get all appointments for a specific slot
        List<Appointment> findBySlotId(Long slotId);
}
