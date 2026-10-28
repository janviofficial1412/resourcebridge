package com.resourcebridge.backend.identity;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EntityManager entityManager;

    private RegistrationService registrationService;

    @BeforeEach
    void setUp() {
        registrationService = new RegistrationService(appUserRepository, passwordEncoder, entityManager);
    }

    @Test
    void successfulUsernameRegistration() {
        RegistrationRequest request = new RegistrationRequest(
                "scholar_jane",
                "jane@example.com",
                "SecretPass123",
                "Jane Doe"
        );

        when(appUserRepository.existsByUsername("scholar_jane")).thenReturn(false);
        when(appUserRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("SecretPass123")).thenReturn("hashed_SecretPass123");

        AppUser savedUser = new AppUser("scholar_jane", "jane@example.com", "hashed_SecretPass123", "Jane Doe");
        when(appUserRepository.saveAndFlush(any(AppUser.class))).thenReturn(savedUser);

        UserResponse response = registrationService.register(request);

        assertNotNull(response);
        assertEquals("scholar_jane", response.username());
        assertEquals("jane@example.com", response.email());
        assertEquals("Jane Doe", response.fullName());
        verify(appUserRepository).saveAndFlush(any(AppUser.class));
    }

    @Test
    void duplicateUsernameRejection() {
        RegistrationRequest request = new RegistrationRequest(
                "existing_user",
                "new@example.com",
                "SecretPass123",
                "User Name"
        );

        when(appUserRepository.existsByUsername("existing_user")).thenReturn(true);

        assertThrows(RegistrationService.UsernameAlreadyTakenException.class, () ->
                registrationService.register(request));
    }

    @Test
    void duplicateEmailRejection() {
        RegistrationRequest request = new RegistrationRequest(
                "unique_user",
                "existing@example.com",
                "SecretPass123",
                "User Name"
        );

        when(appUserRepository.existsByUsername("unique_user")).thenReturn(false);
        when(appUserRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(RegistrationService.EmailAlreadyRegisteredException.class, () ->
                registrationService.register(request));
    }

    @Test
    void registrationWithoutOptionalEmail() {
        RegistrationRequest request = new RegistrationRequest(
                "no_email_user",
                null,
                "SecretPass123",
                "User Name"
        );

        when(appUserRepository.existsByUsername("no_email_user")).thenReturn(false);
        when(passwordEncoder.encode("SecretPass123")).thenReturn("hashed_SecretPass123");

        AppUser savedUser = new AppUser("no_email_user", null, "hashed_SecretPass123", "User Name");
        when(appUserRepository.saveAndFlush(any(AppUser.class))).thenReturn(savedUser);

        UserResponse response = registrationService.register(request);

        assertNotNull(response);
        assertEquals("no_email_user", response.username());
        assertEquals(null, response.email());
    }
}
