package com.resourcebridge.backend.incident;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class IncidentController {

    private final IncidentReportService incidentReportService;
    private final IncidentSummarizationService incidentSummarizationService;

    public IncidentController(IncidentReportService incidentReportService,
                              IncidentSummarizationService incidentSummarizationService) {
        this.incidentReportService = incidentReportService;
        this.incidentSummarizationService = incidentSummarizationService;
    }

    @PostMapping(value = "/api/institutions/{institutionId}/incidents",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentReportResponse create(@PathVariable UUID institutionId,
                                         @Valid @RequestBody CreateIncidentReportRequest request,
                                         Authentication authentication) {
        return incidentReportService.create(institutionId, request.reportText(), username(authentication));
    }

    @GetMapping("/api/incidents/{incidentId}")
    public IncidentReportResponse get(@PathVariable UUID incidentId, Authentication authentication) {
        return incidentReportService.get(incidentId, username(authentication));
    }

    @PostMapping("/api/incidents/{incidentId}/summary")
    public IncidentSummaryResponse summarize(@PathVariable UUID incidentId, Authentication authentication) {
        return incidentSummarizationService.summarize(incidentId, username(authentication));
    }

    private static String username(Authentication authentication) {
        if (authentication == null || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("User must be authenticated");
        }
        return authentication.getName();
    }
}
