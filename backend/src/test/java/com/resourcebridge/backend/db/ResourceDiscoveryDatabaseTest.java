package com.resourcebridge.backend.db;

import com.resourcebridge.backend.resource.ConditionRating;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceService;
import com.resourcebridge.backend.resource.ResourceType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ResourceDiscoveryDatabaseTest {

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
    private ResourceService resourceService;

    @Test
    void combinedFiltersUseAllActiveInstitutionsAndExcludeUnavailableOrInactiveTenants() {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        String username = "discover_" + suffix;
        UUID userId = jdbc.queryForObject(
                "INSERT INTO app_user (username, password_hash, full_name) " +
                        "VALUES (?, 'test-only-hash', 'Discovery User') RETURNING id",
                UUID.class, username);

        UUID alphaId = insertInstitution("alpha-" + suffix);
        UUID betaId = insertInstitution("beta-" + suffix);
        UUID inactiveInstitutionId = insertInstitution("inactive-" + suffix);
        UUID alphaMembershipId = insertMembership(userId, alphaId, "ACTIVE");
        UUID betaMembershipId = insertMembership(userId, betaId, "ACTIVE");
        insertMembership(userId, inactiveInstitutionId, "PENDING");

        UUID alphaCategoryId = insertCategory(alphaId, "Microscopy");
        UUID betaCategoryId = insertCategory(betaId, "Microscopy");

        UUID exactMatchId = insertResource(
                alphaId, alphaMembershipId, alphaCategoryId, "Cryo microscope",
                "EQUIPMENT", "NEW", "AVAILABLE");
        insertResource(alphaId, alphaMembershipId, alphaCategoryId, "Cryo lab room",
                "SPACE", "NEW", "AVAILABLE");
        insertResource(alphaId, alphaMembershipId, alphaCategoryId, "Cryo old microscope",
                "EQUIPMENT", "FAIR", "AVAILABLE");
        insertResource(alphaId, alphaMembershipId, alphaCategoryId, "Cryo draft microscope",
                "EQUIPMENT", "NEW", "DRAFT");
        insertResource(alphaId, alphaMembershipId, alphaCategoryId, "Cryo maintained microscope",
                "EQUIPMENT", "NEW", "MAINTENANCE");
        insertResource(alphaId, alphaMembershipId, alphaCategoryId, "Cryo retired microscope",
                "EQUIPMENT", "NEW", "RETIRED");
        insertResource(betaId, betaMembershipId, betaCategoryId,
                "Cryo beta microscope", "EQUIPMENT", "NEW", "AVAILABLE");
        UUID inactiveMembershipId = membershipId(userId, inactiveInstitutionId);
        UUID inactiveCategoryId = insertCategory(inactiveInstitutionId, "Microscopy");
        insertResource(inactiveInstitutionId, inactiveMembershipId, inactiveCategoryId,
                "Cryo inactive microscope", "EQUIPMENT", "NEW", "AVAILABLE");

        var combined = resourceService.discoverResources(
                null, " cryo ", alphaCategoryId, ResourceType.EQUIPMENT, ConditionRating.NEW, username);

        assertEquals(Set.of(exactMatchId), ids(combined));

        var allAvailable = resourceService.discoverResources(
                null, null, null, null, null, username);
        assertEquals(Set.of(
                exactMatchId,
                findResourceId(alphaId, alphaCategoryId, "Cryo lab room"),
                findResourceId(alphaId, alphaCategoryId, "Cryo old microscope"),
                findResourceId(betaId, betaCategoryId, "Cryo beta microscope")
        ), ids(allAvailable));

        var selectedInstitution = resourceService.discoverResources(
                alphaId, null, null, null, null, username);
        assertEquals(3, selectedInstitution.size());
    }

    private UUID insertInstitution(String slug) {
        return jdbc.queryForObject(
                "INSERT INTO institution (name, slug) VALUES (?, ?) RETURNING id",
                UUID.class, "Institution " + slug, slug);
    }

    private UUID insertMembership(UUID userId, UUID institutionId, String status) {
        return jdbc.queryForObject(
                "INSERT INTO membership (user_id, institution_id, role, status, verified_at) " +
                        "VALUES (?, ?, 'MEMBER', ?, CASE WHEN ? = 'ACTIVE' THEN now() ELSE NULL END) RETURNING id",
                UUID.class, userId, institutionId, status, status);
    }

    private UUID membershipId(UUID userId, UUID institutionId) {
        return jdbc.queryForObject(
                "SELECT id FROM membership WHERE user_id = ? AND institution_id = ?",
                UUID.class, userId, institutionId);
    }

    private UUID insertCategory(UUID institutionId, String name) {
        return jdbc.queryForObject(
                "INSERT INTO resource_category (institution_id, name) VALUES (?, ?) RETURNING id",
                UUID.class, institutionId, name);
    }

    private UUID insertResource(UUID institutionId,
                                UUID ownerMembershipId,
                                UUID categoryId,
                                String name,
                                String type,
                                String condition,
                                String status) {
        return jdbc.queryForObject(
                "INSERT INTO resource (institution_id, owner_membership_id, category_id, name, resource_type, " +
                        "condition_rating, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
                UUID.class, institutionId, ownerMembershipId, categoryId, name, type, condition, status);
    }

    private UUID findResourceId(UUID institutionId, UUID categoryId, String name) {
        return jdbc.queryForObject(
                "SELECT id FROM resource WHERE institution_id = ? AND category_id = ? AND name = ?",
                UUID.class, institutionId, categoryId, name);
    }

    private static Set<UUID> ids(java.util.List<Resource> resources) {
        return resources.stream().map(Resource::getId).collect(Collectors.toSet());
    }
}
