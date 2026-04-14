package com.realestate.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "agent_profiles")
public class AgentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience")
    private Integer experience;

    @Column(name = "specialties")
    private String specialties;

    @Column(name = "reviews")
    private Integer reviews = 0;

    @Column(name = "rating")
    private Double rating = 0.0;

    @Column(name = "agency_status")
    private String agencyStatus = "INDEPENDENT"; // INDEPENDENT, PENDING, JOINED, REJECTED

    @Column(name = "agency_name")
    private String agencyName;

    // Default Constructor
    public AgentProfile() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Agency getAgency() {
        return agency;
    }

    public void setAgency(Agency agency) {
        this.agency = agency;
    }

    public Integer getExperience() {
        return experience;
    }

    public void setExperience(Integer experience) {
        this.experience = experience;
    }

    public String getSpecialties() {
        return specialties;
    }

    public void setSpecialties(String specialties) {
        this.specialties = specialties;
    }

    public Integer getReviews() {
        return reviews;
    }

    public void setReviews(Integer reviews) {
        this.reviews = reviews;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getAgencyStatus() {
        return agencyStatus;
    }

    public void setAgencyStatus(String agencyStatus) {
        this.agencyStatus = agencyStatus;
    }

    public void setAgencyName(String agencyName) {
        this.agencyName = agencyName;
    }

    // --- Backward Compatibility Methods ---
    
    public String getAgencyName() {
        if (agency != null) return agency.getName();
        return agencyName != null ? agencyName : "Independent";
    }

    public Integer getReviewsCount() {
        return reviews != null ? reviews : 0;
    }

    public Double getAverageRating() {
        return rating != null ? rating : 0.0;
    }
}
