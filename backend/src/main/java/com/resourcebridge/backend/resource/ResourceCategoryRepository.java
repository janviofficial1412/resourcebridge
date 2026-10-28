package com.resourcebridge.backend.resource;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResourceCategoryRepository extends JpaRepository<ResourceCategory, UUID> {

    List<ResourceCategory> findByInstitution_IdOrderByNameAsc(UUID institutionId);

    boolean existsByInstitution_IdAndNameIgnoreCase(UUID institutionId, String name);
}

