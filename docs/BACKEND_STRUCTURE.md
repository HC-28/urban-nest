# 🏗️ Urban Nest — MNC Backend Architecture Guide

## Current vs Target Package Structure

### ❌ Current Structure (Flat Layer-Based)
```
com.realestate.backend/
  config/          # All configs mixed
  controller/      # All controllers (15 files)
  dto/             # All DTOs
  entity/          # All entities
  repository/      # All repos
  service/         # All services
  security/
  util/
  exception/
```

### ✅ Target Structure (Domain-Driven — MNC Standard)
```
com.realestate.backend/
  ├── config/                         # Framework configuration
  │   ├── security/
  │   │   ├── SecurityConfig.java
  │   │   ├── JwtAuthFilter.java
  │   │   └── JwtUtil.java
  │   ├── web/
  │   │   └── CorsConfig.java
  │   ├── cloud/
  │   │   └── CloudinaryConfig.java
  │   └── scheduling/
  │       └── ScheduledTasks.java
  │
  ├── domain/                         # Business domains (DDD)
  │   ├── property/
  │   │   ├── entity/         Property.java
  │   │   ├── repository/     PropertyRepository.java
  │   │   ├── service/        PropertyService.java (interface)
  │   │   ├── service/impl/   PropertyServiceImpl.java
  │   │   ├── controller/     PropertyController.java
  │   │   ├── dto/            PropertyListDTO.java, PropertyDetailDTO.java
  │   │   └── mapper/         PropertyMapper.java
  │   │
  │   ├── analytics/                  # 🗺️ Heatmap domain (isolated)
  │   │   ├── entity/         PincodeScore.java
  │   │   ├── repository/     PincodeScoreRepository.java
  │   │   ├── service/        AnalyticsService.java (interface)
  │   │   ├── service/impl/   AnalyticsServiceImpl.java
  │   │   ├── controller/     AnalyticsController.java
  │   │   │                   MapController.java
  │   │   └── dto/            HeatmapResponseDTO.java, CityStatsDTO.java
  │   │
  │   ├── user/
  │   │   ├── entity/         AppUser.java, DeletedUser.java
  │   │   ├── repository/     UserRepository.java
  │   │   ├── service/        UserService.java
  │   │   ├── controller/     UserController.java
  │   │   └── dto/            UserProfileDTO.java, UserSummaryDTO.java
  │   │
  │   ├── auth/
  │   │   ├── service/        AuthService.java, OtpService.java, GoogleAuthService.java
  │   │   ├── controller/     AuthController.java
  │   │   └── dto/            LoginRequest.java, AuthResponse.java
  │   │
  │   ├── agent/
  │   │   ├── entity/         AgentProfile.java, AgentSlot.java, AgentReview.java
  │   │   ├── repository/     AgentProfileRepository.java, AgentSlotRepository.java
  │   │   ├── service/        AgentService.java, AppointmentScheduler.java
  │   │   ├── controller/     AgentController.java, AgentSlotController.java
  │   │   └── dto/            AgentProfileDTO.java, AgentSlotDTO.java, AgentReviewDTO.java
  │   │
  │   ├── agency/
  │   │   ├── entity/         Agency.java
  │   │   ├── repository/     AgencyRepository.java
  │   │   ├── service/        AgencyService.java
  │   │   ├── controller/     AgencyController.java
  │   │   └── dto/            AgencyDTO.java
  │   │
  │   ├── appointment/
  │   │   ├── entity/         Appointment.java
  │   │   ├── repository/     AppointmentRepository.java
  │   │   ├── service/        AppointmentService.java
  │   │   ├── controller/     AppointmentController.java
  │   │   └── dto/            AppointmentDTO.java
  │   │
  │   ├── chat/
  │   │   ├── entity/         ChatMessage.java
  │   │   ├── repository/     ChatMessageRepository.java
  │   │   ├── service/        ChatService.java
  │   │   ├── controller/     ChatController.java
  │   │   └── dto/            ChatMessageDTO.java
  │   │
  │   └── favorite/
  │       ├── entity/         Favorite.java
  │       ├── repository/     FavoriteRepository.java
  │       ├── service/        FavoriteService.java
  │       ├── controller/     FavoriteController.java
  │       └── dto/            FavoriteDTO.java
  │
  ├── shared/                         # Cross-domain shared code
  │   ├── dto/
  │   │   └── ApiResponse.java        # Generic wrapper
  │   ├── exception/
  │   │   ├── GlobalExceptionHandler.java
  │   │   ├── ResourceNotFoundException.java
  │   │   ├── ValidationException.java
  │   │   └── UnauthorizedException.java
  │   └── util/
  │       └── SecurityUtils.java
  │
  └── BackendApplication.java
```

## MNC Service Layer Pattern

```java
// Interface (Contract)
public interface AnalyticsService {
    List<HeatmapResponseDTO> getHeatmapData(String city, String mode, String type, String purpose);
    void computeScoresForCity(String city);
    void trackView(Long propertyId, Long userId);
}

// Implementation (Business Logic)
@Service
@Transactional
public class AnalyticsServiceImpl implements AnalyticsService {
    // Implementation here
}
```

## MNC Exception Hierarchy

```java
RuntimeException
  └── UrbanNestException (base)
        ├── ResourceNotFoundException (404)
        ├── ValidationException (400)
        ├── UnauthorizedException (401)
        ├── ConflictException (409)
        └── ExternalServiceException (503)  ← Cloudinary, email failures
```

## API Response Standards

```json
// Success
{ "success": true, "data": {...}, "message": null, "timestamp": "2026-09-28T18:00:00Z" }

// Error
{ "success": false, "data": null, "message": "Property not found", "code": "RESOURCE_NOT_FOUND", "timestamp": "..." }

// Paginated
{ "success": true, "data": { "content": [...], "page": 0, "size": 20, "totalElements": 150, "totalPages": 8 } }
```

## Dead Code to Remove

| File | Issue | Action |
|------|-------|--------|
| `MapController.java` | Exposes `/api/map/{city}` but frontend fetches from `/public/geo/` directly. Never called. | Remove or wire up properly |
| `DebugController.java` | Debug endpoints should not exist in production | Remove before go-live |
| `growth_score`, `conversion_score` | Always hardcoded to 50.0 | Remove from schema or implement properly |
| `generate_seed.py`, `gen_extra.js`, etc. | Seed scripts should be in a `db/seeds/` folder | Move to `db/seeds/` |
