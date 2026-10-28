package com.resourcebridge.backend.identity;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String fullName,
        Instant createdAt
) {
}
