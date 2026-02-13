package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
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
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

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

    // GET ALL PROPERTIES (including inactive) - for admin purposes
    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllPropertiesIncludingInactive() {
        try {
            List<Property> properties = propertyRepository.findAll();
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // GET PROPERTIES BY AGENT ID - Get all properties posted by a specific agent
    @GetMapping(value = "/agent/{agentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertiesByAgent(@PathVariable Long agentId) {
        try {

            List<Property> properties = propertyRepository.findByAgentId(agentId);
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {

            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + ex.getMessage());
        }
    }

    // GET SINGLE PROPERTY BY ID
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyById(@PathVariable Long id) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }
            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // POST NEW PROPERTY - Agent posts a new property
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProperty(@RequestBody Property property, @RequestParam Long agentId) {
        try {
            if (property == null) {
                return ResponseEntity.badRequest().body("Invalid property data");
            }

            // Get agent details
            User agent = userRepository.findById(agentId).orElse(null);
            if (agent == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Agent not found");
            }

            // Verify user is an agent
            if (!"AGENT".equalsIgnoreCase(agent.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only agents can post properties");
            }

            // Set agent details to property
            property.setAgentId(agent.getId());
            property.setAgentName(agent.getName());
            property.setAgentEmail(agent.getEmail());
            if (property.getPinCode() != null) {
                property.setPinCode(property.getPinCode().trim());
            }
            property.setActive(true);

            Property savedProperty = propertyRepository.save(property);
            return ResponseEntity.ok(savedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // UPDATE PROPERTY - Agent updates their property
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Property property,
            @RequestParam Long agentId) {
        try {
            Property existingProperty = propertyRepository.findById(id).orElse(null);
            if (existingProperty == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify that the agent owns this property
            if (!existingProperty.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own properties");
            }

            // Update property fields
            existingProperty.setTitle(property.getTitle());
            existingProperty.setDescription(property.getDescription());
            existingProperty.setType(property.getType());
            existingProperty.setPrice(property.getPrice());
            existingProperty.setPhotos(property.getPhotos());
            existingProperty.setArea(property.getArea());
            existingProperty.setBhk(property.getBhk());
            existingProperty.setBathrooms(property.getBathrooms());
            existingProperty.setBalconies(property.getBalconies());
            existingProperty.setFloor(property.getFloor());
            existingProperty.setTotalFloors(property.getTotalFloors());
            existingProperty.setFacing(property.getFacing());
            existingProperty.setFurnishing(property.getFurnishing());
            existingProperty.setAge(property.getAge());
            existingProperty.setCity(property.getCity());
            existingProperty.setLocation(property.getLocation());
            existingProperty.setAddress(property.getAddress());
            existingProperty.setAmenities(property.getAmenities());
            existingProperty.setPinCode(property.getPinCode() != null ? property.getPinCode().trim() : null);

            Property updatedProperty = propertyRepository.save(existingProperty);
            return ResponseEntity.ok(updatedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // DELETE PROPERTY - Agent deletes their property (soft delete)
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteProperty(@PathVariable Long id, @RequestParam Long agentId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify that the agent owns this property
            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own properties");
            }

            // Soft delete - mark as inactive
            property.setActive(false);
            propertyRepository.save(property);

            return ResponseEntity.ok("Property deleted successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // MARK PROPERTY AS SOLD
    @PutMapping(value = "/{id}/sold", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> markPropertyAsSold(@PathVariable Long id, @RequestParam Long agentId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }

            // Verify that the agent owns this property
            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own properties");
            }

            property.setActive(false);
            propertyRepository.save(property);

            return ResponseEntity.ok("Property marked as sold");
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
