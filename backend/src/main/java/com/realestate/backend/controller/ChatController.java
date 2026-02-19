package com.realestate.backend.controller;

import com.realestate.backend.entity.ChatMessage;
import com.realestate.backend.repository.ChatMessageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    // ✅ SEND MESSAGE
    @PostMapping("/send")
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

    // ✅ FETCH CONVERSATION (Private - requires all 3 IDs)
    @GetMapping("/conversation")
    public List<ChatMessage> getConversation(
            @RequestParam Long propertyId,
            @RequestParam Long buyerId,
            @RequestParam Long agentId) {
        return chatRepo.findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
                propertyId, buyerId, agentId);
    }

    // ✅ AGENT INBOX (All chats for specific agent only)
    @GetMapping("/agent/{agentId}")
    public List<ChatMessage> getChatsForAgent(@PathVariable Long agentId) {
        System.out.println("Fetching chats for agentId = " + agentId);
        return chatRepo.findByAgentIdOrderByCreatedAtDesc(agentId);
    }

    // ✅ BUYER INBOX (All chats for specific buyer only)
    @GetMapping("/buyer/{buyerId}")
    public List<ChatMessage> getChatsForBuyer(@PathVariable Long buyerId) {
        System.out.println("Fetching chats for buyerId = " + buyerId);
        return chatRepo.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }
}
