package com.realestate.backend.controller;

import com.realestate.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.realestate.backend.dto.ApiResponse;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHeatmapData(
            @PathVariable String city,
            @RequestParam(required = false, defaultValue = "price") String mode,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String purpose) {
        // Dynamic heatmap fetch based on city, mode, and optional property filters
        List<Map<String, Object>> heatmapData = analyticsService.getHeatmapData(city, mode, type, purpose);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "city", city,
                "mode", mode,
                "data", heatmapData)));
    }

    /** POST /api/analytics/compute/{city} — Trigger score computation */
    @PostMapping("/compute/{city}")
    public ResponseEntity<ApiResponse<Map<String, String>>> computeScores(@PathVariable String city) {
        analyticsService.computeScoresForCity(city);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "Scores computed successfully for " + city,
                "city", city)));
    }

    /** POST /api/analytics/track/view/{propertyId} — Track a property view */
    @PostMapping("/track/view/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> trackView(
            @PathVariable Long propertyId,
            @RequestParam(required = false) Long userId) {
        if (userId != null) {
            analyticsService.trackView(propertyId, userId);
        } else {
            analyticsService.trackView(propertyId);
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "View tracked")));
    }

    /** GET /api/analytics/recent — Recently viewed properties for a user */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<?>>> getRecentlyViewed(@RequestParam Long userId) {
        List<?> properties = analyticsService.getRecentlyViewedProperties(userId);
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    /** POST /api/analytics/track/inquiry/{propertyId} — Track a property inquiry */
    @PostMapping("/track/inquiry/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> trackInquiry(@PathVariable Long propertyId) {
        analyticsService.trackInquiry(propertyId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Inquiry tracked")));
    }
}
