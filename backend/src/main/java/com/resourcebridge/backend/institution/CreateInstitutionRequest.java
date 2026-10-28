package com.resourcebridge.backend.institution;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateInstitutionRequest(

        @NotBlank(message = "Institution name is required")
        @Size(max = 200, message = "Name must be at most 200 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 64, message = "Slug must be at most 64 characters")
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug must consist of lowercase letters, numbers, and hyphens (cannot start or end with a hyphen)")
        String slug,

        @Size(max = 64, message = "Timezone must be at most 64 characters")
        String timezone
) {
}
