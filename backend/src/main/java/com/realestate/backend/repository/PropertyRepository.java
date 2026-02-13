package com.realestate.backend.repository;

import com.realestate.backend.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    // Public properties (explicit JPQL avoids ambiguity with Boolean wrappers)
    @Query("SELECT p FROM Property p WHERE p.listed = true AND p.deleted = false")
    List<Property> findPublicProperties();

    // Public properties filtered by a purpose keyword (case-insensitive)
    @Query("SELECT p FROM Property p WHERE p.listed = true AND p.deleted = false AND lower(p.purpose) LIKE %:kw%")
    List<Property> findPublicPropertiesByPurposeKeyword(@Param("kw") String kw);

    // Agent properties (only listed ones)
    @Query("SELECT p FROM Property p WHERE p.agentId = :agentId AND p.listed = true AND p.deleted = false")
    List<Property> findAgentProperties(@Param("agentId") Long agentId);

    // Keep older method names for compatibility if other code uses them
    List<Property> findByListedTrueAndDeletedFalse();
    List<Property> findByAgentIdAndListedTrueAndDeletedFalse(Long agentId);

    // Return all properties for an agent (including unlisted), but exclude deleted ones
    @Query("SELECT p FROM Property p WHERE p.agentId = :agentId AND p.deleted = false")
    List<Property> findAllByAgentId(@Param("agentId") Long agentId);

    // Atomically increment views to avoid concurrency issues
    @Modifying
    @Query("UPDATE Property p SET p.views = COALESCE(p.views, 0) + 1 WHERE p.id = :id")
    void incrementViews(@Param("id") Long id);
}
