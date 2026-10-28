package com.resourcebridge.backend.institution;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    @Query("SELECT m FROM Membership m JOIN FETCH m.institution WHERE m.user.id = :userId")
    List<Membership> findByUserIdWithInstitution(@Param("userId") UUID userId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.user WHERE m.institution.id = :institutionId")
    List<Membership> findByInstitutionIdWithUser(@Param("institutionId") UUID institutionId);

    Optional<Membership> findByUser_IdAndInstitution_Id(UUID userId, UUID institutionId);

    boolean existsByUser_IdAndInstitution_Id(UUID userId, UUID institutionId);

    long countByInstitution_Id(UUID institutionId);
}
