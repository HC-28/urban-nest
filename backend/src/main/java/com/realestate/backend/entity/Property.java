package com.realestate.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "property")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private double price;


    @Column(name="photos",columnDefinition = "TEXT")
    private String photos;

    private double area;
    private int bhk;

    @Column(name = "pin_code", nullable = false)
    private String pinCode; // Changed to String to preserve leading zeros

    private Long agentId;
    private String agentName;
    private String agentEmail;

    @Column(name = "is_active")
    private boolean isActive = true;

    // Default Constructor
    public Property() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getPhotos() { return photos; }
    public void setPhotos(String photos) { this.photos = photos; }

    public double getArea() { return area; }
    public void setArea(double area) { this.area = area; }

    public int getBhk() { return bhk; }
    public void setBhk(int bhk) { this.bhk = bhk; }

    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getAgentEmail() { return agentEmail; }
    public void setAgentEmail(String agentEmail) { this.agentEmail = agentEmail; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    // CORRECTED GETTER/SETTER: Must match pinCode variable name
    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }
}