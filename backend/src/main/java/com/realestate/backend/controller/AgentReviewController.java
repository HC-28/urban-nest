package com.realestate.backend.controller;

import com.realestate.backend.entity.AgentReview;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.AgentReviewRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.AgentReviewDTO;

@RestController
@RequestMapping("/api/reviews")
public class AgentReviewController {

    @Autowired
    private AgentReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** GET /api/reviews/agent/{agentId} — Get all reviews for an agent */
    @GetMapping(value = "/agent/{agentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<List<AgentReviewDTO>>> getAgentReviews(@PathVariable Long agentId) {
        List<AgentReview> reviews = reviewRepository.findByAgent_Id(agentId);
        List<AgentReviewDTO> dtos = reviews.stream().map(AgentReviewDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/reviews/agent/{agentId}/stats — Get average rating and count */
    @GetMapping(value = "/agent/{agentId}/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAgentStats(@PathVariable Long agentId) {
        List<AgentReview> reviews = reviewRepository.findByAgent_Id(agentId);
        int count = reviews.size();
        double average = count > 0 ? reviews.stream().mapToDouble(AgentReview::getRating).average().orElse(0.0) : 0.0;
        return ResponseEntity.ok(ApiResponse.success(Map.of("averageRating", average, "reviewCount", count)));
    }

    /** POST /api/reviews — Submit a review */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> submitReview(@RequestBody Map<String, Object> payload) {
        Long agentId = Long.valueOf(payload.get("agentId").toString());
        Long buyerId = Long.valueOf(payload.get("buyerId").toString());
        Long propertyId = Long.valueOf(payload.get("propertyId").toString());
        int rating = Integer.parseInt(payload.get("rating").toString());
        String text = payload.getOrDefault("reviewText", "").toString();

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Rating must be between 1 and 5"));
        }

        // A buyer can only review an agent regarding a specific property once
        if (reviewRepository.existsByBuyer_IdAndProperty_Id(buyerId, propertyId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("You have already reviewed this agent for this property"));
        }

        AppUser agent = userRepository.findById(agentId).orElse(null);
        AppUser buyer = userRepository.findById(buyerId).orElse(null);
        Property property = propertyRepository.findById(propertyId).orElse(null);

        if (agent == null || buyer == null || property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Invalid references provided"));
        }

        AgentReview review = new AgentReview(agent, buyer, property, rating, text);
        reviewRepository.save(review);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Map.of("message", "Review submitted successfully")));
    }
}
