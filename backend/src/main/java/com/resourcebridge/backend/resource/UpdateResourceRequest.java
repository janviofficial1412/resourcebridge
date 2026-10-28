package com.resourcebridge.backend.resource;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateResourceRequest(
        @Size(max = 200, message = "Resource name must not exceed 200 characters")
        String name,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        UUID categoryId,
        ResourceType resourceType,

        @Size(max = 300, message = "Location must not exceed 300 characters")
        String location,

        ConditionRating conditionRating,
        ResourceStatus status,
        Boolean requiresApproval,

        @Positive(message = "Max booking minutes must be greater than 0")
        Integer maxBookingMinutes
) {
    public ResourceService.UpdateResourceCommand toCommand() {
        return new ResourceService.UpdateResourceCommand(
                name,
                description,
                categoryId,
                resourceType,
                location,
                conditionRating,
                status,
                requiresApproval,
                maxBookingMinutes
        );
    }
}
