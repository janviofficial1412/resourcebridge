package com.resourcebridge.backend.resource.matching;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OllamaClientTest {

    @Test
    void postsCandidateRankingRequestToConfiguredLocalModelAndReadsJsonContent() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:11434");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OllamaClient client = new OllamaClient(builder.build(), new ObjectMapper(), "qwen2.5:3b");

        server.expect(requestTo("http://localhost:11434/api/chat"))
                .andExpect(method(POST))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"model\":\"qwen2.5:3b\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Python laptop")))
                .andRespond(withSuccess("""
                        {"message":{"content":"{\\"matches\\":[]}"}}
                        """, MediaType.APPLICATION_JSON));

        assertEquals("{\"matches\":[]}", client.rank("Python laptop", List.of()));
        server.verify();
    }

    @Test
    void rejectsOllamaResponsesWithoutJsonMessageContent() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:11434");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OllamaClient client = new OllamaClient(builder.build(), new ObjectMapper(), "qwen2.5:3b");
        server.expect(requestTo("http://localhost:11434/api/chat"))
                .andRespond(withSuccess("{\"message\":{}}", MediaType.APPLICATION_JSON));

        assertThrows(OllamaClient.InvalidOllamaResponseException.class,
                () -> client.rank("Python laptop", List.of()));
        server.verify();
    }
}
