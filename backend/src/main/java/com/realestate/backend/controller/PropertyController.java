package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "${app.frontend-url}", allowCredentials = "true")
public class PropertyController {

    @Autowired
    private com.realestate.backend.service.AnalyticsService analyticsService;

    @Autowired
    private PropertyRepository propertyRepository;

    // ... existing autowires ...

    // GET ALL PROPERTIES - Public endpoint for buyers to browse all properties
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllProperties() {
        System.out.println("getAllProperties method called");
        try {
            List<Property> properties = propertyRepository.findByIsActiveTrue();
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ... existing endpoints ...

    // GET SINGLE PROPERTY BY ID
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyById(@PathVariable Long id) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Track view asynchronously
            try {
                analyticsService.trackView(id);
            } catch (Exception e) {
                System.err.println("Failed to track view: " + e.getMessage());
            }

            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ... addProperty, updateProperty, deleteProperty, markPropertyAsSold,
    // relistProperty ...

    // GET HEATMAP DATA
    @GetMapping(value = "/heatmap", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getHeatmapData(@RequestParam String city,
            @RequestParam(defaultValue = "price") String mode) {
        try {
            List<Map<String, Object>> data = analyticsService.getHeatmapData(city, mode);
            return ResponseEntity.ok(data);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // GET property counts by pinCode for map with dynamic city support
    @GetMapping(value = "/countByPincode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyCountByPincode(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) String type) {
        try {
            List<Object[]> results;

            // Determine which query to use based on provided parameters
            boolean hasCity = city != null && !city.isEmpty();
            boolean hasPurpose = purpose != null && !purpose.isEmpty();
            boolean hasType = type != null && !type.isEmpty();

            if (hasCity && hasPurpose && hasType) {
                // City + Purpose + Type
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeAndType(city, purpose,
                        type);
            } else if (hasCity && hasPurpose) {
                // City + Purpose
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurpose(city, purpose);
            } else if (hasCity && hasType) {
                // City + Type
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndType(city, type);
            } else if (hasCity) {
                // City only
                results = propertyRepository.countActivePropertiesByPinCodeAndCity(city);
            } else if (hasPurpose && hasType) {
                // Purpose + Type (no city)
                results = propertyRepository.countActivePropertiesByPinCodeAndPurposeAndType(purpose, type);
            } else if (hasPurpose) {
                // Purpose only (no city)
                results = propertyRepository.countActivePropertiesByPinCodeAndPurpose(purpose);
            } else if (hasType) {
                // Type only (no city)
                results = propertyRepository.countActivePropertiesByPinCodeAndType(type);
            } else {
                // No filters - all properties
                results = propertyRepository.countActivePropertiesByPinCode();
            }

            Map<String, Map<String, Object>> map = new HashMap<>();
            for (Object[] row : results) {
                String pinCode = row[0].toString();
                Long count = (Long) row[1];
                Double avgPricePerSqFt = row[2] != null ? (Double) row[2] : 0.0;

                Map<String, Object> data = new HashMap<>();
                data.put("count", count);
                data.put("avgPrice", Math.round(avgPricePerSqFt * 100.0) / 100.0);

                map.put(pinCode, data);
            }
            return ResponseEntity.ok(map);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // TOGGLE FEATURED STATUS - Agent can feature/unfeature properties (max 3)
    @PutMapping(value = "/{id}/feature", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> toggleFeaturedStatus(@PathVariable Long id, @RequestParam Long agentId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify that the agent owns this property
            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only feature your own properties");
            }

            // If trying to feature a property
            if (!property.isFeatured()) {
                // Check how many properties this agent has already featured
                List<Property> featuredProperties = propertyRepository.findByAgentId(agentId).stream()
                        .filter(Property::isFeatured)
                        .toList();

                if (featuredProperties.size() >= 3) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("You can only feature up to 3 properties. Please unfeature one first.");
                }

                property.setFeatured(true);
            } else {
                // Unfeaturing
                property.setFeatured(false);
            }

            propertyRepository.save(property);

            Map<String, Object> response = new HashMap<>();
            response.put("message",
                    property.isFeatured() ? "Property featured successfully" : "Property unfeatured successfully");
            response.put("isFeatured", property.isFeatured());

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }
}
