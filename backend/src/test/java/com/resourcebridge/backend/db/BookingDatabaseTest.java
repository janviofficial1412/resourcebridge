package com.resourcebridge.backend.db;

import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies database-level constraints and institution isolation for the booking table.
 * Runs against real PostgreSQL when TEST_DB_URL is set.
 */
class BookingDatabaseTest extends AbstractDatabaseTest {

    // Helper to insert user with username required since V2
    private UUID insertUserWithUsername(String username, String email) {
        return jdbc.queryForObject(
                "INSERT INTO app_user (username, email, password_hash, full_name) VALUES (?, ?, 'test-only-hash', 'Test User') RETURNING id",
                UUID.class, username, email);
    }

    private record BookingFixture(
            UUID institutionId,
            UUID resourceId,
            UUID requesterMembershipId,
            UUID ownerMembershipId
    ) {}

    private BookingFixture createBookingFixture(String suffix) {
        UUID institution = insertInstitution("inst-" + suffix);
        UUID ownerUser = insertUserWithUsername("owner_" + suffix, "owner_" + suffix + "@example.com");
        UUID requesterUser = insertUserWithUsername("req_" + suffix, "req_" + suffix + "@example.com");

        UUID ownerMembership = insertActiveMembership(ownerUser, institution, "MEMBER");
        UUID requesterMembership = insertActiveMembership(requesterUser, institution, "MEMBER");

        UUID category = insertCategory(institution, "Cat " + suffix);
        UUID resource = insertResource(institution, ownerMembership, category, "Resource " + suffix);

        return new BookingFixture(institution, resource, requesterMembership, ownerMembership);
    }

    private UUID insertBooking(UUID institutionId, UUID resourceId, UUID requesterMembershipId, String start, String end) {
        return jdbc.queryForObject(
                "INSERT INTO booking (institution_id, resource_id, requester_membership_id, start_time, end_time, status) " +
                        "VALUES (?, ?, ?, CAST(? AS timestamptz), CAST(? AS timestamptz), 'PENDING') RETURNING id",
                UUID.class, institutionId, resourceId, requesterMembershipId, start, end);
    }

    @Test
    void bookingTableExistsAndFlywayV3Applied() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", String.class);
        assertTrue(tables.contains("booking"), "Expected booking table in schema. Found: " + tables);

        Integer v3Count = jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE version = '3' AND success = true",
                Integer.class);
        assertEquals(1, v3Count, "Expected Flyway V3 migration to be recorded as success");
    }

    @Test
    void validBookingCanBeCreatedWithinOneInstitution() {
        BookingFixture fix = createBookingFixture("valid");
        UUID bookingId = insertBooking(
                fix.institutionId(), fix.resourceId(), fix.requesterMembershipId(),
                "2026-11-01 10:00:00+00", "2026-11-01 12:00:00+00");
        assertNotNull(bookingId);
    }

    @Test
    void bookingRejectsStartTimeAfterOrEqualEndTime() throws SQLException {
        BookingFixture fix = createBookingFixture("timerange");

        // start == end
        assertViolation(CHECK_VIOLATION, "ck_booking_time_range", () ->
                insertBooking(fix.institutionId(), fix.resourceId(), fix.requesterMembershipId(),
                        "2026-11-01 10:00:00+00", "2026-11-01 10:00:00+00"));

        // start > end
        assertViolation(CHECK_VIOLATION, "ck_booking_time_range", () ->
                insertBooking(fix.institutionId(), fix.resourceId(), fix.requesterMembershipId(),
                        "2026-11-01 12:00:00+00", "2026-11-01 10:00:00+00"));
    }

    @Test
    void bookingRejectsInvalidStatus() throws SQLException {
        BookingFixture fix = createBookingFixture("status");

        assertViolation(CHECK_VIOLATION, "ck_booking_status", () -> jdbc.update(
                "INSERT INTO booking (institution_id, resource_id, requester_membership_id, start_time, end_time, status) " +
                        "VALUES (?, ?, ?, TIMESTAMPTZ '2026-11-01 10:00:00+00', TIMESTAMPTZ '2026-11-01 12:00:00+00', 'UNKNOWN_STATUS')",
                fix.institutionId(), fix.resourceId(), fix.requesterMembershipId()));
    }

    @Test
    void bookingRejectsResourceFromDifferentInstitution() throws SQLException {
        BookingFixture alpha = createBookingFixture("alpha-res");
        BookingFixture beta = createBookingFixture("beta-res");

        // Attempt to book Beta's resource under Alpha's institution
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_booking_resource", () ->
                insertBooking(alpha.institutionId(), beta.resourceId(), alpha.requesterMembershipId(),
                        "2026-11-01 10:00:00+00", "2026-11-01 12:00:00+00"));
    }

    @Test
    void bookingRejectsRequesterFromDifferentInstitution() throws SQLException {
        BookingFixture alpha = createBookingFixture("alpha-req");
        BookingFixture beta = createBookingFixture("beta-req");

        // Attempt to have Beta's member request Alpha's resource
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_booking_requester", () ->
                insertBooking(alpha.institutionId(), alpha.resourceId(), beta.requesterMembershipId(),
                        "2026-11-01 10:00:00+00", "2026-11-01 12:00:00+00"));
    }

    @Test
    void bookingRejectsDecisionMakerFromDifferentInstitution() throws SQLException {
        BookingFixture alpha = createBookingFixture("alpha-dec");
        BookingFixture beta = createBookingFixture("beta-dec");

        UUID bookingId = insertBooking(alpha.institutionId(), alpha.resourceId(), alpha.requesterMembershipId(),
                "2026-11-01 10:00:00+00", "2026-11-01 12:00:00+00");

        // Decision maker from Beta cannot decide booking for Alpha
        assertViolation(FOREIGN_KEY_VIOLATION, "fk_booking_decision_maker", () -> jdbc.update(
                "UPDATE booking SET status = 'CONFIRMED', decided_by_membership_id = ?, decided_at = now() WHERE id = ?",
                beta.ownerMembershipId(), bookingId));

        // Decision maker from Alpha is accepted
        assertDoesNotThrow(() -> jdbc.update(
                "UPDATE booking SET status = 'CONFIRMED', decided_by_membership_id = ?, decided_at = now() WHERE id = ?",
                alpha.ownerMembershipId(), bookingId));
    }

    @Test
    void bookingUpdatedAtIsMaintainedByTrigger() {
        BookingFixture fix = createBookingFixture("trg");
        UUID bookingId = insertBooking(fix.institutionId(), fix.resourceId(), fix.requesterMembershipId(),
                "2026-11-01 10:00:00+00", "2026-11-01 12:00:00+00");

        // Explicitly update with an old timestamp - trigger will overwrite with now()
        jdbc.update("UPDATE booking SET requester_message = 'Updated note', updated_at = TIMESTAMPTZ '2000-01-01 00:00:00+00' WHERE id = ?",
                bookingId);

        Boolean refreshed = jdbc.queryForObject(
                "SELECT updated_at > TIMESTAMPTZ '2020-01-01 00:00:00+00' FROM booking WHERE id = ?",
                Boolean.class, bookingId);
        assertEquals(Boolean.TRUE, refreshed);
    }
}
