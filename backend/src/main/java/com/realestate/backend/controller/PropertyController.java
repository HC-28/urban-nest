package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.PropertyRepository;

import com.realestate.backend.entity.Appointment;
import com.realestate.backend.entity.ChatMessage;
import com.realestate.backend.entity.Favorite;
import com.realestate.backend.repository.AppointmentRepository;
import com.realestate.backend.repository.ChatMessageRepository;
import com.realestate.backend.repository.FavoriteRepository;
import com.realestate.backend.repository.AgentSlotRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Public and agent-facing property endpoints.
 * Admin property operations are in AdminController.
 */
@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private com.realestate.backend.service.AnalyticsService analyticsService;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private AgentSlotRepository agentSlotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Extract the authenticated user's ID from the JWT token (stored in
     * SecurityContext).
     * Returns null if no authentication is present.
     * Validates that the caller has ROLE_AGENT or ROLE_ADMIN.
     */
    private Long getAuthenticatedAgentId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getCredentials() == null)
            return null;
        // credentials stores userId (set by JwtAuthenticationFilter)
        try {
            return (Long) auth.getCredentials();
        } catch (ClassCastException e) {
            return null;
        }
    }

    private boolean isAgentOrAdmin() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_AGENT") || a.getAuthority().equals("ROLE_ADMIN"));
    }

    /** GET /api/properties — All active, unsold properties with optional filters */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer bhk,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) List<String> amenities) {
        try {
            List<Property> properties = propertyRepository.findByIsActiveTrueAndIsSoldFalse();

            // Server-side filtering
            if (city != null && !city.isBlank()) {
                String c = city.toLowerCase();
                properties = properties.stream()
                        .filter(p -> p.getCity() != null && p.getCity().toLowerCase().equals(c))
                        .toList();
            }
            if (type != null && !type.isBlank()) {
                String t = type.toLowerCase();
                properties = properties.stream()
                        .filter(p -> p.getType() != null && p.getType().toLowerCase().equals(t))
                        .toList();
            }
            if (purpose != null && !purpose.isBlank()) {
                String pu = purpose.toLowerCase();
                properties = properties.stream()
                        .filter(p -> {
                            String pp = p.getPurpose() != null ? p.getPurpose().toLowerCase() : "sale";
                            return pp.contains(pu) || pu.contains(pp);
                        })
                        .toList();
            }
            if (minPrice != null) {
                properties = properties.stream()
                        .filter(p -> p.getPrice() >= minPrice)
                        .toList();
            }
            if (maxPrice != null) {
                properties = properties.stream()
                        .filter(p -> p.getPrice() <= maxPrice)
                        .toList();
            }
            if (bhk != null && bhk > 0) {
                properties = properties.stream()
                        .filter(p -> p.getBhk() == bhk)
                        .toList();
            }
            if (pincode != null && !pincode.isBlank()) {
                properties = properties.stream()
                        .filter(p -> pincode.equals(p.getPinCode()))
                        .toList();
            }
            if (search != null && !search.isBlank()) {
                String s = search.toLowerCase();
                properties = properties.stream()
                        .filter(p -> {
                            String title = p.getTitle() != null ? p.getTitle().toLowerCase() : "";
                            String loc = p.getLocation() != null ? p.getLocation().toLowerCase() : "";
                            String desc = p.getDescription() != null ? p.getDescription().toLowerCase() : "";
                            return title.contains(s) || loc.contains(s) || desc.contains(s);
                        })
                        .toList();
            }
            if (amenities != null && !amenities.isEmpty()) {
                properties = properties.stream()
                        .filter(p -> {
                            if (p.getAmenities() == null || p.getAmenities().isBlank())
                                return false;
                            String propAmenities = p.getAmenities().toLowerCase();
                            // Property must contain all requested amenities to match
                            return amenities.stream().allMatch(a -> propAmenities.contains(a.toLowerCase()));
                        })
                        .toList();
            }

            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/properties/featured — Featured properties for home page */
    @GetMapping(value = "/featured", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFeaturedProperties() {
        try {
            List<Property> featuredProperties = propertyRepository.findByIsActiveTrueAndIsSoldFalse().stream()
                    .filter(Property::isFeatured)
                    .toList();
            return ResponseEntity.ok(featuredProperties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/properties/agent/{agentId} — Properties by agent (for dashboard) */
    @GetMapping(value = "/agent/{agentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPropertiesByAgent(@PathVariable Long agentId) {
        try {
            List<Property> properties = propertyRepository.findByAgentId(agentId);
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/properties/{id} — Single property by ID */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyById(@PathVariable Long id, @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role) {
        if (id == null)
            return ResponseEntity.badRequest().body(Map.of("error", "ID is required"));
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }

            // Sold visibility check
            if (property.isSold()) {
                boolean isAllowed = false;
                if (role != null && role.equalsIgnoreCase("ADMIN")) {
                    isAllowed = true;
                } else if (userId != null) {
                    if (userId.equals(property.getAgentId())) {
                        isAllowed = true;
                    } else if (userId.equals(property.getSoldToUserId())) {
                        isAllowed = true;
                    }
                }
                if (!isAllowed) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "This property is SOLD and no longer publicly available."));
                }
            }

            // Track view for active, unsold properties
            if (!property.isSold() && property.isActive()) {
                try {
                    analyticsService.trackView(id, userId);
                } catch (Exception ignored) {
                    // Non-critical: don't fail the request if tracking fails
                }
            }

            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** POST /api/properties — Add new property */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProperty(@RequestBody Property property, @RequestParam Long agentId) {
        if (agentId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Agent ID is required"));
        }
        try {
            // Server-side role validation: ensure caller is AGENT or ADMIN
            if (!isAgentOrAdmin()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only agents can post properties"));
            }
            // Verify the JWT user matches the agentId param (admins can post on behalf)
            Long authenticatedId = getAuthenticatedAgentId();
            if (authenticatedId != null && !authenticatedId.equals(agentId)) {
                var auth = org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
                boolean isAdmin = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (!isAdmin) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "You can only post properties under your own account"));
                }
            }
            property.setAgentId(agentId);
            Property savedProperty = propertyRepository.save(property);

            if (savedProperty.getCity() != null) {
                analyticsService.computeScoresForCity(savedProperty.getCity());
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(savedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error while adding property"));
        }
    }

    /** PUT /api/properties/{id} — Update property (agent only) */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Property updatedProperty,
            @RequestParam Long agentId) {
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body(Map.of("error", "IDs are required"));
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only update your own properties"));
            }

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
            if (updatedProperty.getLatitude() != null)
                property.setLatitude(updatedProperty.getLatitude());
            if (updatedProperty.getLongitude() != null)
                property.setLongitude(updatedProperty.getLongitude());

            Property savedProperty = propertyRepository.save(property);

            if (savedProperty.getCity() != null) {
                analyticsService.computeScoresForCity(savedProperty.getCity());
            }

            return ResponseEntity.ok(savedProperty);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error while updating property"));
        }
    }

    /** DELETE /api/properties/{id} — Soft delete (set isActive to false) */
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteProperty(@PathVariable Long id, @RequestParam Long agentId) {
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body(Map.of("error", "IDs are required"));
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only delete your own properties"));
            }

            property.setActive(false);
            propertyRepository.save(property);

            if (property.getCity() != null) {
                analyticsService.computeScoresForCity(property.getCity());
            }

            return ResponseEntity.ok(Map.of("message", "Property removed from listings"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** PUT /api/properties/{id}/sold — Mark property as sold */
    @PutMapping(value = "/{id}/sold", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> markPropertyAsSold(@PathVariable Long id, @RequestParam Long agentId,
            @RequestParam(required = false) Long buyerId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not authorized"));
            }

            property.setSold(true);
            property.setSoldAt(LocalDateTime.now());
            if (buyerId != null) {
                property.setSoldToUserId(buyerId);
            }
            property.setActive(false);

            propertyRepository.save(property);

            // Cancel any active appointments and free slots
            List<String> activeStatuses = Arrays.asList("pending", "confirmed", "awaiting_buyer", "awaiting_agent");
            List<Appointment> pendingAppointments = appointmentRepository.findByPropertyIdAndStatusIn(id,
                    activeStatuses);

            Set<String> notifyEmails = new HashSet<>();

            for (Appointment appt : pendingAppointments) {
                appt.setStatus("cancelled");
                appointmentRepository.save(appt);
                if (appt.getSlotId() != null) {
                    agentSlotRepository.findById(appt.getSlotId()).ifPresent(s -> {
                        s.setBooked(false);
                        agentSlotRepository.save(s);
                    });
                }
                if (appt.getBuyerEmail() != null) {
                    notifyEmails.add(appt.getBuyerEmail());
                }
            }

            // Also find all favoriters
            List<Favorite> favorites = favoriteRepository.findByProperty_Id(id);
            for (Favorite fav : favorites) {
                userRepository.findById(fav.getUser().getId()).ifPresent(u -> {
                    if (u.getEmail() != null)
                        notifyEmails.add(u.getEmail());
                });
            }

            // Also find all chatters
            List<ChatMessage> chats = chatMessageRepository.findByPropertyId(id);
            for (ChatMessage chat : chats) {
                userRepository.findById(chat.getBuyerId()).ifPresent(u -> {
                    if (u.getEmail() != null)
                        notifyEmails.add(u.getEmail());
                });
            }

            // Exclude the actual winner if a buyerId was passed
            if (buyerId != null) {
                userRepository.findById(buyerId).ifPresent(winner -> notifyEmails.remove(winner.getEmail()));
            }

            if (!notifyEmails.isEmpty()) {
                emailService.sendSoldNotificationToInquirers(new ArrayList<>(notifyEmails), property.getTitle());
            }

            if (property.getCity() != null) {
                analyticsService.computeScoresForCity(property.getCity());
            }

            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** PUT /api/properties/{id}/relist — Relist a property */
    @PutMapping(value = "/{id}/relist", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> relistProperty(@PathVariable Long id, @RequestParam Long agentId) {
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null)
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not authorized"));
            }

            property.setSold(false);
            property.setSoldAt(null);
            property.setSoldToUserId(null);
            property.setActive(true);

            propertyRepository.save(property);

            if (property.getCity() != null) {
                analyticsService.computeScoresForCity(property.getCity());
            }

            return ResponseEntity.ok(property);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * GET /api/properties/top — Top 5 properties by pincode (for map mini-panel)
     */
    @GetMapping(value = "/top", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getTopProperties(@RequestParam String pincode,
            @RequestParam(defaultValue = "price") String mode) {
        try {
            List<Property> properties;
            switch (mode) {
                case "inventory":
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByListedDateDesc(pincode);
                    break;
                case "market_activity":
                case "demand":
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByViewsDesc(pincode);
                    break;
                case "buyer_opportunity":
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceAsc(pincode);
                    break;
                case "liquidity":
                    // Liquidity = fast-selling areas → show newest listings (recently listed =
                    // active market)
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByListedDateDesc(pincode);
                    break;
                case "saturation":
                    // Saturation = competition level → show most viewed (competitive) properties
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByViewsDesc(pincode);
                    break;
                case "price":
                default:
                    properties = propertyRepository
                            .findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceDesc(pincode);
                    break;
            }
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/properties/count-by-pincode — Property counts by pincode for map */
    @GetMapping(value = "/count-by-pincode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getPropertyCountByPincode(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) String type) {
        try {
            List<Object[]> results;

            boolean hasCity = city != null && !city.isEmpty();
            boolean hasPurpose = purpose != null && !purpose.isEmpty();
            boolean hasType = type != null && !type.isEmpty();

            if (hasCity && hasPurpose && hasType) {
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeAndType(city, purpose,
                        type);
            } else if (hasCity && hasPurpose) {
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurpose(city, purpose);
            } else if (hasCity && hasType) {
                results = propertyRepository.countActivePropertiesByPinCodeAndCityAndType(city, type);
            } else if (hasCity) {
                results = propertyRepository.countActivePropertiesByPinCodeAndCity(city);
            } else if (hasPurpose && hasType) {
                results = propertyRepository.countActivePropertiesByPinCodeAndPurposeAndType(purpose, type);
            } else if (hasPurpose) {
                results = propertyRepository.countActivePropertiesByPinCodeAndPurpose(purpose);
            } else if (hasType) {
                results = propertyRepository.countActivePropertiesByPinCodeAndType(type);
            } else {
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /**
     * PUT /api/properties/{id}/feature — Toggle featured status (max 3 per agent)
     */
    @PutMapping(value = "/{id}/feature", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> toggleFeaturedStatus(@PathVariable Long id, @RequestParam Long agentId) {
        if (id == null || agentId == null)
            return ResponseEntity.badRequest().body(Map.of("error", "IDs are required"));
        try {
            Property property = propertyRepository.findById(id).orElse(null);
            if (property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Property not found"));
            }

            if (!property.getAgentId().equals(agentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only feature your own properties"));
            }

            if (!property.isFeatured()) {
                List<Property> featuredProperties = propertyRepository.findByAgentId(agentId).stream()
                        .filter(Property::isFeatured)
                        .toList();

                if (featuredProperties.size() >= 3) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error",
                                    "You can only feature up to 3 properties. Please unfeature one first."));
                }

                property.setFeatured(true);
            } else {
                property.setFeatured(false);
            }

            propertyRepository.save(property);

            return ResponseEntity.ok(Map.of(
                    "message",
                    property.isFeatured() ? "Property featured successfully" : "Property unfeatured successfully",
                    "isFeatured", property.isFeatured()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }
}
