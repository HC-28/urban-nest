package com.realestate.backend.repository;

import com.realestate.backend.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

        List<Property> findByIsActiveTrueAndIsSoldFalse();

        List<Property> findByAgentId(Long agentId);

        // Top 5 properties by pincode for map mini-panel (Various sorts)
        List<Property> findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceDesc(String pinCode);

        List<Property> findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByPriceAsc(String pinCode);

        List<Property> findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByListedDateDesc(String pinCode);

        List<Property> findTop5ByPinCodeAndIsActiveTrueAndIsSoldFalseOrderByViewsDesc(String pinCode);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCode();

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND p.purpose = :purpose GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndPurpose(@Param("purpose") String purpose);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND p.type = :type GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndType(@Param("type") String type);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND p.purpose = :purpose AND p.type = :type GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndPurposeAndType(@Param("purpose") String purpose,
                        @Param("type") String type);

        // City-based queries for dynamic heatmap
        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND LOWER(p.city) = LOWER(:city) GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndCity(@Param("city") String city);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND p.purpose = :purpose GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndCityAndPurposeWithEngagement(@Param("city") String city,
                        @Param("purpose") String purpose);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndCityAndType(@Param("city") String city,
                        @Param("type") String type);

        @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND p.purpose = :purpose AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
        List<Object[]> countActivePropertiesByPinCodeAndCityAndPurposeAndTypeWithEngagement(@Param("city") String city,
                        @Param("purpose") String purpose, @Param("type") String type);

        List<Property> findByPurpose(String purpose);

        // Find properties by city and active status (for analytics)
        List<Property> findByCityAndIsActiveTrueAndIsSoldFalse(String city);

        // Case-insensitive version for analytics (handles "Ahmedabad" vs "ahmedabad")
        List<Property> findByCityIgnoreCaseAndIsActiveTrueAndIsSoldFalse(String city);

        // Get all distinct cities that have active properties
        @Query("SELECT DISTINCT p.city FROM Property p WHERE p.isActive = true AND p.isSold = false AND p.city IS NOT NULL AND p.city != ''")
        List<String> findDistinctActiveCities();

        // Count sold properties for admin stats
        long countByIsSoldTrue();
}
