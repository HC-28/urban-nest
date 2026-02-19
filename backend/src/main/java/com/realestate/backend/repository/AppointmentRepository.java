package com.realestate.backend.repository;

import com.realestate.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find all appointments for a property
    List<Appointment> findByPropertyId(Long propertyId);

    // Find all appointments for a buyer
    List<Appointment> findByBuyerId(Long buyerId);

    // Find all appointments for an agent
    List<Appointment> findByAgentId(Long agentId);

    // Find appointments by status
    List<Appointment> findByStatus(String status);

    // Find appointments for an agent on a specific date
    List<Appointment> findByAgentIdAndAppointmentDate(Long agentId, LocalDate date);

    // Find appointments for a property on a specific date
    List<Appointment> findByPropertyIdAndAppointmentDate(Long propertyId, LocalDate date);

    // Count appointments for a property
    long countByPropertyId(Long propertyId);
}
