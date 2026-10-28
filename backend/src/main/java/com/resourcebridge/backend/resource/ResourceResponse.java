package com.resourcebridge.backend.resource;

import java.time.Instant;
import java.util.UUID;

public record ResourceResponse(
        UUID id,
        UUID institutionId,
        String institutionName,
        UUID ownerMembershipId,
        String ownerName,
        UUID categoryId,
        String categoryName,
        String name,
        String description,
        ResourceType resourceType,
        String location,
        ConditionRating conditionRating,
        ResourceStatus status,
        boolean requiresApproval,
        Integer maxBookingMinutes,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResourceResponse from(Resource resource) {
        UUID institutionId = resource.getInstitution() != null ? resource.getInstitution().getId() : null;
        String institutionName = resource.getInstitution() != null ? resource.getInstitution().getName() : null;
        UUID ownerMembershipId = resource.getOwnerMembership() != null ? resource.getOwnerMembership().getId() : null;
        String ownerName = null;
        if (resource.getOwnerMembership() != null && resource.getOwnerMembership().getUser() != null) {
            ownerName = resource.getOwnerMembership().getUser().getFullName();
        }
        UUID categoryId = resource.getCategory() != null ? resource.getCategory().getId() : null;
        String categoryName = resource.getCategory() != null ? resource.getCategory().getName() : null;

        return new ResourceResponse(
                resource.getId(),
                institutionId,
                institutionName,
                ownerMembershipId,
                ownerName,
                categoryId,
                categoryName,
                resource.getName(),
                resource.getDescription(),
                resource.getResourceType(),
                resource.getLocation(),
                resource.getConditionRating(),
                resource.getStatus(),
                resource.isRequiresApproval(),
                resource.getMaxBookingMinutes(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}
