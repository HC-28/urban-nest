package com.realestate.backend.controller;

import com.realestate.backend.entity.Favorite;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
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

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "${app.frontend-url}", allowCredentials = "true")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    // GET USER FAVORITES
    @GetMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserFavorites(@PathVariable Long userId) {
        try {
            List<Favorite> favorites = favoriteRepository.findByUserId(userId);
            // Extract properties to return a clean list of properties
            List<Property> properties = new ArrayList<>();
            for (Favorite fav : favorites) {
                properties.add(fav.getProperty());
            }
            return ResponseEntity.ok(properties);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // CHECK IF FAVORITE
    @GetMapping(value = "/check", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> checkFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            boolean exists = favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId);
            return ResponseEntity.ok(Map.of("isFavorite", exists));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // ADD FAVORITE
    @PostMapping(value = "/add", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            // Check limit (Max 10)
            long count = favoriteRepository.countByUserId(userId);
            if (count >= 10) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("You can only favorite up to 10 properties.");
            }

            if (favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Property already in favorites");
            }

            User user = userRepository.findById(userId).orElse(null);
            Property property = propertyRepository.findById(propertyId).orElse(null);

            if (user == null || property == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or Property not found");
            }

            Favorite favorite = new Favorite(user, property);
            favoriteRepository.save(favorite);

            return ResponseEntity.ok("Added to favorites");

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    // REMOVE FAVORITE
    @DeleteMapping(value = "/remove", produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> removeFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        try {
            if (!favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Favorite not found");
            }

            favoriteRepository.deleteByUserIdAndPropertyId(userId, propertyId);
            return ResponseEntity.ok("Removed from favorites");

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }
}
