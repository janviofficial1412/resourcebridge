package com.resourcebridge.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

import java.io.IOException;

@Configuration
public class SecurityConfig {

    static final String REGISTER_PATH = "/api/auth/register";
    static final String LOGIN_PATH = "/api/auth/login";
    static final String CSRF_PATH = "/api/auth/csrf";

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource,
            @Value("${resourcebridge.csrf.cookie.same-site:lax}") String csrfCookieSameSite,
            @Value("${resourcebridge.csrf.cookie.secure:false}") boolean csrfCookieSecure
    ) throws Exception {
        // Each matcher matches ONLY its own method and path.
        PathPatternRequestMatcher registerEndpoint =
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, REGISTER_PATH);
        PathPatternRequestMatcher loginEndpoint =
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, LOGIN_PATH);
        PathPatternRequestMatcher csrfEndpoint =
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, CSRF_PATH);

        http
                // CSRF stays enabled. The SPA obtains the token through the credentialed CSRF endpoint.
                // Registration and GET CSRF probe are exempt. Login is NOT exempt.
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository(csrfCookieSameSite, csrfCookieSecure))
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .ignoringRequestMatchers(registerEndpoint, loginEndpoint, csrfEndpoint))
                // Makes sure the XSRF-TOKEN cookie is actually written (see CsrfCookieFilter below).
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
                // Server-side session (JSESSIONID cookie). No JWT.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(registerEndpoint, loginEndpoint, csrfEndpoint).permitAll()
                        .anyRequest().authenticated())
                // Unauthenticated requests get a bare 401, never a redirect to a login page.
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

        return http.build();
    }

    /** BCrypt with Spring's default strength (10). Produces 60-character hashes, which fit varchar(100). */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Built from the single UserDetailsService bean (AppUserDetailsService) and the PasswordEncoder above.
     * The login endpoint will use it to check credentials.
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${resourcebridge.cors.allowed-origin:}") String configuredOrigins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = new java.util.ArrayList<>(List.of("http://localhost:5173"));
        if (configuredOrigins != null && !configuredOrigins.isBlank()) {
            List<String> deploymentOrigins = Arrays.stream(configuredOrigins.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .toList();
            if (deploymentOrigins.contains("*")) {
                throw new IllegalArgumentException("CORS_ALLOWED_ORIGIN must be an explicit origin, not '*'");
            }
            allowedOrigins.addAll(deploymentOrigins);
        }
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                List.of("*")
        );
        configuration.setExposedHeaders(List.of("X-CSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    CookieCsrfTokenRepository csrfTokenRepository(String sameSite, boolean secure) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie
                .sameSite(sameSite)
                .secure(secure));
        return repository;
    }

    /**
     * Spring Security loads the CSRF token lazily, so on a plain request the cookie would never be written.
     * Reading the token here forces it to load, so the browser receives the XSRF-TOKEN cookie.
     */
    private static final class CsrfCookieFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                String token = csrfToken.getToken();
                if (HttpMethod.GET.matches(request.getMethod()) && CSRF_PATH.equals(request.getServletPath())) {
                    response.setHeader("X-CSRF-TOKEN", token);
                }
            }
            filterChain.doFilter(request, response);
        }
    }
}