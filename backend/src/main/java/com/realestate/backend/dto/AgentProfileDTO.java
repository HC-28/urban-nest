package com.realestate.backend.dto;

import com.realestate.backend.entity.AppUser;
import java.util.List;

/**
 * Public agent profile DTO with statistics and property listings.
 */
public class AgentProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String city;
    private String profilePicture;
    private String bio;
    private String agencyName;
    private String specialties;
    private Integer experience;
    private Double rating;
    private Integer reviews;
    private long propertiesListed;
    private long propertiesSold;
    
    private List<PropertyListDTO> featuredProperties;
    private List<PropertyListDTO> otherProperties;
    private List<PropertyListDTO> soldProperties;

    public static AgentProfileDTO from(AppUser agent) {
        if (agent == null) return null;
        AgentProfileDTO dto = new AgentProfileDTO();
        dto.id = agent.getId();
        dto.name = agent.getName();
        dto.email = agent.getEmail();
        dto.phone = agent.getPhone();
        dto.city = agent.getCity();
        dto.profilePicture = agent.getProfilePictureUrl();
        dto.bio = agent.getBio();
        dto.agencyName = agent.getAgencyName();
        dto.specialties = agent.getSpecialties();
        dto.experience = agent.getExperience();
        dto.rating = agent.getRating();
        dto.reviews = agent.getReviews();
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getSpecialties() { return specialties; }
    public void setSpecialties(String specialties) { this.specialties = specialties; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getReviews() { return reviews; }
    public void setReviews(Integer reviews) { this.reviews = reviews; }
    public long getPropertiesListed() { return propertiesListed; }
    public void setPropertiesListed(long propertiesListed) { this.propertiesListed = propertiesListed; }
    public long getPropertiesSold() { return propertiesSold; }
    public void setPropertiesSold(long propertiesSold) { this.propertiesSold = propertiesSold; }
    public List<PropertyListDTO> getFeaturedProperties() { return featuredProperties; }
    public void setFeaturedProperties(List<PropertyListDTO> featuredProperties) { this.featuredProperties = featuredProperties; }
    public List<PropertyListDTO> getOtherProperties() { return otherProperties; }
    public void setOtherProperties(List<PropertyListDTO> otherProperties) { this.otherProperties = otherProperties; }
    public List<PropertyListDTO> getSoldProperties() { return soldProperties; }
    public void setSoldProperties(List<PropertyListDTO> soldProperties) { this.soldProperties = soldProperties; }
}
