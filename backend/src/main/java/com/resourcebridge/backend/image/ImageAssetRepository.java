package com.resourcebridge.backend.image;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ImageAssetRepository extends JpaRepository<ImageAsset, UUID> {

    @Query("SELECT image FROM ImageAsset image LEFT JOIN FETCH image.resource resource "
            + "LEFT JOIN FETCH resource.institution LEFT JOIN FETCH image.institution "
            + "WHERE image.id = :id")
    Optional<ImageAsset> findByIdWithTarget(@Param("id") UUID id);

    Optional<ImageAsset> findByResource_Id(UUID resourceId);

    Optional<ImageAsset> findByInstitution_Id(UUID institutionId);

    @Query("SELECT image FROM ImageAsset image JOIN FETCH image.resource resource "
            + "WHERE resource.id IN :resourceIds")
    List<ImageAsset> findByResourceIdsWithResource(@Param("resourceIds") Collection<UUID> resourceIds);

    @Query("SELECT image FROM ImageAsset image JOIN FETCH image.institution institution "
            + "WHERE institution.id IN :institutionIds")
    List<ImageAsset> findByInstitutionIdsWithInstitution(@Param("institutionIds") Collection<UUID> institutionIds);
}
