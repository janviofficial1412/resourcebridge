package com.resourcebridge.backend.institution;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InstitutionServiceTest {

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private EntityManager entityManager;

    private InstitutionService institutionService;

    private AppUser adminUser;

    @BeforeEach
    void setUp() {
        institutionService = new InstitutionService(
                institutionRepository,
                membershipRepository,
                appUserRepository,
                entityManager
        );
        adminUser = new AppUser("test_admin", "admin@example.com", "hash", "Admin User");
    }

    @Test
    void institutionCreationAssignsInitialAdminRole() {
        CreateInstitutionRequest request = new CreateInstitutionRequest(
                "Apex Robotics Institute",
                "apex-robotics",
                "America/New_York"
        );

        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(institutionRepository.existsBySlug("apex-robotics")).thenReturn(false);

        Institution savedInst = new Institution("Apex Robotics Institute", "apex-robotics", "America/New_York");
        when(institutionRepository.saveAndFlush(any(Institution.class))).thenReturn(savedInst);

        InstitutionDetailResponse response = institutionService.createInstitution(request, "test_admin");

        assertNotNull(response);
        assertEquals("Apex Robotics Institute", response.name());
        assertEquals("apex-robotics", response.slug());
        assertEquals("ADMIN", response.role());
        assertEquals("ACTIVE", response.membershipStatus());
        assertNull(response.logoId());

        ArgumentCaptor<Membership> membershipCaptor = ArgumentCaptor.forClass(Membership.class);
        verify(membershipRepository).saveAndFlush(membershipCaptor.capture());
        Membership createdMembership = membershipCaptor.getValue();
        assertEquals("ADMIN", createdMembership.getRole());
        assertEquals("ACTIVE", createdMembership.getStatus());
        assertNotNull(createdMembership.getVerifiedAt());
    }

    @Test
    void institutionCreationRejectsDuplicateSlug() {
        CreateInstitutionRequest request = new CreateInstitutionRequest(
                "Duplicate Lab",
                "existing-slug",
                "UTC"
        );

        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(institutionRepository.existsBySlug("existing-slug")).thenReturn(true);

        assertThrows(InstitutionService.DuplicateInstitutionSlugException.class, () ->
                institutionService.createInstitution(request, "test_admin"));
    }

    @Test
    void institutionCreationFailsIfMembershipFails() {
        CreateInstitutionRequest request = new CreateInstitutionRequest(
                "Failing Lab",
                "fail-lab",
                "UTC"
        );

        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(institutionRepository.existsBySlug("fail-lab")).thenReturn(false);

        Institution savedInst = new Institution("Failing Lab", "fail-lab", "UTC");
        when(institutionRepository.saveAndFlush(any(Institution.class))).thenReturn(savedInst);

        when(membershipRepository.saveAndFlush(any(Membership.class)))
                .thenThrow(new RuntimeException("Database constraint failure on membership"));

        assertThrows(RuntimeException.class, () ->
                institutionService.createInstitution(request, "test_admin"));
    }

    @Test
    void listMyInstitutionsIncludesAnActiveMembership() {
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));

        Institution inst = new Institution("Apex Lab", "apex-lab", "UTC");
        Membership membership = new Membership(adminUser, inst, "ADMIN", "ACTIVE", null);

        when(membershipRepository.findActiveByUserIdWithInstitution(any())).thenReturn(List.of(membership));

        List<InstitutionSummaryResponse> result = institutionService.listMyInstitutions("test_admin");

        assertEquals(1, result.size());
        assertEquals("Apex Lab", result.get(0).name());
        assertEquals("ADMIN", result.get(0).role());
    }

    @Test
    void listMyInstitutionsExcludesInactiveMembership() {
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        Institution institution = new Institution("Pending Lab", "pending-lab", "UTC");
        Membership pendingMembership = new Membership(
                adminUser, institution, "MEMBER", "PENDING", null);
        when(membershipRepository.findActiveByUserIdWithInstitution(any()))
                .thenReturn(List.of(pendingMembership));

        assertEquals(0, institutionService.listMyInstitutions("test_admin").size());
    }

    @Test
    void listMyInstitutionsIncludesOnlyInstitutionsWithActiveMemberships() {
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));

        Institution activeInstitution = new Institution("Active Lab", "active-lab", "UTC");
        ReflectionTestUtils.setField(activeInstitution, "id", UUID.randomUUID());
        Institution inactiveInstitution = new Institution("Pending Lab", "pending-lab", "UTC");
        ReflectionTestUtils.setField(inactiveInstitution, "id", UUID.randomUUID());

        Membership activeMembership = new Membership(
                adminUser, activeInstitution, "MEMBER", "ACTIVE", null);
        Membership pendingMembership = new Membership(
                adminUser, inactiveInstitution, "MEMBER", "PENDING", null);

        when(membershipRepository.findActiveByUserIdWithInstitution(any()))
                .thenReturn(List.of(activeMembership, pendingMembership));

        List<InstitutionSummaryResponse> result = institutionService.listMyInstitutions("test_admin");

        assertEquals(1, result.size());
        assertEquals(activeInstitution.getId(), result.get(0).id());
        assertEquals("ACTIVE", result.get(0).membershipStatus());
    }

    @Test
    void listMyInstitutionsDeduplicatesDuplicateInstitutionIds() {
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));

        UUID institutionId = UUID.randomUUID();
        Institution inst = new Institution("Apex Lab", "apex-lab", "UTC");
        ReflectionTestUtils.setField(inst, "id", institutionId);

        Membership primaryMembership = new Membership(adminUser, inst, "ADMIN", "ACTIVE", null);
        Membership duplicateMembership = new Membership(adminUser, inst, "MEMBER", "ACTIVE", null);

        when(membershipRepository.findActiveByUserIdWithInstitution(any())).thenReturn(List.of(primaryMembership, duplicateMembership));

        List<InstitutionSummaryResponse> result = institutionService.listMyInstitutions("test_admin");

        assertEquals(1, result.size());
        assertEquals(institutionId, result.get(0).id());
        assertEquals("Apex Lab", result.get(0).name());
        assertEquals("ADMIN", result.get(0).role());
        assertEquals("ACTIVE", result.get(0).membershipStatus());
    }

    @Test
    void getInstitutionDetailsDeniesUnauthorizedUser() {
        UUID instId = UUID.randomUUID();
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(InstitutionService.InstitutionAccessDeniedException.class, () ->
                institutionService.getInstitutionDetails(instId, "test_admin"));
    }

    @Test
    void getInstitutionMembersDeniesUnauthorizedUser() {
        UUID instId = UUID.randomUUID();
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(InstitutionService.InstitutionAccessDeniedException.class, () ->
                institutionService.getInstitutionMembers(instId, "test_admin"));
    }

    @Test
    void directoryOnlyQueriesActiveInstitutions() {
        when(institutionRepository.findByStatusOrderByNameAsc("ACTIVE")).thenReturn(List.of());

        assertEquals(0, institutionService.listDirectory().size());
        verify(institutionRepository).findByStatusOrderByNameAsc("ACTIVE");
    }

    @Test
    void membershipRequestCreatesPendingStudentMembership() {
        UUID institutionId = UUID.randomUUID();
        Institution institution = new Institution("Open Lab", "open-lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        AppUser student = new AppUser("student", "student@example.com", "hash", "Student User");
        ReflectionTestUtils.setField(student, "id", UUID.randomUUID());
        when(appUserRepository.findByUsername("student")).thenReturn(Optional.of(student));
        when(institutionRepository.findById(institutionId)).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(student.getId(), institutionId))
                .thenReturn(Optional.empty());
        when(membershipRepository.saveAndFlush(any(Membership.class))).thenAnswer(invocation -> {
            Membership saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        MemberResponse response = institutionService.requestMembership(institutionId, "student");

        assertEquals("MEMBER", response.role());
        assertEquals("PENDING", response.status());
        ArgumentCaptor<Membership> membershipCaptor = ArgumentCaptor.forClass(Membership.class);
        verify(membershipRepository).saveAndFlush(membershipCaptor.capture());
        assertNull(membershipCaptor.getValue().getVerifiedByMembershipId());
        assertNull(membershipCaptor.getValue().getVerifiedAt());
    }

    @Test
    void membershipRequestRejectsDuplicatePendingMembership() {
        UUID institutionId = UUID.randomUUID();
        Institution institution = new Institution("Open Lab", "open-lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        Membership pending = new Membership(adminUser, institution, "MEMBER", "PENDING", null);
        ReflectionTestUtils.setField(pending, "id", UUID.randomUUID());
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(institutionRepository.findById(institutionId)).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institutionId))
                .thenReturn(Optional.of(pending));

        assertThrows(InstitutionService.MembershipRequestConflictException.class,
                () -> institutionService.requestMembership(institutionId, "test_admin"));
    }

    @Test
    void activeAdminApprovesPendingMembershipAndIsRecordedAsVerifier() {
        UUID institutionId = UUID.randomUUID();
        UUID requestedId = UUID.randomUUID();
        Institution institution = new Institution("Open Lab", "open-lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        AppUser student = new AppUser("student", "student@example.com", "hash", "Student User");
        Membership admin = new Membership(adminUser, institution, "ADMIN", "ACTIVE", null);
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        Membership requested = new Membership(student, institution, "MEMBER", "PENDING", null);
        ReflectionTestUtils.setField(requested, "id", requestedId);
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institutionId))
                .thenReturn(Optional.of(admin));
        when(membershipRepository.findById(requestedId)).thenReturn(Optional.of(requested));
        when(membershipRepository.saveAndFlush(requested)).thenReturn(requested);

        MemberResponse response = institutionService.approveMembership(institutionId, requestedId, "test_admin");

        assertEquals("ACTIVE", response.status());
        assertEquals(admin.getId(), requested.getVerifiedByMembershipId());
        assertNotNull(requested.getVerifiedAt());
    }

    @Test
    void memberCannotApproveMembershipRequest() {
        UUID institutionId = UUID.randomUUID();
        Institution institution = new Institution("Open Lab", "open-lab", "UTC");
        Membership member = new Membership(adminUser, institution, "MEMBER", "ACTIVE", null);
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institutionId))
                .thenReturn(Optional.of(member));

        assertThrows(InstitutionService.InstitutionAccessDeniedException.class,
                () -> institutionService.approveMembership(institutionId, UUID.randomUUID(), "test_admin"));
    }

    @Test
    void adminCannotManageMembershipFromAnotherInstitution() {
        UUID institutionId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        Institution institution = new Institution("Other Lab", "other-lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", UUID.randomUUID());
        Membership admin = new Membership(adminUser, new Institution("Own Lab", "own-lab", "UTC"),
                "ADMIN", "ACTIVE", null);
        Membership foreignMembership = new Membership(adminUser, institution, "MEMBER", "PENDING", null);
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institutionId))
                .thenReturn(Optional.of(admin));
        when(membershipRepository.findById(membershipId)).thenReturn(Optional.of(foreignMembership));

        assertThrows(InstitutionService.InstitutionNotFoundException.class,
                () -> institutionService.approveMembership(institutionId, membershipId, "test_admin"));
    }

    @Test
    void adminCanDeactivateActiveStudentMembership() {
        UUID institutionId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        Institution institution = new Institution("Open Lab", "open-lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        Membership admin = new Membership(adminUser, institution, "ADMIN", "ACTIVE", null);
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        Membership student = new Membership(
                new AppUser("student", "student@example.com", "hash", "Student User"),
                institution, "MEMBER", "ACTIVE", null);
        ReflectionTestUtils.setField(student, "id", membershipId);
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institutionId))
                .thenReturn(Optional.of(admin));
        when(membershipRepository.findById(membershipId)).thenReturn(Optional.of(student));
        when(membershipRepository.saveAndFlush(student)).thenReturn(student);

        MemberResponse response = institutionService.deactivateMembership(institutionId, membershipId, "test_admin");

        assertEquals("SUSPENDED", response.status());
    }
}
