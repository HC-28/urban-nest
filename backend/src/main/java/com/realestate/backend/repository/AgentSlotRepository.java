package com.realestate.backend.repository;

import com.realestate.backend.entity.AgentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AgentSlotRepository extends JpaRepository<AgentSlot, Long> {

    // All slots for a specific property (available + booked)
    List<AgentSlot> findByPropertyId(Long propertyId);

    // Only available (unbooked) slots for a property from today onwards
    List<AgentSlot> findByPropertyIdAndIsBookedFalseAndSlotDateGreaterThanEqual(Long propertyId, LocalDate fromDate);

    // All slots for an agent
    List<AgentSlot> findByAgentId(Long agentId);

    // All available slots for a property on a given date
    List<AgentSlot> findByPropertyIdAndSlotDateAndIsBookedFalse(Long propertyId, LocalDate date);
}
