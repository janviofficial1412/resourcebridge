package com.resourcebridge.backend.institution;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(
        UUID id,
        String username,
        String fullName,
        String role,
        String status,
        Instant verifiedAt,
        Instant createdAt
) {
}
