package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent listings and profiles.
 */
@RestController
@RequestMapping("/api/agents")
public class AgentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** GET /api/agents/ — List all agents with property statistics */
    @GetMapping("/")
    public ResponseEntity<?> getAllAgents() {
        try {
            List<AppUser> agents = userRepository.findAll().stream()
                    .filter(user -> "AGENT".equalsIgnoreCase(user.getRole()))
                    .toList();

            List<Map<String, Object>> enrichedAgents = new ArrayList<>();

            for (AppUser agent : agents) {
                Map<String, Object> agentData = new HashMap<>();

                agentData.put("id", agent.getId());
                agentData.put("name", agent.getName());
                agentData.put("email", agent.getEmail());
                agentData.put("image", agent.getProfilePicture());

                List<Property> agentProperties = propertyRepository.findByAgentId(agent.getId());

                long propertiesListed = agentProperties.size();
                long propertiesSold = agentProperties.stream()
                        .filter(prop -> !prop.isActive())
                        .count();

                agentData.put("propertiesListed", propertiesListed);
                agentData.put("propertiesSold", propertiesSold);

                // Use actual DB values instead of hardcoded fakes
                agentData.put("company", agent.getAgencyName() != null ? agent.getAgencyName() : null);
                agentData.put("city", agent.getCity() != null ? agent.getCity() : null);
                agentData.put("specialization", agent.getSpecialties() != null ? agent.getSpecialties() : null);
                agentData.put("experience", agent.getExperience() != null ? agent.getExperience() : null);
                agentData.put("phone", agent.getPhone() != null ? agent.getPhone() : null);
                agentData.put("bio", agent.getBio());
                agentData.put("isVerified", agent.isVerified());

                enrichedAgents.add(agentData);
            }

            return ResponseEntity.ok(enrichedAgents);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching agents: " + ex.getMessage()));
        }
    }

    /** GET /api/agents/{id} — Single agent profile with featured listings first */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAgentProfile(@PathVariable Long id) {
        try {
            AppUser agent = userRepository.findById(id).orElse(null);

            if (agent == null || !"AGENT".equalsIgnoreCase(agent.getRole())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Agent not found"));
            }

            List<Property> allProperties = propertyRepository.findByAgentId(id);

            List<Property> featuredProperties = allProperties.stream()
                    .filter(p -> p.isFeatured() && !p.isSold())
                    .toList();

            List<Property> otherProperties = allProperties.stream()
                    .filter(p -> !p.isFeatured() && !p.isSold())
                    .toList();

            List<Property> soldProperties = allProperties.stream()
                    .filter(Property::isSold)
                    .toList();

            long propertiesListed = allProperties.size();
            long propertiesSold = allProperties.stream()
                    .filter(prop -> !prop.isActive())
                    .count();

            Map<String, Object> response = new HashMap<>();

            response.put("id", agent.getId());
            response.put("name", agent.getName());
            response.put("email", agent.getEmail());
            response.put("phone", agent.getPhone());
            response.put("city", agent.getCity());
            response.put("profilePicture", agent.getProfilePicture());
            response.put("bio", agent.getBio());
            response.put("agencyName", agent.getAgencyName());
            response.put("specialties", agent.getSpecialties());

            response.put("propertiesListed", propertiesListed);
            response.put("propertiesSold", propertiesSold);
            response.put("experience", agent.getExperience());

            response.put("featuredProperties", featuredProperties);
            response.put("otherProperties", otherProperties);
            response.put("soldProperties", soldProperties);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching agent profile: " + ex.getMessage()));
        }
    }
}
