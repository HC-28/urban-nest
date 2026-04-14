package com.realestate.backend.repository;

import com.realestate.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByEmail(String email);

    Optional<AppUser> findByVerificationToken(String token);
}
