package com.realestate.backend.config;

import com.cloudinary.Cloudinary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${CLOUDINARY_CLOUD_NAME:dummy_cloud}")
    private String cloudName;

    @Value("${CLOUDINARY_API_KEY:dummy_key}")
    private String apiKey;

    @Value("${CLOUDINARY_API_SECRET:dummy_secret}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        if ("dummy_cloud".equals(cloudName) || "dummy_key".equals(apiKey)) {
            logger.warn("[Cloudinary] Credentials not fully configured. Image uploads will require valid Cloudinary environment variables.");
        }
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        return new Cloudinary(config);
    }
}
