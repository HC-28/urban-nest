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
    List<ChatMessage> findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
            Long propertyId,
            Long buyerId,
            Long agentId);

    // Fetch all chats for an agent (inbox view)
    List<ChatMessage> findByAgentIdOrderByCreatedAtDesc(Long agentId);

    // Fetch all chats for a buyer (buyer's chat history)
    List<ChatMessage> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    // Fetch all chats for a property to notify all interested parties
    List<ChatMessage> findByPropertyId(Long propertyId);

    // Mark messages as seen for a specific conversation
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage c SET c.seen = true " +
            "WHERE c.propertyId = :propertyId " +
            "AND c.buyerId = :buyerId " +
            "AND c.agentId = :agentId " +
            "AND c.sender != :userRole " +
            "AND c.seen = false")
    void markAsSeen(@Param("propertyId") Long propertyId,
            @Param("buyerId") Long buyerId,
            @Param("agentId") Long agentId,
            @Param("userRole") String userRole);
}
