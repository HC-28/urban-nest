package com.realestate.backend.repository;

import com.realestate.backend.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    @Query("SELECT p FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL)")
    List<Property> findVisibleProperties();

    @Query("SELECT p FROM Property p WHERE p.agent.id = :agentId")
    List<Property> findByAgentId(@Param("agentId") Long agentId);

    @Query("SELECT p FROM Property p WHERE p.agent.id = :agentId")
    List<Property> findByAgent_Id(Long agentId);

    long countByAgent_IdInAndActiveTrueAndSoldFalse(List<Long> agentIds);

    // Simplified top 5 queries
    @Query("SELECT p FROM Property p WHERE p.pinCode = :pinCode AND (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) ORDER BY p.price DESC")
    List<Property> findTop5ByPinCodeVisibleOrderByPriceDesc(@Param("pinCode") String pinCode);

    @Query("SELECT p FROM Property p WHERE p.pinCode = :pinCode AND (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) ORDER BY p.price ASC")
    List<Property> findTop5ByPinCodeVisibleOrderByPriceAsc(@Param("pinCode") String pinCode);

    @Query("SELECT p FROM Property p WHERE p.pinCode = :pinCode AND (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) ORDER BY p.listedDate DESC")
    List<Property> findTop5ByPinCodeVisibleOrderByListedDateDesc(@Param("pinCode") String pinCode);

    @Query("SELECT p FROM Property p WHERE p.pinCode = :pinCode AND (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) ORDER BY p.views DESC")
    List<Property> findTop5ByPinCodeVisibleOrderByViewsDesc(@Param("pinCode") String pinCode);

    List<Property> findTop5ByPinCodeAndActiveTrueAndSoldFalseOrderByListedDateDesc(String pinCode);

    List<Property> findTop5ByPinCodeAndActiveTrueAndSoldFalseOrderByViewsDesc(String pinCode);

    List<Property> findTop5ByPinCodeAndActiveTrueAndSoldFalseOrderByPriceAsc(String pinCode);

    List<Property> findTop5ByPinCodeAndActiveTrueAndSoldFalseOrderByPriceDesc(String pinCode);

    // Simplified map counters
    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCode();

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.purpose) = LOWER(:purpose) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndPurpose(@Param("purpose") String purpose);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndType(@Param("type") String type);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.purpose) = LOWER(:purpose) AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndPurposeAndType(@Param("purpose") String purpose, @Param("type") String type);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.city) = LOWER(:city) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCity(@Param("city") String city);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND LOWER(p.purpose) LIKE LOWER(CONCAT('%', :purpose, '%')) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndPurposeWithEngagement(@Param("city") String city, @Param("purpose") String purpose);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndType(@Param("city") String city, @Param("type") String type);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area), SUM(CAST(p.views AS long)), SUM(CAST(p.favorites AS long)), SUM(CAST(p.inquiries AS long)) FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.area > 0 AND LOWER(p.city) = LOWER(:city) AND LOWER(p.purpose) LIKE LOWER(CONCAT('%', :purpose, '%')) AND LOWER(p.type) = LOWER(:type) GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndPurposeAndTypeWithEngagement(@Param("city") String city, @Param("purpose") String purpose, @Param("type") String type);

    @Query("SELECT p FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND LOWER(p.city) = LOWER(:city)")
    List<Property> findByCityVisible(@Param("city") String city);

    @Query("SELECT DISTINCT p.city FROM Property p WHERE (p.active = true OR p.active IS NULL) AND (p.sold = false OR p.sold IS NULL) AND p.city IS NOT NULL AND p.city != ''")
    List<String> findDistinctActiveCities();

    long countBySoldTrue();
}
