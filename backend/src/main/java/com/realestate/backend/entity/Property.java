package com.realestate.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "property")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    private String type;
    private double price;

    @Column(name = "photos", columnDefinition = "TEXT")
    private String photos;

    private double area;
    private int bhk;
    private int bathrooms;
    private int balconies;
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

    private Long agentId;
    private String agentName;
    private String agentEmail;

    @Column(name = "is_active")
    private boolean isActive = true;

    // Purpose: "Sale" or "Rent"
    private String purpose;

    // Featured property flag (agents can feature up to 3 properties)
    @Column(name = "is_featured")
    private boolean isFeatured = false;

    // Analytics tracking fields
    @Column(name = "views")
    private int views = 0;

    @Column(name = "favorites")
    private int favorites = 0;

    @Column(name = "inquiries")
    private int inquiries = 0;

    @Column(name = "listed_date")
    private java.time.LocalDateTime listedDate;

    @Column(name = "last_viewed_at")
    private java.time.LocalDateTime lastViewedAt;

    // --- Sold Property Fields ---
    @Column(name = "is_sold")
    private boolean isSold = false;

    @Column(name = "sold_to_user_id")
    private Long soldToUserId;

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

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getPhotos() {
        return photos;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }

    public double getArea() {
        return area;
    }

    public void setArea(double area) {
        this.area = area;
    }

    public int getBhk() {
        return bhk;
    }

    public void setBhk(int bhk) {
        this.bhk = bhk;
    }

    public int getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(int bathrooms) {
        this.bathrooms = bathrooms;
    }

    public int getBalconies() {
        return balconies;
    }

    public void setBalconies(int balconies) {
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

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public String getAgentEmail() {
        return agentEmail;
    }

    public void setAgentEmail(String agentEmail) {
        this.agentEmail = agentEmail;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
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

    public boolean isFeatured() {
        return isFeatured;
    }

    public void setFeatured(boolean featured) {
        isFeatured = featured;
    }

    // Analytics getters and setters
    public int getViews() {
        return views;
    }

    public void setViews(int views) {
        this.views = views;
    }

    public int getFavorites() {
        return favorites;
    }

    public void setFavorites(int favorites) {
        this.favorites = favorites;
    }

    public int getInquiries() {
        return inquiries;
    }

    public void setInquiries(int inquiries) {
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

    public boolean isSold() {
        return isSold;
    }

    public void setSold(boolean sold) {
        isSold = sold;
    }

    public Long getSoldToUserId() {
        return soldToUserId;
    }

    public void setSoldToUserId(Long soldToUserId) {
        this.soldToUserId = soldToUserId;
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
        if (isSold)
            return "SOLD";
        return isActive ? "LISTED" : "UNLISTED";
    }
}
