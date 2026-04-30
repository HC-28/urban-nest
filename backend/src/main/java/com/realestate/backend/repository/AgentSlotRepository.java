package com.realestate.backend.repository;

import com.realestate.backend.entity.AgentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AgentSlotRepository extends JpaRepository<AgentSlot, Long> {

    // All slots for a specific property (available + booked)
    List<AgentSlot> findByProperty_Id(Long propertyId);

    // Only available (unbooked) slots for a property from today onwards
    // INCLUDING global slots (where propertyId is null) for the same agent
    @Query("SELECT s FROM AgentSlot s WHERE (s.property.id = :propertyId OR s.property IS NULL) " +
            "AND s.agent.id = :agentId AND s.isBooked = false AND s.slotDate >= :fromDate")
    List<AgentSlot> findAvailableSlots(@Param("propertyId") Long propertyId,
            @Param("agentId") Long agentId,
            @Param("fromDate") LocalDate fromDate);

    // All slots for an agent
    List<AgentSlot> findByAgent_Id(Long agentId);

    default List<AgentSlot> findByAgentId(Long agentId) {
        return findByAgent_Id(agentId);
    }

    // All available slots for a property on a given date
    List<AgentSlot> findByProperty_IdAndSlotDateAndIsBookedFalse(Long propertyId, LocalDate date);

    @org.springframework.transaction.annotation.Transactional
    void deleteByProperty_Id(Long propertyId);

    default void deleteByPropertyId(Long propertyId) {
        deleteByProperty_Id(propertyId);
    }
}
