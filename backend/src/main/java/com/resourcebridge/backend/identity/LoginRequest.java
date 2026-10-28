package com.resourcebridge.backend.identity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank
        @Size(min = 3, max = 50, message = "must be between 3 and 50 characters")
        String username,

        @NotBlank
        String password
) {

    /** Keeps the password out of logs: the auto-generated record toString() would print it. */
    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=<redacted>]";
    }
}
