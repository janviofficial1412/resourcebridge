package com.resourcebridge.backend.db;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Base class for tests that talk to the real PostgreSQL schema created by Flyway.
 * Every test runs in a transaction that is ALWAYS rolled back, so no data survives.
 */
@SpringBootTest
@ActiveProfiles("test")
abstract class AbstractDatabaseTest {

    static final String REQUIRED_DB = "resourcebridge_test";

    static final String UNIQUE_VIOLATION = "23505";
    static final String FOREIGN_KEY_VIOLATION = "23503";
    static final String CHECK_VIOLATION = "23514";
    static final String RAISE_EXCEPTION = "P0001";

    // Runs before Spring creates the context, so Flyway can never touch another database.
    static {
        String url = System.getenv("TEST_DB_URL");
        String withoutParams = url == null ? "" : url.split("\\?")[0];
        if (!withoutParams.endsWith("/" + REQUIRED_DB)) {
            throw new IllegalStateException(
                    "Refusing to run: TEST_DB_URL must be set and point to the '" + REQUIRED_DB + "' database.");
        }
    }

    @Autowired
    private DataSource dataSource;

    Connection conn;
    JdbcTemplate jdbc;

    record Tenant(UUID institutionId, UUID ownerMembershipId, UUID categoryId) {
    }

    @BeforeEach
    void openTransaction() throws SQLException {
        conn = dataSource.getConnection();
        assertEquals(REQUIRED_DB, conn.getCatalog(), "Connected to the wrong database");
        conn.setAutoCommit(false);
        jdbc = new JdbcTemplate(new SingleConnectionDataSource(conn, true));
    }

    @AfterEach
    void rollbackAndClose() throws SQLException {
        try {
            conn.rollback();
        } finally {
            conn.close();
        }
    }

    /**
     * Runs the action, which MUST fail with the given SQLSTATE and mention the given text
     * (normally a constraint name). Rolls back to a savepoint so the test can continue.
     */
    void assertViolation(String expectedSqlState, String expectedText, Runnable action) throws SQLException {
        Savepoint savepoint = conn.setSavepoint();
        try {
            action.run();
        } catch (RuntimeException e) {
            conn.rollback(savepoint);
            SQLException sql = findSqlException(e);
            assertNotNull(sql, "Expected a database error but got: " + e);
            assertEquals(expectedSqlState, sql.getSQLState(), "Unexpected SQLSTATE: " + sql.getMessage());
            assertTrue(sql.getMessage().contains(expectedText),
                    "Expected message to mention '" + expectedText + "' but was: " + sql.getMessage());
            return;
        }
        conn.rollback(savepoint);
        fail("Expected the database to reject this statement, but it was accepted");
    }

    private static SQLException findSqlException(Throwable t) {
        while (t != null) {
            if (t instanceof SQLException s) {
                return s;
            }
            t = t.getCause();
        }
        return null;
    }

    // ---- helpers that insert VALID rows ----

    UUID insertInstitution(String slug) {
        return jdbc.queryForObject(
                "INSERT INTO institution (name, slug) VALUES (?, ?) RETURNING id",
                UUID.class, "Institution " + slug, slug);
    }

    UUID insertUser(String email) {
        return jdbc.queryForObject(
                "INSERT INTO app_user (email, password_hash, full_name) VALUES (?, 'test-only-hash', 'Test User') RETURNING id",
                UUID.class, email);
    }

    UUID insertMembership(UUID userId, UUID institutionId, String role) {
        return jdbc.queryForObject(
                "INSERT INTO membership (user_id, institution_id, role) VALUES (?, ?, ?) RETURNING id",
                UUID.class, userId, institutionId, role);
    }

    UUID insertActiveMembership(UUID userId, UUID institutionId, String role) {
        return jdbc.queryForObject(
                "INSERT INTO membership (user_id, institution_id, role, status, verified_at) "
                        + "VALUES (?, ?, ?, 'ACTIVE', now()) RETURNING id",
                UUID.class, userId, institutionId, role);
    }

    UUID insertCategory(UUID institutionId, String name) {
        return jdbc.queryForObject(
                "INSERT INTO resource_category (institution_id, name) VALUES (?, ?) RETURNING id",
                UUID.class, institutionId, name);
    }

    UUID insertResource(UUID institutionId, UUID ownerMembershipId, UUID categoryId, String name) {
        return jdbc.queryForObject(
                "INSERT INTO resource (institution_id, owner_membership_id, category_id, name, resource_type) "
                        + "VALUES (?, ?, ?, ?, 'EQUIPMENT') RETURNING id",
                UUID.class, institutionId, ownerMembershipId, categoryId, name);
    }

    /** An institution with one verified owner and one category. */
    Tenant createTenant(String slug) {
        UUID institution = insertInstitution(slug);
        UUID user = insertUser(slug + "-owner@example.com");
        UUID owner = insertActiveMembership(user, institution, "RESOURCE_OWNER");
        UUID category = insertCategory(institution, "General");
        return new Tenant(institution, owner, category);
    }
}