package com.resourcebridge.backend.institution;

import com.resourcebridge.backend.image.ImageAssetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/institutions")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final ImageAssetService imageAssetService;

    public InstitutionController(InstitutionService institutionService, ImageAssetService imageAssetService) {
        this.institutionService = institutionService;
        this.imageAssetService = imageAssetService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionDetailResponse createInstitution(@Valid @RequestBody CreateInstitutionRequest request,
                                                       Authentication authentication) {
        InstitutionDetailResponse created = institutionService.createInstitution(request, authentication.getName());
        return withLogo(created);
    }

    @GetMapping
    public List<InstitutionSummaryResponse> listMyInstitutions(Authentication authentication) {
        List<InstitutionSummaryResponse> institutions = institutionService.listMyInstitutions(authentication.getName());
        Set<UUID> institutionIds = institutions.stream()
                .map(InstitutionSummaryResponse::id)
                .collect(Collectors.toSet());
        Map<UUID, UUID> logoIds = imageAssetService.getInstitutionLogoIds(institutionIds);
        return institutions.stream()
                .map(institution -> new InstitutionSummaryResponse(
                        institution.id(), institution.name(), institution.slug(), institution.timezone(),
                        institution.status(), institution.role(), institution.membershipStatus(),
                        institution.createdAt(), logoIds.get(institution.id())))
                .toList();
    }

    @GetMapping("/{id}")
    public InstitutionDetailResponse getInstitutionDetails(@PathVariable UUID id,
                                                           Authentication authentication) {
        return withLogo(institutionService.getInstitutionDetails(id, authentication.getName()));
    }

    @GetMapping("/{id}/members")
    public List<MemberResponse> getInstitutionMembers(@PathVariable UUID id,
                                                      Authentication authentication) {
        return institutionService.getInstitutionMembers(id, authentication.getName());
    }

    private InstitutionDetailResponse withLogo(InstitutionDetailResponse institution) {
        UUID logoId = imageAssetService.getInstitutionLogoIds(Set.of(institution.id())).get(institution.id());
        return new InstitutionDetailResponse(
                institution.id(), institution.name(), institution.slug(), institution.timezone(),
                institution.status(), institution.role(), institution.membershipStatus(),
                institution.memberCount(), institution.createdAt(), logoId);
    }
}
