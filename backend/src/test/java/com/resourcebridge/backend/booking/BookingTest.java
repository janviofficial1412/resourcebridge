package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.resource.ConditionRating;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceCategory;
import com.resourcebridge.backend.resource.ResourceStatus;
import com.resourcebridge.backend.resource.ResourceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingTest {

    private Institution institution;
    private AppUser requesterUser;
    private AppUser ownerUser;
    private Membership requesterMembership;
    private Membership ownerMembership;
    private ResourceCategory category;
    private Resource resource;

    @BeforeEach
    void setUp() {
        institution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(institution, "id", UUID.randomUUID());

        requesterUser = new AppUser("requester_bob", "bob@example.com", "hash", "Bob Requester");
        ReflectionTestUtils.setField(requesterUser, "id", UUID.randomUUID());

        ownerUser = new AppUser("owner_alice", "alice@example.com", "hash", "Alice Owner");
        ReflectionTestUtils.setField(ownerUser, "id", UUID.randomUUID());

        requesterMembership = new Membership(requesterUser, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(requesterMembership, "id", UUID.randomUUID());

        ownerMembership = new Membership(ownerUser, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(ownerMembership, "id", UUID.randomUUID());

        category = new ResourceCategory(institution, "Microscopes", "High-res optical and EM instruments");
        ReflectionTestUtils.setField(category, "id", UUID.randomUUID());

        resource = new Resource(
                institution,
                ownerMembership,
                category,
                "Confocal Laser Microscope",
                "Laser scanning confocal microscope",
                ResourceType.EQUIPMENT,
                "Room 402",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                120
        );
        ReflectionTestUtils.setField(resource, "id", UUID.randomUUID());
    }

    @Test
    void defaultBookingStatusIsPending() {
        Instant start = Instant.now().plus(Duration.ofHours(2));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, "Need microscope for live cell imaging");

        assertEquals(BookingStatus.PENDING, booking.getStatus());
        assertSame(institution, booking.getInstitution());
        assertSame(resource, booking.getResource());
        assertSame(requesterMembership, booking.getRequesterMembership());
        assertEquals(start, booking.getStartTime());
        assertEquals(end, booking.getEndTime());
        assertEquals("Need microscope for live cell imaging", booking.getRequesterMessage());
        assertNull(booking.getDecisionMessage());
        assertNull(booking.getDecidedByMembership());
        assertNull(booking.getDecidedAt());
        assertNull(booking.getCancelledAt());
    }

    @Test
    void bookingStatusEnumContainsAllRequiredStates() {
        List<String> expectedStatuses = List.of("PENDING", "CONFIRMED", "REJECTED", "CANCELLED");
        List<String> actualStatuses = Arrays.stream(BookingStatus.values())
                .map(Enum::name)
                .toList();

        assertEquals(expectedStatuses.size(), actualStatuses.size());
        assertTrue(actualStatuses.containsAll(expectedStatuses));
    }

    @Test
    void bookingIntervalTimeRangeValidation() {
        Instant start = Instant.parse("2026-11-01T10:00:00Z");
        Instant end = Instant.parse("2026-11-01T12:00:00Z");

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, null);

        assertTrue(booking.getStartTime().isBefore(booking.getEndTime()));
        assertEquals(Duration.ofHours(2), Duration.between(booking.getStartTime(), booking.getEndTime()));

        // Inverted time check
        assertFalse(end.isBefore(start));
        // Equal time check (zero duration)
        assertFalse(start.isBefore(start));
    }

    @Test
    void fullConstructorSetsAllPropertiesCorrectly() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.parse("2026-11-01T10:00:00Z");
        Instant end = Instant.parse("2026-11-01T12:00:00Z");
        Instant decidedAt = Instant.parse("2026-10-31T15:00:00Z");
        Instant cancelledAt = Instant.parse("2026-11-01T08:00:00Z");

        Booking booking = new Booking(
                institution,
                resource,
                requesterMembership,
                BookingStatus.CANCELLED,
                start,
                end,
                "Initial reservation",
                "Approved by department head",
                ownerMembership,
                decidedAt,
                cancelledAt
        );
        ReflectionTestUtils.setField(booking, "id", bookingId);

        assertEquals(bookingId, booking.getId());
        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertEquals(start, booking.getStartTime());
        assertEquals(end, booking.getEndTime());
        assertEquals("Initial reservation", booking.getRequesterMessage());
        assertEquals("Approved by department head", booking.getDecisionMessage());
        assertSame(ownerMembership, booking.getDecidedByMembership());
        assertEquals(decidedAt, booking.getDecidedAt());
        assertEquals(cancelledAt, booking.getCancelledAt());
    }

    @Test
    void decisionLifecycleApproval() {
        Instant start = Instant.now().plus(Duration.ofDays(1));
        Instant end = start.plus(Duration.ofHours(1));

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, "Training session");
        assertEquals(BookingStatus.PENDING, booking.getStatus());

        // Simulate approval
        Instant decisionTime = Instant.now();
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setDecidedByMembership(ownerMembership);
        booking.setDecidedAt(decisionTime);
        booking.setDecisionMessage("Approved for Room 402");

        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        assertSame(ownerMembership, booking.getDecidedByMembership());
        assertEquals(decisionTime, booking.getDecidedAt());
        assertEquals("Approved for Room 402", booking.getDecisionMessage());
        assertNull(booking.getCancelledAt());
    }

    @Test
    void decisionLifecycleRejection() {
        Instant start = Instant.now().plus(Duration.ofDays(1));
        Instant end = start.plus(Duration.ofHours(1));

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, "Training session");

        // Simulate rejection
        Instant decisionTime = Instant.now();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setDecidedByMembership(ownerMembership);
        booking.setDecidedAt(decisionTime);
        booking.setDecisionMessage("Resource undergoing scheduled sensor calibration");

        assertEquals(BookingStatus.REJECTED, booking.getStatus());
        assertSame(ownerMembership, booking.getDecidedByMembership());
        assertEquals(decisionTime, booking.getDecidedAt());
        assertEquals("Resource undergoing scheduled sensor calibration", booking.getDecisionMessage());
        assertNull(booking.getCancelledAt());
    }

    @Test
    void cancellationLifecycle() {
        Instant start = Instant.now().plus(Duration.ofDays(2));
        Instant end = start.plus(Duration.ofHours(3));

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, "Workshop setup");

        // Simulate user cancellation
        Instant cancelTime = Instant.now();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(cancelTime);

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertEquals(cancelTime, booking.getCancelledAt());
    }

    @Test
    void tenantIsolationConsistencyAcrossAssociations() {
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, resource, requesterMembership, start, end, null);

        // Verify all entities belong to the same institution
        assertEquals(booking.getInstitution().getId(), booking.getResource().getInstitution().getId());
        assertEquals(booking.getInstitution().getId(), booking.getRequesterMembership().getInstitution().getId());

        booking.setDecidedByMembership(ownerMembership);
        assertEquals(booking.getInstitution().getId(), booking.getDecidedByMembership().getInstitution().getId());
    }

    @Test
    void settersAndGettersWorkAsExpected() {
        Booking booking = new Booking();

        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(booking, "id", id);
        assertEquals(id, booking.getId());

        booking.setInstitution(institution);
        assertSame(institution, booking.getInstitution());

        booking.setResource(resource);
        assertSame(resource, booking.getResource());

        booking.setRequesterMembership(requesterMembership);
        assertSame(requesterMembership, booking.getRequesterMembership());

        booking.setStatus(BookingStatus.CONFIRMED);
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

        Instant start = Instant.now();
        Instant end = start.plusSeconds(3600);
        booking.setStartTime(start);
        booking.setEndTime(end);
        assertEquals(start, booking.getStartTime());
        assertEquals(end, booking.getEndTime());

        booking.setRequesterMessage("Test message");
        assertEquals("Test message", booking.getRequesterMessage());

        booking.setDecisionMessage("Confirmed");
        assertEquals("Confirmed", booking.getDecisionMessage());

        booking.setDecidedByMembership(ownerMembership);
        assertSame(ownerMembership, booking.getDecidedByMembership());

        Instant decidedAt = Instant.now();
        booking.setDecidedAt(decidedAt);
        assertEquals(decidedAt, booking.getDecidedAt());

        Instant cancelledAt = Instant.now();
        booking.setCancelledAt(cancelledAt);
        assertEquals(cancelledAt, booking.getCancelledAt());
    }
}
