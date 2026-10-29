package com.resourcebridge.backend.incident;

import java.util.UUID;

public record IncidentSummaryResponse(
        UUID incidentId,
        boolean aiGenerated,
        boolean requiresHumanReview,
        String label,
        String incidentSummary,
        String reportedIssue,
        String reportedDelay,
        String evidenceMentioned,
        String suggestedNextAction,
        String missingInformation
) {
    static IncidentSummaryResponse draft(UUID incidentId, IncidentSummaryFields fields) {
        return new IncidentSummaryResponse(
                incidentId,
                true,
                true,
                "AI-generated draft — requires human review",
                fields.incidentSummary(),
                fields.reportedIssue(),
                fields.reportedDelay(),
                fields.evidenceMentioned(),
                fields.suggestedNextAction(),
                fields.missingInformation());
    }
}
