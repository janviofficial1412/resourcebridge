package com.resourcebridge.backend.institution;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class InstitutionService {

    static final String SLUG_UNIQUE_CONSTRAINT = "uq_institution_slug";

    private final InstitutionRepository institutionRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;
    private final EntityManager entityManager;

    public InstitutionService(InstitutionRepository institutionRepository,
                              MembershipRepository membershipRepository,
                              AppUserRepository appUserRepository,
                              EntityManager entityManager) {
        this.institutionRepository = institutionRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public InstitutionDetailResponse createInstitution(CreateInstitutionRequest request, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        String slug = request.slug().trim().toLowerCase(Locale.ROOT);
        String name = request.name().trim();
        String timezone = (request.timezone() == null || request.timezone().isBlank())
                ? "UTC"
                : request.timezone().trim();

        if (institutionRepository.existsBySlug(slug)) {
            throw new DuplicateInstitutionSlugException();
        }

        Institution institution = new Institution(name, slug, timezone);
        Institution savedInstitution;
        try {
            savedInstitution = institutionRepository.saveAndFlush(institution);
        } catch (DataIntegrityViolationException e) {
            if (isConstraintViolation(e, SLUG_UNIQUE_CONSTRAINT)) {
                throw new DuplicateInstitutionSlugException(e);
            }
            throw e;
        }

        entityManager.refresh(savedInstitution);

        // Transactional initial administrator membership assignment
        Membership adminMembership = new Membership(
                user,
                savedInstitution,
                "ADMIN",
                "ACTIVE",
                Instant.now()
        );

        membershipRepository.saveAndFlush(adminMembership);

        return new InstitutionDetailResponse(
                savedInstitution.getId(),
                savedInstitution.getName(),
                savedInstitution.getSlug(),
                savedInstitution.getTimezone(),
                savedInstitution.getStatus(),
                adminMembership.getRole(),
                adminMembership.getStatus(),
                1L,
                savedInstitution.getCreatedAt(),
                null
        );
    }

    @Transactional(readOnly = true)
    public List<InstitutionSummaryResponse> listMyInstitutions(String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        List<Membership> memberships = membershipRepository.findActiveByUserIdWithInstitution(user.getId());

        Map<UUID, InstitutionSummaryResponse> deduplicated = new LinkedHashMap<>();
        for (Membership membership : memberships) {
            if (membership == null
                    || membership.getInstitution() == null
                    || !"ACTIVE".equalsIgnoreCase(membership.getStatus())) {
                continue;
            }

            Institution institution = membership.getInstitution();
            deduplicated.putIfAbsent(institution.getId(), new InstitutionSummaryResponse(
                    institution.getId(),
                    institution.getName(),
                    institution.getSlug(),
                    institution.getTimezone(),
                    institution.getStatus(),
                    membership.getRole(),
                    membership.getStatus(),
                    institution.getCreatedAt(),
                    null
            ));
        }

        return List.copyOf(deduplicated.values());
    }

    @Transactional(readOnly = true)
    public InstitutionDetailResponse getInstitutionDetails(UUID institutionId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Membership membership = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institutionId)
                .orElseThrow(InstitutionAccessDeniedException::new);

        if (!"ACTIVE".equalsIgnoreCase(membership.getStatus())) {
            throw new InstitutionAccessDeniedException("Membership is not active");
        }

        Institution institution = membership.getInstitution();
        long memberCount = membershipRepository.countByInstitution_Id(institutionId);

        return new InstitutionDetailResponse(
                institution.getId(),
                institution.getName(),
                institution.getSlug(),
                institution.getTimezone(),
                institution.getStatus(),
                membership.getRole(),
                membership.getStatus(),
                memberCount,
                institution.getCreatedAt(),
                null
        );
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getInstitutionMembers(UUID institutionId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Membership currentMembership = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institutionId)
                .orElseThrow(InstitutionAccessDeniedException::new);

        if (!"ACTIVE".equalsIgnoreCase(currentMembership.getStatus())) {
            throw new InstitutionAccessDeniedException("Membership is not active");
        }

        List<Membership> members = membershipRepository.findByInstitutionIdWithUser(institutionId);

        return members.stream()
                .map(m -> new MemberResponse(
                        m.getId(),
                        m.getUser().getUsername(),
                        m.getUser().getFullName(),
                        m.getRole(),
                        m.getStatus(),
                        m.getVerifiedAt(),
                        m.getCreatedAt()
                ))
                .toList();
    }

    private AppUser getAuthenticatedUser(String username) {
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
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

    public static class DuplicateInstitutionSlugException extends RuntimeException {
        public DuplicateInstitutionSlugException() {
            super("An institution with this slug already exists");
        }

        public DuplicateInstitutionSlugException(Throwable cause) {
            super("An institution with this slug already exists", cause);
        }
    }

    public static class InstitutionNotFoundException extends RuntimeException {
        public InstitutionNotFoundException() {
            super("Institution not found");
        }

        public InstitutionNotFoundException(String message) {
            super(message);
        }
    }

    public static class InstitutionAccessDeniedException extends RuntimeException {
        public InstitutionAccessDeniedException() {
            super("You do not have active membership in this institution");
        }

        public InstitutionAccessDeniedException(String message) {
            super(message);
        }
    }
}
