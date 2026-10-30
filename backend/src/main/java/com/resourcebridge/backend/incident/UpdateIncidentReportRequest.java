package com.resourcebridge.backend.incident;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateIncidentReportRequest(
        @NotNull IncidentStatus status,
        @Size(max = 10000) String resolution
) {}
