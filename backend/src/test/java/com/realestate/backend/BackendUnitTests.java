package com.realestate.backend;

import com.realestate.backend.security.JwtUtil;
import com.realestate.backend.service.OtpService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class BackendUnitTests {

    @Test
    void testOtpLifecycleAndBruteForceProtection() {
        OtpService otpService = new OtpService();
        String email = "test@urbannest.com";
        String otp = otpService.generateOtp(email);

        assertNotNull(otp);
        assertEquals(6, otp.length());

        // Validate wrong OTP increments attempts
        assertFalse(otpService.validateOtp(email, "000000"));

        // Validate correct OTP succeeds
        assertTrue(otpService.validateOtp(email, otp));

        // Validate single-use (cannot be reused)
        assertFalse(otpService.validateOtp(email, otp));
    }

    @Test
    void testJwtTokenGenerationAndClaims() {
        JwtUtil jwtUtil = new JwtUtil();
        String secret = "super_secret_test_key_at_least_32_characters_long!";
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600000L);
        jwtUtil.validateSecret();

        String token = jwtUtil.generateToken(42L, "buyer@urbannest.com", "BUYER");
        assertNotNull(token);
        assertTrue(jwtUtil.isTokenValid(token));
        assertEquals("buyer@urbannest.com", jwtUtil.extractEmail(token));
        assertEquals(42L, jwtUtil.extractUserId(token));
        assertEquals("BUYER", jwtUtil.extractRole(token));
    }
}
