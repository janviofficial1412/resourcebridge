package com.resourcebridge.backend.institution;

import java.time.Instant;
import java.util.UUID;

public record InstitutionDirectoryResponse(
        UUID id,
        String name,
        String slug,
        String timezone,
        String status,
        Instant createdAt,
        UUID logoId
) {
}
