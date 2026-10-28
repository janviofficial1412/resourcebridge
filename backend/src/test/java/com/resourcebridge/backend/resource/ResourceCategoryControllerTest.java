package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.ApiExceptionHandler;
import com.resourcebridge.backend.institution.Institution;
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

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResourceCategoryControllerTest {

    @Mock
    private ResourceCategoryService resourceCategoryService;

    private MockMvc mockMvc;

    private Institution institution;
    private ResourceCategory sampleCategory;
    private UUID institutionId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        ResourceCategoryController controller = new ResourceCategoryController(resourceCategoryService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        institutionId = UUID.randomUUID();
        categoryId = UUID.randomUUID();

        institution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);

        sampleCategory = new ResourceCategory(institution, "Electron Microscopy", "High-resolution EM devices");
        ReflectionTestUtils.setField(sampleCategory, "id", categoryId);
    }

    @Test
    void getCategoriesReturns200WithList() throws Exception {
        when(resourceCategoryService.getCategories(institutionId, "scholar_jane"))
                .thenReturn(List.of(sampleCategory));

        mockMvc.perform(get("/api/institutions/{institutionId}/categories", institutionId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(categoryId.toString())))
                .andExpect(jsonPath("$[0].name", is("Electron Microscopy")))
                .andExpect(jsonPath("$[0].description", is("High-resolution EM devices")))
                .andExpect(jsonPath("$[0].institutionId", is(institutionId.toString())));
    }

    @Test
    void getCategoriesForbiddenWhenNotMemberReturns403() throws Exception {
        when(resourceCategoryService.getCategories(institutionId, "unauthorized_user"))
                .thenThrow(new ResourceService.ResourceAccessDeniedException("Active membership required"));

        mockMvc.perform(get("/api/institutions/{institutionId}/categories", institutionId)
                        .principal(new TestingAuthenticationToken("unauthorized_user", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Active membership required")));
    }

    @Test
    void createCategorySucceedsWith201() throws Exception {
        String requestJson = """
                {
                    "name": "Mass Spectrometry",
                    "description": "Mass specs and ion sources"
                }
                """;

        ResourceCategory createdCategory = new ResourceCategory(institution, "Mass Spectrometry", "Mass specs and ion sources");
        UUID newCatId = UUID.randomUUID();
        ReflectionTestUtils.setField(createdCategory, "id", newCatId);

        when(resourceCategoryService.createCategory(institutionId, "Mass Spectrometry", "Mass specs and ion sources", "scholar_jane"))
                .thenReturn(createdCategory);

        mockMvc.perform(post("/api/institutions/{institutionId}/categories", institutionId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(newCatId.toString())))
                .andExpect(jsonPath("$.name", is("Mass Spectrometry")))
                .andExpect(jsonPath("$.institutionId", is(institutionId.toString())));
    }

    @Test
    void createCategoryDuplicateNameReturns409() throws Exception {
        String requestJson = """
                {
                    "name": "Electron Microscopy",
                    "description": "Duplicate name"
                }
                """;

        when(resourceCategoryService.createCategory(institutionId, "Electron Microscopy", "Duplicate name", "scholar_jane"))
                .thenThrow(new ResourceCategoryService.DuplicateCategoryException("Category with this name already exists in this institution"));

        mockMvc.perform(post("/api/institutions/{institutionId}/categories", institutionId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("Category with this name already exists in this institution")));
    }

    @Test
    void createCategoryBlankNameReturns400() throws Exception {
        String requestJson = """
                {
                    "name": "   ",
                    "description": "Empty name"
                }
                """;

        mockMvc.perform(post("/api/institutions/{institutionId}/categories", institutionId)
                        .principal(new TestingAuthenticationToken("scholar_jane", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createCategoryUnauthenticatedReturns401() throws Exception {
        String requestJson = """
                {
                    "name": "Cleanrooms",
                    "description": "ISO class 5-8 spaces"
                }
                """;

        mockMvc.perform(post("/api/institutions/{institutionId}/categories", institutionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("User must be authenticated")));
    }
}
