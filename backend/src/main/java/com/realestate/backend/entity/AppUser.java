package com.realestate.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    // BUYER or AGENT
    private String role;

    @Column(name = "profile_picture", columnDefinition = "TEXT")
    private String profilePicture;

    private String city;

    private String phone;

    private String pincode;

    // Professional info for Agents
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "agency_name")
    private String agencyName;

    @Column(name = "experience")
    private String experience;

    @Column(name = "specialties")
    private String specialties;

    @Column(name = "reviews")
    private Integer reviews = 0;

    @Column(name = "rating")
    private Double rating = 0.0;

    // Admin approval for Agents (false = pending, true = approved)
    @Column(name = "verified", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean verified = true;

    // Email verification status
    @Column(name = "email_verified", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean emailVerified = false;

    // Account deletion request flag
    @Column(name = "deletion_requested", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean deletionRequested = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
    }

    // Getters & Setters

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAgencyName() {
        return agencyName;
    }

    public void setAgencyName(String agencyName) {
        this.agencyName = agencyName;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getSpecialties() {
        return specialties;
    }

    public void setSpecialties(String specialties) {
        this.specialties = specialties;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isDeletionRequested() {
        return deletionRequested;
    }

    public void setDeletionRequested(boolean deletionRequested) {
        this.deletionRequested = deletionRequested;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
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

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
