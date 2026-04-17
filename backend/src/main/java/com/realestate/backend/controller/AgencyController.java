package com.realestate.backend.controller;

import com.realestate.backend.entity.Agency;
import com.realestate.backend.entity.AgentProfile;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.AgencyRepository;
import com.realestate.backend.repository.AgentProfileRepository;
import com.realestate.backend.repository.UserRepository;
import com.realestate.backend.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.AgencyDTO;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/agencies")
public class AgencyController {

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private AgentProfileRepository agentProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** Extract authenticated user ID from JWT SecurityContext */
    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getCredentials() == null) return null;
        try {
            return (Long) auth.getCredentials();
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/public")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getPublicAgencies() {
        java.util.List<Agency> approvedAgencies = agencyRepository.findAll().stream()
                .filter(a -> "APPROVED".equalsIgnoreCase(a.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        java.util.List<Map<String, Object>> response = new java.util.ArrayList<>();
        
        for (Agency agency : approvedAgencies) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", agency.getId());
            map.put("name", agency.getName());
            map.put("logo", agency.getLogoUrl());
            map.put("licenseNumber", agency.getLicenseNumber());
            map.put("agencyCode", agency.getAgencyCode());
            map.put("bio", agency.getBio());
            
            // Agents count
            java.util.List<AgentProfile> profiles = agentProfileRepository.findByAgencyAndAgencyStatus(agency, "JOINED");
            map.put("agentCount", profiles.size());
            
            // Properties count - aggregate total listed by its agents
            java.util.List<Long> agentIds = profiles.stream()
                    .map(p -> p.getUser().getId())
                    .toList();
            long propertyCount = 0;
            if (!agentIds.isEmpty()) {
                propertyCount = propertyRepository.countByAgent_IdInAndActiveTrueAndSoldFalse(agentIds);
            }
            map.put("propertyCount", propertyCount);
            
            response.add(map);
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AgencyDTO>> registerAgency(@RequestBody Agency agency) {
        // Extract adminId from JWT — never trust client-supplied param
        Long adminId = getAuthenticatedUserId();
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Authentication required"));
        }
        AppUser admin = userRepository.findById(adminId).orElse(null);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found"));
        }

        agency.setAdmin(admin);
        agency.setStatus("PENDING");
        Agency savedAgency = agencyRepository.save(agency);

        // Also link the admin to their own agency
        AgentProfile profile = agentProfileRepository.findByUser(admin).orElse(new AgentProfile());
        profile.setUser(admin);
        profile.setAgency(savedAgency);
        profile.setAgencyStatus("JOINED");
        agentProfileRepository.save(profile);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(AgencyDTO.from(savedAgency)));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Map<String, String>>> joinAgency(@RequestBody Map<String, String> payload) {
        String agencyCode = payload.get("agencyCode");

        // Extract agentId from JWT — never trust client-supplied param
        Long agentId = getAuthenticatedUserId();
        if (agentId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Authentication required"));
        }

        Agency agency = agencyRepository.findByAgencyCode(agencyCode).orElse(null);
        if (agency == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Invalid Agency Code"));
        }
        if (!"APPROVED".equals(agency.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("This agency is not yet verified by the platform admin."));
        }

        AppUser agent = userRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Agent not found"));
        }

        AgentProfile profile = agentProfileRepository.findByUser(agent).orElse(new AgentProfile());
        if (profile.getAgency() != null && "JOINED".equals(profile.getAgencyStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You are already a member of " + profile.getAgency().getName()));
        }

        profile.setUser(agent);
        profile.setAgency(agency);
        profile.setAgencyStatus("PENDING");
        agentProfileRepository.save(profile);

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Join request sent to " + agency.getName() + ". Please wait for approval.")));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyAgency(@RequestParam Long agentId) {
        Optional<AppUser> agentOpt = userRepository.findById(agentId);
        if (agentOpt.isPresent()) {
            AgentProfile profile = agentProfileRepository.findByUser(agentOpt.get())
                    .orElse(null);
            if (profile != null && profile.getAgency() != null) {
                // Include the agency status for the agent
                return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "agency", AgencyDTO.from(profile.getAgency()),
                    "agencyStatus", profile.getAgencyStatus()
                )));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("No agency found for this agent"));
    }

    // --- OWNER APPROVAL ENDPOINTS ---

    @GetMapping("/pending-agents")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getPendingAgents(@RequestParam Long ownerId) {
        Optional<Agency> agencyOpt = agencyRepository.findByAdminId(ownerId);
        if (agencyOpt.isEmpty()) {
             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Agency not found or you are not an owner"));
        }
        
        java.util.List<AgentProfile> pending = agentProfileRepository.findByAgencyAndAgencyStatus(agencyOpt.get(), "PENDING");
        
        // Transform to include user details
        java.util.List<Map<String, Object>> response = pending.stream().map(p -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("agentId", p.getUser().getId());
            map.put("name", p.getUser().getName());
            map.put("email", p.getUser().getEmail());
            map.put("experience", p.getExperience());
            map.put("profileId", p.getId());
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/approve-agent/{profileId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> approveAgent(@PathVariable Long profileId) {
        // Extract ownerId from JWT — never trust client-supplied param
        Long ownerId = getAuthenticatedUserId();
        if (ownerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Authentication required"));
        }

        AgentProfile profile = agentProfileRepository.findById(profileId).orElse(null);
        if (profile == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Profile not found"));

        if (profile.getAgency() == null || !profile.getAgency().getAdmin().getId().equals(ownerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Unauthorized"));
        }

        profile.setAgencyStatus("JOINED");
        agentProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Agent approved successfully")));
    }

    @PostMapping("/reject-agent/{profileId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> rejectAgent(@PathVariable Long profileId) {
        // Extract ownerId from JWT — never trust client-supplied param
        Long ownerId = getAuthenticatedUserId();
        if (ownerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Authentication required"));
        }

        AgentProfile profile = agentProfileRepository.findById(profileId).orElse(null);
        if (profile == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Profile not found"));

        if (profile.getAgency() == null || !profile.getAgency().getAdmin().getId().equals(ownerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Unauthorized"));
        }

        profile.setAgencyStatus("REJECTED");
        profile.setAgency(null);
        agentProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Agent request rejected")));
    }
}

