package com.realestate.backend.repository;

import com.realestate.backend.entity.AgentReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentReviewRepository extends JpaRepository<AgentReview, Long> {
    List<AgentReview> findByAgent_Id(Long agentId);
    
    boolean existsByBuyer_IdAndProperty_Id(Long buyerId, Long propertyId);
}
