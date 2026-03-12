package com.realestate.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that intercepts every request and validates the JWT token.
 * Sets the SecurityContext with the authenticated user's details.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println(
                    "[JWT Debug] Token received: " + (token.length() > 10 ? token.substring(0, 10) + "..." : "short"));

            try {
                if (jwtUtil.isTokenValid(token)) {
                    String email = jwtUtil.extractEmail(token);
                    String role = jwtUtil.extractRole(token);
                    Long userId = jwtUtil.extractUserId(token);
                    System.out.println(
                            "[JWT Debug] Valid token. Email: " + email + ", Role: " + role + ", UserId: " + userId);

                    if (role != null) {
                        String roleName = role.trim().toUpperCase();
                        if (!roleName.startsWith("ROLE_")) {
                            roleName = "ROLE_" + roleName;
                        }

                        System.out.println("[JWT Debug] Setting authority: " + roleName);
                        // Create authentication token with user's role
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                email,
                                userId, // store userId as credentials for easy access
                                List.of(new SimpleGrantedAuthority(roleName)));

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    } else {
                        System.out.println("[JWT Debug] Role is NULL in token");
                    }
                } else {
                    System.out.println("[JWT Debug] Token is NOT valid");
                }
            } catch (Exception e) {
                System.out.println("[JWT Debug] Exception: " + e.getMessage());
                e.printStackTrace();
                // Invalid token — continue without authentication, security context will be
                // empty
                SecurityContextHolder.clearContext();
            }
        } else {
            if (authHeader != null) {
                System.out.println("[JWT Debug] Invalid Auth header format: " + authHeader);
            }
        }

        filterChain.doFilter(request, response);
    }
}
