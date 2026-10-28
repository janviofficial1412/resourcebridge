package com.resourcebridge.backend.institution;

import java.time.Instant;
import java.util.UUID;

public record InstitutionSummaryResponse(
        UUID id,
        String name,
        String slug,
        String timezone,
        String status,
        String role,
        String membershipStatus,
        Instant createdAt
) {
}
