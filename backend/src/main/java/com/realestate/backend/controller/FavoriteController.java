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

/**
 * Manage user favorites.
 * RESTful: POST /api/favorites to add, DELETE /api/favorites to remove.
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    /** GET /api/favorites/user/{userId} — Get user's favorite properties */
    @GetMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserFavorites(@PathVariable Long userId) {
        try {
            List<Favorite> favorites = favoriteRepository.findByUser_Id(userId);
            List<Property> properties = new ArrayList<>();
            for (Favorite fav : favorites) {
                properties.add(fav.getProperty());
            }
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** GET /api/favorites/status — Check if a property is favorited */
    @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> checkFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            boolean exists = favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId);
            return ResponseEntity.ok(Map.of("isFavorite", exists));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }

    /** POST /api/favorites — Add a favorite */
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> addFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            long count = favoriteRepository.countByUser_Id(userId);
            if (count >= 10) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "You can only favorite up to 10 properties."));
            }

            if (favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Property already in favorites"));
            }

            AppUser user = userRepository.findById(userId).orElse(null);
            Property property = propertyRepository.findById(propertyId).orElse(null);

            if (user == null || property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User or Property not found"));
            }

            Favorite favorite = new Favorite(user, property);
            favoriteRepository.save(favorite);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Added to favorites"));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error: " + ex.getMessage()));
        }
    }

    /** DELETE /api/favorites — Remove a favorite */
    @DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> removeFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            if (!favoriteRepository.existsByUser_IdAndProperty_Id(userId, propertyId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Favorite not found"));
            }

            favoriteRepository.deleteByUser_IdAndProperty_Id(userId, propertyId);
            return ResponseEntity.ok(Map.of("message", "Removed from favorites"));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error"));
        }
    }
}
