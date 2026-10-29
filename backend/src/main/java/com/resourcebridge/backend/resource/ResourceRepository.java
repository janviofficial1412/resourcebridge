package com.resourcebridge.backend.resource;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Resource r WHERE r.id = :id")
    Optional<Resource> findByIdForUpdate(@Param("id") UUID id);

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

    /**
     * Discovery query: returns AVAILABLE resources in an institution, with optional
     * search (name/description), category, type, and condition filters.
     * All optional parameters are nullable; a null value means "no filter applied".
     * Uses JOIN FETCH to avoid N+1 queries on institution, category, and owner/user.
     */
    @Query("SELECT r FROM Resource r " +
            "JOIN FETCH r.institution i " +
            "JOIN FETCH r.category c " +
            "JOIN FETCH r.ownerMembership m " +
            "JOIN FETCH m.user u " +
            "WHERE r.institution.id = :institutionId " +
            "AND r.status = com.resourcebridge.backend.resource.ResourceStatus.AVAILABLE " +
            "AND (CAST(:search AS string) IS NULL " +
            "     OR LOWER(r.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "     OR LOWER(r.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:categoryId IS NULL OR r.category.id = :categoryId) " +
            "AND (:resourceType IS NULL OR r.resourceType = :resourceType) " +
            "AND (:conditionRating IS NULL OR r.conditionRating = :conditionRating) " +
            "ORDER BY r.name ASC")
    List<Resource> findDiscoverable(
            @Param("institutionId") UUID institutionId,
            @Param("search") String search,
            @Param("categoryId") UUID categoryId,
            @Param("resourceType") ResourceType resourceType,
            @Param("conditionRating") ConditionRating conditionRating);

    long countByOwnerMembership_User_Id(UUID userId);

    long countByInstitution_IdAndOwnerMembership_User_Id(UUID institutionId, UUID userId);
}
