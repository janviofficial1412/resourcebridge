package com.resourcebridge.backend.institution;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InstitutionRepository extends JpaRepository<Institution, UUID> {

    boolean existsBySlug(String slug);

    Optional<Institution> findBySlug(String slug);

    List<Institution> findByStatusOrderByNameAsc(String status);
}
