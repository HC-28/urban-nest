package com.realestate.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    // BUYER or AGENT
    private String role;

    @Column(name = "profile_picture_url", columnDefinition = "TEXT")
    private String profilePictureUrl;

    private String city;

    private String phone;

    private String pincode;

    // Email verification status
    @Column(name = "email_verified", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean emailVerified = false;

    // Account deletion request flag
    @Column(name = "deletion_requested", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean deletionRequested = false;

    @JsonIgnore
    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "verified", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean verified = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AgentProfile agentProfile;

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

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
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

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public AgentProfile getAgentProfile() {
        return agentProfile;
    }

    public void setAgentProfile(AgentProfile agentProfile) {
        this.agentProfile = agentProfile;
    }

    // ── Convenience methods for Agent functionality ──────────────────────────

    public int getReviews() {
        return agentProfile != null ? agentProfile.getReviews() : 0;
    }

    public void setReviews(int reviews) {
        ensureAgentProfile();
        agentProfile.setReviews(reviews);
    }

    public double getRating() {
        return agentProfile != null ? agentProfile.getRating() : 0.0;
    }

    public void setRating(double rating) {
        ensureAgentProfile();
        agentProfile.setRating(rating);
    }

    public String getSpecialties() {
        return agentProfile != null ? agentProfile.getSpecialties() : null;
    }

    public Integer getExperience() {
        return agentProfile != null ? agentProfile.getExperience() : null;
    }

    public void setExperience(Integer experience) {
        ensureAgentProfile();
        agentProfile.setExperience(experience);
    }

    public void setSpecialties(String specialties) {
        ensureAgentProfile();
        agentProfile.setSpecialties(specialties);
    }

    public String getBio() {
        return agentProfile != null ? agentProfile.getBio() : null;
    }

    public void setBio(String bio) {
        ensureAgentProfile();
        agentProfile.setBio(bio);
    }

    public String getAgencyName() {
        return agentProfile != null ? agentProfile.getAgencyName() : "Independent";
    }

    public void setAgencyName(String agencyName) {
        ensureAgentProfile();
        agentProfile.setAgencyName(agencyName);
    }

    private void ensureAgentProfile() {
        if (this.agentProfile == null) {
            this.agentProfile = new AgentProfile();
            this.agentProfile.setUser(this);
        }
    }
}
