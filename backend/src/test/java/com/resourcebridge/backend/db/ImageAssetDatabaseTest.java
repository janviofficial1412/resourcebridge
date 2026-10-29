package com.resourcebridge.backend.db;

import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ImageAssetDatabaseTest extends AbstractDatabaseTest {

    @Test
    void imageMetadataIsPersistedWithoutImageBytes() {
        Tenant tenant = createTenant("images");
        UUID user = insertUser("image-owner@example.com");
        UUID member = insertActiveMembership(user, tenant.institutionId(), "MEMBER");
        UUID resource = insertResource(
                tenant.institutionId(), member, tenant.categoryId(), "Image test resource");
        String storageKey = "a".repeat(64) + ".png";

        jdbc.update("INSERT INTO image_asset "
                        + "(storage_key, content_type, size_bytes, width, height, resource_id, uploaded_by_user_id) "
                        + "VALUES (?, 'image/png', 16, 2, 2, ?, ?)",
                storageKey, resource, user);

        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM image_asset WHERE resource_id = ? AND storage_key = ?",
                Integer.class, resource, storageKey));
        assertEquals(0, jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.columns "
                        + "WHERE table_schema = 'public' AND table_name = 'image_asset' "
                        + "AND data_type IN ('bytea', 'oid')",
                Integer.class));
    }

    @Test
    void imageTargetMustBeExactlyOneOfResourceOrInstitution() throws SQLException {
        Tenant tenant = createTenant("image-target");
        UUID user = insertUser("image-target-owner@example.com");
        assertViolation(CHECK_VIOLATION, "ck_image_asset_target", () -> jdbc.update(
                "INSERT INTO image_asset (storage_key, content_type, size_bytes, width, height, uploaded_by_user_id) "
                        + "VALUES (?, 'image/png', 1, 1, 1, ?)",
                "b".repeat(64) + ".png", user));
    }
}
