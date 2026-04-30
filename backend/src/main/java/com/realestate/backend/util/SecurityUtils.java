package com.realestate.backend.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.realestate.backend.repository.AgentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class SecurityUtils {

    @Autowired
    private AgentProfileRepository agentProfileRepository;

    public static Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getCredentials() == null) return null;
        try {
            if (auth.getCredentials() instanceof Long) {
                return (Long) auth.getCredentials();
            }
            return Long.valueOf(auth.getCredentials().toString());
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(roleWithPrefix));
    }

    @Autowired
    private com.realestate.backend.repository.UserRepository userRepository;

    public boolean isVerifiedAgent(Long agentId) {
        if (hasRole("ADMIN")) return true;
        
        // Check if the user itself is verified (Independent Agent support)
        boolean userVerified = userRepository.findById(agentId)
                .map(u -> Boolean.TRUE.equals(u.isVerified()))
                .orElse(false);
        
        if (userVerified) return true;

        // Otherwise, check if they belong to a verified agency
        return agentProfileRepository.findByUserId(agentId)
                .map(p -> "JOINED".equals(p.getAgencyStatus()) && 
                          p.getAgency() != null && 
                          "APPROVED".equals(p.getAgency().getStatus()))
                .orElse(false);
    }
}
