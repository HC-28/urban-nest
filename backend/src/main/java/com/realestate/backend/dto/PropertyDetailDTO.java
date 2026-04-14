package com.realestate.backend.dto;

import com.realestate.backend.entity.Property;
import java.time.LocalDateTime;

/**
 * Full property detail DTO for single property view.
 * Used by: GET /api/properties/{id}
 * Includes all fields the PropertyDetail.jsx page needs.
 */
public class PropertyDetailDTO {

    private Long id;
    private String title;
    private String description;
    private String type;
    private String purpose;
    private Double price;
    private Double area;
    private String city;
    private String location;
    private String address;
    private String pinCode;
    private String photos;
    private Integer bhk;
    private Integer bathrooms;
    private Integer balconies;
    private String floor;
    private String totalFloors;
    private String facing;
    private String furnishing;
    private String age;
    private String amenities;
    private Boolean featured;
    private Boolean sold;
    private Double latitude;
    private Double longitude;
    private LocalDateTime listedDate;
    private LocalDateTime lastViewedAt;
    private LocalDateTime soldAt;
    private Integer views;
    private Integer favorites;
    private Integer inquiries;
    private String launchDate;
    private String possessionStarts;
    private String reraId;
    private String videoLink;
    private String review;
    private String status;
    private Boolean isVerified;
    private Long soldToUserId;

    // Flattened agent fields (frontend accesses data.agentId, data.agentName etc.)
    private Long agentId;
    private String agentName;
    private String agentEmail;
    private String agentProfilePicture;
    private String agentPhone;
    private String agentCity;

    public PropertyDetailDTO() {
    }

