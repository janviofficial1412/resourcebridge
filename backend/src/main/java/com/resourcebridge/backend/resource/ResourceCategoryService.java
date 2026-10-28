package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ResourceCategoryService {

    static final String CATEGORY_UNIQUE_CONSTRAINT = "uq_resource_category_name";

    private final ResourceCategoryRepository resourceCategoryRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;

    public ResourceCategoryService(ResourceCategoryRepository resourceCategoryRepository,
                                   MembershipRepository membershipRepository,
                                   AppUserRepository appUserRepository) {
        this.resourceCategoryRepository = resourceCategoryRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public List<ResourceCategory> getCategories(UUID institutionId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        verifyActiveMembership(user.getId(), institutionId);

        return resourceCategoryRepository.findByInstitution_IdOrderByNameAsc(institutionId);
    }

    @Transactional
    public ResourceCategory createCategory(UUID institutionId, String name, String description, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        Membership membership = verifyActiveMembership(user.getId(), institutionId);

        if ("BORROWER".equalsIgnoreCase(membership.getRole())) {
            throw new ResourceService.ResourceAccessDeniedException("Borrowers cannot create resource categories");
        }

        if (name == null || name.isBlank()) {
            throw new ResourceService.ResourceValidationException("Category name must not be blank");
        }

        String trimmedName = name.trim();
        if (trimmedName.length() > 100) {
            throw new ResourceService.ResourceValidationException("Category name must not exceed 100 characters");
        }

        String trimmedDescription = (description != null && !description.isBlank()) ? description.trim() : null;
        if (trimmedDescription != null && trimmedDescription.length() > 500) {
            throw new ResourceService.ResourceValidationException("Category description must not exceed 500 characters");
        }

        if (resourceCategoryRepository.existsByInstitution_IdAndNameIgnoreCase(institutionId, trimmedName)) {
            throw new DuplicateCategoryException("A category named '" + trimmedName + "' already exists in this institution");
        }

        Institution institution = membership.getInstitution();
        ResourceCategory category = new ResourceCategory(institution, trimmedName, trimmedDescription);

        try {
            return resourceCategoryRepository.saveAndFlush(category);
        } catch (DataIntegrityViolationException e) {
            if (isConstraintViolation(e, CATEGORY_UNIQUE_CONSTRAINT)) {
                throw new DuplicateCategoryException("A category named '" + trimmedName + "' already exists in this institution", e);
            }
            throw e;
        }
    }

    private AppUser getAuthenticatedUser(String username) {
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    private Membership verifyActiveMembership(UUID userId, UUID institutionId) {
        Membership membership = membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId)
                .orElseThrow(() -> new ResourceService.ResourceAccessDeniedException("You do not belong to this institution"));

        if (!"ACTIVE".equalsIgnoreCase(membership.getStatus())) {
            throw new ResourceService.ResourceAccessDeniedException("Your membership in this institution is not active");
        }
        return membership;
    }

    private static boolean isConstraintViolation(Throwable failure, String constraintName) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            if (t instanceof ConstraintViolationException cve
                    && constraintName.equalsIgnoreCase(cve.getConstraintName())) {
                return true;
            }
            String message = t.getMessage();
            if (message != null && message.contains(constraintName)) {
                return true;
            }
        }
        return false;
    }

    public static class DuplicateCategoryException extends RuntimeException {
        public DuplicateCategoryException(String message) {
            super(message);
        }

        public DuplicateCategoryException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class ResourceCategoryNotFoundException extends RuntimeException {
        public ResourceCategoryNotFoundException(String message) {
            super(message);
        }
    }
}
