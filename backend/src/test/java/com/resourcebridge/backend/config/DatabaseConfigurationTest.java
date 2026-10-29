package com.resourcebridge.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseConfigurationTest {

    @Test
    void validatesProductionDatabaseEnvironment() {
        MockEnvironment environment = configuredEnvironment("");

        assertDoesNotThrow(() -> DatabaseConfiguration.validate(environment));
    }

    @Test
    void validatesTestDatabaseEnvironmentWhenTestProfileIsActive() {
        MockEnvironment environment = configuredEnvironment("TEST_");
        environment.setActiveProfiles("test");

        assertDoesNotThrow(() -> DatabaseConfiguration.validate(environment));
    }

    @Test
    void missingDatabaseUrlHasActionableDiagnostic() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("DB_USERNAME", "resourcebridge")
                .withProperty("DB_PASSWORD", "test-only");

        IllegalStateException failure = assertThrows(
                IllegalStateException.class, () -> DatabaseConfiguration.validate(environment));
        assertTrue(failure.getMessage().contains("DB_URL"));
        assertTrue(failure.getMessage().contains("PostgreSQL JDBC URL"));
    }

    @Test
    void unresolvedPlaceholderIsRejectedWithoutEchoingItsValue() {
        MockEnvironment environment = configuredEnvironment("")
                .withProperty("DB_URL", "${DB_URL}");

        IllegalStateException failure = assertThrows(
                IllegalStateException.class, () -> DatabaseConfiguration.validate(environment));
        assertTrue(failure.getMessage().contains("DB_URL"));
        assertTrue(!failure.getMessage().contains("${DB_URL}"));
    }

    @Test
    void malformedDatabaseUrlIsRejected() {
        MockEnvironment environment = configuredEnvironment("")
                .withProperty("DB_URL", "postgresql://localhost/resourcebridge");

        IllegalStateException failure = assertThrows(
                IllegalStateException.class, () -> DatabaseConfiguration.validate(environment));
        assertTrue(failure.getMessage().contains("jdbc:postgresql://"));
    }

    private static MockEnvironment configuredEnvironment(String prefix) {
        return new MockEnvironment()
                .withProperty(prefix + "DB_URL", "jdbc:postgresql://localhost:5432/resourcebridge")
                .withProperty(prefix + "DB_USERNAME", "resourcebridge")
                .withProperty(prefix + "DB_PASSWORD", "test-only");
    }
}
