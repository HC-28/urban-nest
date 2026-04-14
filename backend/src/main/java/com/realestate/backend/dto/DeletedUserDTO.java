package com.realestate.backend.dto;

import com.realestate.backend.entity.DeletedUser;
import java.time.LocalDateTime;

public class DeletedUserDTO {
    private Long id;
    private Long originalUserId;
    private String name;
    private String email;
    private String role;
    private String agencyName;
    private String reason;
    private LocalDateTime deletedAt;
    private Long deletedBy;

    public static DeletedUserDTO from(DeletedUser user) {
        if (user == null) return null;
        DeletedUserDTO dto = new DeletedUserDTO();
        dto.id = user.getId();
        dto.originalUserId = user.getOriginalUserId();
        dto.name = user.getName();
        dto.email = user.getEmail();
        dto.role = user.getRole();
        dto.agencyName = user.getAgencyName();
        dto.reason = user.getDeletionReason();
        dto.deletedAt = user.getDeletedAt();
        dto.deletedBy = user.getDeletedBy();
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public Long getOriginalUserId() { return originalUserId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getAgencyName() { return agencyName; }
    public String getReason() { return reason; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public Long getDeletedBy() { return deletedBy; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setOriginalUserId(Long originalUserId) { this.originalUserId = originalUserId; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public void setReason(String reason) { this.reason = reason; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
    public void setDeletedBy(Long deletedBy) { this.deletedBy = deletedBy; }
}
