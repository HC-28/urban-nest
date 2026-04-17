package com.realestate.backend.dto;

import com.realestate.backend.entity.Agency;

/**
 * Lightweight Agency DTO — avoids serializing the full Admin AppUser
 * (which contains base64 profilePicture) and prevents circular references.
 */
public class AgencyDTO {

    private Long id;
    private String name;
    private String agencyCode;
    private String licenseNumber;
    private String bio;
    private String status;
    private Long adminUserId;
    private String adminName;
    private String adminEmail;
    private String logo;
    private String createdAt;

    public static AgencyDTO from(Agency agency) {
        if (agency == null) return null;
        AgencyDTO dto = new AgencyDTO();
        dto.id = agency.getId();
        dto.name = agency.getName();
        dto.agencyCode = agency.getAgencyCode();
        dto.licenseNumber = agency.getLicenseNumber();
        dto.bio = agency.getBio();
        dto.status = agency.getStatus();
        dto.logo = agency.getLogoUrl();
        if (agency.getAdmin() != null) {
            dto.adminUserId = agency.getAdmin().getId();
            dto.adminName = agency.getAdmin().getName();
            dto.adminEmail = agency.getAdmin().getEmail();
        }
        if (agency.getCreatedAt() != null) {
            dto.createdAt = agency.getCreatedAt().toString();
        }
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAgencyCode() { return agencyCode; }
    public String getLicenseNumber() { return licenseNumber; }
    public String getBio() { return bio; }
    public String getStatus() { return status; }
    public String getLogo() { return logo; }
    public Long getAdminUserId() { return adminUserId; }
    public String getAdminName() { return adminName; }
    public String getAdminEmail() { return adminEmail; }
    public String getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setAgencyCode(String agencyCode) { this.agencyCode = agencyCode; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setBio(String bio) { this.bio = bio; }
    public void setStatus(String status) { this.status = status; }
    public void setLogo(String logo) { this.logo = logo; }
    public void setAdminUserId(Long adminUserId) { this.adminUserId = adminUserId; }
    public void setAdminName(String adminName) { this.adminName = adminName; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
