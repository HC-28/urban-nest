package com.realestate.backend.dto;

import com.realestate.backend.entity.AppUser;
import java.time.LocalDateTime;

public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String profilePicture;
    private String city;
    private String phone;
    private String pincode;
    private boolean verified;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    
    // Professional info (for AGENT role)
    private String bio;
    private String agencyName;
    private Integer experience;
    private String specialties;
    private Double rating;
    private Integer reviews;

    public static UserProfileDTO from(AppUser user) {
        if (user == null) return null;
        UserProfileDTO dto = new UserProfileDTO();
        dto.id = user.getId();
        dto.name = user.getName();
        dto.email = user.getEmail();
        dto.role = user.getRole();
        dto.profilePicture = user.getProfilePicture();
        dto.city = user.getCity();
        dto.phone = user.getPhone();
        dto.pincode = user.getPincode();
        dto.verified = user.isVerified();
        dto.emailVerified = user.isEmailVerified();
        dto.createdAt = user.getCreatedAt();
        
        dto.bio = user.getBio();
        dto.agencyName = user.getAgencyName();
        dto.experience = user.getExperience();
        dto.specialties = user.getSpecialties();
        dto.rating = user.getRating();
        dto.reviews = user.getReviews();
        
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getSpecialties() { return specialties; }
    public void setSpecialties(String specialties) { this.specialties = specialties; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getReviews() { return reviews; }
    public void setReviews(Integer reviews) { this.reviews = reviews; }
}
