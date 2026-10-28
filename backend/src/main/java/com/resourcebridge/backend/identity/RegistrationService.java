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

    /** Name of the unique constraint on app_user.email, exactly as defined in V1__initial_schema.sql. */
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
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // Friendly early answer. Not a guarantee: two simultaneous requests can both pass this check.
        if (appUserRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        String passwordHash = passwordEncoder.encode(request.password());
        AppUser user = new AppUser(email, passwordHash, request.fullName());

        AppUser saved;
        try {
            // Flush now so the INSERT (and any constraint violation) happens inside this try block.
            saved = appUserRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            if (isEmailUniqueViolation(e)) {
                throw new EmailAlreadyRegisteredException(e);
            }
            throw e; // some other integrity problem: do not mislabel it as a duplicate email
        }

        // Re-read the row so created_at holds the value the database actually generated.
        entityManager.refresh(saved);

        return new UserResponse(saved.getId(), saved.getEmail(), saved.getFullName(), saved.getCreatedAt());
    }

    /** True only if this failure was caused by the unique constraint on app_user.email. */
    private static boolean isEmailUniqueViolation(Throwable failure) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            if (t instanceof ConstraintViolationException cve
                    && EMAIL_UNIQUE_CONSTRAINT.equalsIgnoreCase(cve.getConstraintName())) {
                return true;
            }
            String message = t.getMessage();
            if (message != null && message.contains(EMAIL_UNIQUE_CONSTRAINT)) {
                return true;
            }
        }
        return false;
    }

    /** Thrown when the email is already registered. Carries no email address, to keep personal data out of logs. */
    public static class EmailAlreadyRegisteredException extends RuntimeException {

        public EmailAlreadyRegisteredException() {
            super("An account with this email already exists");
        }

        public EmailAlreadyRegisteredException(Throwable cause) {
            super("An account with this email already exists", cause);
        }
    }
}