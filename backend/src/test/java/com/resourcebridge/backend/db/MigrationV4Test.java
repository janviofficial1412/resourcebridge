package com.resourcebridge.backend.db;

import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MigrationV4Test extends AbstractDatabaseTest {

    @Test
    void roleNormalizationMigrationIsApplied() {
        Integer applied = jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history "
                        + "WHERE version = '4' AND success = true AND description = 'normalize membership roles'",
                Integer.class);
        assertEquals(1, applied);
    }

    @Test
    void normalizedRolesAreAcceptedAndLegacyRolesAreRejected() throws SQLException {
        UUID institution = insertInstitution("role-migration");
        UUID admin = insertUser("admin-role@example.com");
        UUID member = insertUser("member-role@example.com");
        UUID borrower = insertUser("borrower-role@example.com");

        insertActiveMembership(admin, institution, "ADMIN");
        insertActiveMembership(member, institution, "MEMBER");
        insertActiveMembership(borrower, institution, "BORROWER");

        UUID legacyUser = insertUser("legacy-role@example.com");
        assertViolation(CHECK_VIOLATION, "ck_membership_role",
                () -> insertActiveMembership(legacyUser, institution, "INSTITUTION_ADMIN"));
    }
}
