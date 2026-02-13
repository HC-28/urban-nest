package com.realestate.backend.repository;

import com.realestate.backend.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findByIsActiveTrue();

    List<Property> findByAgentId(Long agentId);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCode();

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.purpose = :purpose GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndPurpose(@Param("purpose") String purpose);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.type = :type GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndType(@Param("type") String type);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.purpose = :purpose AND p.type = :type GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndPurposeAndType(@Param("purpose") String purpose,
            @Param("type") String type);

    // City-based queries for dynamic heatmap
    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.city = :city GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCity(@Param("city") String city);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.city = :city AND p.purpose = :purpose GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndPurpose(@Param("city") String city,
            @Param("purpose") String purpose);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.city = :city AND p.type = :type GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndType(@Param("city") String city, @Param("type") String type);

    @Query("SELECT p.pinCode, COUNT(p), AVG(p.price / p.area) FROM Property p WHERE p.isActive = true AND p.area > 0 AND p.city = :city AND p.purpose = :purpose AND p.type = :type GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCodeAndCityAndPurposeAndType(@Param("city") String city,
            @Param("purpose") String purpose, @Param("type") String type);

    List<Property> findByPurpose(String purpose);
}
