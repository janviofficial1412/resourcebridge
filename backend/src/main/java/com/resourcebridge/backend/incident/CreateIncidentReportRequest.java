package com.resourcebridge.backend.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateIncidentReportRequest(
        @NotBlank(message = "Incident report must not be blank")
        @Size(max = 10000, message = "Incident report must not exceed 10,000 characters")
        String reportText
) {
}
