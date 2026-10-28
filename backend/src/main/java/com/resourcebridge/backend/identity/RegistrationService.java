package com.resourcebridge.backend.identity;

import jakarta.persistence.EntityManager;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class RegistrationService {

    static final String USERNAME_UNIQUE_CONSTRAINT = "uq_app_user_username";
    static final String EMAIL_UNIQUE_CONSTRAINT = "uq_app_user_email";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public RegistrationService(AppUserRepository appUserRepository,
                               PasswordEncoder passwordEncoder,
                               EntityManager entityManager) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
    }

    @Transactional
    public UserResponse register(RegistrationRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email() != null && !request.email().isBlank()
                ? request.email().trim().toLowerCase(Locale.ROOT)
                : null;

        // Friendly early validation checks
        if (appUserRepository.existsByUsername(username)) {
            throw new UsernameAlreadyTakenException();
        }

        if (email != null && appUserRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        String passwordHash = passwordEncoder.encode(request.password());
        AppUser user = new AppUser(username, email, passwordHash, request.fullName().trim());

        AppUser saved;
        try {
            saved = appUserRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            if (isConstraintViolation(e, USERNAME_UNIQUE_CONSTRAINT)) {
                throw new UsernameAlreadyTakenException(e);
            }
            if (isConstraintViolation(e, EMAIL_UNIQUE_CONSTRAINT)) {
                throw new EmailAlreadyRegisteredException(e);
            }
            throw e;
        }

        entityManager.refresh(saved);

        return new UserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getCreatedAt()
        );
    }

    private static boolean isConstraintViolation(Throwable failure, String constraintName) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            if (t instanceof ConstraintViolationException cve
                    && constraintName.equalsIgnoreCase(cve.getConstraintName())) {
                return true;
            }
            String message = t.getMessage();
            if (message != null && message.contains(constraintName)) {
                return true;
            }
        }
        return false;
    }

    public static class UsernameAlreadyTakenException extends RuntimeException {
        public UsernameAlreadyTakenException() {
            super("An account with this username already exists");
        }

        public UsernameAlreadyTakenException(Throwable cause) {
            super("An account with this username already exists", cause);
        }
    }

    public static class EmailAlreadyRegisteredException extends RuntimeException {
        public EmailAlreadyRegisteredException() {
            super("An account with this email already exists");
        }

        public EmailAlreadyRegisteredException(Throwable cause) {
            super("An account with this email already exists", cause);
        }
    }
}
