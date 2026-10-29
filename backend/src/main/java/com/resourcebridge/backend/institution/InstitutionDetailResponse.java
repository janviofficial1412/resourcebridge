package com.resourcebridge.backend.institution;

import java.time.Instant;
import java.util.UUID;

public record InstitutionDetailResponse(
        UUID id,
        String name,
        String slug,
        String timezone,
        String status,
        String role,
        String membershipStatus,
        long memberCount,
        Instant createdAt,
        UUID logoId
) {
}
