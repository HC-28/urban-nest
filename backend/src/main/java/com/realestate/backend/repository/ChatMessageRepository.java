package com.realestate.backend.repository;

import com.realestate.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Fetch conversation between specific buyer and agent for a property
    List<ChatMessage> findByProperty_IdAndBuyer_IdAndAgent_IdOrderByCreatedAtAsc(
            Long propertyId,
            Long buyerId,
            Long agentId);

    default List<ChatMessage> findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
            Long propertyId,
            Long buyerId,
            Long agentId) {
        return findByProperty_IdAndBuyer_IdAndAgent_IdOrderByCreatedAtAsc(propertyId, buyerId, agentId);
    }

    // Fetch all chats for an agent (inbox view)
    List<ChatMessage> findByAgent_IdOrderByCreatedAtDesc(Long agentId);

    default List<ChatMessage> findByAgentIdOrderByCreatedAtDesc(Long agentId) {
        return findByAgent_IdOrderByCreatedAtDesc(agentId);
    }

    // Fetch all chats for a buyer (buyer's chat history)
    List<ChatMessage> findByBuyer_IdOrderByCreatedAtDesc(Long buyerId);

    default List<ChatMessage> findByBuyerIdOrderByCreatedAtDesc(Long buyerId) {
        return findByBuyer_IdOrderByCreatedAtDesc(buyerId);
    }

    default List<ChatMessage> findByAgentId(Long agentId) {
        return findByAgent_IdOrderByCreatedAtDesc(agentId);
    }

    default List<ChatMessage> findByBuyerId(Long buyerId) {
        return findByBuyer_IdOrderByCreatedAtDesc(buyerId);
    }

    // Fetch all chats for a property to notify all interested parties
    List<ChatMessage> findByProperty_Id(Long propertyId);

    // Alias without underscore — used by some controllers
    default List<ChatMessage> findByPropertyId(Long propertyId) {
        return findByProperty_Id(propertyId);
    }

    // Mark messages as seen for a specific conversation
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage c SET c.seen = true " +
            "WHERE c.property.id = :propertyId " +
            "AND c.buyer.id = :buyerId " +
            "AND c.agent.id = :agentId " +
            "AND c.sender != :userRole " +
            "AND c.seen = false")
    void markAsSeen(@Param("propertyId") Long propertyId,
            @Param("buyerId") Long buyerId,
            @Param("agentId") Long agentId,
            @Param("userRole") String userRole);

    @Transactional
    void deleteByProperty_Id(Long propertyId);

    default void deleteByPropertyId(Long propertyId) {
        deleteByProperty_Id(propertyId);
    }
}
