package com.realestate.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "agencies")
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "logo", columnDefinition = "TEXT")
    private String logo;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "agency_code", unique = true, nullable = false)
    private String agencyCode;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @OneToOne
    @JoinColumn(name = "admin_user_id", referencedColumnName = "id")
    private AppUser admin;

    @Column(name = "status")
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, SUSPENDED

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Agency() {
        // Generate a random unique code if not provided
        this.agencyCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getAgencyCode() { return agencyCode; }
    public void setAgencyCode(String agencyCode) { this.agencyCode = agencyCode; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public AppUser getAdmin() { return admin; }
    public void setAdmin(AppUser admin) { this.admin = admin; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
