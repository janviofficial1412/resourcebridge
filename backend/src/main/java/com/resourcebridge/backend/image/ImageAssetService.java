package com.resourcebridge.backend.image;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.InstitutionRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ImageAssetService {

    private static final Logger logger = LoggerFactory.getLogger(ImageAssetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    public record ImageResponse(UUID id, String url, String contentType, long sizeBytes, int width, int height) {
    }

    public record ImageContent(InputStream inputStream, String contentType, long sizeBytes) {
    }

    private final ImageAssetRepository imageAssetRepository;
    private final ResourceRepository resourceRepository;
    private final InstitutionRepository institutionRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;
    private final ImageStorage imageStorage;
    private final ImageContentValidator imageContentValidator;

    public ImageAssetService(ImageAssetRepository imageAssetRepository,
                             ResourceRepository resourceRepository,
                             InstitutionRepository institutionRepository,
                             MembershipRepository membershipRepository,
                             AppUserRepository appUserRepository,
                             ImageStorage imageStorage,
                             ImageContentValidator imageContentValidator) {
        this.imageAssetRepository = imageAssetRepository;
        this.resourceRepository = resourceRepository;
        this.institutionRepository = institutionRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
        this.imageStorage = imageStorage;
        this.imageContentValidator = imageContentValidator;
    }

    @Transactional
    public ImageResponse uploadResourceImage(UUID resourceId, MultipartFile file, String username) {
        AppUser user = getUser(username);
        Resource resource = resourceRepository.findByIdWithDetails(resourceId)
                .orElseThrow(() -> new ImageNotFoundException("Resource not found"));
        authorizeResourceImageManagement(user, resource);

        return save(file, resource, null, user.getId(),
                imageAssetRepository.findByResource_Id(resourceId).orElse(null));
    }

    @Transactional
    public void removeResourceImage(UUID resourceId, String username) {
        AppUser user = getUser(username);
        Resource resource = resourceRepository.findByIdWithDetails(resourceId)
                .orElseThrow(() -> new ImageNotFoundException("Resource not found"));
        authorizeResourceImageManagement(user, resource);
        imageAssetRepository.findByResource_Id(resourceId).ifPresent(image -> {
            imageAssetRepository.delete(image);
            scheduleDeletionAfterCommit(image.getStorageKey());
        });
    }

    @Transactional(readOnly = true)
    public Map<UUID, UUID> getResourceImageIds(Set<UUID> resourceIds) {
        if (resourceIds.isEmpty()) {
            return Map.of();
        }
        return imageAssetRepository.findByResourceIdsWithResource(resourceIds).stream()
                .collect(Collectors.toMap(image -> image.getResource().getId(), ImageAsset::getId));
    }

    @Transactional
    public ImageResponse uploadInstitutionLogo(UUID institutionId, MultipartFile file, String username) {
        AppUser user = getUser(username);
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ImageNotFoundException("Institution not found"));
        Membership membership = getActiveMembership(user, institution);
        if (!"ADMIN".equalsIgnoreCase(membership.getRole())) {
            throw new ImageAccessDeniedException("Only an active institution administrator can upload its logo");
        }

        return save(file, null, institution, user.getId(),
                imageAssetRepository.findByInstitution_Id(institutionId).orElse(null));
    }

    @Transactional
    public void removeInstitutionLogo(UUID institutionId, String username) {
        AppUser user = getUser(username);
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ImageNotFoundException("Institution not found"));
        Membership membership = getActiveMembership(user, institution);
        if (!"ADMIN".equalsIgnoreCase(membership.getRole())) {
            throw new ImageAccessDeniedException("Only an active institution administrator can manage its logo");
        }
        imageAssetRepository.findByInstitution_Id(institutionId).ifPresent(image -> {
            imageAssetRepository.delete(image);
            scheduleDeletionAfterCommit(image.getStorageKey());
        });
    }

    @Transactional(readOnly = true)
    public Map<UUID, UUID> getInstitutionLogoIds(Set<UUID> institutionIds) {
        if (institutionIds.isEmpty()) {
            return Map.of();
        }
        return imageAssetRepository.findByInstitutionIdsWithInstitution(institutionIds).stream()
                .collect(Collectors.toMap(image -> image.getInstitution().getId(), ImageAsset::getId));
    }

    @Transactional(readOnly = true)
    public ImageContent getImage(UUID imageId, String username) {
        AppUser user = getUser(username);
        ImageAsset image = imageAssetRepository.findByIdWithTarget(imageId)
                .orElseThrow(() -> new ImageNotFoundException("Image not found"));
        Institution institution = image.getResource() != null
                ? image.getResource().getInstitution()
                : image.getInstitution();
        getActiveMembership(user, institution);
        try {
            return new ImageContent(imageStorage.open(image.getStorageKey()),
                    image.getContentType(), image.getSizeBytes());
        } catch (IOException exception) {
            throw new ImageStorageException("Unable to read stored image", exception);
        }
    }

    private ImageResponse save(MultipartFile file, Resource resource, Institution institution,
                               UUID uploaderId, ImageAsset existing) {
        if (file == null || file.isEmpty() || file.getSize() > ImageContentValidator.MAX_BYTES) {
            throw new ImageContentValidator.InvalidImageException("Image must be non-empty and no larger than 5 MB.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ImageStorageException("Unable to read uploaded image", exception);
        }
        DecodedImage decoded = imageContentValidator.validate(bytes);
        String storageKey = newStorageKey(decoded.extension());
        try {
            imageStorage.store(storageKey, bytes);
        } catch (IOException exception) {
            throw new ImageStorageException("Unable to store uploaded image", exception);
        }

        String previousKey = existing == null ? null : existing.getStorageKey();
        try {
            ImageAsset image = existing == null
                    ? new ImageAsset(storageKey, decoded.contentType(), bytes.length, decoded.width(),
                    decoded.height(), resource, institution, uploaderId)
                    : replaceExisting(existing, storageKey, decoded, bytes.length, uploaderId);
            ImageAsset saved = imageAssetRepository.saveAndFlush(image);
            scheduleStorageCleanup(storageKey, previousKey);
            return response(saved);
        } catch (RuntimeException exception) {
            cleanupAfterFailure(storageKey, exception);
            throw exception;
        }
    }

    private static ImageAsset replaceExisting(ImageAsset existing, String key, DecodedImage decoded,
                                              long size, UUID uploaderId) {
        existing.replace(key, decoded.contentType(), size, decoded.width(), decoded.height(), uploaderId);
        return existing;
    }

    private void scheduleStorageCleanup(String newKey, String oldKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            if (oldKey != null) {
                deleteAfterCommit(oldKey);
            }
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    if (oldKey != null) {
                        deleteAfterCommit(oldKey);
                    }
                } else {
                    deleteAfterCommit(newKey);
                }
            }
        });
    }

    private void scheduleDeletionAfterCommit(String storageKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteAfterCommit(storageKey);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    deleteAfterCommit(storageKey);
                }
            }
        });
    }

    private void authorizeResourceImageManagement(AppUser user, Resource resource) {
        Membership membership = getActiveMembership(user, resource.getInstitution());
        if (!"ADMIN".equalsIgnoreCase(membership.getRole())) {
            throw new ImageAccessDeniedException(
                    "Only an active institution administrator can manage resource images");
        }
    }

    private void cleanupAfterFailure(String key, RuntimeException original) {
        try {
            imageStorage.delete(key);
        } catch (IOException cleanupFailure) {
            original.addSuppressed(cleanupFailure);
        }
    }

    private void deleteAfterCommit(String key) {
        try {
            imageStorage.delete(key);
        } catch (IOException cleanupFailure) {
            logger.error("Could not clean up an obsolete image storage object", cleanupFailure);
        }
    }

    private static ImageResponse response(ImageAsset image) {
        return new ImageResponse(image.getId(), "/api/images/" + image.getId(),
                image.getContentType(), image.getSizeBytes(), image.getWidth(), image.getHeight());
    }

    private static String newStorageKey(String extension) {
        byte[] random = new byte[32];
        RANDOM.nextBytes(random);
        return HexFormat.of().formatHex(random) + "." + extension;
    }

    private AppUser getUser(String username) {
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private Membership getActiveMembership(AppUser user, Institution institution) {
        return membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institution.getId())
                .filter(membership -> "ACTIVE".equalsIgnoreCase(membership.getStatus()))
                .orElseThrow(() -> new ImageAccessDeniedException("An active membership in this institution is required"));
    }

    public static class ImageNotFoundException extends RuntimeException {
        public ImageNotFoundException(String message) { super(message); }
    }

    public static class ImageAccessDeniedException extends RuntimeException {
        public ImageAccessDeniedException(String message) { super(message); }
    }

    public static class ImageStorageException extends RuntimeException {
        public ImageStorageException(String message, Throwable cause) { super(message, cause); }
    }
}
