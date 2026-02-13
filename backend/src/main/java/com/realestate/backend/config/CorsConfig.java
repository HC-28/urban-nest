package com.realestate.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow CORS for specific frontend domain
        registry.addMapping("/**")  // Apply to all endpoints
                .allowedOrigins(frontendUrl)  // Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Allow these HTTP methods
                .allowedHeaders("*")  // Allow all headers
                .allowCredentials(true)  // Allow sending cookies with requests (for authentication, etc.)
                .maxAge(3600);  // Cache the CORS pre-flight request for 1 hour (3600 seconds)
    }
}
