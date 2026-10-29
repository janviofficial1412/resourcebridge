package com.resourcebridge.backend.db;

import com.resourcebridge.backend.institution.InstitutionService;
import com.resourcebridge.backend.institution.InstitutionSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InstitutionListingDatabaseTest {

    private static final String REQUIRED_DB = "resourcebridge_test";

    static {
        String url = System.getenv("TEST_DB_URL");
        String withoutParams = url == null ? "" : url.split("\\?")[0];
        if (!withoutParams.endsWith("/" + REQUIRED_DB)) {
            throw new IllegalStateException(
                    "Refusing to run: TEST_DB_URL must point to the '" + REQUIRED_DB + "' database.");
        }
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private InstitutionService institutionService;

    @Test
    void institutionListAndItsDashboardCountIncludeOnlyActiveMembershipInstitutions() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        String username = "member_" + suffix;
        UUID userId = jdbc.queryForObject(
                "INSERT INTO app_user (username, password_hash, full_name) " +
                        "VALUES (?, 'test-only-hash', 'Test Member') RETURNING id",
                UUID.class, username);

        UUID activeInstitutionId = insertInstitution("active-" + suffix);
        UUID secondActiveInstitutionId = insertInstitution("second-active-" + suffix);
        UUID pendingInstitutionId = insertInstitution("pending-" + suffix);
        UUID suspendedInstitutionId = insertInstitution("suspended-" + suffix);

        insertMembership(userId, activeInstitutionId, "ACTIVE");
        insertMembership(userId, secondActiveInstitutionId, "ACTIVE");
        insertMembership(userId, pendingInstitutionId, "PENDING");
        insertMembership(userId, suspendedInstitutionId, "SUSPENDED");

        List<InstitutionSummaryResponse> institutions = institutionService.listMyInstitutions(username);

        assertEquals(2, institutions.size());
        assertEquals(
                java.util.Set.of(activeInstitutionId, secondActiveInstitutionId),
                institutions.stream().map(InstitutionSummaryResponse::id).collect(java.util.stream.Collectors.toSet()));
        assertEquals(2, institutions.size(), "Dashboard count is the size of GET /api/institutions");

        List<String> statuses = jdbc.queryForList(
                "SELECT status FROM membership WHERE user_id = ? ORDER BY status",
                String.class, userId);
        assertEquals(List.of("ACTIVE", "ACTIVE", "PENDING", "SUSPENDED"), statuses);
    }

    private UUID insertInstitution(String slug) {
        return jdbc.queryForObject(
                "INSERT INTO institution (name, slug) VALUES (?, ?) RETURNING id",
                UUID.class, "Institution " + slug, slug);
    }

    private void insertMembership(UUID userId, UUID institutionId, String status) {
        jdbc.update(
                "INSERT INTO membership (user_id, institution_id, role, status, verified_at) " +
                        "VALUES (?, ?, 'MEMBER', ?, CASE WHEN ? = 'ACTIVE' THEN now() ELSE NULL END)",
                userId, institutionId, status, status);
    }
}
