package com.realestate.backend.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class OtpService {
    private static final int OTP_EXPIRY_MINUTES = 5;
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static class OtpData {
        String code;
        LocalDateTime expiry;

        OtpData(String code, LocalDateTime expiry) {
            this.code = code;
            this.expiry = expiry;
        }
    }

    public String generateOtp(String email) {
        String code = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, new OtpData(code, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        return code;
    }

    public boolean validateOtp(String email, String code) {
        OtpData data = otpStorage.get(email);
        if (data == null) return false;
        
        if (LocalDateTime.now().isAfter(data.expiry)) {
            otpStorage.remove(email);
            return false;
        }

        boolean isValid = data.code.equals(code);
        if (isValid) {
            otpStorage.remove(email); // One-time use
        }
        return isValid;
    }
}
