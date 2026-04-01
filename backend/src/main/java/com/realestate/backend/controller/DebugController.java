package com.realestate.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Debug controller — ADMIN-ONLY. Exposes auth context info only.
 * The old /api/debug/reset-password endpoint was REMOVED (security vulnerability:
 * it allowed anyone to set any password to plaintext without authentication).
 */
@RestController
@RequestMapping("/api/debug")
public class DebugController {

    /** GET /api/debug/auth — Returns the authenticated user's JWT context (admin only) */
    @GetMapping("/auth")
    public Map<String, Object> getAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Map.of("authenticated", false);
        }
        return Map.of(
                "authenticated", auth.isAuthenticated(),
                "principal", auth.getPrincipal(),
                "authorities", auth.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .collect(Collectors.toList()));
    }
}
