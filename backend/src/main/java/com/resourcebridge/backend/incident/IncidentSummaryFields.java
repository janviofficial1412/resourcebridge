package com.resourcebridge.backend.incident;

public record IncidentSummaryFields(
        String incidentSummary,
        String reportedIssue,
        String reportedDelay,
        String evidenceMentioned,
        String suggestedNextAction,
        String missingInformation
) {
}
