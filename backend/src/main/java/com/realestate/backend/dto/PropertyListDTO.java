package com.realestate.backend.dto;

import com.realestate.backend.entity.Property;
import java.time.LocalDateTime;

/**
 * Lightweight DTO for property grid/list cards and map pins.
 * Used by: GET /api/properties, /featured, /trending, /agent/{id}, map pins.
 * Excludes heavy fields like description, amenities, and full agent details.
 */
public class PropertyListDTO {

    private Long id;
    private String title;
    private String type;
    private String purpose;
    private Double price;
    private Double area;
    private String city;
    private String location;
    private String pinCode;
    private String photos;
    private Integer bhk;
    private Integer bathrooms;
    private String furnishing;
    private Boolean featured;
    private Boolean sold;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime listedDate;
    private Integer views;
    private String status;
    private String amenities;
    private Boolean isVerified;
    private Boolean active;
    private LocalDateTime soldAt;
    private String buyerName;

    // Flat mappings for PropertyCard
    private Long agentId;
    private String agentName;

    // Nested agent summary
    private AgentSummary agent;

    public PropertyListDTO() {
    }

    public static PropertyListDTO from(Property p) {
        if (p == null)
            return null;
        PropertyListDTO dto = new PropertyListDTO();
        dto.id = p.getId();
        dto.title = p.getTitle();
        dto.type = p.getType();
        dto.purpose = p.getPurpose();
        dto.price = p.getPrice();
        dto.area = p.getArea();
        dto.city = p.getCity();
        dto.location = p.getLocation();
        dto.pinCode = p.getPinCode();
        dto.photos = p.getPhotos();
        dto.bhk = p.getBhk();
        dto.bathrooms = p.getBathrooms();
        dto.furnishing = p.getFurnishing();
        dto.featured = p.isFeatured();
        dto.sold = p.isSold();
        dto.latitude = p.getLatitude();
        dto.longitude = p.getLongitude();
        dto.createdAt = p.getListedDate();
        dto.listedDate = p.getListedDate();
        dto.views = p.getViews() != null ? p.getViews() : 0;
        dto.status = p.getStatus();
        dto.amenities = p.getAmenities();
        dto.active = p.isActive();
        dto.soldAt = p.getSoldAt();
        // buyerName is not stored on property — will be null unless join-fetched

        if (p.getAgent() != null) {
            dto.agentId = p.getAgent().getId();
            dto.agentName = p.getAgent().getName();
            dto.agent = new AgentSummary(
                    p.getAgent().getId(),
                    p.getAgent().getName(),
                    p.getAgent().getEmail(),
                    p.getAgent().getProfilePicture());
            dto.isVerified = p.getAgent().isVerified();
        }
        return dto;
    }

    // ── Nested agent summary (avoids full AppUser serialization) ──
    public static class AgentSummary {
        private Long id;
        private String name;
        private String email;
        private String profilePicture;

        public AgentSummary() {
        }

        public AgentSummary(Long id, String name, String email, String profilePicture) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.profilePicture = profilePicture;
        }

        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        public String getProfilePicture() {
            return profilePicture;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public void setProfilePicture(String p) {
            this.profilePicture = p;
        }
    }

// Getters
    public Long getId() {
        return id;
    }
    public String getTitle() { return title; }
    public String getType() { return type; }
    public String getPurpose() { return purpose; }
    public Double getPrice() { return price; }
    public Double getArea() { return area; }
    public String getCity() { return city; }
    public String getLocation() { return location; }
    public String getPinCode() { return pinCode; }
    public String getPhotos() { return photos; }
    public Integer getBhk() { return bhk; }
    public Integer getBathrooms() { return bathrooms; }
    public String getFurnishing() { return furnishing; }
    public Boolean getFeatured() { return featured; }
    public Boolean getSold() { return sold; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getListedDate() { return listedDate; }
    public Integer getViews() { return views; }
    public String getStatus() { return status; }
    public String getAmenities() { return amenities; }
    public Boolean getIsVerified() { return isVerified; }
    public Boolean getActive() { return active; }
    public LocalDateTime getSoldAt() { return soldAt; }
    public String getBuyerName() { return buyerName; }
    public Long getAgentId() { return agentId; }
    public String getAgentName() { return agentName; }
    public AgentSummary getAgent() { return agent; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setType(String type) { this.type = type; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public void setPrice(Double price) { this.price = price; }
    public void setArea(Double area) { this.area = area; }
    public void setCity(String city) { this.city = city; }
    public void setLocation(String location) { this.location = location; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public void setPhotos(String photos) { this.photos = photos; }
    public void setBhk(Integer bhk) { this.bhk = bhk; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }
    public void setFurnishing(String furnishing) { this.furnishing = furnishing; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public void setSold(Boolean sold) { this.sold = sold; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setListedDate(LocalDateTime listedDate) { this.listedDate = listedDate; }
    public void setViews(Integer views) { this.views = views; }
    public void setStatus(String status) { this.status = status; }
    public void setAmenities(String amenities) { this.amenities = amenities; }
    public void setActive(Boolean active) { this.active = active; }
    public void setSoldAt(LocalDateTime soldAt) { this.soldAt = soldAt; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public void setAgentName(String agentName) { this.agentName = agentName; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public void setAgent(AgentSummary agent) { this.agent = agent; }
}
