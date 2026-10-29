package com.resourcebridge.backend.booking;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull(message = "Resource ID is required")
        UUID resourceId,

        @NotNull(message = "Start time is required")
        Instant startTime,

        @NotNull(message = "End time is required")
        Instant endTime,

        @Size(max = 2000, message = "Requester message must not exceed 2000 characters")
        String requesterMessage
) {}
