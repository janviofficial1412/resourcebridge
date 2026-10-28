package com.resourcebridge.backend.resource;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        UUID institutionId,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static CategoryResponse from(ResourceCategory category) {
        UUID instId = (category.getInstitution() != null) ? category.getInstitution().getId() : null;
        return new CategoryResponse(
                category.getId(),
                instId,
                category.getName(),
                category.getDescription(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
