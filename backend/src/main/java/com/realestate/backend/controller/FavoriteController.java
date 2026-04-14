package com.realestate.backend.controller;

import com.realestate.backend.entity.Favorite;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.AppUser;
import com.realestate.backend.repository.FavoriteRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.realestate.backend.dto.ApiResponse;
import com.realestate.backend.dto.PropertyListDTO;

/**
 * Manage user favorites.
 * RESTful: POST /api/favorites to add, DELETE /api/favorites to remove.
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteController.class);

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** GET /api/favorites/user/{userId} — Get user's favorite properties */
    @GetMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<List<PropertyListDTO>>> getUserFavorites(@PathVariable Long userId) {
        List<Favorite> favorites = favoriteRepository.findByUser_Id(userId);
        List<PropertyListDTO> dtos = favorites.stream()
                .map(fav -> PropertyListDTO.from(fav.getProperty()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/favorites/status — Check if a property is favorited */
    @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        boolean exists = favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("isFavorite", exists)));
    }

    /** POST /api/favorites — Add a favorite */
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> addFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        long count = favoriteRepository.countByUser_Id(userId);
        if (count >= 10) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("You can only favorite up to 10 properties."));
        }

        if (favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Property already in favorites"));
        }

        AppUser user = userRepository.findById(userId).orElse(null);
        Property property = propertyRepository.findById(propertyId).orElse(null);

        if (user == null || property == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User or Property not found"));
        }

        Favorite favorite = new Favorite(user, property);
        favoriteRepository.save(favorite);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(Map.of("message", "Added to favorites")));
    }

    /** DELETE /api/favorites — Remove a favorite */
    @DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> removeFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        if (!favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Favorite not found"));
        }

        favoriteRepository.deleteByUser_IdAndProperty_Id(userId, propertyId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Removed from favorites")));
    }
}
