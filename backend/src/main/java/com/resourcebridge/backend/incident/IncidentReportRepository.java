package com.resourcebridge.backend.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import java.util.Collection;

public interface IncidentReportRepository extends JpaRepository<IncidentReport, UUID> {

    @Query("SELECT report FROM IncidentReport report " +
            "JOIN FETCH report.institution " +
            "JOIN FETCH report.reporterMembership reporter " +
            "JOIN FETCH reporter.user " +
            "WHERE report.id = :id")
    Optional<IncidentReport> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT report FROM IncidentReport report " +
            "JOIN FETCH report.institution " +
            "JOIN FETCH report.reporterMembership reporter " +
            "JOIN FETCH reporter.user " +
            "WHERE report.institution.id = :institutionId ORDER BY report.createdAt DESC")
    List<IncidentReport> findByInstitutionIdWithDetails(@Param("institutionId") UUID institutionId);

    @Query("SELECT report FROM IncidentReport report " +
            "JOIN FETCH report.institution " +
            "JOIN FETCH report.reporterMembership reporter " +
            "JOIN FETCH reporter.user " +
            "WHERE reporter.user.id = :userId ORDER BY report.createdAt DESC")
    List<IncidentReport> findByReporterUserIdWithDetails(@Param("userId") UUID userId);

    long countByInstitution_IdAndStatusIn(UUID institutionId, Collection<String> statuses);

    long countByInstitution_IdAndReporterMembership_User_Id(UUID institutionId, UUID userId);
}
