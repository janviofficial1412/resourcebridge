package com.resourcebridge.backend.identity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank
        @Size(max = 254, message = "must be at most 254 characters")
        String email,

        @NotBlank
        String password
) {

    /** Keeps the password out of logs: the auto-generated record toString() would print it. */
    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", password=<redacted>]";
    }
}