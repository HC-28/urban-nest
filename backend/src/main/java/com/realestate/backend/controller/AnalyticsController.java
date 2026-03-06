package com.realestate.backend.controller;

import com.realestate.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Analytics: heatmap data, view tracking, inquiry tracking, recently viewed.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /** GET /api/analytics/heatmap/{city} — Heatmap data for a city */
    @GetMapping("/heatmap/{city}")
    public ResponseEntity<?> getHeatmapData(
            @PathVariable String city,
            @RequestParam(required = false, defaultValue = "price") String mode,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String type) {
        try {
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
                    .body(Map.of("error", "Error fetching heatmap data: " + ex.getMessage()));
        }
    }

    /** POST /api/analytics/compute/{city} — Trigger score computation */
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
                    .body(Map.of("error", "Error computing scores: " + ex.getMessage()));
        }
    }

    /** POST /api/analytics/track/view/{propertyId} — Track a property view */
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
                    .body(Map.of("error", "Error tracking view: " + ex.getMessage()));
        }
    }

    /** GET /api/analytics/recent — Recently viewed properties for a user */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentlyViewed(@RequestParam Long userId) {
        try {
            List<?> properties = analyticsService.getRecentlyViewedProperties(userId);
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching recent views: " + ex.getMessage()));
        }
    }

    /** POST /api/analytics/track/inquiry/{propertyId} — Track a property inquiry */
    @PostMapping("/track/inquiry/{propertyId}")
    public ResponseEntity<?> trackInquiry(@PathVariable Long propertyId) {
        try {
            analyticsService.trackInquiry(propertyId);
            return ResponseEntity.ok(Map.of("message", "Inquiry tracked"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error tracking inquiry: " + ex.getMessage()));
        }
    }
}
