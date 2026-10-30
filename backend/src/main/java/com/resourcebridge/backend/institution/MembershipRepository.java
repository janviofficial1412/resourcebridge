package com.resourcebridge.backend.institution;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    @Query("SELECT m FROM Membership m JOIN FETCH m.institution " +
            "WHERE m.user.id = :userId AND m.status = 'ACTIVE'")
    List<Membership> findActiveByUserIdWithInstitution(@Param("userId") UUID userId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.institution " +
            "WHERE m.user.id = :userId ORDER BY m.institution.name")
    List<Membership> findByUserIdWithInstitution(@Param("userId") UUID userId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.user WHERE m.institution.id = :institutionId")
    List<Membership> findByInstitutionIdWithUser(@Param("institutionId") UUID institutionId);

    Optional<Membership> findByUser_IdAndInstitution_Id(UUID userId, UUID institutionId);

    Optional<Membership> findByIdAndInstitution_Id(UUID id, UUID institutionId);

    @Query("SELECT m.institution.id FROM Membership m WHERE m.user.id = :userId AND m.status = 'ACTIVE'")
    List<UUID> findActiveInstitutionIdsByUserId(@Param("userId") UUID userId);

    boolean existsByUser_IdAndInstitution_Id(UUID userId, UUID institutionId);

    long countByInstitution_Id(UUID institutionId);

    @Query("SELECT COUNT(m) FROM Membership m " +
            "WHERE m.institution.id = :institutionId AND m.status = 'ACTIVE'")
    long countActiveByInstitutionId(@Param("institutionId") UUID institutionId);

    @Query("SELECT COUNT(m) FROM Membership m " +
            "WHERE m.institution.id = :institutionId AND m.role = 'ADMIN' AND m.status = 'ACTIVE'")
    long countActiveAdmins(@Param("institutionId") UUID institutionId);

    long countByInstitution_IdAndRoleAndStatus(UUID institutionId, String role, String status);
}
