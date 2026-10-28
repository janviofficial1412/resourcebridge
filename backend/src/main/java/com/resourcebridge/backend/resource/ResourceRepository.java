package com.resourcebridge.backend.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    List<Resource> findByInstitution_IdAndOwnerMembership_Id(UUID institutionId, UUID ownerMembershipId);

    List<Resource> findByInstitution_Id(UUID institutionId);

    List<Resource> findByOwnerMembership_User_Id(UUID userId);

    List<Resource> findByInstitution_IdAndOwnerMembership_User_Id(UUID institutionId, UUID userId);

    @Query("SELECT r FROM Resource r " +
            "JOIN FETCH r.institution " +
            "JOIN FETCH r.category " +
            "JOIN FETCH r.ownerMembership m " +
            "JOIN FETCH m.user " +
            "WHERE r.id = :id")
    Optional<Resource> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT r FROM Resource r " +
            "JOIN FETCH r.institution " +
            "JOIN FETCH r.category " +
            "JOIN FETCH r.ownerMembership m " +
            "JOIN FETCH m.user u " +
            "WHERE u.id = :userId " +
            "ORDER BY r.createdAt DESC")
    List<Resource> findByOwnerUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT r FROM Resource r " +
            "JOIN FETCH r.institution " +
            "JOIN FETCH r.category " +
            "JOIN FETCH r.ownerMembership m " +
            "JOIN FETCH m.user u " +
            "WHERE r.institution.id = :institutionId AND u.id = :userId " +
            "ORDER BY r.createdAt DESC")
    List<Resource> findByInstitutionIdAndOwnerUserIdWithDetails(@Param("institutionId") UUID institutionId, @Param("userId") UUID userId);

    long countByOwnerMembership_User_Id(UUID userId);

    long countByInstitution_IdAndOwnerMembership_User_Id(UUID institutionId, UUID userId);
}
