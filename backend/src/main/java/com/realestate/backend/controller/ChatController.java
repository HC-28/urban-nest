package com.realestate.backend.controller;

import com.realestate.backend.entity.ChatMessage;
import com.realestate.backend.repository.ChatMessageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Chat messaging between buyers and agents.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    /** POST /api/chat/messages — Send a message */
    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessage message) {

        if (message.getMessage() == null || message.getMessage().trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body("Message cannot be empty");
        }

        if (message.getBuyerId() == null ||
                message.getAgentId() == null ||
                message.getPropertyId() == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Invalid chat data");
        }

        ChatMessage saved = chatRepo.save(message);
        return ResponseEntity.ok(saved);
    }

    /**
     * GET /api/chat/messages — Fetch conversation (requires propertyId, buyerId,
     * agentId)
     */
    @GetMapping("/messages")
    public List<ChatMessage> getConversation(
            @RequestParam Long propertyId,
            @RequestParam Long buyerId,
            @RequestParam Long agentId) {
        return chatRepo.findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
                propertyId, buyerId, agentId);
    }

    /** GET /api/chat/agent/{agentId} — Agent inbox */
    @GetMapping("/agent/{agentId}")
    public List<ChatMessage> getChatsForAgent(@PathVariable Long agentId) {
        return chatRepo.findByAgentIdOrderByCreatedAtDesc(agentId);
    }

    /** GET /api/chat/buyer/{buyerId} — Buyer inbox */
    @GetMapping("/buyer/{buyerId}")
    public List<ChatMessage> getChatsForBuyer(@PathVariable Long buyerId) {
        return chatRepo.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }
}
