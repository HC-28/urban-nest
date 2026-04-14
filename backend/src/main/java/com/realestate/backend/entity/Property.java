package com.realestate.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "property")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    private String type;

    @Min(value = 1, message = "Price must be greater than zero")
    private Double price;

    @Column(name = "photos", columnDefinition = "TEXT")
    private String photos;

    @Min(value = 1, message = "Area must be greater than zero")
    private Double area;
    private Integer bhk;
    private Integer bathrooms;
    private Integer balconies;
    private String floor;
    private String totalFloors;
    private String facing;
    private String furnishing;
    private String age;
    private String city;

    @Column(name = "location", columnDefinition = "TEXT")
    private String location;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "amenities", columnDefinition = "TEXT")
    private String amenities;

    @Column(name = "pin_code", nullable = false)
    private String pinCode; // Changed to String to preserve leading zeros

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id", nullable = false)
    private AppUser agent;

    @Column(name = "active")
    private Boolean active = true;

    // Purpose: "Sale" or "Rent"
    private String purpose;

    // Featured property flag (agents can feature up to 3 properties)
    @Column(name = "featured")
    private Boolean featured = false;

    // Analytics tracking fields
    @Column(name = "views")
    private Integer views = 0;

    @Column(name = "favorites")
    private Integer favorites = 0;

    @Column(name = "inquiries")
    private Integer inquiries = 0;

    @Column(name = "listed_date")
    private java.time.LocalDateTime listedDate;

    @Column(name = "last_viewed_at")
    private java.time.LocalDateTime lastViewedAt;

    // --- Sold Property Fields ---
    @Column(name = "sold")
    private Boolean sold = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sold_to_user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AppUser soldToUser;

    @Column(name = "sold_at")
    private java.time.LocalDateTime soldAt;

    private String launchDate;
    private String possessionStarts;

    @Column(name = "review")
    private String review;

    // Professional Listing Fields
    @Column(name = "rera_id")
    private String reraId;

    @Column(name = "video_link", columnDefinition = "TEXT")
    private String videoLink;

    // Geolocation for map pins
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // Default Constructor
    public Property() {
    }

    // Lifecycle callback to set listed_date when property is first created
    @PrePersist
    protected void onCreate() {
        if (this.listedDate == null) {
            this.listedDate = java.time.LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getPhotos() {
        return photos;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }

    public Double getArea() {
        return area;
    }

    public void setArea(Double area) {
        this.area = area;
    }

    public Integer getBhk() {
        return bhk;
    }

    public void setBhk(Integer bhk) {
        this.bhk = bhk;
    }

    public Integer getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(Integer bathrooms) {
        this.bathrooms = bathrooms;
    }

    public Integer getBalconies() {
        return balconies;
    }

    public void setBalconies(Integer balconies) {
        this.balconies = balconies;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(String totalFloors) {
        this.totalFloors = totalFloors;
    }

    public String getFacing() {
        return facing;
    }

    public void setFacing(String facing) {
        this.facing = facing;
    }

    public String getFurnishing() {
        return furnishing;
    }

    public void setFurnishing(String furnishing) {
        this.furnishing = furnishing;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAmenities() {
        return amenities;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    public AppUser getAgent() {
        return agent;
    }

    public void setAgent(AppUser agent) {
        this.agent = agent;
    }

    public Boolean getActive() {
        return active != null ? active : true;
    }
    
    public Boolean isActive() {
        return active != null ? active : true;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Boolean getFeatured() {
        return featured != null ? featured : false;
    }
    
    public Boolean isFeatured() {
        return featured != null ? featured : false;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    // Analytics getters and setters
    public Integer getViews() {
        return views;
    }

    public void setViews(Integer views) {
        this.views = views;
    }

    public Integer getFavorites() {
        return favorites;
    }

    public void setFavorites(Integer favorites) {
        this.favorites = favorites;
    }

    public Integer getInquiries() {
        return inquiries;
    }

    public void setInquiries(Integer inquiries) {
        this.inquiries = inquiries;
    }

    public java.time.LocalDateTime getListedDate() {
        return listedDate;
    }

    public void setListedDate(java.time.LocalDateTime listedDate) {
        this.listedDate = listedDate;
    }

    public java.time.LocalDateTime getLastViewedAt() {
        return lastViewedAt;
    }

    public void setLastViewedAt(java.time.LocalDateTime lastViewedAt) {
        this.lastViewedAt = lastViewedAt;
    }

    public Boolean getSold() {
        return sold != null ? sold : false;
    }
    
    public Boolean isSold() {
        return sold != null ? sold : false;
    }

    public void setSold(Boolean sold) {
        this.sold = sold;
    }

    public AppUser getSoldToUser() {
        return soldToUser;
    }

    public void setSoldToUser(AppUser soldToUser) {
        this.soldToUser = soldToUser;
    }

    public java.time.LocalDateTime getSoldAt() {
        return soldAt;
    }

    public void setSoldAt(java.time.LocalDateTime soldAt) {
        this.soldAt = soldAt;
    }

    public String getLaunchDate() {
        return launchDate;
    }

    public void setLaunchDate(String launchDate) {
        this.launchDate = launchDate;
    }

    public String getPossessionStarts() {
        return possessionStarts;
    }

    public void setPossessionStarts(String possessionStarts) {
        this.possessionStarts = possessionStarts;
    }

    public String getReraId() {
        return reraId;
    }

    public void setReraId(String reraId) {
        this.reraId = reraId;
    }

    public String getVideoLink() {
        return videoLink;
    }

    public void setVideoLink(String videoLink) {
        this.videoLink = videoLink;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getReview() {
        return review;
    }

    public void setReview(String review) {
        this.review = review;
    }

    // Virtual getter for frontend compatibility
    public String getStatus() {
        if (Boolean.TRUE.equals(sold))
            return "SOLD";
        return Boolean.TRUE.equals(active) ? "LISTED" : "UNLISTED";
    }

    // ── Convenience ID accessors used by controllers ──────────────────────────

    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    public String getAgentName() {
        return agent != null ? agent.getName() : null;
    }

    public void setAgentId(Long agentId) {
        if (this.agent == null) {
            this.agent = new AppUser();
        }
        this.agent.setId(agentId);
    }

    public Long getSoldToUserId() {
        return soldToUser != null ? soldToUser.getId() : null;
    }

    public void setSoldToUserId(Long soldToUserId) {
        if (this.soldToUser == null) {
            this.soldToUser = new AppUser();
        }
        this.soldToUser.setId(soldToUserId);
    }
}
