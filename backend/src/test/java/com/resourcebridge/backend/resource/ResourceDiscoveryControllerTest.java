package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.ApiExceptionHandler;
import com.resourcebridge.backend.image.ImageAssetService;
import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MockMvc unit tests for GET /api/resources (Phase 6.1 – Resource Discovery).
 *
 * Tests delegate all business logic to a mocked ResourceService, following the
 * same pattern used in ResourceControllerTest.
 */
@ExtendWith(MockitoExtension.class)
class ResourceDiscoveryControllerTest {

    @Mock
    private ResourceService resourceService;

    @Mock
    private ImageAssetService imageAssetService;

    private MockMvc mockMvc;

    private UUID institutionId;
    private UUID otherInstitutionId;
    private UUID categoryId;
    private UUID resourceId;

    private AppUser testUser;
    private Institution testInstitution;
    private Membership testMembership;
    private ResourceCategory testCategory;
    private Resource availableResource;

    @BeforeEach
    void setUp() {
        ResourceController controller = new ResourceController(resourceService, imageAssetService);
        lenient().when(imageAssetService.getResourceImageIds(any())).thenReturn(java.util.Map.of());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        institutionId = UUID.randomUUID();
        otherInstitutionId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        resourceId = UUID.randomUUID();

        testUser = new AppUser("alice", "alice@lab.com", "hash", "Alice Researcher");
        ReflectionTestUtils.setField(testUser, "id", UUID.randomUUID());

        testInstitution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(testInstitution, "id", institutionId);

        testMembership = new Membership(testUser, testInstitution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(testMembership, "id", UUID.randomUUID());

        testCategory = new ResourceCategory(testInstitution, "Microscopy", "High-res scopes");
        ReflectionTestUtils.setField(testCategory, "id", categoryId);

        availableResource = new Resource(
                testInstitution,
                testMembership,
                testCategory,
                "Cryo-EM Station",
                "Advanced cryo-transmission microscope",
                ResourceType.EQUIPMENT,
                "Room B12",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240
        );
        ReflectionTestUtils.setField(availableResource, "id", resourceId);
    }

    // -----------------------------------------------------------------------
    // 1. Happy-path: authorized member gets resource list
    // -----------------------------------------------------------------------

    @Test
    void authorizedMemberReceivesResourceList() throws Exception {
        when(resourceService.discoverResources(eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(resourceId.toString())))
                .andExpect(jsonPath("$[0].name", is("Cryo-EM Station")))
                .andExpect(jsonPath("$[0].status", is("AVAILABLE")))
                .andExpect(jsonPath("$[0].institutionId", is(institutionId.toString())))
                .andExpect(jsonPath("$[0].categoryName", is("Microscopy")))
                .andExpect(jsonPath("$[0].ownerName", is("Alice Researcher")));
    }

    @Test
    void returnsEmptyListWhenNoResourcesMatch() throws Exception {
        when(resourceService.discoverResources(eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // -----------------------------------------------------------------------
    // 2. Unauthenticated request is rejected
    // -----------------------------------------------------------------------

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("User must be authenticated")));
    }

    // -----------------------------------------------------------------------
    // 3. No active membership → service throws ResourceAccessDeniedException → 403
    // -----------------------------------------------------------------------

    @Test
    void memberWithoutActiveMembershipReceives403() throws Exception {
        when(resourceService.discoverResources(eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("outsider")))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("Your membership in this institution is not active"));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("outsider", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Your membership in this institution is not active")));
    }

    @Test
    void nonMemberReceives403() throws Exception {
        when(resourceService.discoverResources(eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("nonmember")))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("You do not have access to this institution"));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("nonmember", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    // -----------------------------------------------------------------------
    // 4. Resources from another institution never appear (service-layer contract)
    // -----------------------------------------------------------------------

    @Test
    void resourcesFromOtherInstitutionAreNeverReturned() throws Exception {
        // Service is scoped to otherInstitutionId and returns nothing for the
        // cross-institution call; alice is a member of testInstitution only.
        when(resourceService.discoverResources(eq(otherInstitutionId), isNull(), isNull(), isNull(), isNull(), eq("alice")))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("You do not have access to this institution"));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", otherInstitutionId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isForbidden());
    }

    // -----------------------------------------------------------------------
    // 5. Draft / maintenance / retired statuses are excluded (service contract)
    // -----------------------------------------------------------------------

    @Test
    void nonAvailableStatusesAreExcluded() throws Exception {
        // The service filters to AVAILABLE only; when it returns an empty list
        // the controller faithfully returns [].
        when(resourceService.discoverResources(eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of()); // draft/maintenance/retired all filtered out

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // -----------------------------------------------------------------------
    // 6. Optional filters are forwarded to the service correctly
    // -----------------------------------------------------------------------

    @Test
    void searchFilterIsForwardedToService() throws Exception {
        when(resourceService.discoverResources(
                eq(institutionId), eq("cryo"), isNull(), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("search", "cryo")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Cryo-EM Station")));
    }

    @Test
    void categoryIdFilterIsForwardedToService() throws Exception {
        when(resourceService.discoverResources(
                eq(institutionId), isNull(), eq(categoryId), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("categoryId", categoryId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].categoryName", is("Microscopy")));
    }

    @Test
    void resourceTypeFilterIsForwardedToService() throws Exception {
        when(resourceService.discoverResources(
                eq(institutionId), isNull(), isNull(), eq(ResourceType.EQUIPMENT), isNull(), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("resourceType", "EQUIPMENT")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].resourceType", is("EQUIPMENT")));
    }

    @Test
    void conditionRatingFilterIsForwardedToService() throws Exception {
        when(resourceService.discoverResources(
                eq(institutionId), isNull(), isNull(), isNull(), eq(ConditionRating.NEW), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("conditionRating", "NEW")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].conditionRating", is("NEW")));
    }

    @Test
    void allFiltersTogetherAreForwardedCorrectly() throws Exception {
        when(resourceService.discoverResources(
                eq(institutionId), eq("cryo"), eq(categoryId),
                eq(ResourceType.EQUIPMENT), eq(ConditionRating.NEW), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("search", "cryo")
                        .param("categoryId", categoryId.toString())
                        .param("resourceType", "EQUIPMENT")
                        .param("conditionRating", "NEW")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void institutionFilterIsOptionalForAllActiveInstitutionDiscovery() throws Exception {
        when(resourceService.discoverResources(isNull(), isNull(), isNull(), isNull(), isNull(), eq("alice")))
                .thenReturn(List.of(availableResource));

        mockMvc.perform(get("/api/resources")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // -----------------------------------------------------------------------
    // 7. Category from another institution → service throws validation error → 400
    // -----------------------------------------------------------------------

    @Test
    void categoryFromAnotherInstitutionReturns400() throws Exception {
        UUID foreignCategoryId = UUID.randomUUID();

        when(resourceService.discoverResources(
                eq(institutionId), isNull(), eq(foreignCategoryId), isNull(), isNull(), eq("alice")))
                .thenThrow(new ResourceService.ResourceValidationException(
                        "Category does not belong to institution " + institutionId));

        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("categoryId", foreignCategoryId.toString())
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    // -----------------------------------------------------------------------
    // 8. Invalid enum value produces client error (400)
    // -----------------------------------------------------------------------

    @Test
    void invalidResourceTypeReturns400() throws Exception {
        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("resourceType", "INVALID_TYPE")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void invalidConditionRatingReturns400() throws Exception {
        mockMvc.perform(get("/api/resources")
                        .param("institutionId", institutionId.toString())
                        .param("conditionRating", "EXCELLENT")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void malformedInstitutionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/resources")
                        .param("institutionId", "not-a-uuid")
                        .principal(new TestingAuthenticationToken("alice", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }
}
