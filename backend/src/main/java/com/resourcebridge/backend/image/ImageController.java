package com.resourcebridge.backend.image;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ImageController {

    private final ImageAssetService imageAssetService;

    public ImageController(ImageAssetService imageAssetService) {
        this.imageAssetService = imageAssetService;
    }

    @PostMapping(path = "/resources/{resourceId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageAssetService.ImageResponse uploadResourceImage(@PathVariable UUID resourceId,
                                                               @RequestParam("file") MultipartFile file,
                                                               Authentication authentication) {
        return imageAssetService.uploadResourceImage(resourceId, file, authentication.getName());
    }

    @DeleteMapping("/resources/{resourceId}/image")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void removeResourceImage(@PathVariable UUID resourceId, Authentication authentication) {
        imageAssetService.removeResourceImage(resourceId, authentication.getName());
    }

    @PostMapping(path = "/institutions/{institutionId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageAssetService.ImageResponse uploadInstitutionLogo(@PathVariable UUID institutionId,
                                                                 @RequestParam("file") MultipartFile file,
                                                                 Authentication authentication) {
        return imageAssetService.uploadInstitutionLogo(institutionId, file, authentication.getName());
    }

    @DeleteMapping("/institutions/{institutionId}/logo")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void removeInstitutionLogo(@PathVariable UUID institutionId, Authentication authentication) {
        imageAssetService.removeInstitutionLogo(institutionId, authentication.getName());
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<InputStreamResource> getImage(@PathVariable UUID imageId,
                                                        Authentication authentication) {
        ImageAssetService.ImageContent content = imageAssetService.getImage(imageId, authentication.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.contentType()))
                .contentLength(content.sizeBytes())
                .cacheControl(CacheControl.noCache().cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .body(new InputStreamResource(content.inputStream()));
    }
}
