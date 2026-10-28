package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private ResourceCategoryRepository resourceCategoryRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private AppUserRepository appUserRepository;

    private ResourceService resourceService;
    private ResourceCategoryService resourceCategoryService;

    private AppUser scholarJane;
    private AppUser colleagueBob;
    private Institution apexLab;
    private Institution otherLab;
    private Membership janeMembership;
    private Membership bobMembership;
    private ResourceCategory microscopeCategory;

    @BeforeEach
    void setUp() {
        resourceService = new ResourceService(
                resourceRepository,
                resourceCategoryRepository,
                membershipRepository,
                appUserRepository
        );

        resourceCategoryService = new ResourceCategoryService(
                resourceCategoryRepository,
                membershipRepository,
                appUserRepository
        );

        scholarJane = new AppUser("scholar_jane", "jane@example.com", "hash", "Jane Doe");
        ReflectionTestUtils.setField(scholarJane, "id", UUID.randomUUID());

        colleagueBob = new AppUser("colleague_bob", "bob@example.com", "hash", "Bob Smith");
        ReflectionTestUtils.setField(colleagueBob, "id", UUID.randomUUID());

        apexLab = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(apexLab, "id", UUID.randomUUID());

        otherLab = new Institution("Bioengineering Core", "bio-core", "UTC");
        ReflectionTestUtils.setField(otherLab, "id", UUID.randomUUID());

        janeMembership = new Membership(scholarJane, apexLab, "RESOURCE_OWNER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(janeMembership, "id", UUID.randomUUID());

        bobMembership = new Membership(colleagueBob, apexLab, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(bobMembership, "id", UUID.randomUUID());

        microscopeCategory = new ResourceCategory(apexLab, "Electron Microscopy", "High-resolution EM devices");
        ReflectionTestUtils.setField(microscopeCategory, "id", UUID.randomUUID());
    }

    @Test
    void validResourceCreationSucceedsWithServerVerifiedOwnershipAndInstitution() {
        UUID institutionId = apexLab.getId();
        UUID categoryId = microscopeCategory.getId();

        ResourceService.CreateResourceCommand command = new ResourceService.CreateResourceCommand(
                institutionId,
                categoryId,
                "Titan Krios Cryo-EM",
                "Advanced 300kV cryo-transmission microscope",
                ResourceType.EQUIPMENT,
                "Room B12, Basement",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240
        );

        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(membershipRepository.findByUser_IdAndInstitution_Id(scholarJane.getId(), institutionId))
                .thenReturn(Optional.of(janeMembership));
        when(resourceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(microscopeCategory));

        Resource savedResource = new Resource(
                apexLab,
                janeMembership,
                microscopeCategory,
                "Titan Krios Cryo-EM",
                "Advanced 300kV cryo-transmission microscope",
                ResourceType.EQUIPMENT,
                "Room B12, Basement",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240
        );
        when(resourceRepository.saveAndFlush(any(Resource.class))).thenReturn(savedResource);

        Resource result = resourceService.createResource(command, "scholar_jane");

        assertNotNull(result);
        assertEquals("Titan Krios Cryo-EM", result.getName());
        assertEquals(ResourceType.EQUIPMENT, result.getResourceType());
        assertEquals(ConditionRating.NEW, result.getConditionRating());
        assertEquals(ResourceStatus.AVAILABLE, result.getStatus());
        assertTrue(result.isRequiresApproval());
        assertEquals(240, result.getMaxBookingMinutes());

        ArgumentCaptor<Resource> resourceCaptor = ArgumentCaptor.forClass(Resource.class);
        verify(resourceRepository).saveAndFlush(resourceCaptor.capture());
        Resource captured = resourceCaptor.getValue();
        assertEquals(apexLab, captured.getInstitution());
        assertEquals(janeMembership, captured.getOwnerMembership());
        assertEquals(microscopeCategory, captured.getCategory());
    }

    @Test
    void userWithoutActiveMembershipCannotAccessInstitutionScopedOperations() {
        UUID institutionId = apexLab.getId();
        ResourceService.CreateResourceCommand command = new ResourceService.CreateResourceCommand(
                institutionId,
                microscopeCategory.getId(),
                "Spectrometer",
                "",
                ResourceType.EQUIPMENT,
                null,
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                true,
                null
        );

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        Membership pendingMembership = new Membership(colleagueBob, apexLab, "MEMBER", "PENDING", null);
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), institutionId))
                .thenReturn(Optional.of(pendingMembership));

        ResourceService.ResourceAccessDeniedException ex = assertThrows(
                ResourceService.ResourceAccessDeniedException.class,
                () -> resourceService.createResource(command, "colleague_bob")
        );
        assertTrue(ex.getMessage().contains("not active"));
    }

    @Test
    void borrowerCannotRegisterResources() {
        UUID institutionId = apexLab.getId();
        ResourceService.CreateResourceCommand command = new ResourceService.CreateResourceCommand(
                institutionId,
                microscopeCategory.getId(),
                "Spectrometer",
                "",
                ResourceType.EQUIPMENT,
                null,
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                true,
                null
        );

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        Membership borrowerMembership = new Membership(colleagueBob, apexLab, "BORROWER", "ACTIVE", Instant.now());
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), institutionId))
                .thenReturn(Optional.of(borrowerMembership));

        ResourceService.ResourceAccessDeniedException ex = assertThrows(
                ResourceService.ResourceAccessDeniedException.class,
                () -> resourceService.createResource(command, "colleague_bob")
        );
        assertTrue(ex.getMessage().contains("Borrowers cannot register resources"));
    }

    @Test
    void resourceCannotBeCreatedWithCategoryFromAnotherInstitution() {
        UUID institutionId = apexLab.getId();
        ResourceCategory foreignCategory = new ResourceCategory(otherLab, "Bio Sensors", "Foreign category");
        ReflectionTestUtils.setField(foreignCategory, "id", UUID.randomUUID());

        ResourceService.CreateResourceCommand command = new ResourceService.CreateResourceCommand(
                institutionId,
                foreignCategory.getId(),
                "Centrifuge",
                "",
                ResourceType.EQUIPMENT,
                null,
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                true,
                null
        );

        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(membershipRepository.findByUser_IdAndInstitution_Id(scholarJane.getId(), institutionId))
                .thenReturn(Optional.of(janeMembership));
        when(resourceCategoryRepository.findById(foreignCategory.getId())).thenReturn(Optional.of(foreignCategory));

        ResourceService.ResourceValidationException ex = assertThrows(
                ResourceService.ResourceValidationException.class,
                () -> resourceService.createResource(command, "scholar_jane")
        );
        assertTrue(ex.getMessage().contains("does not belong to the selected institution"));
    }

    @Test
    void userCannotUpdateAnotherUsersResourceWithoutAdminPermission() {
        UUID resourceId = UUID.randomUUID();
        Resource existingResource = new Resource(
                apexLab,
                janeMembership, // Owned by Jane
                microscopeCategory,
                "Jane's Laser Cutter",
                ResourceType.EQUIPMENT
        );

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(existingResource));
        // Bob is a normal MEMBER, not an admin
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), apexLab.getId()))
                .thenReturn(Optional.of(bobMembership));

        ResourceService.UpdateResourceCommand updateCommand = new ResourceService.UpdateResourceCommand(
                "Tampered Title",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        ResourceService.ResourceAccessDeniedException ex = assertThrows(
                ResourceService.ResourceAccessDeniedException.class,
                () -> resourceService.updateResource(resourceId, updateCommand, "colleague_bob")
        );
        assertTrue(ex.getMessage().contains("do not have permission"));
    }

    @Test
    void institutionAdminCanUpdateAnotherUsersResource() {
        UUID resourceId = UUID.randomUUID();
        Resource existingResource = new Resource(
                apexLab,
                janeMembership, // Owned by Jane
                microscopeCategory,
                "Confocal Microscope",
                ResourceType.EQUIPMENT
        );

        Membership bobAdminMembership = new Membership(colleagueBob, apexLab, "INSTITUTION_ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(bobAdminMembership, "id", UUID.randomUUID());

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(existingResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), apexLab.getId()))
                .thenReturn(Optional.of(bobAdminMembership));
        when(resourceRepository.saveAndFlush(any(Resource.class))).thenReturn(existingResource);

        ResourceService.UpdateResourceCommand updateCommand = new ResourceService.UpdateResourceCommand(
                "Confocal Microscope (Serviced)",
                "Recently calibrated laser heads",
                null,
                null,
                "Room 401",
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                false,
                180
        );

        Resource updated = resourceService.updateResource(resourceId, updateCommand, "colleague_bob");

        assertNotNull(updated);
        assertEquals("Confocal Microscope (Serviced)", updated.getName());
        assertEquals("Recently calibrated laser heads", updated.getDescription());
        assertEquals("Room 401", updated.getLocation());
        assertFalse(updated.isRequiresApproval());
        assertEquals(180, updated.getMaxBookingMinutes());
    }

    @Test
    void resourceOwnerCanUpdateOwnResource() {
        UUID resourceId = UUID.randomUUID();
        Resource existingResource = new Resource(
                apexLab,
                janeMembership, // Owned by Jane
                microscopeCategory,
                "Autoclave",
                ResourceType.EQUIPMENT
        );

        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(existingResource));
        when(resourceRepository.saveAndFlush(any(Resource.class))).thenReturn(existingResource);

        ResourceService.UpdateResourceCommand updateCommand = new ResourceService.UpdateResourceCommand(
                "Autoclave Model X",
                "Updated description",
                null,
                null,
                null,
                ConditionRating.FAIR,
                ResourceStatus.MAINTENANCE,
                null,
                null
        );

        Resource updated = resourceService.updateResource(resourceId, updateCommand, "scholar_jane");

        assertNotNull(updated);
        assertEquals("Autoclave Model X", updated.getName());
        assertEquals(ResourceStatus.MAINTENANCE, updated.getStatus());
        assertEquals(ConditionRating.FAIR, updated.getConditionRating());
    }

    @Test
    void userCannotDeleteAnotherUsersResourceWithoutAdminPermission() {
        UUID resourceId = UUID.randomUUID();
        Resource existingResource = new Resource(
                apexLab,
                janeMembership, // Owned by Jane
                microscopeCategory,
                "Oscilloscope",
                ResourceType.EQUIPMENT
        );

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(existingResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), apexLab.getId()))
                .thenReturn(Optional.of(bobMembership));

        assertThrows(
                ResourceService.ResourceAccessDeniedException.class,
                () -> resourceService.deleteResource(resourceId, "colleague_bob")
        );
    }

    @Test
    void missingResourceThrowsResourceNotFoundException() {
        UUID nonExistentId = UUID.randomUUID();
        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(resourceRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThrows(
                ResourceService.ResourceNotFoundException.class,
                () -> resourceService.deleteResource(nonExistentId, "scholar_jane")
        );
    }

    @Test
    void cannotViewResourceDetailsWithoutActiveMembershipInInstitution() {
        UUID resourceId = UUID.randomUUID();
        Resource existingResource = new Resource(
                apexLab,
                janeMembership,
                microscopeCategory,
                "NMR Spectrometer",
                ResourceType.EQUIPMENT
        );

        when(appUserRepository.findByUsername("colleague_bob")).thenReturn(Optional.of(colleagueBob));
        when(resourceRepository.findByIdWithDetails(resourceId)).thenReturn(Optional.of(existingResource));
        // Bob has no membership in apexLab
        when(membershipRepository.findByUser_IdAndInstitution_Id(colleagueBob.getId(), apexLab.getId()))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceService.ResourceAccessDeniedException.class,
                () -> resourceService.getResourceDetails(resourceId, "colleague_bob")
        );
    }

    @Test
    void duplicateCategoryNameIsRejectedCaseInsensitive() {
        UUID institutionId = apexLab.getId();
        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(membershipRepository.findByUser_IdAndInstitution_Id(scholarJane.getId(), institutionId))
                .thenReturn(Optional.of(janeMembership));
        when(resourceCategoryRepository.existsByInstitution_IdAndNameIgnoreCase(institutionId, "ELECTRON MICROSCOPY"))
                .thenReturn(true);

        ResourceCategoryService.DuplicateCategoryException ex = assertThrows(
                ResourceCategoryService.DuplicateCategoryException.class,
                () -> resourceCategoryService.createCategory(institutionId, "ELECTRON MICROSCOPY", "desc", "scholar_jane")
        );
        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    void categoryCreationSucceedsForActiveMember() {
        UUID institutionId = apexLab.getId();
        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        when(membershipRepository.findByUser_IdAndInstitution_Id(scholarJane.getId(), institutionId))
                .thenReturn(Optional.of(janeMembership));
        when(resourceCategoryRepository.existsByInstitution_IdAndNameIgnoreCase(institutionId, "Cleanroom Spaces"))
                .thenReturn(false);

        ResourceCategory savedCategory = new ResourceCategory(apexLab, "Cleanroom Spaces", "ISO 5 cleanroom areas");
        ReflectionTestUtils.setField(savedCategory, "id", UUID.randomUUID());
        when(resourceCategoryRepository.saveAndFlush(any(ResourceCategory.class))).thenReturn(savedCategory);

        ResourceCategory created = resourceCategoryService.createCategory(
                institutionId, "Cleanroom Spaces", "ISO 5 cleanroom areas", "scholar_jane");

        assertNotNull(created);
        assertEquals("Cleanroom Spaces", created.getName());
        assertEquals("ISO 5 cleanroom areas", created.getDescription());
    }

    @Test
    void getMyResourcesReturnsResourcesOwnedByUser() {
        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(scholarJane));
        Resource res1 = new Resource(apexLab, janeMembership, microscopeCategory, "Device 1", ResourceType.EQUIPMENT);
        Resource res2 = new Resource(apexLab, janeMembership, microscopeCategory, "Device 2", ResourceType.EQUIPMENT);

        when(resourceRepository.findByOwnerUserIdWithDetails(scholarJane.getId())).thenReturn(List.of(res1, res2));

        List<Resource> myResources = resourceService.getMyResources("scholar_jane");

        assertEquals(2, myResources.size());
        assertEquals("Device 1", myResources.get(0).getName());
        assertEquals("Device 2", myResources.get(1).getName());
    }
}
