package com.resourcebridge.backend.identity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private HttpServletResponse httpResponse;

    @Mock
    private HttpSession httpSession;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authenticationManager, appUserRepository);
    }

    @Test
    void successfulLoginWithUsernameAndPassword() {
        LoginRequest request = new LoginRequest("scholar_jane", "Password123");
        Authentication authenticated = mock(Authentication.class);
        when(authenticated.getName()).thenReturn("scholar_jane");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authenticated);
        when(httpRequest.getSession(false)).thenReturn(null);

        ResponseEntity<?> response = authController.login(request, httpRequest, httpResponse);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthController.LoginResponse);
        AuthController.LoginResponse body = (AuthController.LoginResponse) response.getBody();
        assertEquals("scholar_jane", body.username());
    }

    @Test
    void invalidUsernamePasswordRejection() {
        LoginRequest request = new LoginRequest("scholar_jane", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> response = authController.login(request, httpRequest, httpResponse);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void logoutInvalidatesSession() {
        when(httpRequest.getSession(false)).thenReturn(httpSession);

        authController.logout(httpRequest);

        verify(httpSession).invalidate();
    }

    @Test
    void getCurrentUserReturnsAuthenticatedUserInfo() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("scholar_jane");

        AppUser user = new AppUser("scholar_jane", "jane@example.com", "hash", "Jane Doe");
        when(appUserRepository.findByUsername("scholar_jane")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.getCurrentUser(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof UserResponse);
        UserResponse body = (UserResponse) response.getBody();
        assertEquals("scholar_jane", body.username());
        assertEquals("Jane Doe", body.fullName());
    }

    @Test
    void getCurrentUserUnauthenticatedReturns401() {
        ResponseEntity<?> response = authController.getCurrentUser(null);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
