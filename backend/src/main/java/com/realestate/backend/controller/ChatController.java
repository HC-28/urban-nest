package com.realestate.backend.controller;

import com.realestate.backend.entity.ChatMessage;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.ChatMessageRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.ChatMessageDTO;

/**
 * Chat messaging between buyers and agents.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    /** POST /api/chat/messages — Send a message */
    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageDTO>> sendMessage(@RequestBody ChatMessage message) {

        if (message.getMessage() == null || message.getMessage().trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.error("Message cannot be empty"));
        }

        if (message.getBuyerId() == null ||
                message.getAgentId() == null ||
                message.getPropertyId() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.error("Invalid chat data"));
        }

        ChatMessage saved = chatRepo.save(message);

        // Process feedback if applicable
        if ("BUYER".equals(message.getSender()) && message.getMessage() != null
                && message.getMessage().startsWith("⭐ FEEDBACK:")) {
            boolean isPositive = message.getMessage().contains("Positive");
            String reviewStatus = isPositive ? "Positive" : "Negative";

            // Update Property
            propertyRepository.findById(message.getPropertyId()).ifPresent(property -> {
                property.setReview(reviewStatus);
                propertyRepository.save(property);
            });

            // Update Agent
            userRepository.findById(message.getAgentId()).ifPresent(agent -> {
                int currentReviews = agent.getReviews();
                double currentRating = agent.getRating();
                double newScore = isPositive ? 5.0 : 1.0;

                double newRating = ((currentRating * currentReviews) + newScore) / (currentReviews + 1);

                agent.setReviews(currentReviews + 1);
                // round to 1 decimal place
                agent.setRating(Math.round(newRating * 10.0) / 10.0);

                userRepository.save(agent);
            });
        }

        return ResponseEntity.ok(ApiResponse.success(ChatMessageDTO.from(saved)));
    }

    /**
     * GET /api/chat/messages — Fetch conversation (requires propertyId, buyerId,
     * agentId)
     */
    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getConversation(
            @RequestParam Long propertyId,
            @RequestParam Long buyerId,
            @RequestParam Long agentId) {
        List<ChatMessage> conversation = chatRepo.findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
                propertyId, buyerId, agentId);
        List<ChatMessageDTO> dtos = conversation.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/chat/agent/{agentId} — Agent inbox */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getChatsForAgent(@PathVariable Long agentId) {
        List<ChatMessage> chats = chatRepo.findByAgentIdOrderByCreatedAtDesc(agentId);
        List<ChatMessageDTO> dtos = chats.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getChatsForBuyer(@PathVariable Long buyerId) {
        List<ChatMessage> chats = chatRepo.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        List<ChatMessageDTO> dtos = chats.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** POST /api/chat/seen — Mark messages as seen */
    @PostMapping("/seen")
    public ResponseEntity<ApiResponse<Void>> markAsSeen(@RequestBody Map<String, Object> payload) {
        Long propertyId = Long.valueOf(payload.get("propertyId").toString());
        Long buyerId = Long.valueOf(payload.get("buyerId").toString());
        Long agentId = Long.valueOf(payload.get("agentId").toString());
        String userRole = payload.get("userRole").toString();

        chatRepo.markAsSeen(propertyId, buyerId, agentId, userRole);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
