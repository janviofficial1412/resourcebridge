package com.resourcebridge.backend.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface IncidentReportRepository extends JpaRepository<IncidentReport, UUID> {

    @Query("SELECT report FROM IncidentReport report " +
            "JOIN FETCH report.institution " +
            "JOIN FETCH report.reporterMembership reporter " +
            "JOIN FETCH reporter.user " +
            "WHERE report.id = :id")
    Optional<IncidentReport> findByIdWithDetails(@Param("id") UUID id);
}
