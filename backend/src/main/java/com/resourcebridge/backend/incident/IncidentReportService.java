package com.resourcebridge.backend.incident;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.InstitutionRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import jakarta.persistence.EntityManager;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class IncidentReportService {

    private static final int MAX_REPORT_LENGTH = 10000;

    private final IncidentReportRepository incidentReportRepository;
    private final InstitutionRepository institutionRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;
    private final EntityManager entityManager;

    public IncidentReportService(IncidentReportRepository incidentReportRepository,
                                 InstitutionRepository institutionRepository,
                                 MembershipRepository membershipRepository,
                                 AppUserRepository appUserRepository,
                                 EntityManager entityManager) {
        this.incidentReportRepository = incidentReportRepository;
        this.institutionRepository = institutionRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public IncidentReportResponse create(UUID institutionId, String reportText, String username) {
        if (institutionId == null || reportText == null || reportText.isBlank()
                || reportText.length() > MAX_REPORT_LENGTH) {
            throw new IncidentValidationException("Incident report must contain 1 to 10,000 characters.");
        }
        AppUser user = findUser(username);
        Membership membership = activeInstitutionMembership(user.getId(), institutionId);
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(IncidentNotFoundException::new);
        IncidentReport report = incidentReportRepository.saveAndFlush(
                new IncidentReport(institution, membership, reportText));
        entityManager.refresh(report);
        return IncidentReportResponse.from(report);
    }

    @Transactional(readOnly = true)
    public IncidentReport getAuthorizedReport(UUID incidentId, String username) {
        IncidentReport report = incidentReportRepository.findByIdWithDetails(incidentId)
                .orElseThrow(IncidentNotFoundException::new);
        AppUser user = findUser(username);
        Membership currentMembership = activeInstitutionMembership(
                user.getId(), report.getInstitution().getId());
        boolean isReporter = currentMembership.getId().equals(report.getReporterMembership().getId());
        boolean isInstitutionAdmin = "ADMIN".equalsIgnoreCase(currentMembership.getRole());
        if (!isReporter && !isInstitutionAdmin) {
            throw new IncidentAccessDeniedException(
                    "Only the report author or an active institution administrator may access this report.");
        }
        return report;
    }

    @Transactional(readOnly = true)
    public IncidentReportResponse get(UUID incidentId, String username) {
        return IncidentReportResponse.from(getAuthorizedReport(incidentId, username));
    }

    private AppUser findUser(String username) {
        if (username == null || username.isBlank()) {
            throw new UsernameNotFoundException("User not found");
        }
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private Membership activeInstitutionMembership(UUID userId, UUID institutionId) {
        Membership membership = membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId)
                .orElseThrow(IncidentAccessDeniedException::new);
        if (!"ACTIVE".equalsIgnoreCase(membership.getStatus())
                || !("ADMIN".equalsIgnoreCase(membership.getRole())
                || "MEMBER".equalsIgnoreCase(membership.getRole()))) {
            throw new IncidentAccessDeniedException(
                    "An active institution administrator or member role is required.");
        }
        return membership;
    }

    public static class IncidentNotFoundException extends RuntimeException {
        public IncidentNotFoundException() {
            super("Incident report not found");
        }
    }

    public static class IncidentAccessDeniedException extends RuntimeException {
        public IncidentAccessDeniedException() {
            super("You do not have access to this incident report");
        }

        public IncidentAccessDeniedException(String message) {
            super(message);
        }
    }

    public static class IncidentValidationException extends RuntimeException {
        public IncidentValidationException(String message) {
            super(message);
        }
    }
}
