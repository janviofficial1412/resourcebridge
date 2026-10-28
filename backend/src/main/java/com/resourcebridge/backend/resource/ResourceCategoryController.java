package com.resourcebridge.backend.resource;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/institutions/{institutionId}/categories")
public class ResourceCategoryController {

    private final ResourceCategoryService resourceCategoryService;

    public ResourceCategoryController(ResourceCategoryService resourceCategoryService) {
        this.resourceCategoryService = resourceCategoryService;
    }

    @GetMapping
    public List<CategoryResponse> getCategories(@PathVariable UUID institutionId,
                                                Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        List<ResourceCategory> categories = resourceCategoryService.getCategories(institutionId, username);
        return categories.stream().map(CategoryResponse::from).toList();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@PathVariable UUID institutionId,
                                           @Valid @RequestBody CreateCategoryRequest request,
                                           Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        ResourceCategory category = resourceCategoryService.createCategory(
                institutionId,
                request.name(),
                request.description(),
                username
        );
        return CategoryResponse.from(category);
    }

    private String getAuthenticatedUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("User must be authenticated");
        }
        return authentication.getName();
    }
}
