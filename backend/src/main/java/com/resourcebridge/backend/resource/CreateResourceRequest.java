package com.resourcebridge.backend.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateResourceRequest(
        @NotNull(message = "Institution ID is required")
        UUID institutionId,

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        @NotBlank(message = "Resource name is required")
        @Size(max = 200, message = "Resource name must not exceed 200 characters")
        String name,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotNull(message = "Resource type is required (EQUIPMENT or SPACE)")
        ResourceType resourceType,

        @Size(max = 300, message = "Location must not exceed 300 characters")
        String location,

        ConditionRating conditionRating,
        ResourceStatus status,
        Boolean requiresApproval,

        @Positive(message = "Max booking minutes must be greater than 0")
        Integer maxBookingMinutes
) {
    public ResourceService.CreateResourceCommand toCommand() {
        return new ResourceService.CreateResourceCommand(
                institutionId,
                categoryId,
                name,
                description,
                resourceType,
                location,
                conditionRating,
                status,
                requiresApproval,
                maxBookingMinutes
        );
    }
}
