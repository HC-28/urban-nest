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

        List<Appointment> findByProperty_Id(Long propertyId);

        List<Appointment> findByBuyer_Id(Long buyerId);

        List<Appointment> findByAgent_Id(Long agentId);

        default List<Appointment> findByAgentId(Long agentId) {
                return findByAgent_Id(agentId);
        }

        default List<Appointment> findByBuyerId(Long buyerId) {
                return findByBuyer_Id(buyerId);
        }

        default List<Appointment> findByPropertyId(Long propertyId) {
                return findByProperty_Id(propertyId);
        }

        default List<Appointment> findByBuyerIdAndPropertyId(Long buyerId, Long propertyId) {
                return findByBuyer_IdAndProperty_Id(buyerId, propertyId);
        }

        default List<Appointment> findByPropertyIdAndStatusIn(Long propertyId, List<String> statuses) {
                return findByProperty_IdAndStatusIn(propertyId, statuses);
        }

        List<Appointment> findByBuyer_IdAndProperty_Id(Long buyerId, Long propertyId);

        List<Appointment> findByStatus(String status);

        List<Appointment> findByAgent_IdAndAppointmentDate(Long agentId, LocalDate date);

        List<Appointment> findByProperty_IdAndAppointmentDate(Long propertyId, LocalDate date);

        long countByProperty_Id(Long propertyId);

        // Find all active appointments for a property (for cancellation when sold)
        List<Appointment> findByProperty_IdAndStatusIn(Long propertyId, List<String> statuses);

        // Buyer time-conflict check: same buyer, same date, same time, different
        // property
        @Query("SELECT a FROM Appointment a WHERE a.buyer.id = :buyerId " +
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

        @org.springframework.transaction.annotation.Transactional
        void deleteByProperty_Id(Long propertyId);

        default void deleteByPropertyId(Long propertyId) {
                deleteByProperty_Id(propertyId);
        }
}
