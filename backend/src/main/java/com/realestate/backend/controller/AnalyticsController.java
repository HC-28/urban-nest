package com.realestate.backend.controller;

import com.realestate.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${app.frontend-url}", allowCredentials = "true")
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * GET HEATMAP DATA FOR A CITY
     * Returns pincode scores for visualization
     * 
     * @param city     The city name
     * @param mode     The heatmap mode (price, market_activity, inventory,
     *                 buyer_opportunity, demand, liquidity, growth, saturation,
     *                 conversion)
     * @param userType Optional user type (buyer or agent) - affects default mode
     */
    @GetMapping("/heatmap/{city}")
    public ResponseEntity<?> getHeatmapData(
            @PathVariable String city,
            @RequestParam(required = false, defaultValue = "price") String mode,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String type) {
        try {
            // Set default mode based on user type if not specified
            if (mode.equals("price") && userType != null) {
                mode = userType.equalsIgnoreCase("agent") ? "demand" : "price";
            }

            List<Map<String, Object>> heatmapData = analyticsService.getHeatmapData(city, mode, type);

            return ResponseEntity.ok(Map.of(
                    "city", city,
                    "mode", mode,
                    "data", heatmapData));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching heatmap data: " + ex.getMessage());
        }
    }

    /**
     * COMPUTE SCORES FOR A CITY
     * Triggers score computation for all pincodes in a city
     * This can be called manually or scheduled
     */
    @PostMapping("/compute/{city}")
    public ResponseEntity<?> computeScores(@PathVariable String city) {
        try {
            analyticsService.computeScoresForCity(city);
            return ResponseEntity.ok(Map.of(
                    "message", "Scores computed successfully for " + city,
                    "city", city));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error computing scores: " + ex.getMessage());
        }
    }

    /**
     * TRACK PROPERTY VIEW
     * Increments view count when a user views a property
     */
    @PostMapping("/track/view/{propertyId}")
    public ResponseEntity<?> trackView(
            @PathVariable Long propertyId,
            @RequestParam(required = false) Long userId) {
        try {
            if (userId != null) {
                analyticsService.trackView(propertyId, userId);
            } else {
                analyticsService.trackView(propertyId);
            }
            return ResponseEntity.ok(Map.of("message", "View tracked"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error tracking view: " + ex.getMessage());
        }
    }

    /**
     * GET RECENTLY VIEWED PROPERTIES
     * Returns top 5 recently viewed properties for a user
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentlyViewed(@RequestParam Long userId) {
        try {
            List<?> properties = analyticsService.getRecentlyViewedProperties(userId);
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching recent views: " + ex.getMessage());
        }
    }

    /**
     * TRACK PROPERTY INQUIRY
     * Increments inquiry count when a user sends an inquiry/message
     */
    @PostMapping("/track/inquiry/{propertyId}")
    public ResponseEntity<?> trackInquiry(@PathVariable Long propertyId) {
        try {
            analyticsService.trackInquiry(propertyId);
            return ResponseEntity.ok(Map.of("message", "Inquiry tracked"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error tracking inquiry: " + ex.getMessage());
        }
    }
}
