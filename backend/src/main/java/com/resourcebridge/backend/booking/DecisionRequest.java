package com.resourcebridge.backend.booking;

import jakarta.validation.constraints.Size;

public record DecisionRequest(
        @Size(max = 2000, message = "Decision message must not exceed 2000 characters")
        String decisionMessage
) {}
