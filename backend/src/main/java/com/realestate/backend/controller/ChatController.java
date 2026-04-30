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
import com.realestate.backend.util.SecurityUtils;
import org.springframework.http.HttpStatus;

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

    @Autowired
    private SecurityUtils securityUtils;

    private boolean isAdmin() {
        return securityUtils.hasRole("ADMIN");
    }

    /** POST /api/chat/messages — Send a message */
    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageDTO>> sendMessage(@RequestBody ChatMessage message) {

        if (message.getMessage() == null || message.getMessage().trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.error("Message cannot be empty"));
        }

        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (authId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));

        // Centralize identity: Set the participant ID based on the authenticated user and their declared sender role
        if ("BUYER".equals(message.getSender())) {
            message.setBuyerId(authId);
            if (message.getAgentId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("agentId is required for buyer messages"));
            }
        } else if ("AGENT".equals(message.getSender())) {
            message.setAgentId(authId);
            if (message.getBuyerId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("buyerId is required for agent messages"));
            }
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid sender role"));
        }

        if (message.getPropertyId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("propertyId is required"));
        }

        ChatMessage saved = chatRepo.save(message);

        // Process reviews/feedback automatically if the message follows the pattern
        if ("BUYER".equals(message.getSender()) && message.getMessage().startsWith("⭐ FEEDBACK:")) {
            boolean isPositive = message.getMessage().contains("Positive");
            String reviewStatus = isPositive ? "Positive" : "Negative";

            propertyRepository.findById(message.getPropertyId()).ifPresent(property -> {
                property.setReview(reviewStatus);
                propertyRepository.save(property);
            });

            userRepository.findById(message.getAgentId()).ifPresent(agent -> {
                int currentReviews = agent.getReviews();
                double currentRating = agent.getRating();
                double newScore = isPositive ? 5.0 : 1.0;
                double newRating = ((currentRating * currentReviews) + newScore) / (currentReviews + 1);
                agent.setReviews(currentReviews + 1);
                agent.setRating(Math.round(newRating * 10.0) / 10.0);
                userRepository.save(agent);
            });
        }

        return ResponseEntity.ok(ApiResponse.success(ChatMessageDTO.from(saved)));
    }

    /**
     * GET /api/chat/messages — Fetch conversation
     */
    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getConversation(
            @RequestParam Long propertyId,
            @RequestParam(required = false) Long buyerId,
            @RequestParam(required = false) Long agentId) {
        
        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (authId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));

        Long effectiveBuyerId = buyerId;
        Long effectiveAgentId = agentId;

        // If not admin, one of the IDs MUST be inferred from session if missing, or validated if present
        if (!isAdmin()) {
            if (securityUtils.hasRole("AGENT")) {
                effectiveAgentId = authId;
                if (effectiveBuyerId == null) return ResponseEntity.badRequest().body(ApiResponse.error("buyerId required for agents"));
            } else {
                // Assume BUYER if not AGENT/ADMIN
                effectiveBuyerId = authId;
                if (effectiveAgentId == null) return ResponseEntity.badRequest().body(ApiResponse.error("agentId required for buyers"));
            }
        }

        // Final safety check: ensuring the user is actually one of the requested participants
        if (!isAdmin() && !authId.equals(effectiveBuyerId) && !authId.equals(effectiveAgentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied to this conversation"));
        }

        List<ChatMessage> conversation = chatRepo.findByPropertyIdAndBuyerIdAndAgentIdOrderByCreatedAtAsc(
                propertyId, effectiveBuyerId, effectiveAgentId);
        List<ChatMessageDTO> dtos = conversation.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/chat/agent/me — Agent inbox (session-based) */
    @GetMapping("/agent/me")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getMyChatsAsAgent() {
        Long agentId = SecurityUtils.getAuthenticatedUserId();
        if (agentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));
        
        List<ChatMessage> chats = chatRepo.findByAgentIdOrderByCreatedAtDesc(agentId);
        List<ChatMessageDTO> dtos = chats.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/chat/buyer/me — Buyer inbox (session-based) */
    @GetMapping("/buyer/me")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getMyChatsAsBuyer() {
        Long buyerId = SecurityUtils.getAuthenticatedUserId();
        if (buyerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));

        List<ChatMessage> chats = chatRepo.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        List<ChatMessageDTO> dtos = chats.stream().map(ChatMessageDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** POST /api/chat/seen — Mark messages as seen (hardened) */
    @PostMapping("/seen")
    public ResponseEntity<ApiResponse<Void>> markAsSeen(@RequestBody Map<String, Object> payload) {
        Long propertyId = Long.valueOf(payload.get("propertyId").toString());
        String userRole = payload.get("userRole").toString();
        
        Long authId = SecurityUtils.getAuthenticatedUserId();
        if (authId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Login required"));

        Long buyerIdParam = payload.get("buyerId") != null ? Long.valueOf(payload.get("buyerId").toString()) : null;
        Long agentIdParam = payload.get("agentId") != null ? Long.valueOf(payload.get("agentId").toString()) : null;

        Long effectiveBuyerId = buyerIdParam;
        Long effectiveAgentId = agentIdParam;

        if ("BUYER".equals(userRole)) {
            effectiveBuyerId = authId;
            if (effectiveAgentId == null) return ResponseEntity.badRequest().body(ApiResponse.error("agentId required"));
        } else if ("AGENT".equals(userRole)) {
            effectiveAgentId = authId;
            if (effectiveBuyerId == null) return ResponseEntity.badRequest().body(ApiResponse.error("buyerId required"));
        }

        // Security check
        if (!isAdmin() && !authId.equals(effectiveBuyerId) && !authId.equals(effectiveAgentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        chatRepo.markAsSeen(propertyId, effectiveBuyerId, effectiveAgentId, userRole);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