    public static PropertyDetailDTO from(Property p) {
        if (p == null)
            return null;
        PropertyDetailDTO dto = new PropertyDetailDTO();
        dto.id = p.getId();
        dto.title = p.getTitle();
        dto.description = p.getDescription();
        dto.type = p.getType();
        dto.purpose = p.getPurpose();
        dto.price = p.getPrice();
        dto.area = p.getArea();
        dto.city = p.getCity();
        dto.location = p.getLocation();
        dto.address = p.getAddress();
        dto.pinCode = p.getPinCode();
        dto.photos = p.getPhotos();
        dto.bhk = p.getBhk();
        dto.bathrooms = p.getBathrooms();
        dto.balconies = p.getBalconies();
        dto.floor = p.getFloor();
        dto.totalFloors = p.getTotalFloors();
        dto.facing = p.getFacing();
        dto.furnishing = p.getFurnishing();
        dto.age = p.getAge();
        dto.amenities = p.getAmenities();
        dto.featured = p.getFeatured();
        dto.sold = p.getSold();
        dto.latitude = p.getLatitude();
        dto.longitude = p.getLongitude();
        dto.listedDate = p.getListedDate();
        dto.lastViewedAt = p.getLastViewedAt();
        dto.soldAt = p.getSoldAt();
        dto.views = p.getViews() != null ? p.getViews() : 0;
        dto.favorites = p.getFavorites() != null ? p.getFavorites() : 0;
        dto.inquiries = p.getInquiries() != null ? p.getInquiries() : 0;
        dto.launchDate = p.getLaunchDate();
        dto.possessionStarts = p.getPossessionStarts();
        dto.reraId = p.getReraId();
        dto.videoLink = p.getVideoLink();
        dto.review = p.getReview();
        dto.status = p.getStatus();

        // Flatten agent fields for direct access by frontend
        if (p.getAgent() != null) {
            dto.agentId = p.getAgent().getId();
            dto.agentName = p.getAgent().getName();
            dto.agentEmail = p.getAgent().getEmail();
            dto.agentProfilePicture = p.getAgent().getProfilePicture();
            dto.agentPhone = p.getAgent().getPhone();
            dto.agentCity = p.getAgent().getCity();
            dto.isVerified = p.getAgent().isVerified();
        }
        dto.soldToUserId = p.getSoldToUserId();
        return dto;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getType() {
        return type;
    }

    public String getPurpose() {
        return purpose;
    }

    public Double getPrice() {
        return price;
    }

    public Double getArea() {
        return area;
    }

    public String getCity() {
        return city;
    }

    public String getLocation() {
        return location;
    }

    public String getAddress() {
        return address;
    }

    public String getPinCode() {
        return pinCode;
    }

    public String getPhotos() {
        return photos;
    }

    public Integer getBhk() {
        return bhk;
    }

    public Integer getBathrooms() {
        return bathrooms;
    }

    public Integer getBalconies() {
        return balconies;
    }

    public String getFloor() {
        return floor;
    }

    public String getTotalFloors() {
        return totalFloors;
    }

    public String getFacing() {
        return facing;
    }

    public String getFurnishing() {
        return furnishing;
    }

    public String getAge() {
        return age;
    }

    public String getAmenities() {
        return amenities;
    }

    public boolean isFeatured() {
        return featured != null ? featured : false;
    }

    public boolean isSold() {
        return sold != null ? sold : false;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocalDateTime getListedDate() {
        return listedDate;
    }

    public LocalDateTime getLastViewedAt() {
        return lastViewedAt;
    }

    public LocalDateTime getSoldAt() {
        return soldAt;
    }

    public Integer getViews() {
        return views;
    }

    public Integer getFavorites() {
        return favorites;
    }

    public Integer getInquiries() {
        return inquiries;
    }

    public String getLaunchDate() {
        return launchDate;
    }

    public String getPossessionStarts() {
        return possessionStarts;
    }

    public String getReraId() {
        return reraId;
    }

    public String getVideoLink() {
        return videoLink;
    }

    public String getReview() {
        return review;
    }

    public String getStatus() { return status; }
    public Boolean getIsVerified() { return isVerified; }
    public Long getAgentId() { return agentId; }

    public String getAgentName() {
        return agentName;
    }

    public String getAgentEmail() {
        return agentEmail;
    }

    public String getAgentProfilePicture() {
        return agentProfilePicture;
    }

    public String getAgentPhone() {
        return agentPhone;
    }

    public String getAgentCity() {
        return agentCity;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void setArea(Double area) {
        this.area = area;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }

    public void setBhk(Integer bhk) {
        this.bhk = bhk;
    }

    public void setBathrooms(Integer bathrooms) {
        this.bathrooms = bathrooms;
    }

    public void setBalconies(Integer balconies) {
        this.balconies = balconies;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public void setTotalFloors(String totalFloors) {
        this.totalFloors = totalFloors;
    }

    public void setFacing(String facing) {
        this.facing = facing;
    }

    public void setFurnishing(String furnishing) {
        this.furnishing = furnishing;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    public void setSold(Boolean sold) {
        this.sold = sold;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public void setListedDate(LocalDateTime listedDate) {
        this.listedDate = listedDate;
    }

    public void setLastViewedAt(LocalDateTime lastViewedAt) {
        this.lastViewedAt = lastViewedAt;
    }

    public void setSoldAt(LocalDateTime soldAt) {
        this.soldAt = soldAt;
    }

    public void setViews(Integer views) {
        this.views = views;
    }

    public void setFavorites(Integer favorites) {
        this.favorites = favorites;
    }

    public void setInquiries(Integer inquiries) {
        this.inquiries = inquiries;
    }

    public void setLaunchDate(String launchDate) {
        this.launchDate = launchDate;
    }

    public void setPossessionStarts(String possessionStarts) {
        this.possessionStarts = possessionStarts;
    }

    public void setReraId(String reraId) {
        this.reraId = reraId;
    }

    public void setVideoLink(String videoLink) {
        this.videoLink = videoLink;
    }

    public void setReview(String review) {
        this.review = review;
    }

    public void setStatus(String status) { this.status = status; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }
    public Long getSoldToUserId() { return soldToUserId; }
    public void setSoldToUserId(Long soldToUserId) { this.soldToUserId = soldToUserId; }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public void setAgentEmail(String agentEmail) {
        this.agentEmail = agentEmail;
    }

    public void setAgentProfilePicture(String agentProfilePicture) {
        this.agentProfilePicture = agentProfilePicture;
    }

    public void setAgentPhone(String agentPhone) {
        this.agentPhone = agentPhone;
    }

    public void setAgentCity(String agentCity) {
        this.agentCity = agentCity;
    }
}

