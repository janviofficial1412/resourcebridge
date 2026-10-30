package com.resourcebridge.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig();

    @Test
    void allowsLocalAndConfiguredFrontendOriginsWithCredentials() {
        CorsConfigurationSource source =
                securityConfig.corsConfigurationSource("https://resourcebridge.vercel.app");

        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("GET", "/api/auth/csrf"));

        assertEquals(
                java.util.List.of("http://localhost:5173", "https://resourcebridge.vercel.app"),
                configuration.getAllowedOrigins());
        assertTrue(configuration.getAllowCredentials());
        assertEquals(java.util.List.of("X-CSRF-TOKEN"), configuration.getExposedHeaders());
    }

    @Test
    void rejectsWildcardOriginWhenCredentialsAreEnabled() {
        assertThrows(
                IllegalArgumentException.class,
                () -> securityConfig.corsConfigurationSource("*"));
    }

    @Test
    void configuresProductionCsrfCookieForCrossOriginRequests() {
        CookieCsrfTokenRepository repository =
                securityConfig.csrfTokenRepository("None", true);
        MockHttpServletResponse response = new MockHttpServletResponse();
        repository.saveToken(
                new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "csrf-token"),
                new MockHttpServletRequest(),
                response);

        jakarta.servlet.http.Cookie cookie = response.getCookie("XSRF-TOKEN");

        assertEquals("None", cookie.getAttribute("SameSite"));
        assertTrue(cookie.getSecure());
        assertFalse(cookie.isHttpOnly());
    }
}
