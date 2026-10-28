package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.ApiExceptionHandler;
import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResourceControllerTest {

    @Mock
    private ResourceService resourceService;

    private MockMvc mockMvc;

    private AppUser testUser;
    private Institution testInstitution;
    private Membership testMembership;
    private ResourceCategory testCategory;
    private Resource sampleResource;

    private UUID institutionId;
    private UUID categoryId;
    private UUID resourceId;

    @BeforeEach
    void setUp() {
        ResourceController controller = new ResourceController(resourceService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        institutionId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        resourceId = UUID.randomUUID();

        testUser = new AppUser("scholar_jane", "jane@example.com", "hash", "Jane Doe");
        ReflectionTestUtils.setField(testUser, "id", UUID.randomUUID());

        testInstitution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(testInstitution, "id", institutionId);

        testMembership = new Membership(testUser, testInstitution, "RESOURCE_OWNER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(testMembership, "id", UUID.randomUUID());

        testCategory = new ResourceCategory(testInstitution, "Electron Microscopy", "High-res microscopes");
        ReflectionTestUtils.setField(testCategory, "id", categoryId);

        sampleResource = new Resource(
                testInstitution,
                testMembership,
                testCategory,
                "Titan Krios Cryo-EM",
                "Advanced 300kV cryo-transmission microscope",
                ResourceType.EQUIPMENT,
                "Room B12, Basement",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240
        );
        ReflectionTestUtils.setField(sampleResource, "id", resourceId);
    }

    @Test
    void createResourceSucceedsWith201() throws Exception {
        String requestJson = String.format("""
                {
                    "institutionId": "%s",
                    "categoryId": "%s",
                    "name": "Titan Krios Cryo-EM",
                    "description": "Advanced 300kV cryo-transmission microscope",
                    "resourceType": "EQUIPMENT",
                    "location": "Room B12, Basement",
                    "conditionRating": "NEW",
                    "status": "AVAILABLE",
                    "requiresApproval": true,
                    "maxBookingMinutes": 240
                }
                """, institutionId, categoryId);

        when(resourceService.createResource(any(ResourceService.CreateResourceCommand.class), eq("scholar_jane")))
                .thenReturn(sampleResource);

        mockMvc.perform(post("/api/resources")
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(resourceId.toString())))
                .andExpect(jsonPath("$.name", is("Titan Krios Cryo-EM")))
                .andExpect(jsonPath("$.resourceType", is("EQUIPMENT")))
                .andExpect(jsonPath("$.conditionRating", is("NEW")))
                .andExpect(jsonPath("$.status", is("AVAILABLE")))
                .andExpect(jsonPath("$.institutionName", is("Apex Nanotech Lab")))
                .andExpect(jsonPath("$.ownerName", is("Jane Doe")))
                .andExpect(jsonPath("$.categoryName", is("Electron Microscopy")));
    }

    @Test
    void createResourceRejectsInvalidPayloadWith400() throws Exception {
        // Missing name, missing institutionId, missing categoryId, missing resourceType
        String invalidJson = "{\"description\": \"Incomplete payload\"}";

        mockMvc.perform(post("/api/resources")
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        String requestJson = String.format("""
                {
                    "institutionId": "%s",
                    "categoryId": "%s",
                    "name": "Titan Krios Cryo-EM",
                    "resourceType": "EQUIPMENT"
                }
                """, institutionId, categoryId);

        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("User must be authenticated")));
    }

    @Test
    void getMyResourcesReturns200WithList() throws Exception {
        when(resourceService.getMyResources("scholar_jane")).thenReturn(List.of(sampleResource));

        mockMvc.perform(get("/api/resources/my")
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Titan Krios Cryo-EM")))
                .andExpect(jsonPath("$[0].institutionName", is("Apex Nanotech Lab")));
    }

    @Test
    void getMyResourcesWithInstitutionFilterDelegatesCorrectly() throws Exception {
        when(resourceService.getMyResourcesByInstitution(institutionId, "scholar_jane"))
                .thenReturn(List.of(sampleResource));

        mockMvc.perform(get("/api/resources/my")
                        .param("institutionId", institutionId.toString())
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].institutionId", is(institutionId.toString())));
    }

    @Test
    void getResourceDetailsReturns200() throws Exception {
        when(resourceService.getResourceDetails(resourceId, "scholar_jane")).thenReturn(sampleResource);

        mockMvc.perform(get("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(resourceId.toString())))
                .andExpect(jsonPath("$.name", is("Titan Krios Cryo-EM")));
    }

    @Test
    void getResourceDetailsNonExistentReturns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(resourceService.getResourceDetails(nonExistentId, "scholar_jane"))
                .thenThrow(new ResourceService.ResourceNotFoundException("Resource not found"));

        mockMvc.perform(get("/api/resources/{id}", nonExistentId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", is("Resource not found")));
    }

    @Test
    void getResourceDetailsForbiddenReturns403() throws Exception {
        when(resourceService.getResourceDetails(resourceId, "foreign_user"))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("Membership is not active in this institution"));

        mockMvc.perform(get("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("foreign_user", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Membership is not active in this institution")));
    }

    @Test
    void updateResourceSucceedsWith200() throws Exception {
        String updateJson = """
                {
                    "name": "Titan Krios Cryo-EM (Calibrated)",
                    "description": "Newly calibrated detectors",
                    "location": "Room B14",
                    "conditionRating": "GOOD",
                    "status": "AVAILABLE",
                    "requiresApproval": false,
                    "maxBookingMinutes": 180
                }
                """;

        Resource updatedResource = new Resource(
                testInstitution,
                testMembership,
                testCategory,
                "Titan Krios Cryo-EM (Calibrated)",
                "Newly calibrated detectors",
                ResourceType.EQUIPMENT,
                "Room B14",
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                false,
                180
        );
        ReflectionTestUtils.setField(updatedResource, "id", resourceId);

        when(resourceService.updateResource(eq(resourceId), any(ResourceService.UpdateResourceCommand.class), eq("scholar_jane")))
                .thenReturn(updatedResource);

        mockMvc.perform(put("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(resourceId.toString())))
                .andExpect(jsonPath("$.name", is("Titan Krios Cryo-EM (Calibrated)")))
                .andExpect(jsonPath("$.location", is("Room B14")))
                .andExpect(jsonPath("$.requiresApproval", is(false)))
                .andExpect(jsonPath("$.maxBookingMinutes", is(180)));
    }

    @Test
    void updateResourceUnauthorizedReturns403() throws Exception {
        String updateJson = """
                {
                    "name": "Tampered Title"
                }
                """;

        when(resourceService.updateResource(eq(resourceId), any(ResourceService.UpdateResourceCommand.class), eq("intruder_bob")))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("You do not have permission to modify or delete this resource"));

        mockMvc.perform(put("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("intruder_bob", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    void deleteResourceSucceedsWith204() throws Exception {
        doNothing().when(resourceService).deleteResource(resourceId, "scholar_jane");

        mockMvc.perform(delete("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isNoContent());

        verify(resourceService).deleteResource(resourceId, "scholar_jane");
    }

    @Test
    void deleteResourceUnauthorizedReturns403() throws Exception {
        doThrow(new ResourceService.ResourceAccessDeniedException("You do not have permission to modify or delete this resource"))
                .when(resourceService).deleteResource(resourceId, "intruder_bob");

        mockMvc.perform(delete("/api/resources/{id}", resourceId)
                        .principal(new TestingAuthenticationToken("intruder_bob", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
