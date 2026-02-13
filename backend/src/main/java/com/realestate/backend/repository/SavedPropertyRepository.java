package com.realestate.backend.repository;

import com.realestate.backend.entity.SavedProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedPropertyRepository extends JpaRepository<SavedProperty, Long> {

    // 🔥 DELETE saved entries when property is deleted
    void deleteByProperty_Id(Long propertyId);

    @Query("""
                SELECT sp
                FROM SavedProperty sp
                WHERE sp.userId = :userId
                  AND sp.property.deleted = false
            """)
    List<SavedProperty> findValidSavedProperties(Long userId);

}