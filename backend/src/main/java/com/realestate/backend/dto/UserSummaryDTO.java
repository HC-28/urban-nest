package com.realestate.backend.dto;

import com.realestate.backend.entity.AppUser;

/**
 * Lightweight user info for embedding in other DTOs.
 * Never exposes password, verificationToken, or other sensitive fields.
 */
public class UserSummaryDTO {

    private Long id;
    private String name;
    private String email;
    private String profilePicture;
    private String role;
    private String city;
    private String phone;
    private boolean verified;
    private boolean deletionRequested;

    public UserSummaryDTO() {}

    public static UserSummaryDTO from(AppUser user) {
        if (user == null) return null;
        UserSummaryDTO dto = new UserSummaryDTO();
        dto.id = user.getId();
        dto.name = user.getName();
        dto.email = user.getEmail();
        dto.profilePicture = user.getProfilePicture();
        dto.role = user.getRole();
        dto.city = user.getCity();
        dto.phone = user.getPhone();
        dto.verified = user.isVerified();
        dto.deletionRequested = user.isDeletionRequested();
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getProfilePicture() { return profilePicture; }
    public String getRole() { return role; }
    public String getCity() { return city; }
    public String getPhone() { return phone; }
    public boolean isVerified() { return verified; }
    public boolean isDeletionRequested() { return deletionRequested; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public void setRole(String role) { this.role = role; }
    public void setCity(String city) { this.city = city; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public void setDeletionRequested(boolean deletionRequested) { this.deletionRequested = deletionRequested; }
}
