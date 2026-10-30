package com.resourcebridge.backend.incident;

import java.time.Instant;
import java.util.UUID;

public record IncidentReportResponse(
        UUID id,
        UUID institutionId,
        String institutionName,
        UUID reporterMembershipId,
        String reporterName,
        String reportText,
        Instant createdAt,
        String status,
        String resolution,
        Instant resolvedAt
) {
    static IncidentReportResponse from(IncidentReport report) {
        return new IncidentReportResponse(
                report.getId(),
                report.getInstitution().getId(),
                report.getInstitution().getName(),
                report.getReporterMembership().getId(),
                report.getReporterMembership().getUser().getFullName(),
                report.getReportText(),
                report.getCreatedAt(),
                report.getStatus(),
                report.getResolution(),
                report.getResolvedAt());
    }
}
