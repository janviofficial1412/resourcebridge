package com.resourcebridge.backend.resource.matching;

import com.resourcebridge.backend.resource.ConditionRating;
import com.resourcebridge.backend.resource.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record ResourceMatchRequest(
        @NotBlank(message = "Describe what you are looking for")
        @Size(max = 1000, message = "Request must not exceed 1000 characters")
        String request,
        UUID institutionId,
        UUID categoryId,
        ResourceType resourceType,
        ConditionRating conditionRating,
        Instant startTime,
        Instant endTime,
        @Size(max = 1000, message = "Discovery search must not exceed 1000 characters")
        String search
) {
    public ResourceMatchRequest(String request,
                               UUID institutionId,
                               UUID categoryId,
                               ResourceType resourceType,
                               ConditionRating conditionRating,
                               Instant startTime,
                               Instant endTime) {
        this(request, institutionId, categoryId, resourceType, conditionRating, startTime, endTime, null);
    }
}
