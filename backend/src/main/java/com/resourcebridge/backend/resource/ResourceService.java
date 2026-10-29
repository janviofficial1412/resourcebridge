package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceCategoryRepository resourceCategoryRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;

    public ResourceService(ResourceRepository resourceRepository,
                           ResourceCategoryRepository resourceCategoryRepository,
                           MembershipRepository membershipRepository,
                           AppUserRepository appUserRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceCategoryRepository = resourceCategoryRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
    }

    public record CreateResourceCommand(
            UUID institutionId,
            UUID categoryId,
            String name,
            String description,
            ResourceType resourceType,
            String location,
            ConditionRating conditionRating,
            ResourceStatus status,
            Boolean requiresApproval,
            Integer maxBookingMinutes
    ) {}

    public record UpdateResourceCommand(
            String name,
            String description,
            UUID categoryId,
            ResourceType resourceType,
            String location,
            ConditionRating conditionRating,
            ResourceStatus status,
            Boolean requiresApproval,
            Integer maxBookingMinutes
    ) {}

    @Transactional
    public Resource createResource(CreateResourceCommand command, String currentUsername) {
        validateCreateCommand(command);

        AppUser user = getAuthenticatedUser(currentUsername);

        Membership ownerMembership = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), command.institutionId())
                .orElseThrow(() -> new ResourceAccessDeniedException("You do not belong to the selected institution"));

        if (!"ACTIVE".equalsIgnoreCase(ownerMembership.getStatus())) {
            throw new ResourceAccessDeniedException("Your membership in this institution is not active");
        }

        if ("BORROWER".equalsIgnoreCase(ownerMembership.getRole())) {
            throw new ResourceAccessDeniedException("Borrowers cannot register resources");
        }

        ResourceCategory category = resourceCategoryRepository.findById(command.categoryId())
                .orElseThrow(() -> new ResourceCategoryService.ResourceCategoryNotFoundException(
                        "Category not found with ID: " + command.categoryId()));

        if (!category.getInstitution().getId().equals(command.institutionId())) {
            throw new ResourceValidationException("Category does not belong to the selected institution");
        }

        String description = (command.description() == null) ? "" : command.description().trim();
        ConditionRating condition = (command.conditionRating() == null) ? ConditionRating.GOOD : command.conditionRating();
        ResourceStatus status = (command.status() == null) ? ResourceStatus.DRAFT : command.status();
        boolean requiresApproval = (command.requiresApproval() == null) || command.requiresApproval();

        Resource resource = new Resource(
                ownerMembership.getInstitution(),
                ownerMembership,
                category,
                command.name().trim(),
                description,
                command.resourceType(),
                command.location() != null ? command.location().trim() : null,
                condition,
                status,
                requiresApproval,
                command.maxBookingMinutes()
        );

        Resource savedResource = resourceRepository.saveAndFlush(resource);

        return resourceRepository.findByIdWithDetails(savedResource.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with ID: " + savedResource.getId()));

    }
    @Transactional(readOnly = true)
    public List<Resource> getMyResources(String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        return resourceRepository.findByOwnerUserIdWithDetails(user.getId()).stream()
                .filter(resource -> "ACTIVE".equalsIgnoreCase(resource.getOwnerMembership().getStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Resource> getMyResourcesByInstitution(UUID institutionId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        verifyActiveMembership(user.getId(), institutionId);

        return resourceRepository.findByInstitutionIdAndOwnerUserIdWithDetails(institutionId, user.getId());
    }

    @Transactional(readOnly = true)
    public Resource getResourceDetails(UUID resourceId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Resource resource = resourceRepository.findByIdWithDetails(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));

        verifyActiveMembership(user.getId(), resource.getInstitution().getId());

        return resource;
    }

    @Transactional
    public Resource updateResource(UUID resourceId, UpdateResourceCommand command, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));

        verifyCanModifyResource(user, resource);

        if (command.name() != null) {
            if (command.name().isBlank()) {
                throw new ResourceValidationException("Resource name must not be blank");
            }
            if (command.name().trim().length() > 200) {
                throw new ResourceValidationException("Resource name must not exceed 200 characters");
            }
            resource.setName(command.name().trim());
        }

        if (command.description() != null) {
            resource.setDescription(command.description().trim());
        }

        if (command.categoryId() != null) {
            ResourceCategory category = resourceCategoryRepository.findById(command.categoryId())
                    .orElseThrow(() -> new ResourceCategoryService.ResourceCategoryNotFoundException(
                            "Category not found with ID: " + command.categoryId()));

            if (!category.getInstitution().getId().equals(resource.getInstitution().getId())) {
                throw new ResourceValidationException("Category does not belong to the resource's institution");
            }
            resource.setCategory(category);
        }

        if (command.resourceType() != null) {
            resource.setResourceType(command.resourceType());
        }

        if (command.location() != null) {
            if (command.location().trim().length() > 300) {
                throw new ResourceValidationException("Location must not exceed 300 characters");
            }
            resource.setLocation(command.location().trim());
        }

        if (command.conditionRating() != null) {
            resource.setConditionRating(command.conditionRating());
        }

        if (command.status() != null) {
            resource.setStatus(command.status());
        }

        if (command.requiresApproval() != null) {
            resource.setRequiresApproval(command.requiresApproval());
        }

        if (command.maxBookingMinutes() != null) {
            if (command.maxBookingMinutes() <= 0) {
                throw new ResourceValidationException("Max booking minutes must be greater than 0");
            }
            resource.setMaxBookingMinutes(command.maxBookingMinutes());
        }

        return resourceRepository.saveAndFlush(resource);
    }

    @Transactional
    public void deleteResource(UUID resourceId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));

        verifyCanModifyResource(user, resource);

        resourceRepository.delete(resource);
        resourceRepository.flush();
    }

    /**
     * Discovers AVAILABLE resources across the caller's active institutions,
     * optionally narrowed to one institution.
     * All filter parameters are optional (null = no filter applied).
     * When categoryId is provided it must belong to an institution the caller
     * can access and, when selected, to the selected institution.
     */
    @Transactional(readOnly = true)
    public List<Resource> discoverResources(UUID institutionId,
                                            String search,
                                            UUID categoryId,
                                            ResourceType resourceType,
                                            ConditionRating conditionRating,
                                            String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        List<UUID> activeInstitutionIds;
        if (institutionId != null) {
            verifyActiveMembership(user.getId(), institutionId);
            activeInstitutionIds = List.of(institutionId);
        } else {
            activeInstitutionIds = membershipRepository.findActiveInstitutionIdsByUserId(user.getId());
        }

        if (activeInstitutionIds.isEmpty()) {
            return List.of();
        }

        if (categoryId != null) {
            ResourceCategory category = resourceCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceCategoryService.ResourceCategoryNotFoundException(
                            "Category not found with ID: " + categoryId));
            UUID categoryInstitutionId = category.getInstitution().getId();
            if (institutionId != null && !categoryInstitutionId.equals(institutionId)) {
                throw new ResourceValidationException(
                        "Category does not belong to institution " + institutionId);
            }
            if (!activeInstitutionIds.contains(categoryInstitutionId)) {
                throw new ResourceAccessDeniedException("You do not have access to this category's institution");
            }
        }

        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        return resourceRepository.findDiscoverable(
                institutionId, activeInstitutionIds, trimmedSearch, categoryId, resourceType, conditionRating);
    }

    @Transactional(readOnly = true)
    public long countMyResources(String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        return resourceRepository.countByOwnerMembership_User_Id(user.getId());
    }

    private void validateCreateCommand(CreateResourceCommand command) {
        if (command == null) {
            throw new ResourceValidationException("Create resource command must not be null");
        }
        if (command.institutionId() == null) {
            throw new ResourceValidationException("Institution ID is required");
        }
        if (command.categoryId() == null) {
            throw new ResourceValidationException("Category ID is required");
        }
        if (command.name() == null || command.name().isBlank()) {
            throw new ResourceValidationException("Resource name must not be blank");
        }
        if (command.name().trim().length() > 200) {
            throw new ResourceValidationException("Resource name must not exceed 200 characters");
        }
        if (command.resourceType() == null) {
            throw new ResourceValidationException("Resource type is required (EQUIPMENT or SPACE)");
        }
        if (command.location() != null && command.location().trim().length() > 300) {
            throw new ResourceValidationException("Location must not exceed 300 characters");
        }
        if (command.maxBookingMinutes() != null && command.maxBookingMinutes() <= 0) {
            throw new ResourceValidationException("Max booking minutes must be greater than 0");
        }
    }

    private void verifyCanModifyResource(AppUser user, Resource resource) {
        Membership membership = membershipRepository
                .findByUser_IdAndInstitution_Id(user.getId(), resource.getInstitution().getId())
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                .orElseThrow(() -> new ResourceAccessDeniedException(
                        "You need an active membership in this institution to modify this resource"));

        boolean isOwner = resource.getOwnerMembership().getId().equals(membership.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(membership.getRole());
        if (!isOwner && !isAdmin) {
            throw new ResourceAccessDeniedException("You do not have permission to modify or delete this resource");
        }
    }

    private AppUser getAuthenticatedUser(String username) {
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    private Membership verifyActiveMembership(UUID userId, UUID institutionId) {
        Membership membership = membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId)
                .orElseThrow(() -> new ResourceAccessDeniedException("You do not have access to this institution"));

        if (!"ACTIVE".equalsIgnoreCase(membership.getStatus())) {
            throw new ResourceAccessDeniedException("Your membership in this institution is not active");
        }
        return membership;
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    public static class ResourceAccessDeniedException extends RuntimeException {
        public ResourceAccessDeniedException(String message) {
            super(message);
        }
    }

    public static class ResourceValidationException extends RuntimeException {
        public ResourceValidationException(String message) {
            super(message);
        }
    }
}
