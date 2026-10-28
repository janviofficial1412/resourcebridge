package com.resourcebridge.backend.institution;

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
import java.util.UUID;

@RestController
@RequestMapping("/api/institutions")
public class InstitutionController {

    private final InstitutionService institutionService;

    public InstitutionController(InstitutionService institutionService) {
        this.institutionService = institutionService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionDetailResponse createInstitution(@Valid @RequestBody CreateInstitutionRequest request,
                                                       Authentication authentication) {
        return institutionService.createInstitution(request, authentication.getName());
    }

    @GetMapping
    public List<InstitutionSummaryResponse> listMyInstitutions(Authentication authentication) {
        return institutionService.listMyInstitutions(authentication.getName());
    }

    @GetMapping("/{id}")
    public InstitutionDetailResponse getInstitutionDetails(@PathVariable UUID id,
                                                           Authentication authentication) {
        return institutionService.getInstitutionDetails(id, authentication.getName());
    }

    @GetMapping("/{id}/members")
    public List<MemberResponse> getInstitutionMembers(@PathVariable UUID id,
                                                      Authentication authentication) {
        return institutionService.getInstitutionMembers(id, authentication.getName());
    }
}
