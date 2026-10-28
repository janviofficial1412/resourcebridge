package com.resourcebridge.backend.identity;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

public record RegistrationRequest(

        @NotBlank
        @Email
        @Size(max = 254, message = "must be at most 254 characters")
        String email,

        @NotBlank
        @Size(min = 8, message = "must be at least 8 characters")
        @RegistrationRequest.MaxUtf8Bytes(72)
        String password,

        @NotBlank
        @Size(max = 200, message = "must be at most 200 characters")
        String fullName
) {

    /** Keeps the password out of logs: the auto-generated record toString() would print it. */
    @Override
    public String toString() {
        return "RegistrationRequest[email=" + email + ", password=<redacted>, fullName=" + fullName + "]";
    }

    /** Custom constraint: the value, encoded as UTF-8, must be at most {@code value()} bytes. */
    @Documented
    @Constraint(validatedBy = MaxUtf8BytesValidator.class)
    @Target(ElementType.FIELD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface MaxUtf8Bytes {

        int value();

        String message() default "must be at most {value} bytes when encoded as UTF-8";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    public static class MaxUtf8BytesValidator implements ConstraintValidator<MaxUtf8Bytes, String> {

        private int maxBytes;

        @Override
        public void initialize(MaxUtf8Bytes constraint) {
            this.maxBytes = constraint.value();
        }

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null) {
                return true; // "missing" is @NotBlank's job, not this rule's
            }
            return value.getBytes(StandardCharsets.UTF_8).length <= maxBytes;
        }
    }
}