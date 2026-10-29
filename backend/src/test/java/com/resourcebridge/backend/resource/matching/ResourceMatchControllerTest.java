package com.resourcebridge.backend.resource.matching;

import com.resourcebridge.backend.ApiExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResourceMatchControllerTest {

    @Mock
    private ResourceMatchService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ResourceMatchController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void authenticatedRequestPassesValidatedQueryToMatchingService() throws Exception {
        when(service.match(any(), eq("alice"))).thenReturn(new ResourceMatchResponse(
                ResourceMatchResponse.RankingMethod.DETERMINISTIC, false,
                "Booking times are not confirmed because no time window was supplied.", List.of()));

        mockMvc.perform(post("/api/resources/match")
                        .principal(new TestingAuthenticationToken("alice", null))
                        .contentType("application/json")
                        .content("""
                                {"request":"I need a laptop for Python"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rankingMethod", is("DETERMINISTIC")))
                .andExpect(jsonPath("$.bookingWindowChecked", is(false)));

        verify(service).match(any(), eq("alice"));
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(post("/api/resources/match")
                        .contentType("application/json")
                        .content("""
                                {"request":"I need a laptop"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void blankRequestIsRejected() throws Exception {
        mockMvc.perform(post("/api/resources/match")
                        .principal(new TestingAuthenticationToken("alice", null))
                        .contentType("application/json")
                        .content("""
                                {"request":"   "}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void overlyLongRequestIsRejected() throws Exception {
        String request = "a".repeat(1001);
        mockMvc.perform(post("/api/resources/match")
                        .principal(new TestingAuthenticationToken("alice", null))
                        .contentType("application/json")
                        .content("{\"request\":\"" + request + "\"}"))
                .andExpect(status().isBadRequest());
    }
}
