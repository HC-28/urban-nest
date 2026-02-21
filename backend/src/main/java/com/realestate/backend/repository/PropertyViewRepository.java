package com.realestate.backend.repository;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.PropertyView;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyViewRepository extends JpaRepository<PropertyView, Long> {

    Optional<PropertyView> findByUserAndProperty(AppUser user, Property property);

    List<PropertyView> findByUserOrderByViewedAtDesc(AppUser user, Pageable pageable);
}
