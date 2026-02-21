package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.PropertyRepository;

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
            // Only return properties that are active and NOT sold
            List<Property> properties = propertyRepository.findByIsActiveTrueAndIsSoldFalse();
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // GET FEATURED PROPERTIES (for Home page)
    @GetMapping(value = "/featured", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFeaturedProperties() {
        try {
            // Only return active, NOT sold, and featured properties
            List<Property> featuredProperties = propertyRepository.findByIsActiveTrueAndIsSoldFalse().stream()
                    .filter(Property::isFeatured)
                    .toList();
            return ResponseEntity.ok(featuredProperties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // GET PROPERTIES BY AGENT ID - For agent dashboard
    @GetMapping(value = "/agent/{agentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPropertiesByAgent(@PathVariable Long agentId) {
        try {
            List<Property> properties = propertyRepository.findByAgentId(agentId);
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ... existing endpoints ...

    // GET SINGLE PROPERTY BY ID
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyById(@PathVariable Long id, @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role) {
        if (id == null)
            return ResponseEntity.badRequest().body("ID is required");
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // --- SOLD VISIBILITY CHECK ---
            // If property is sold, only allow: Admin, Selling Agent, or Buyer who bought it
            if (property.isSold()) {
                boolean isAllowed = false;

                if (role != null && role.equalsIgnoreCase("ADMIN")) {
                    isAllowed = true;
                } else if (userId != null) {
                    if (userId.equals(property.getAgentId())) {
                        isAllowed = true; // Selling Agent
                    } else if (userId.equals(property.getSoldToUserId())) {
                        isAllowed = true; // Winning Buyer
                    }
                }

                if (!isAllowed) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("This property is SOLD and no longer publicly available.");
                }
            }

            // Track view asynchronously (only for active, unsold properties)
            if (!property.isSold() && property.isActive()) {
                try {
                    analyticsService.trackView(id);
                } catch (Exception e) {
                    System.err.println("Failed to track view: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ADD NEW PROPERTY
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProperty(@RequestBody Property property, @RequestParam Long agentId) {
        if (agentId == null) {
            return ResponseEntity.badRequest().body("Agent ID is required");
        }
        try {
            property.setAgentId(agentId);
            // Additional fields logic if needed (e.g. agent name/email)
            // For now, assume they are passed or handled by service
            Property savedProperty = propertyRepository.save(property);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error while adding property");
        }
    }

    // UPDATE PROPERTY
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Property updatedProperty,
            @RequestParam Long agentId) {
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body("IDs are required");
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify ownership
            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own properties");
            }

            // Update fields
            if (updatedProperty.getTitle() != null)
                property.setTitle(updatedProperty.getTitle());
            if (updatedProperty.getDescription() != null)
                property.setDescription(updatedProperty.getDescription());
            if (updatedProperty.getType() != null)
                property.setType(updatedProperty.getType());
            if (updatedProperty.getPrice() > 0)
                property.setPrice(updatedProperty.getPrice());
            if (updatedProperty.getArea() > 0)
                property.setArea(updatedProperty.getArea());
            if (updatedProperty.getPhotos() != null)
                property.setPhotos(updatedProperty.getPhotos());
            if (updatedProperty.getBhk() > 0)
                property.setBhk(updatedProperty.getBhk());
            if (updatedProperty.getBathrooms() > 0)
                property.setBathrooms(updatedProperty.getBathrooms());
            if (updatedProperty.getBalconies() >= 0)
                property.setBalconies(updatedProperty.getBalconies());
            if (updatedProperty.getFloor() != null)
                property.setFloor(updatedProperty.getFloor());
            if (updatedProperty.getTotalFloors() != null)
                property.setTotalFloors(updatedProperty.getTotalFloors());
            if (updatedProperty.getFacing() != null)
                property.setFacing(updatedProperty.getFacing());
            if (updatedProperty.getFurnishing() != null)
                property.setFurnishing(updatedProperty.getFurnishing());
            if (updatedProperty.getAge() != null)
                property.setAge(updatedProperty.getAge());
            if (updatedProperty.getCity() != null)
                property.setCity(updatedProperty.getCity());
            if (updatedProperty.getLocation() != null)
                property.setLocation(updatedProperty.getLocation());
            if (updatedProperty.getAddress() != null)
                property.setAddress(updatedProperty.getAddress());
            if (updatedProperty.getPinCode() != null)
                property.setPinCode(updatedProperty.getPinCode());
            if (updatedProperty.getAmenities() != null)
                property.setAmenities(updatedProperty.getAmenities());
            if (updatedProperty.getPurpose() != null)
                property.setPurpose(updatedProperty.getPurpose());

            Property savedProperty = propertyRepository.save(property);
            return ResponseEntity.ok(savedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error while updating property");
        }
    }

    // DELETE PROPERTY (Soft delete by setting isActive to false)
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteProperty(@PathVariable Long id, @RequestParam Long agentId) {
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body("IDs are required");
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify ownership
            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own properties");
            }

            property.setActive(false);
            propertyRepository.save(property);
            return ResponseEntity.ok(Map.of("message", "Property removed from listings"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // MARK AS SOLD
    @PutMapping(value = "/{id}/sold", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> markPropertyAsSold(@PathVariable Long id, @RequestParam Long agentId,
            @RequestParam(required = false) Long buyerId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
            }

            property.setSold(true);
            property.setSoldAt(java.time.LocalDateTime.now());
            if (buyerId != null) {
                property.setSoldToUserId(buyerId);
            }

            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // RELIST PROPERTY
    @PutMapping(value = "/{id}/relist", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> relistProperty(@PathVariable Long id, @RequestParam Long agentId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
            }

            property.setSold(false);
            property.setSoldAt(null);
            property.setSoldToUserId(null);
            property.setActive(true);

            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // GET TOP 5 PROPERTIES BY PINCODE (for Map Mini-Panel)
    @GetMapping(value = "/top", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getTopProperties(@RequestParam String pincode,
            @RequestParam(defaultValue = "price") String mode) {
        try {
            List<Property> properties;
            switch (mode) {
                case "inventory":
                    // Newest listings first
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByListedDateDesc(pincode);
                    break;
                case "market_activity":
                case "demand":
                    // Most viewed/active
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByViewsDesc(pincode);
                    break;
                case "buyer_opportunity":
                    // Lowest price (best opportunity)
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceAsc(pincode);
                    break;
                case "price":
                default:
                    // Highest price (luxury/premium) or default
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceDesc(pincode);
                    break;
            }
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

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
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body("IDs are required");
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

    // ============================================================
    // ADMIN ENDPOINTS
    // ============================================================

    /** GET ALL properties including inactive/deleted (Admin only) */
    @GetMapping("/admin/all")
    @Transactional(readOnly = true)
    public ResponseEntity<?> adminGetAllProperties() {
        try {
            return ResponseEntity.ok(propertyRepository.findAll());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Admin update any property */
    @PutMapping(value = "/admin/update/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> adminUpdateProperty(@PathVariable Long id, @RequestBody Property updatedProperty) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");

            if (updatedProperty.getTitle() != null)
                property.setTitle(updatedProperty.getTitle());
            if (updatedProperty.getPrice() > 0)
                property.setPrice(updatedProperty.getPrice());
            if (updatedProperty.getLocation() != null)
                property.setLocation(updatedProperty.getLocation());
            if (updatedProperty.getArea() > 0)
                property.setArea(updatedProperty.getArea());
            if (updatedProperty.getBhk() > 0)
                property.setBhk(updatedProperty.getBhk());

            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Admin hard-delete a property */
    @DeleteMapping("/admin/delete/{id}")
    public ResponseEntity<?> adminDeleteProperty(@PathVariable Long id) {
        try {
            if (!propertyRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }
            propertyRepository.deleteById(id);
            return ResponseEntity.ok("Property deleted successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    /** Admin toggle property listing status */
    @PutMapping("/admin/toggle/{id}")
    public ResponseEntity<?> adminToggleListing(@PathVariable Long id) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            property.setActive(!property.isActive());
            propertyRepository.save(property);
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }
}
