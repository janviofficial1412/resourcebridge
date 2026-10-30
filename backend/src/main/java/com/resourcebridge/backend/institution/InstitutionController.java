package com.resourcebridge.backend.institution;

import com.resourcebridge.backend.image.ImageAssetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    @GetMapping("/memberships")
    public List<InstitutionSummaryResponse> listMyMemberships(Authentication authentication) {
        List<InstitutionSummaryResponse> memberships =
                institutionService.listMyMemberships(authentication.getName());
        Set<UUID> institutionIds = memberships.stream()
                .map(InstitutionSummaryResponse::id)
                .collect(Collectors.toSet());
        Map<UUID, UUID> logoIds = imageAssetService.getInstitutionLogoIds(institutionIds);
        return memberships.stream()
                .map(membership -> new InstitutionSummaryResponse(
                        membership.id(), membership.name(), membership.slug(), membership.timezone(),
                        membership.status(), membership.role(), membership.membershipStatus(),
                        membership.createdAt(), logoIds.get(membership.id())))
                .toList();
    }

    @GetMapping("/directory")
    public List<InstitutionDirectoryResponse> listDirectory() {
        List<InstitutionDirectoryResponse> institutions = institutionService.listDirectory();
        Set<UUID> institutionIds = institutions.stream()
                .map(InstitutionDirectoryResponse::id)
                .collect(Collectors.toSet());
        Map<UUID, UUID> logoIds = imageAssetService.getInstitutionLogoIds(institutionIds);
        return institutions.stream()
                .map(institution -> new InstitutionDirectoryResponse(
                        institution.id(), institution.name(), institution.slug(), institution.timezone(),
                        institution.status(), institution.createdAt(), logoIds.get(institution.id())))
                .toList();
    }

    @PostMapping("/{id}/membership-request")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse requestMembership(@PathVariable UUID id, Authentication authentication) {
        return institutionService.requestMembership(id, authentication.getName());
    }

    @PostMapping("/{id}/members/{membershipId}/approve")
    public MemberResponse approveMembership(@PathVariable UUID id,
                                            @PathVariable UUID membershipId,
                                            Authentication authentication) {
        return institutionService.approveMembership(id, membershipId, authentication.getName());
    }

    @PostMapping("/{id}/members/{membershipId}/reject")
    public MemberResponse rejectMembership(@PathVariable UUID id,
                                           @PathVariable UUID membershipId,
                                           Authentication authentication) {
        return institutionService.rejectMembership(id, membershipId, authentication.getName());
    }

    @DeleteMapping("/{id}/members/{membershipId}")
    public MemberResponse deactivateMembership(@PathVariable UUID id,
                                               @PathVariable UUID membershipId,
                                               Authentication authentication) {
        return institutionService.deactivateMembership(id, membershipId, authentication.getName());
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
