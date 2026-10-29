package com.resourcebridge.backend.image;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.InstitutionRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceCategory;
import com.resourcebridge.backend.resource.ResourceRepository;
import com.resourcebridge.backend.resource.ResourceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageAssetServiceTest {

    @Mock private ImageAssetRepository imageAssetRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private InstitutionRepository institutionRepository;
    @Mock private MembershipRepository membershipRepository;
    @Mock private AppUserRepository appUserRepository;

    @TempDir
    Path storageDirectory;

    private ImageAssetService service;
    private AppUser user;
    private Institution institution;
    private Membership member;
    private Resource resource;

    @BeforeEach
    void setUp() {
        service = new ImageAssetService(imageAssetRepository, resourceRepository, institutionRepository,
                membershipRepository, appUserRepository, new LocalImageStorage(storageDirectory.toString()),
                new ImageContentValidator());

        user = new AppUser("owner", "owner@example.com", "hash", "Owner");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        institution = new Institution("Lab", "lab", "UTC");
        ReflectionTestUtils.setField(institution, "id", UUID.randomUUID());
        member = new Membership(user, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(member, "id", UUID.randomUUID());
        ResourceCategory category = new ResourceCategory(institution, "General", null);
        resource = new Resource(institution, member, category, "Microscope", ResourceType.EQUIPMENT);
        ReflectionTestUtils.setField(resource, "id", UUID.randomUUID());
        when(appUserRepository.findByUsername("owner")).thenReturn(Optional.of(user));
    }

    @Test
    void uploadsDecodedImageAndPersistsOpaqueMetadataReference() throws Exception {
        byte[] imageBytes = pngImage();
        when(resourceRepository.findByIdWithDetails(resource.getId())).thenReturn(Optional.of(resource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));
        when(imageAssetRepository.findByResource_Id(resource.getId())).thenReturn(Optional.empty());
        when(imageAssetRepository.saveAndFlush(any(ImageAsset.class))).thenAnswer(invocation -> {
            ImageAsset saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        ImageAssetService.ImageResponse response = service.uploadResourceImage(
                resource.getId(), new MockMultipartFile("file", "../../client-name.png",
                        "text/plain", imageBytes), "owner");

        assertEquals("image/png", response.contentType());
        assertTrue(response.url().startsWith("/api/images/"));
        org.mockito.ArgumentCaptor<ImageAsset> assetCaptor =
                org.mockito.ArgumentCaptor.forClass(ImageAsset.class);
        verify(imageAssetRepository).saveAndFlush(assetCaptor.capture());
        ImageAsset stored = assetCaptor.getValue();
        assertTrue(stored.getStorageKey().matches("[a-f0-9]{64}\\.png"));
        assertEquals(imageBytes.length, stored.getSizeBytes());
        assertArrayEquals(imageBytes, new LocalImageStorage(storageDirectory.toString())
                .open(stored.getStorageKey()).readAllBytes());
    }

    @Test
    void replacingPhotoUpdatesMetadataAndRemovesOldStorageObject() throws Exception {
        String oldStorageKey = "d".repeat(64) + ".png";
        ImageAsset existing = new ImageAsset(oldStorageKey, "image/png", 1,
                1, 1, resource, null, user.getId());
        ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
        LocalImageStorage storage = new LocalImageStorage(storageDirectory.toString());
        storage.store(oldStorageKey, new byte[]{1});
        when(resourceRepository.findByIdWithDetails(resource.getId())).thenReturn(Optional.of(resource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));
        when(imageAssetRepository.findByResource_Id(resource.getId())).thenReturn(Optional.of(existing));
        when(imageAssetRepository.saveAndFlush(existing)).thenReturn(existing);

        service.uploadResourceImage(resource.getId(),
                new MockMultipartFile("file", "replacement.png", "image/png", pngImage()), "owner");

        assertTrue(existing.getStorageKey().matches("[a-f0-9]{64}\\.png"));
        org.junit.jupiter.api.Assertions.assertNotEquals(oldStorageKey, existing.getStorageKey());
        assertFalse(Files.exists(storageDirectory.resolve(oldStorageKey)));
        assertTrue(Files.exists(storageDirectory.resolve(existing.getStorageKey())));
    }

    @Test
    void deniesUploadFromOtherActiveMemberAndDoesNotPersist() {
        Membership otherMember = new Membership(user, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(otherMember, "id", UUID.randomUUID());
        Resource otherOwnersResource = new Resource(institution, member,
                new ResourceCategory(institution, "General", null), "Microscope", ResourceType.EQUIPMENT);
        ReflectionTestUtils.setField(otherOwnersResource, "id", UUID.randomUUID());
        when(resourceRepository.findByIdWithDetails(otherOwnersResource.getId()))
                .thenReturn(Optional.of(otherOwnersResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(otherMember));

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.uploadResourceImage(otherOwnersResource.getId(),
                        new MockMultipartFile("file", "x.png", "image/png", new byte[]{1}), "owner"));
        verify(imageAssetRepository, never()).saveAndFlush(any());
    }

    @Test
    void institutionLogoRequiresActiveAdministratorMembership() {
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.uploadInstitutionLogo(institution.getId(),
                        new MockMultipartFile("file", "logo.png", "image/png", pngImage()), "owner"));
        verify(imageAssetRepository, never()).saveAndFlush(any());
    }

    @Test
    void activeAdministratorCanUploadInstitutionLogo() throws Exception {
        Membership admin = new Membership(user, institution, "ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(admin));
        when(imageAssetRepository.findByInstitution_Id(institution.getId())).thenReturn(Optional.empty());
        when(imageAssetRepository.saveAndFlush(any(ImageAsset.class))).thenAnswer(invocation -> {
            ImageAsset saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        ImageAssetService.ImageResponse response = service.uploadInstitutionLogo(institution.getId(),
                new MockMultipartFile("file", "logo.jpg", "application/octet-stream", jpegImage()), "owner");

        assertEquals("image/jpeg", response.contentType());
        verify(imageAssetRepository).saveAndFlush(any(ImageAsset.class));
    }

    @Test
    void institutionCreatorWithActiveAdminMembershipCanUploadLogo() throws Exception {
        Membership creatorAdmin = new Membership(user, institution, "ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(creatorAdmin, "id", UUID.randomUUID());
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(creatorAdmin));
        when(imageAssetRepository.findByInstitution_Id(institution.getId())).thenReturn(Optional.empty());
        when(imageAssetRepository.saveAndFlush(any(ImageAsset.class))).thenAnswer(invocation -> {
            ImageAsset saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        service.uploadInstitutionLogo(institution.getId(),
                new MockMultipartFile("file", "institution.webp", "image/webp", webpImage()), "owner");

        verify(imageAssetRepository).saveAndFlush(any(ImageAsset.class));
    }

    @Test
    void activeAdministratorCanReplaceInstitutionLogo() throws Exception {
        Membership admin = new Membership(user, institution, "ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        String oldStorageKey = "f".repeat(64) + ".png";
        ImageAsset existing = new ImageAsset(oldStorageKey, "image/png", 1,
                1, 1, null, institution, user.getId());
        ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
        LocalImageStorage storage = new LocalImageStorage(storageDirectory.toString());
        storage.store(oldStorageKey, new byte[]{1});
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(admin));
        when(imageAssetRepository.findByInstitution_Id(institution.getId())).thenReturn(Optional.of(existing));
        when(imageAssetRepository.saveAndFlush(existing)).thenReturn(existing);

        service.uploadInstitutionLogo(institution.getId(),
                new MockMultipartFile("file", "new-logo.png", "image/png", pngImage()), "owner");

        org.junit.jupiter.api.Assertions.assertNotEquals(oldStorageKey, existing.getStorageKey());
        assertFalse(Files.exists(storageDirectory.resolve(oldStorageKey)));
        assertTrue(Files.exists(storageDirectory.resolve(existing.getStorageKey())));
    }

    @Test
    void institutionLogoCannotBeChangedAcrossInstitutionBoundary() {
        Institution foreignInstitution = new Institution("Foreign lab", "foreign", "UTC");
        ReflectionTestUtils.setField(foreignInstitution, "id", UUID.randomUUID());
        when(institutionRepository.findById(foreignInstitution.getId())).thenReturn(Optional.of(foreignInstitution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), foreignInstitution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.uploadInstitutionLogo(foreignInstitution.getId(),
                        new MockMultipartFile("file", "logo.png", "image/png", pngImage()), "owner"));
        verify(imageAssetRepository, never()).saveAndFlush(any(ImageAsset.class));
    }

    @Test
    void administratorCanRemoveInstitutionLogo() throws Exception {
        Membership admin = new Membership(user, institution, "ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        String storageKey = "e".repeat(64) + ".webp";
        ImageAsset existing = new ImageAsset(storageKey, "image/webp", 1,
                1, 1, null, institution, user.getId());
        ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
        LocalImageStorage storage = new LocalImageStorage(storageDirectory.toString());
        storage.store(storageKey, new byte[]{1});
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(admin));
        when(imageAssetRepository.findByInstitution_Id(institution.getId())).thenReturn(Optional.of(existing));

        service.removeInstitutionLogo(institution.getId(), "owner");

        verify(imageAssetRepository).delete(existing);
        assertFalse(Files.exists(storageDirectory.resolve(storageKey)));
    }

    @Test
    void regularMemberCannotRemoveInstitutionLogo() {
        when(institutionRepository.findById(institution.getId())).thenReturn(Optional.of(institution));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.removeInstitutionLogo(institution.getId(), "owner"));
        verify(imageAssetRepository, never()).delete(any(ImageAsset.class));
    }

    @Test
    void imageReadsRequireActiveMembershipInTargetInstitution() {
        ImageAsset asset = new ImageAsset("a".repeat(64) + ".png", "image/png", 1,
                1, 1, resource, null, user.getId());
        ReflectionTestUtils.setField(asset, "id", UUID.randomUUID());
        when(imageAssetRepository.findByIdWithTarget(asset.getId())).thenReturn(Optional.of(asset));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.getImage(asset.getId(), "owner"));
    }

    @Test
    void activeOwnerCanRemovePhotoAndStoredFile() throws Exception {
        String storageKey = "c".repeat(64) + ".png";
        ImageAsset asset = new ImageAsset(storageKey, "image/png", 1,
                1, 1, resource, null, user.getId());
        ReflectionTestUtils.setField(asset, "id", UUID.randomUUID());
        LocalImageStorage storage = new LocalImageStorage(storageDirectory.toString());
        storage.store(storageKey, new byte[]{1});
        when(resourceRepository.findByIdWithDetails(resource.getId())).thenReturn(Optional.of(resource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));
        when(imageAssetRepository.findByResource_Id(resource.getId())).thenReturn(Optional.of(asset));

        service.removeResourceImage(resource.getId(), "owner");

        verify(imageAssetRepository).delete(asset);
        assertFalse(Files.exists(storageDirectory.resolve(storageKey)));
    }

    @Test
    void inactiveOwnerCannotRemovePhoto() {
        Membership inactive = new Membership(user, institution, "MEMBER", "SUSPENDED", Instant.now());
        ReflectionTestUtils.setField(inactive, "id", member.getId());
        when(resourceRepository.findByIdWithDetails(resource.getId())).thenReturn(Optional.of(resource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(inactive));

        assertThrows(ImageAssetService.ImageAccessDeniedException.class,
                () -> service.removeResourceImage(resource.getId(), "owner"));
        verify(imageAssetRepository, never()).delete(any(ImageAsset.class));
    }

    @Test
    void removingPhotoFromResourceWithoutPhotoIsSafe() {
        when(resourceRepository.findByIdWithDetails(resource.getId())).thenReturn(Optional.of(resource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId()))
                .thenReturn(Optional.of(member));
        when(imageAssetRepository.findByResource_Id(resource.getId())).thenReturn(Optional.empty());

        service.removeResourceImage(resource.getId(), "owner");

        verify(imageAssetRepository, never()).delete(any(ImageAsset.class));
    }

    private static byte[] pngImage() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }

    private static byte[] jpegImage() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "jpeg", output);
        return output.toByteArray();
    }

    private static byte[] webpImage() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "webp", output);
        return output.toByteArray();
    }
}
