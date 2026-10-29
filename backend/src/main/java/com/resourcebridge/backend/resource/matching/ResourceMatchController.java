package com.resourcebridge.backend.resource.matching;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
public class ResourceMatchController {

    private final ResourceMatchService resourceMatchService;

    public ResourceMatchController(ResourceMatchService resourceMatchService) {
        this.resourceMatchService = resourceMatchService;
    }

    @PostMapping(value = "/match", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResourceMatchResponse match(@Valid @RequestBody ResourceMatchRequest request,
                                       Authentication authentication) {
        if (authentication == null || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("User must be authenticated");
        }
        return resourceMatchService.match(request, authentication.getName());
    }
}
