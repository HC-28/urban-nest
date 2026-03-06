package com.realestate.backend.repository;

import com.realestate.backend.entity.DeletedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeletedUserRepository extends JpaRepository<DeletedUser, Long> {
    List<DeletedUser> findAllByOrderByDeletedAtDesc();

    boolean existsByEmail(String email);
}
