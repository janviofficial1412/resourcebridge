package com.resourcebridge.backend.resource.matching;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OllamaConfigurationTest {

    private final OllamaConfiguration configuration = new OllamaConfiguration();

    @Test
    void acceptsLoopbackOllamaUrl() {
        assertDoesNotThrow(() -> configuration.ollamaRestClient(
                "http://localhost:11434",
                Duration.ofSeconds(2), Duration.ofSeconds(20)));
    }

    @Test
    void rejectsNonLocalOllamaUrl() {
        assertThrows(IllegalStateException.class, () -> configuration.ollamaRestClient(
                "https://example.com",
                Duration.ofSeconds(2), Duration.ofSeconds(20)));
    }
}
