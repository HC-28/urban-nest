package com.realestate.backend.repository;

import com.realestate.backend.entity.AgentProfile;
import com.realestate.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgentProfileRepository extends JpaRepository<AgentProfile, Long> {
    Optional<AgentProfile> findByUser(AppUser user);
    Optional<AgentProfile> findByUserId(Long userId);
    void deleteByUser(AppUser user);
    
    java.util.List<AgentProfile> findByAgencyAndAgencyStatus(com.realestate.backend.entity.Agency agency, String agencyStatus);
    java.util.List<AgentProfile> findByAgency(com.realestate.backend.entity.Agency agency);
}
