package com.resourcebridge.backend.db;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import java.sql.SQLException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MigrationV1Test extends AbstractDatabaseTest {

    @Autowired
    private Environment environment;

    // ------------------------------------------------------------- migration itself

    @Test
    void flywayAppliedVersion1Successfully() {
        Integer applied = jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history "
                        + "WHERE version = '1' AND success = true AND description = 'initial schema'",
                Integer.class);
        Integer failed = jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success = false", Integer.class);
        assertEquals(1, applied);
        assertEquals(0, failed);
    }

    @Test
    void allExpectedTablesExist() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", String.class);
        Set<String> expected = Set.of("institution", "app_user", "membership",
                "resource_category", "resource", "audit_log", "flyway_schema_history");
        assertTrue(tables.containsAll(expected), "Missing tables. Found: " + tables);
    }

    @Test
    void hibernateIsNotAllowedToChangeTheSchema() {
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
    }

    // ------------------------------------------------------------------ institution

    @Test
    void institutionRejectsDuplicateSlug() throws SQLException {
        insertInstitution("alpha");
        assertViolation(UNIQUE_VIOLATION, "uq_institution_slug", () -> insertInstitution("alpha"));
    }

    @Test
    void institutionRejectsMalformedSlug() throws SQLException {
        assertViolation(CHECK_VIOLATION, "ck_institution_slug", () -> insertInstitution("Bad Slug!"));
    }

    @Test
    void institutionRejectsUnknownStatus() throws SQLException {
        assertViolation(CHECK_VIOLATION, "ck_institution_status", () -> jdbc.update(
                "INSERT INTO institution (name, slug, status) VALUES ('X', 'status-test', 'DELETED')"));
    }

    @Test
    void institutionWithMembersCannotBeDeleted() throws SQLException {
        UUID institution = insertInstitution("alpha");
        UUID user = insertUser("member@example.com");

        insertMembership(user, institution, "MEMBER");

        assertViolation(
                FOREIGN_KEY_VIOLATION,
                "membership_institution_id_fkey",
                () -> jdbc.update(
                        "DELETE FROM institution WHERE id = ?",
                        institution
                )
        );
    }

    // ---------------------------------------------------------------------- app_user

    @Test
    void userRejectsDuplicateEmail() throws SQLException {
        insertUser("a@example.com");
        assertViolation(UNIQUE_VIOLATION, "uq_app_user_email", () -> insertUser("a@example.com"));
    }

    @Test
    void userRejectsUppercaseEmail() throws SQLException {
        assertViolation(CHECK_VIOLATION, "ck_app_user_email_lower", () -> insertUser("A@Example.com"));
    }

    // -------------------------------------------------------------------- membership

    @Test
    void membershipRejectsSecondMembershipForSameUserAndInstitution() throws SQLException {
        UUID institution = insertInstitution("alpha");
        UUID user = insertUser("a@example.com");
        insertMembership(user, institution, "MEMBER");
        assertViolation(UNIQUE_VIOLATION, "uq_membership_user_institution",
                () -> insertMembership(user, institution, "BORROWER"));
    }

    @Test
    void membershipRejectsUnknownRole() throws SQLException {
        UUID institution = insertInstitution("alpha");
        UUID user = insertUser("a@example.com");
        assertViolation(CHECK_VIOLATION, "ck_membership_role",
                () -> insertMembership(user, institution, "SUPERUSER"));
    }

    @Test
    void activeMembershipRequiresVerificationTimestamp() throws SQLException {
        UUID institution = insertInstitution("alpha");
        UUID user = insertUser("a@example.com");
        assertViolation(CHECK_VIOLATION, "ck_membership_active_verified", () -> jdbc.update(
                "INSERT INTO membership (user_id, institution_id, role, status) VALUES (?, ?, 'MEMBER', 'ACTIVE')",
                user, institution));
    }

    @Test
    void membershipVerifierMustBelongToSameInstitution() throws SQLException {
        Tenant alpha = createTenant("alpha");
        Tenant beta = createTenant("beta");
        UUID newUser = insertUser("new@example.com");

        // Verifier from ANOTHER institution is rejected.
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_membership_verifier", () -> jdbc.update(
                "INSERT INTO membership (user_id, institution_id, role, status, verified_by_membership_id, verified_at) "
                        + "VALUES (?, ?, 'MEMBER', 'ACTIVE', ?, now())",
                newUser, alpha.institutionId(), beta.ownerMembershipId()));

        // Verifier from the SAME institution is accepted.
        assertDoesNotThrow(() -> jdbc.update(
                "INSERT INTO membership (user_id, institution_id, role, status, verified_by_membership_id, verified_at) "
                        + "VALUES (?, ?, 'MEMBER', 'ACTIVE', ?, now())",
                newUser, alpha.institutionId(), alpha.ownerMembershipId()));
    }

    // ------------------------------------------------------------- resource_category

    @Test
    void categoryNamesAreUniquePerInstitutionIgnoringCase() throws SQLException {
        UUID alpha = insertInstitution("alpha");
        UUID beta = insertInstitution("beta");
        insertCategory(alpha, "Printers");

        assertViolation(UNIQUE_VIOLATION, "uq_resource_category_name", () -> insertCategory(alpha, "printers"));
        // The same name in a different institution is fine.
        assertDoesNotThrow(() -> insertCategory(beta, "Printers"));
    }

    // ---------------------------------------------------------------------- resource

    @Test
    void resourceCanBeCreatedWithinOneInstitution() {
        Tenant alpha = createTenant("alpha");
        UUID id = insertResource(alpha.institutionId(), alpha.ownerMembershipId(), alpha.categoryId(), "3D Printer");
        assertNotNull(id);
    }

    @Test
    void resourceRejectsOwnerFromAnotherInstitution() throws SQLException {
        Tenant alpha = createTenant("alpha");
        Tenant beta = createTenant("beta");
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_resource_owner",
                () -> insertResource(alpha.institutionId(), beta.ownerMembershipId(), alpha.categoryId(), "Leaky"));
    }

    @Test
    void resourceRejectsCategoryFromAnotherInstitution() throws SQLException {
        Tenant alpha = createTenant("alpha");
        Tenant beta = createTenant("beta");
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_resource_category",
                () -> insertResource(alpha.institutionId(), alpha.ownerMembershipId(), beta.categoryId(), "Leaky"));
    }

    @Test
    void resourceRejectsInvalidConditionAndBookingLimit() throws SQLException {
        Tenant alpha = createTenant("alpha");
        assertViolation(CHECK_VIOLATION, "ck_resource_condition", () -> jdbc.update(
                "INSERT INTO resource (institution_id, owner_membership_id, category_id, name, resource_type, condition_rating) "
                        + "VALUES (?, ?, ?, 'X', 'SPACE', 'BROKEN')",
                alpha.institutionId(), alpha.ownerMembershipId(), alpha.categoryId()));
        assertViolation(CHECK_VIOLATION, "ck_resource_max_minutes", () -> jdbc.update(
                "INSERT INTO resource (institution_id, owner_membership_id, category_id, name, resource_type, max_booking_minutes) "
                        + "VALUES (?, ?, ?, 'X', 'SPACE', 0)",
                alpha.institutionId(), alpha.ownerMembershipId(), alpha.categoryId()));
    }

    // --------------------------------------------------------------------- audit_log

    @Test
    void auditLogAcceptsInserts() {
        UUID institution = insertInstitution("alpha");
        assertDoesNotThrow(() -> jdbc.update(
                "INSERT INTO audit_log (institution_id, action) VALUES (?, 'TEST_EVENT')", institution));
    }

    @Test
    void auditLogIsAppendOnly() throws SQLException {
        UUID institution = insertInstitution("alpha");
        UUID auditId = jdbc.queryForObject(
                "INSERT INTO audit_log (institution_id, action) VALUES (?, 'TEST_EVENT') RETURNING id",
                UUID.class, institution);

        assertViolation(RAISE_EXCEPTION, "append-only",
                () -> jdbc.update("UPDATE audit_log SET action = 'TAMPERED' WHERE id = ?", auditId));
        assertViolation(RAISE_EXCEPTION, "append-only",
                () -> jdbc.update("DELETE FROM audit_log WHERE id = ?", auditId));
        assertViolation(RAISE_EXCEPTION, "append-only",
                () -> jdbc.execute("TRUNCATE TABLE audit_log"));
    }

    // ------------------------------------------------------------------- updated_at

    @Test
    void updatedAtIsMaintainedByTheDatabase() {
        UUID institution = insertInstitution("alpha");
        // Even if the application tries to set an old value, the trigger overwrites it.
        jdbc.update("UPDATE institution SET name = 'Renamed', updated_at = TIMESTAMPTZ '2000-01-01 00:00:00+00' WHERE id = ?",
                institution);
        Boolean refreshed = jdbc.queryForObject(
                "SELECT updated_at > TIMESTAMPTZ '2020-01-01 00:00:00+00' FROM institution WHERE id = ?",
                Boolean.class, institution);
        assertEquals(Boolean.TRUE, refreshed);
    }
}