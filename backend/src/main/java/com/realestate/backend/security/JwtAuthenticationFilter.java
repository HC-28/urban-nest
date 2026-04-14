package com.realestate.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtUtil.isTokenValid(token)) {
                    String email = jwtUtil.extractEmail(token);
                    String role = jwtUtil.extractRole(token);
                    Long userId = jwtUtil.extractUserId(token);

                    // DEBUG level — will be silent in production when log level is WARN/INFO
                    logger.debug("[JWT] Valid token for user: {} | Role: {} | UserId: {}", email, role, userId);

                    if (role != null) {
                        String roleName = role.trim().toUpperCase();
                        if (!roleName.startsWith("ROLE_")) {
                            roleName = "ROLE_" + roleName;
                        }

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                email,
                                userId, // store userId as credentials for easy access
                                List.of(new SimpleGrantedAuthority(roleName)));

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    } else {
                        logger.warn("[JWT] Token valid but role claim is missing for user: {}", email);
                    }
                } else {
                    logger.debug("[JWT] Token is not valid or expired for request: {}", request.getRequestURI());
                }
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                logger.debug("[JWT] Token expired");
                SecurityContextHolder.clearContext();
            } catch (io.jsonwebtoken.security.SignatureException e) {
                logger.warn("[JWT] Token signature invalid — possible tampering attempt on: {}", request.getRequestURI());
                SecurityContextHolder.clearContext();
            } catch (Exception e) {
                logger.error("[JWT] Unexpected error during token validation: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
