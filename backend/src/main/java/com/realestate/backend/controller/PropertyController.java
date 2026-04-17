package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
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
import com.realestate.backend.service.AnalyticsService;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.PropertyListDTO;
import com.realestate.backend.dto.PropertyDetailDTO;

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
    private AnalyticsService analyticsService;

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
     * Helper: Extract the authenticated user's ID from the JWT token.
     */
    private Long getAuthenticatedAgentId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getCredentials() == null) return null;
        try {
            return (Long) auth.getCredentials();
        } catch (ClassCastException e) {
            return null;
        }
    }

    /**
     * Helper: Check if the authenticated user is an AGENT or ADMIN.
     */
    private boolean isAgentOrAdmin() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_AGENT") || a.getAuthority().equals("ROLE_ADMIN"));
    }

    /** GET /api/properties — All active, unsold properties with optional filters */
    @GetMapping(value = {"", "/"}, produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getAllProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(required = false) String bhk,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) List<String> amenities) {
        
        List<Property> properties = propertyRepository.findVisibleProperties();

        // Filter by City
        if (city != null && !city.isBlank()) {
            String c = city.toLowerCase();
            properties = properties.stream()
                    .filter(p -> p.getCity() != null && p.getCity().toLowerCase().equals(c))
                    .toList();
        }
        
        // Filter by Type (Apartment, House, etc)
        if (type != null && !type.isBlank() && !type.equalsIgnoreCase("All")) {
            String t = type.toLowerCase();
            properties = properties.stream()
                    .filter(p -> p.getType() != null && p.getType().toLowerCase().equals(t))
                    .toList();
        }

        // Filter by Purpose (Rent, Sale)
        if (purpose != null && !purpose.isBlank() && !purpose.equalsIgnoreCase("All")) {
            String pu = purpose.toLowerCase();
            properties = properties.stream()
                    .filter(p -> {
                        String pp = p.getPurpose() != null ? p.getPurpose().toLowerCase() : "sale";
                        return pp.contains(pu) || pu.contains(pp);
                    })
                    .toList();
        }
        
        // Price and BHK filters
        Double minP = null;
        if (minPrice != null && !minPrice.isBlank() && !minPrice.equalsIgnoreCase("All")) {
            try { minP = Double.parseDouble(minPrice); } catch (Exception ignored) {}
        }
        Double maxP = null;
        if (maxPrice != null && !maxPrice.isBlank() && !maxPrice.equalsIgnoreCase("All")) {
            try { maxP = Double.parseDouble(maxPrice); } catch (Exception ignored) {}
        }
        Integer bhkNum = null;
        if (bhk != null && !bhk.isBlank() && !bhk.equalsIgnoreCase("All")) {
            try { bhkNum = Integer.parseInt(bhk); } catch (Exception ignored) {}
        }

        if (minP != null) {
            final Double finalMinP = minP;
            properties = properties.stream().filter(p -> p.getPrice() >= finalMinP).toList();
        }
        if (maxP != null) {
            final Double finalMaxP = maxP;
            properties = properties.stream().filter(p -> p.getPrice() <= finalMaxP).toList();
        }
        if (bhkNum != null && bhkNum > 0) {
            final Integer finalBhkNum = bhkNum;
            properties = properties.stream().filter(p -> p.getBhk() == finalBhkNum).toList();
        }
        if (pincode != null && !pincode.isBlank()) {
            properties = properties.stream().filter(p -> pincode.equals(p.getPinCode())).toList();
        }

        // Text search
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

        // Amenities check (And logic: must have all selected)
        if (amenities != null && !amenities.isEmpty()) {
            properties = properties.stream()
                    .filter(p -> {
                        if (p.getAmenities() == null || p.getAmenities().isBlank()) return false;
                        String propAmenities = p.getAmenities().toLowerCase();
                        return amenities.stream().allMatch(a -> propAmenities.contains(a.toLowerCase()));
                    })
                    .toList();
        }

        List<PropertyListDTO> dtos = properties.stream().map(PropertyListDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/properties/featured — Featured properties for home page */
    @GetMapping(value = "/featured", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getFeaturedProperties() {
        List<PropertyListDTO> featuredProperties = propertyRepository.findVisibleProperties().stream()
                .filter(Property::getFeatured)
                .map(PropertyListDTO::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(featuredProperties));
    }

    /** GET /api/properties/trending — Trending properties based on views */
    @GetMapping(value = "/trending", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getTrendingProperties() {
        List<PropertyListDTO> trending = propertyRepository.findVisibleProperties().stream()
                .sorted(Comparator.comparingInt(Property::getViews).reversed())
                .limit(6)
                .map(PropertyListDTO::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(trending));
    }

    /** GET /api/properties/agent/{agentId} — Properties by agent (for dashboard) */
    @GetMapping(value = "/agent/{agentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getPropertiesByAgent(@PathVariable Long agentId) {
        List<PropertyListDTO> properties = propertyRepository.findByAgentId(agentId).stream()
                .map(PropertyListDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    /** GET /api/properties/top?pincode=... — Support Map Sidebar */
    @GetMapping(value = "/top", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getTopPropertiesByPincode(
            @RequestParam String pincode,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String purpose) {
        
        List<Property> properties = propertyRepository.findVisibleProperties().stream()
                .filter(p -> pincode.equals(p.getPinCode()))
                .toList();
        
        // Filter by purpose if specified
        if (purpose != null && !purpose.isBlank() && !purpose.equalsIgnoreCase("All")) {
            final String pu = purpose.toLowerCase();
            properties = properties.stream().filter(p -> p.getPurpose().toLowerCase().contains(pu)).toList();
        }

        // Sort by views (simple "top" logic)
        List<PropertyListDTO> dtos = properties.stream()
                .sorted(Comparator.comparingInt(Property::getViews).reversed())
                .limit(10)
                .map(PropertyListDTO::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/properties/{id} — Single property by ID */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> getPropertyById(@PathVariable Long id, 
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role) {
        
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Property not found"));
        }

        // Sold visibility check
        if (property.getSold()) {
            boolean isAllowed = false;
            if ("ADMIN".equalsIgnoreCase(role)) {
                isAllowed = true;
            } else if (userId != null) {
                if (userId.equals(property.getAgentId()) || userId.equals(property.getSoldToUserId())) {
                    isAllowed = true;
                }
            }
            if (!isAllowed) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("This property is SOLD and no longer publicly available."));
            }
        }

        // Track view for active, unsold properties
        if (!property.getSold() && property.getActive()) {
            try {
                analyticsService.trackView(id, userId);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(property)));
    }

    /** POST /api/properties — Add new property */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> addProperty(@RequestBody Property property, @RequestParam Long agentId) {
        if (!isAgentOrAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Only agents can post properties"));
        }
        
        Long authId = getAuthenticatedAgentId();
        if (authId != null && !authId.equals(agentId)) {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("You can only post properties for yourself"));
            }
        }

        AppUser agent = userRepository.findById(agentId).orElse(null);
        if (agent == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Agent not found"));
        
        property.setAgent(agent);
        Property savedProperty = propertyRepository.save(property);

        if (savedProperty.getCity() != null) analyticsService.computeScoresForCity(savedProperty.getCity());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(PropertyDetailDTO.from(savedProperty)));
    }

    /** PUT /api/properties/{id} — Update property */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> updateProperty(@PathVariable Long id, @RequestBody Property up, @RequestParam Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Property not found"));

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (up.getTitle() != null) property.setTitle(up.getTitle());
        if (up.getDescription() != null) property.setDescription(up.getDescription());
        if (up.getType() != null) property.setType(up.getType());
        if (up.getPrice() > 0) property.setPrice(up.getPrice());
        if (up.getArea() > 0) property.setArea(up.getArea());
        if (up.getPhotos() != null) property.setPhotos(up.getPhotos());
        if (up.getBhk() > 0) property.setBhk(up.getBhk());
        if (up.getBathrooms() > 0) property.setBathrooms(up.getBathrooms());
        if (up.getBalconies() >= 0) property.setBalconies(up.getBalconies());
        if (up.getFloor() != null) property.setFloor(up.getFloor());
        if (up.getTotalFloors() != null) property.setTotalFloors(up.getTotalFloors());
        if (up.getFacing() != null) property.setFacing(up.getFacing());
        if (up.getFurnishing() != null) property.setFurnishing(up.getFurnishing());
        if (up.getAge() != null) property.setAge(up.getAge());
        if (up.getCity() != null) property.setCity(up.getCity());
        if (up.getLocation() != null) property.setLocation(up.getLocation());
        if (up.getAddress() != null) property.setAddress(up.getAddress());
        if (up.getPinCode() != null) property.setPinCode(up.getPinCode());
        if (up.getAmenities() != null) property.setAmenities(up.getAmenities());
        if (up.getPurpose() != null) property.setPurpose(up.getPurpose());
        if (up.getLatitude() != null) property.setLatitude(up.getLatitude());
        if (up.getLongitude() != null) property.setLongitude(up.getLongitude());

        Property saved = propertyRepository.save(property);
        if (saved.getCity() != null) analyticsService.computeScoresForCity(saved.getCity());
        
        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(saved)));
    }

    /** DELETE /api/properties/{id} — Soft delete */
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteProperty(@PathVariable Long id, @RequestParam Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Property not found"));

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        property.setActive(false);
        propertyRepository.save(property);

        if (property.getCity() != null) analyticsService.computeScoresForCity(property.getCity());
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Deleted successfully")));
    }

    /** PUT /api/properties/{id}/sold — Finalize sale */
    @PutMapping(value = "/{id}/sold", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> markPropertyAsSold(@PathVariable Long id, @RequestParam Long agentId, @RequestParam(required = false) Long buyerId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Property not found"));

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        property.setSold(true);
        property.setSoldAt(LocalDateTime.now());
        if (buyerId != null) property.setSoldToUserId(buyerId);
        property.setActive(false);
        property.setFeatured(false);

        propertyRepository.save(property);

        // Cancel appointments and notify
        List<String> activeStatuses = Arrays.asList("pending", "confirmed", "awaiting_buyer", "awaiting_agent");
        List<Appointment> pending = appointmentRepository.findByPropertyIdAndStatusIn(id, activeStatuses);

        Set<String> notifyEmails = new HashSet<>();
        for (Appointment appt : pending) {
            appt.setStatus("cancelled");
            appointmentRepository.save(appt);
            if (appt.getSlotId() != null) {
                agentSlotRepository.findById(appt.getSlotId()).ifPresent(s -> {
                    s.setBooked(false);
                    agentSlotRepository.save(s);
                });
            }
            if (appt.getBuyerEmail() != null) notifyEmails.add(appt.getBuyerEmail());
        }

        // Favorites and Chats
        favoriteRepository.findByProperty_Id(id).forEach(fav -> {
            if (fav.getUser().getEmail() != null) notifyEmails.add(fav.getUser().getEmail());
        });
        chatMessageRepository.findByPropertyId(id).forEach(chat -> {
            userRepository.findById(chat.getBuyerId()).ifPresent(u -> {
                if (u.getEmail() != null) notifyEmails.add(u.getEmail());
            });
        });

        if (buyerId != null) userRepository.findById(buyerId).ifPresent(winner -> notifyEmails.remove(winner.getEmail()));

        if (!notifyEmails.isEmpty()) {
            emailService.sendSoldNotificationToInquirers(new ArrayList<>(notifyEmails), property.getTitle());
        }

        if (property.getCity() != null) analyticsService.computeScoresForCity(property.getCity());
        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(property)));
    }

    /** PUT /api/properties/{id}/relist — Relist property */
    @PutMapping(value = "/{id}/relist", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PropertyDetailDTO>> relistProperty(@PathVariable Long id, @RequestParam Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        property.setSold(false);
        property.setSoldAt(null);
        property.setSoldToUserId(null);
        property.setActive(true);

        propertyRepository.save(property);
        if (property.getCity() != null) analyticsService.computeScoresForCity(property.getCity());
        return ResponseEntity.ok(ApiResponse.success(PropertyDetailDTO.from(property)));
    }

    /** GET /api/properties/count-by-pincode — Map aggregate counts */
    @GetMapping(value = "/count-by-pincode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Map<String, Object>>>> getPropertyCountByPincode(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) String type) {
        
        List<Object[]> results;
        boolean hasCity = city != null && !city.isEmpty();
        boolean hasPurpose = purpose != null && !purpose.isEmpty();
        boolean hasType = type != null && !type.isEmpty();

        if (hasCity && hasPurpose && hasType) results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeAndTypeWithEngagement(city, purpose, type);
        else if (hasCity && hasPurpose) results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeWithEngagement(city, purpose);
        else if (hasCity && hasType) results = propertyRepository.countActivePropertiesByPinCodeAndCityAndType(city, type);
        else if (hasCity) results = propertyRepository.countActivePropertiesByPinCodeAndCity(city);
        else if (hasPurpose && hasType) results = propertyRepository.countActivePropertiesByPinCodeAndPurposeAndType(purpose, type);
        else if (hasPurpose) results = propertyRepository.countActivePropertiesByPinCodeAndPurpose(purpose);
        else if (hasType) results = propertyRepository.countActivePropertiesByPinCodeAndType(type);
        else results = propertyRepository.countActivePropertiesByPinCode();

        Map<String, Map<String, Object>> map = new HashMap<>();
        for (Object[] row : results) {
            String pinCode = row[0].toString();
            Map<String, Object> data = new HashMap<>();
            data.put("count", row[1]);
            data.put("avgPrice", row[2] != null ? Math.round((Double) row[2] * 100.0) / 100.0 : 0.0);
            map.put(pinCode, data);
        }
        return ResponseEntity.ok(ApiResponse.success(map));
    }

    /** PUT /api/properties/{id}/feature — Spotlight toggle */
    @PutMapping(value = "/{id}/feature", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleFeaturedStatus(@PathVariable Long id, @RequestParam Long agentId) {
        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));

        if (!property.getAgentId().equals(agentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        if (Boolean.TRUE.equals(property.getSold())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Cannot feature sold property"));
        }

        List<Property> agentFeatured = propertyRepository.findByAgentId(agentId).stream()
                .filter(p -> Boolean.TRUE.equals(p.getFeatured()))
                .toList();

        if (!Boolean.TRUE.equals(property.getFeatured())) {
            if (agentFeatured.size() >= 3) {
                Property first = agentFeatured.get(0);
                first.setFeatured(false);
                propertyRepository.save(first);
            }
            property.setFeatured(true);
        } else {
            property.setFeatured(false);
        }

        propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "message", property.getFeatured() ? "Featured" : "Unfeatured",
            "featured", property.getFeatured()
        )));
    }
}
