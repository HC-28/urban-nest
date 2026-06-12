package com.realestate.backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import com.realestate.backend.dto.ApiResponse;

/**
 * Controller serving GeoJSON map boundary data for supported cities.
 * Uses InputStream reading to guarantee compatibility when packaged in a JAR/WAR.
 */
@RestController
@RequestMapping("/api/map")
public class MapController {

    /**
     * GET /api/map/{city}
     * Returns GeoJSON boundaries for the requested city (e.g. ahmedabad, mumbai, bangalore)
     */
    @GetMapping(value = "/{city}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<String>> getCityMap(@PathVariable String city) {
        if (city == null || city.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("City name cannot be empty"));
        }

        String sanitizedCity = city.toLowerCase().replaceAll("[^a-z0-9]", "");
        Resource resource = new ClassPathResource("geo/" + sanitizedCity + ".geojson");

        if (!resource.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Map boundary data not found for city: " + city));
        }

        try (InputStream inputStream = resource.getInputStream()) {
            String geoJson = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            return ResponseEntity.ok(ApiResponse.success(geoJson));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to read map data: " + e.getMessage()));
        }
    }

    /**
     * GET /api/map/ahmedabad (legacy backwards-compatible route)
     */
    @GetMapping(value = "/ahmedabad", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<String>> getAhmedabadMap() {
        return getCityMap("ahmedabad");
    }
}
