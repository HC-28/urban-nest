package com.realestate.backend.controller;
import java.util.List;
import java.util.ArrayList;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;


import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.repository.SavedPropertyRepository;


import java.util.Optional;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PropertyController {

    private static final Logger logger = Logger.getLogger(PropertyController.class.getName());

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SavedPropertyRepository savedPropertyRepository;

    // ======================= PURPOSE NORMALIZER =======================
    private String normalizePurpose(String input, String title) {
        if (input == null || input.trim().isEmpty()) {
            String t = title == null ? "" : title.toLowerCase();
            if (t.contains("rent")) return "For Rent";
            return "For Sale";
        }

        String p = input.toLowerCase();
        if (p.contains("rent")) return "For Rent";
        if (p.contains("sale") || p.contains("buy")) return "For Sale";
        if (p.contains("commercial")) return "Commercial";
        if (p.contains("project")) return "Project";
        return "For Sale";
    }

    // ======================= PUBLIC PROPERTIES =======================
    @GetMapping
    public ResponseEntity<?> getAllProperties(@RequestParam(required = false) String purpose) {
        List<Property> props;

        if (purpose != null && !purpose.trim().isEmpty()) {
            String kw = purpose.toLowerCase();
            if (kw.contains("buy") || kw.contains("sale")) kw = "sale";
            if (kw.contains("rent")) kw = "rent";
            if (kw.contains("commercial")) kw = "commercial";
            props = propertyRepository.findPublicPropertiesByPurposeKeyword(kw);
        } else {
            props = propertyRepository.findPublicProperties();
        }

        props.forEach(p -> p.setPurpose(normalizePurpose(p.getPurpose(), p.getTitle())));
        return ResponseEntity.ok(props);
    }

    // ======================= AGENT PROPERTIES =======================
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAgentProperties(@PathVariable Long agentId) {
        List<Property> props = propertyRepository.findAgentProperties(agentId);
        props.forEach(p -> p.setPurpose(normalizePurpose(p.getPurpose(), p.getTitle())));
        return ResponseEntity.ok(props);
    }

    @GetMapping("/agent/all/{agentId}")
    public ResponseEntity<?> getAgentAllProperties(@PathVariable Long agentId) {
        List<Property> props = propertyRepository.findAllByAgentId(agentId);
        props.forEach(p -> p.setPurpose(normalizePurpose(p.getPurpose(), p.getTitle())));
        return ResponseEntity.ok(props);
    }

    // ======================= GET PROPERTY BY ID =======================
    @GetMapping("/{id}")
    public ResponseEntity<?> getPropertyById(@PathVariable Long id,
                                             @RequestParam(required = false) Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);

        if (property == null || property.isDeleted()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
        }

        if (!property.isListed()) {
            if (agentId == null || !property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
            }
        }

        property.setPurpose(normalizePurpose(property.getPurpose(), property.getTitle()));
        return ResponseEntity.ok(property);
    }

    // ======================= RECORD VIEW =======================
    @PostMapping("/{id}/view")
    @Transactional
    public ResponseEntity<?> recordView(@PathVariable Long id,
                                        @RequestParam(required = false) Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null || property.isDeleted()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Property not found");
        }

        propertyRepository.incrementViews(id);
        return ResponseEntity.ok(property);
    }

    // ======================= JSON PROPERTY POST (UNCHANGED) =======================
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProperty(@RequestBody Property property,
                                         @RequestParam Long agentId) {
        try {
            Optional<User> agentOpt = userRepository.findById(agentId);
            if (agentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Agent not found");
            }

            User agent = agentOpt.get();
            if (!"AGENT".equalsIgnoreCase(agent.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only agents can post properties");
            }

            property.setPurpose(normalizePurpose(property.getPurpose(), property.getTitle()));
            property.setAgentId(agent.getId());
            property.setAgentName(agent.getName());
            property.setAgentEmail(agent.getEmail());
            property.setListed(true);
            property.setDeleted(false);

            Property savedProperty = propertyRepository.save(property);
            return ResponseEntity.ok(savedProperty);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error");
        }
    }

    // ======================= 🔥 NEW MULTIPART API (ADDED – DO NOT REMOVE) =======================
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> addPropertyWithImages(
            @RequestParam Long agentId,
            @RequestParam String title,
            @RequestParam String type,
            @RequestParam double price,
            @RequestParam double area,
            @RequestParam int bhk,
            @RequestParam String pinCode,
            @RequestParam String address,
            @RequestParam String location,
            @RequestParam String purpose,
            @RequestParam String age,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) Integer totalFloors,
            @RequestPart(required = false) List<MultipartFile> photos
    ) {
        try {
            Optional<User> agentOpt = userRepository.findById(agentId);
            if (agentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Agent not found");
            }

            User agent = agentOpt.get();
            if (!"AGENT".equalsIgnoreCase(agent.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only agents can post properties");
            }

            Property property = new Property();
            property.setTitle(title);
            property.setType(type);
            property.setPrice(price);
            property.setArea(area);
            property.setBhk(bhk);
            property.setPinCode(pinCode);
            property.setAddress(address);
            property.setLocation(location);
            property.setPurpose(normalizePurpose(purpose, title));
            property.setAge(age);
            property.setAgentId(agent.getId());
            property.setAgentName(agent.getName());
            property.setAgentEmail(agent.getEmail());
            property.setListed(true);
            property.setDeleted(false);

            if (floor != null) property.setFloor(floor);
            if (totalFloors != null) property.setTotalFloors(totalFloors);

            // ✅ IMAGE SAVE LOGIC (CLEAN & SAFE)
            // ✅ IMAGE SAVE LOGIC (FIXED & VERIFIED)
            if (photos != null && !photos.isEmpty()) {

                Path uploadDir = Paths.get("uploads").toAbsolutePath();


                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }

                List<String> filenames = new ArrayList<>();

                for (MultipartFile file : photos) {
                    if (file.isEmpty()) continue;

                    String filename = System.currentTimeMillis() + "_" +
                            file.getOriginalFilename().replaceAll("\\s+", "_");

                    Path filePath = uploadDir.resolve(filename);

                    Files.copy(
                            file.getInputStream(),
                            filePath,
                            StandardCopyOption.REPLACE_EXISTING
                    );

                    filenames.add(filename);
                }

                property.setPhotos(String.join(",", filenames));
            }


            Property saved = propertyRepository.save(property);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload property");
        }
    }

    // ======================= DELETE PROPERTY =======================
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteProperty(@PathVariable Long id,
                                            @RequestParam Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.notFound().build();

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        savedPropertyRepository.deleteByProperty_Id(id);
        propertyRepository.delete(property);
        return ResponseEntity.ok("Property deleted");
    }
}
