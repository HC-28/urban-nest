package com.realestate.backend.repository;

import com.realestate.backend.entity.PincodeScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PincodeScoreRepository extends JpaRepository<PincodeScore, Long> {

    // Find all scores for a specific city (case-insensitive)
    List<PincodeScore> findByCityIgnoreCase(String city);

    // Find all scores for a specific city (exact match)
    List<PincodeScore> findByCity(String city);

    // Find score for a specific city and pincode
    Optional<PincodeScore> findByCityAndPincode(String city, String pincode);

    // Delete all scores for a city (for recomputation)
    void deleteByCity(String city);

    // Check if scores exist for a city
    boolean existsByCity(String city);

    // Get all unique cities that have scores
    @Query("SELECT DISTINCT ps.city FROM PincodeScore ps")
    List<String> findDistinctCities();
}
