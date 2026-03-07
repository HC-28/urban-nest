package com.realestate.backend.repository;

import com.realestate.backend.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser_Id(Long userId);

    boolean existsByUser_IdAndProperty_Id(Long userId, Long propertyId);

    List<Favorite> findByProperty_Id(Long propertyId);

    void deleteByUser_IdAndProperty_Id(Long userId, Long propertyId);

    long countByUser_Id(Long userId);

    long countByProperty_Id(Long propertyId); // For analytics tracking
}
