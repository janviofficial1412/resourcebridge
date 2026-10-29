package com.resourcebridge.backend.resource;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // -----------------------------------------------------------------------
    // Resource discovery  (Phase 6.1)
    // -----------------------------------------------------------------------

    /**
     * GET /api/resources?institutionId=&search=&categoryId=&resourceType=&conditionRating=
     *
     * Returns AVAILABLE resources in the given institution visible to any ACTIVE member.
     * All filter params except institutionId are optional.
     */
    @GetMapping
    public List<ResourceResponse> discoverResources(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) ResourceType resourceType,
            @RequestParam(required = false) ConditionRating conditionRating,
            Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        List<Resource> resources = resourceService.discoverResources(
                institutionId, search, categoryId, resourceType, conditionRating, username);
        return resources.stream().map(ResourceResponse::from).toList();
    }

    // -----------------------------------------------------------------------
    // My resources (Phase 5)
    // -----------------------------------------------------------------------

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createResource(@Valid @RequestBody CreateResourceRequest request,
                                           Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        Resource created = resourceService.createResource(request.toCommand(), username);
        return ResourceResponse.from(created);
    }

    @GetMapping("/my")
    public List<ResourceResponse> getMyResources(@RequestParam(required = false) UUID institutionId,
                                                 Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        List<Resource> resources = (institutionId != null)
                ? resourceService.getMyResourcesByInstitution(institutionId, username)
                : resourceService.getMyResources(username);

        return resources.stream().map(ResourceResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResourceResponse getResourceDetails(@PathVariable UUID id,
                                               Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        Resource resource = resourceService.getResourceDetails(id, username);
        return ResourceResponse.from(resource);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResourceResponse updateResource(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateResourceRequest request,
                                           Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        Resource updated = resourceService.updateResource(id, request.toCommand(), username);
        return ResourceResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable UUID id,
                               Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        resourceService.deleteResource(id, username);
    }

    // -----------------------------------------------------------------------

    private String getAuthenticatedUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("User must be authenticated");
        }
        return authentication.getName();
    }
}
