package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    // GET ALL PROPERTIES - Public endpoint for buyers to browse all properties
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllProperties() {
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
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
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Property property, @RequestParam Long agentId) {
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
            existingProperty.setType(property.getType());
            existingProperty.setPrice(property.getPrice());
            existingProperty.setPhotos(property.getPhotos());
            existingProperty.setArea(property.getArea());
            existingProperty.setBhk(property.getBhk());

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
}

