package com.realestate.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * OTP generation and validation with rate limiting.
 * - Max 5 attempts per OTP before it is invalidated (brute-force protection)
 * - Uses SecureRandom instead of java.util.Random for cryptographic safety
 * - OTPs expire after 5 minutes
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;

    // SecureRandom is cryptographically strong — java.util.Random is NOT safe for OTPs
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static class OtpData {
        final String code;
        final LocalDateTime expiry;
        int attempts;

        OtpData(String code, LocalDateTime expiry) {
            this.code = code;
            this.expiry = expiry;
            this.attempts = 0;
        }
    }

    public String generateOtp(String email) {
        // Always overwrite any existing OTP (restart the flow)
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        otpStorage.put(email, new OtpData(code, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        logger.debug("[OTP] Generated OTP for email: {}", email);
        return code;
    }

    public boolean validateOtp(String email, String code) {
        OtpData data = otpStorage.get(email);
        if (data == null) {
            logger.debug("[OTP] No OTP found for email: {}", email);
            return false;
        }

        // Check if expired
        if (LocalDateTime.now().isAfter(data.expiry)) {
            otpStorage.remove(email);
            logger.debug("[OTP] OTP expired for email: {}", email);
            return false;
        }

        // Increment attempt counter
        data.attempts++;

        // Brute-force protection: invalidate after MAX_ATTEMPTS wrong guesses
        if (data.attempts > MAX_ATTEMPTS) {
            otpStorage.remove(email);
            logger.warn("[OTP] Too many failed attempts for email: {}. OTP invalidated.", email);
            return false;
        }

        boolean isValid = data.code.equals(code);
        if (isValid) {
            otpStorage.remove(email); // One-time use
            logger.debug("[OTP] OTP validated successfully for: {}", email);
        } else {
            logger.debug("[OTP] Wrong OTP attempt {}/{} for: {}", data.attempts, MAX_ATTEMPTS, email);
        }
        return isValid;
    }
}
