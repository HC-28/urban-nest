package com.realestate.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "properties")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ---------------- BASIC INFO ----------------
    private String title;
    private String type;           // Apartment, Villa, Plot, etc.
    private String purpose = "For Sale";

    private double price;
    private double area;
    private int bhk;

    // ---------------- LOCATION ----------------
    private String pinCode;

    @Column(length = 500)
    private String address;

    private String location;

    // ---------------- PROPERTY DETAILS ----------------
    private String age;            // New Construction, 1-3 years, etc.

    // Apartment-only (nullable for others)
    private Integer floor;
    private Integer totalFloors;

    // ---------------- AGENT INFO ----------------
    private Long agentId;
    private String agentName;
    private String agentEmail;

    // ---------------- MEDIA ----------------
    @Column(length = 2000)
    private String photos;          // comma-separated URLs

    // ---------------- STATUS ----------------
    private Boolean listed = true;
    private Boolean deleted = false;
    private Integer views = 0;

    // ---------------- DEFAULTS ----------------
    @PrePersist
    public void prePersistDefaults() {
        if (this.listed == null) this.listed = true;
        if (this.deleted == null) this.deleted = false;
        if (this.views == null) this.views = 0;
        if (this.purpose == null) this.purpose = "For Sale";
    }

    // ---------------- GETTERS & SETTERS ----------------

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
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

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public Integer getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(Integer totalFloors) {
        this.totalFloors = totalFloors;
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

    public String getPhotos() {
        return photos;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }

    public boolean isListed() {
        return Boolean.TRUE.equals(listed);
    }

    public void setListed(boolean listed) {
        this.listed = listed;
    }

    public boolean isDeleted() {
        return Boolean.TRUE.equals(deleted);
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public Integer getViews() {
        return views == null ? 0 : views;
    }

    public void setViews(Integer views) {
        this.views = views;
    }
}
