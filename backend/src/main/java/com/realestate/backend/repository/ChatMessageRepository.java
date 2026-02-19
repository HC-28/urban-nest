package com.realestate.backend.repository;

import com.realestate.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
