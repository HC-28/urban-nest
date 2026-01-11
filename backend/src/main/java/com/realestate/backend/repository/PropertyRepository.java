package com.realestate.backend.repository;

import com.realestate.backend.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findByIsActiveTrue();
    List<Property> findByAgentId(Long agentId);


    @Query("SELECT p.pinCode, COUNT(p) FROM Property p WHERE p.isActive = true GROUP BY p.pinCode")
    List<Object[]> countActivePropertiesByPinCode();
}
