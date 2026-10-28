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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
        assertEquals("INSTITUTION_ADMIN", response.role());
        assertEquals("ACTIVE", response.membershipStatus());

        ArgumentCaptor<Membership> membershipCaptor = ArgumentCaptor.forClass(Membership.class);
        verify(membershipRepository).saveAndFlush(membershipCaptor.capture());
        Membership createdMembership = membershipCaptor.getValue();
        assertEquals("INSTITUTION_ADMIN", createdMembership.getRole());
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
    void listMyInstitutionsReturnsOnlyUserMemberships() {
        when(appUserRepository.findByUsername("test_admin")).thenReturn(Optional.of(adminUser));

        Institution inst = new Institution("Apex Lab", "apex-lab", "UTC");
        Membership membership = new Membership(adminUser, inst, "INSTITUTION_ADMIN", "ACTIVE", null);

        when(membershipRepository.findByUserIdWithInstitution(any())).thenReturn(List.of(membership));

        List<InstitutionSummaryResponse> result = institutionService.listMyInstitutions("test_admin");

        assertEquals(1, result.size());
        assertEquals("Apex Lab", result.get(0).name());
        assertEquals("INSTITUTION_ADMIN", result.get(0).role());
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
}
