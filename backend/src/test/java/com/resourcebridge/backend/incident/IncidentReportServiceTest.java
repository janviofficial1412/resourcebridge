package com.resourcebridge.backend.incident;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.InstitutionRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentReportServiceTest {

    @Mock
    private IncidentReportRepository reportRepository;
    @Mock
    private InstitutionRepository institutionRepository;
    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private AppUserRepository userRepository;
    @Mock
    private EntityManager entityManager;

    private IncidentReportService service;
    private UUID institutionId;
    private UUID reporterMembershipId;
    private UUID reporterId;
    private UUID otherUserId;
    private UUID incidentId;
    private Institution institution;
    private Membership reporterMembership;
    private IncidentReport report;
    @BeforeEach
    void setUp() {
        service = new IncidentReportService(
                reportRepository, institutionRepository, membershipRepository, userRepository, entityManager);
        institutionId = UUID.randomUUID();
        reporterMembershipId = UUID.randomUUID();
        reporterId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        incidentId = UUID.randomUUID();
        institution = new Institution("Example", "example", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        AppUser reporter = user("reporter", reporterId);
        reporterMembership = new Membership(reporter, institution, "MEMBER", "ACTIVE", null);
        ReflectionTestUtils.setField(reporterMembership, "id", reporterMembershipId);
        report = new IncidentReport(institution, reporterMembership, "The original report text.");
        ReflectionTestUtils.setField(report, "id", incidentId);
    }

    @Test
    void reportAuthorCanRetrieveOriginalReport() {
        stubExistingReport(reporterId);
        when(membershipRepository.findByUser_IdAndInstitution_Id(reporterId, institutionId))
                .thenReturn(Optional.of(reporterMembership));

        assertEquals(report, service.getAuthorizedReport(incidentId, "requester"));
        assertEquals("The original report text.", report.getReportText());
    }

    @Test
    void activeInstitutionAdministratorCanRetrieveReportButAnotherMemberCannot() {
        stubExistingReport(otherUserId);
        Membership adminMembership = activeMembership(otherUserId, "ADMIN", "ACTIVE");
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(adminMembership));
        assertEquals(report, service.getAuthorizedReport(incidentId, "requester"));

        Membership otherMember = activeMembership(otherUserId, "MEMBER", "ACTIVE");
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(otherMember));
        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.getAuthorizedReport(incidentId, "requester"));
    }

    @Test
    void pendingOrCrossInstitutionMembershipCannotAccessReport() {
        stubExistingReport(otherUserId);
        Membership pendingMember = activeMembership(otherUserId, "MEMBER", "PENDING");
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(pendingMember));
        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.getAuthorizedReport(incidentId, "requester"));

        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.empty());
        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.getAuthorizedReport(incidentId, "requester"));
    }

    @Test
    void createRejectsEmptyOrExcessivelyLongReportsBeforePersistence() {
        assertThrows(IncidentReportService.IncidentValidationException.class,
                () -> service.create(institutionId, "  ", "requester"));
        assertThrows(IncidentReportService.IncidentValidationException.class,
                () -> service.create(institutionId, "x".repeat(10001), "requester"));
        verify(reportRepository, never()).saveAndFlush(any());
    }

    @Test
    void createPreservesTheExactSubmittedReportText() {
        Membership member = activeMembership(otherUserId, "MEMBER", "ACTIVE");
        when(userRepository.findByUsername("requester"))
                .thenReturn(Optional.of(user("requester", otherUserId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(member));
        when(institutionRepository.findById(institutionId)).thenReturn(Optional.of(institution));
        when(reportRepository.saveAndFlush(any(IncidentReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        String originalText = "  The report, including surrounding whitespace, is preserved. \n";

        IncidentReportResponse response = service.create(institutionId, originalText, "requester");

        assertEquals(originalText, response.reportText());
    }

    @Test
    void studentsCanListOnlyTheirOwnReportsWithActiveMemberships() {
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", reporterId)));
        when(membershipRepository.findActiveByUserIdWithInstitution(reporterId))
                .thenReturn(java.util.List.of(reporterMembership));
        when(reportRepository.findByReporterUserIdWithDetails(reporterId))
                .thenReturn(java.util.List.of(report));

        var responses = service.getMyReports("requester");

        assertEquals(1, responses.size());
        assertEquals(incidentId, responses.get(0).id());
        assertEquals("OPEN", responses.get(0).status());
    }

    @Test
    void institutionReportsRequireAnActiveAdministrator() {
        Membership member = activeMembership(otherUserId, "MEMBER", "ACTIVE");
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", otherUserId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(member));

        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.getInstitutionReports(institutionId, "requester"));
        verify(reportRepository, never()).findByInstitutionIdWithDetails(any());
    }

    @Test
    void institutionAdministratorCanListReportsOnlyWithinTheirInstitution() {
        Membership admin = activeMembership(otherUserId, "ADMIN", "ACTIVE");
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", otherUserId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(admin));
        when(reportRepository.findByInstitutionIdWithDetails(institutionId)).thenReturn(java.util.List.of(report));

        var responses = service.getInstitutionReports(institutionId, "requester");

        assertEquals(1, responses.size());
        verify(reportRepository).findByInstitutionIdWithDetails(institutionId);
    }

    @Test
    void administratorCanRecordResolutionAndStatus() {
        Membership admin = activeMembership(otherUserId, "ADMIN", "ACTIVE");
        when(reportRepository.findByIdWithDetails(incidentId)).thenReturn(Optional.of(report));
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", otherUserId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(admin));
        when(reportRepository.saveAndFlush(report)).thenReturn(report);

        IncidentReportResponse response = service.update(incidentId,
                new UpdateIncidentReportRequest(IncidentStatus.RESOLVED, "Repaired and tested."),
                "requester");

        assertEquals("RESOLVED", response.status());
        assertEquals("Repaired and tested.", response.resolution());
        assertEquals(admin.getId(), report.getResolvedByMembershipId());
        assertNotNull(report.getResolvedAt());
    }

    @Test
    void resolvingReportRequiresResolutionNote() {
        Membership admin = activeMembership(otherUserId, "ADMIN", "ACTIVE");
        when(reportRepository.findByIdWithDetails(incidentId)).thenReturn(Optional.of(report));
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", otherUserId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(otherUserId, institutionId))
                .thenReturn(Optional.of(admin));

        assertThrows(IncidentReportService.IncidentValidationException.class,
                () -> service.update(incidentId,
                        new UpdateIncidentReportRequest(IncidentStatus.RESOLVED, " "),
                        "requester"));
        verify(reportRepository, never()).saveAndFlush(any());
    }

    @Test
    void studentCannotUpdateIncidentStatusOrResolution() {
        when(reportRepository.findByIdWithDetails(incidentId)).thenReturn(Optional.of(report));
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", reporterId)));
        when(membershipRepository.findByUser_IdAndInstitution_Id(reporterId, institutionId))
                .thenReturn(Optional.of(reporterMembership));

        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.update(incidentId,
                        new UpdateIncidentReportRequest(IncidentStatus.IN_PROGRESS, null),
                        "requester"));
        verify(reportRepository, never()).saveAndFlush(any());
    }

    private Membership activeMembership(UUID userId, String role, String status) {
        Membership membership = new Membership(user("member", userId), institution, role, status, null);
        ReflectionTestUtils.setField(membership, "id", UUID.randomUUID());
        return membership;
    }

    private void stubExistingReport(UUID userId) {
        when(reportRepository.findByIdWithDetails(incidentId)).thenReturn(Optional.of(report));
        when(userRepository.findByUsername("requester")).thenReturn(Optional.of(user("requester", userId)));
    }

    private AppUser user(String username, UUID id) {
        AppUser user = new AppUser(username, "unused", "Test User");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
