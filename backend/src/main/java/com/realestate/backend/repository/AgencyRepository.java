package com.realestate.backend.repository;

import com.realestate.backend.entity.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, Long> {
    Optional<Agency> findByAgencyCode(String agencyCode);
    Optional<Agency> findByAdminId(Long adminId);
}
