package com.resourcebridge.backend.identity;

import com.resourcebridge.backend.institution.CreateInstitutionRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validRegistrationRequestPasses() {
        RegistrationRequest req = new RegistrationRequest(
                "scholar_jane",
                "jane@example.com",
                "ValidPassword123",
                "Jane Doe"
        );
        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(req);
        assertTrue(violations.isEmpty());
    }

    @Test
    void registrationRejectsShortUsername() {
        RegistrationRequest req = new RegistrationRequest(
                "ab",
                "jane@example.com",
                "ValidPassword123",
                "Jane Doe"
        );
        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty());
    }

    @Test
    void registrationRejectsInvalidUsernameCharacters() {
        RegistrationRequest req = new RegistrationRequest(
                "jane doe!",
                "jane@example.com",
                "ValidPassword123",
                "Jane Doe"
        );
        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty());
    }

    @Test
    void registrationRejectsShortPassword() {
        RegistrationRequest req = new RegistrationRequest(
                "scholar_jane",
                "jane@example.com",
                "short",
                "Jane Doe"
        );
        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty());
    }

    @Test
    void validInstitutionRequestPasses() {
        CreateInstitutionRequest req = new CreateInstitutionRequest(
                "Oakridge University",
                "oakridge-univ",
                "UTC"
        );
        Set<ConstraintViolation<CreateInstitutionRequest>> violations = validator.validate(req);
        assertTrue(violations.isEmpty());
    }

    @Test
    void institutionRejectsInvalidSlug() {
        CreateInstitutionRequest req = new CreateInstitutionRequest(
                "Oakridge University",
                "-invalid-slug-",
                "UTC"
        );
        Set<ConstraintViolation<CreateInstitutionRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty());
    }
}
