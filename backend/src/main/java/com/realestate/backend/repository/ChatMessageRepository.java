package com.realestate.backend.repository;

import com.realestate.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
            Long propertyId,
            Long buyerId,
            Long agentId
    );

    List<ChatMessage> findByAgentIdOrderByCreatedAtDesc(Long agentId);
}
