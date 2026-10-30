package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.resource.ConditionRating;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceCategory;
import com.resourcebridge.backend.resource.ResourceRepository;
import com.resourcebridge.backend.resource.ResourceService;
import com.resourcebridge.backend.resource.ResourceStatus;
import com.resourcebridge.backend.resource.ResourceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private AppUserRepository appUserRepository;

    private BookingService bookingService;

    private AppUser requesterUser;
    private AppUser ownerUser;
    private AppUser adminUser;
    private AppUser strangerUser;

    private Institution institution;
    private Institution otherInstitution;

    private Membership requesterMembership;
    private Membership ownerMembership;
    private Membership adminMembership;

    private ResourceCategory category;
    private Resource approvalRequiredResource;
    private Resource instantBookResource;

    private UUID resourceId;
    private UUID instantResourceId;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepository,
                resourceRepository,
                membershipRepository,
                appUserRepository
        );

        institution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(institution, "id", UUID.randomUUID());

        otherInstitution = new Institution("BioCore", "biocore", "UTC");
        ReflectionTestUtils.setField(otherInstitution, "id", UUID.randomUUID());

        requesterUser = new AppUser("bob_requester", "bob@example.com", "hash", "Bob Requester");
        ReflectionTestUtils.setField(requesterUser, "id", UUID.randomUUID());

        ownerUser = new AppUser("alice_owner", "alice@example.com", "hash", "Alice Owner");
        ReflectionTestUtils.setField(ownerUser, "id", UUID.randomUUID());

        adminUser = new AppUser("charlie_admin", "charlie@example.com", "hash", "Charlie Admin");
        ReflectionTestUtils.setField(adminUser, "id", UUID.randomUUID());

        strangerUser = new AppUser("stranger", "stranger@example.com", "hash", "Stranger");
        ReflectionTestUtils.setField(strangerUser, "id", UUID.randomUUID());

        requesterMembership = new Membership(requesterUser, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(requesterMembership, "id", UUID.randomUUID());

        ownerMembership = new Membership(ownerUser, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(ownerMembership, "id", UUID.randomUUID());

        adminMembership = new Membership(adminUser, institution, "ADMIN", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(adminMembership, "id", UUID.randomUUID());

        category = new ResourceCategory(institution, "Microscopy", "EM scopes");
        ReflectionTestUtils.setField(category, "id", UUID.randomUUID());

        resourceId = UUID.randomUUID();
        approvalRequiredResource = new Resource(
                institution,
                ownerMembership,
                category,
                "Cryo-EM Station",
                "Advanced Cryo-EM",
                ResourceType.EQUIPMENT,
                "Room 101",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240 // 4 hours max
        );
        ReflectionTestUtils.setField(approvalRequiredResource, "id", resourceId);

        instantResourceId = UUID.randomUUID();
        instantBookResource = new Resource(
                institution,
                ownerMembership,
                category,
                "Stereomicroscope",
                "Basic bench stereomicroscope",
                ResourceType.EQUIPMENT,
                "Bench 4",
                ConditionRating.GOOD,
                ResourceStatus.AVAILABLE,
                false, // no approval required
                120
        );
        ReflectionTestUtils.setField(instantBookResource, "id", instantResourceId);
    }

    // -------------------------------------------------------------------------
    // 1. Create booking tests
    // -------------------------------------------------------------------------

    @Test
    void createBookingRequiresApprovalProducesPendingBooking() {
        Instant start = Instant.now().plus(Duration.ofHours(2));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, "Live cell imaging");

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership));
        when(bookingRepository.countOverlappingActiveBookings(resourceId, start, end, null)).thenReturn(0L);

        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            ReflectionTestUtils.setField(b, "id", UUID.randomUUID());
            return b;
        });

        Booking result = bookingService.createBooking(command, "bob_requester");

        assertNotNull(result);
        assertEquals(BookingStatus.PENDING, result.getStatus());
        assertEquals("Live cell imaging", result.getRequesterMessage());
        assertEquals(start, result.getStartTime());
        assertEquals(end, result.getEndTime());
        assertEquals(requesterMembership, result.getRequesterMembership());
        assertEquals(approvalRequiredResource, result.getResource());
    }

    @Test
    void createBookingNoApprovalProducesConfirmedBooking() {
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(1));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                instantResourceId, start, end, "Quick check");

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(instantResourceId)).thenReturn(Optional.of(instantBookResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership));
        when(bookingRepository.countOverlappingActiveBookings(instantResourceId, start, end, null)).thenReturn(0L);

        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            ReflectionTestUtils.setField(b, "id", UUID.randomUUID());
            return b;
        });

        Booking result = bookingService.createBooking(command, "bob_requester");

        assertNotNull(result);
        assertEquals(BookingStatus.CONFIRMED, result.getStatus());
    }

    @Test
    void createBookingRejectsPastStartTime() {
        Instant start = Instant.now().minus(Duration.ofMinutes(10));
        Instant end = Instant.now().plus(Duration.ofHours(1));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("Booking start time cannot be in the past", ex.getMessage());
    }

    @Test
    void createBookingRejectsInvalidInterval() {
        Instant start = Instant.now().plus(Duration.ofHours(2));
        Instant end = start.minus(Duration.ofHours(1)); // end before start

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("Start time must precede end time", ex.getMessage());
    }

    @Test
    void createBookingRejectsExcessiveDuration() {
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(5)); // 5h > 240m (4h max)

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("Booking duration exceeds maximum allowed duration of 240 minutes", ex.getMessage());
    }

    @Test
    void createBookingRejectsNonExistentResource() {
        UUID unknownId = UUID.randomUUID();
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                unknownId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(unknownId)).thenReturn(Optional.empty());

        assertThrows(
                ResourceService.ResourceNotFoundException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
    }

    @Test
    void createBookingRejectsUnavailableResource() {
        approvalRequiredResource.setStatus(ResourceStatus.MAINTENANCE);

        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("Resource is not available for booking", ex.getMessage());
    }

    @Test
    void createBookingRejectsSelfBooking() {
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        // alice_owner tries to book her own resource
        when(appUserRepository.findByUsername("alice_owner")).thenReturn(Optional.of(ownerUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.createBooking(command, "alice_owner")
        );
        assertEquals("You cannot book your own resource", ex.getMessage());
    }

    @Test
    void createBookingRejectsInactiveMembership() {
        Membership pendingMembership = new Membership(requesterUser, institution, "MEMBER", "PENDING", null);
        ReflectionTestUtils.setField(pendingMembership, "id", UUID.randomUUID());

        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(pendingMembership));

        BookingService.BookingAccessDeniedException ex = assertThrows(
                BookingService.BookingAccessDeniedException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("Your membership in this institution is not active", ex.getMessage());
    }

    @Test
    void createBookingRejectsOverlappingBookingConflict() {
        Instant start = Instant.now().plus(Duration.ofHours(1));
        Instant end = start.plus(Duration.ofHours(2));

        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                resourceId, start, end, null);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(resourceRepository.findByIdForUpdate(resourceId)).thenReturn(Optional.of(approvalRequiredResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership));

        // 1 overlapping active booking exists
        when(bookingRepository.countOverlappingActiveBookings(resourceId, start, end, null)).thenReturn(1L);

        BookingService.BookingConflictException ex = assertThrows(
                BookingService.BookingConflictException.class,
                () -> bookingService.createBooking(command, "bob_requester")
        );
        assertEquals("The requested time interval overlaps with an existing booking", ex.getMessage());
    }

    // -------------------------------------------------------------------------
    // 2. Read booking tests
    // -------------------------------------------------------------------------

    @Test
    void getMyBookingsReturnsUserBookings() {
        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));

        Booking b = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now(), Instant.now().plusSeconds(3600), "Note");
        when(bookingRepository.findByRequesterUserIdAndStatusWithDetails(requesterUser.getId(), BookingStatus.PENDING))
                .thenReturn(List.of(b));

        List<Booking> list = bookingService.getMyBookings(BookingStatus.PENDING, "bob_requester");
        assertEquals(1, list.size());
    }

    @Test
    void getBookingDetailsPermitsRequesterOwnerAndAdmin() {
        UUID bookingId = UUID.randomUUID();
        Booking b = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now(), Instant.now().plusSeconds(3600), null);
        ReflectionTestUtils.setField(b, "id", bookingId);

        // Requester access
        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(b));
        Booking details = bookingService.getBookingDetails(bookingId, "bob_requester");
        assertNotNull(details);

        // Resource ownership alone does not grant access.
        when(appUserRepository.findByUsername("alice_owner")).thenReturn(Optional.of(ownerUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(ownerUser.getId(), institution.getId()))
                .thenReturn(Optional.of(ownerMembership));
        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getBookingDetails(bookingId, "alice_owner"));

        // Admin access
        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        details = bookingService.getBookingDetails(bookingId, "charlie_admin");
        assertNotNull(details);
    }

    @Test
    void getBookingDetailsRejectsUnrelatedUser() {
        UUID bookingId = UUID.randomUUID();
        Booking b = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now(), Instant.now().plusSeconds(3600), null);
        ReflectionTestUtils.setField(b, "id", bookingId);

        when(appUserRepository.findByUsername("stranger")).thenReturn(Optional.of(strangerUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(b));
        when(membershipRepository.findByUser_IdAndInstitution_Id(strangerUser.getId(), institution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(
                BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getBookingDetails(bookingId, "stranger")
        );
    }

    @Test
    void getIncomingBookingsDoesNotReturnBookingsForResourceOwners() {
        when(appUserRepository.findByUsername("alice_owner")).thenReturn(Optional.of(ownerUser));

        List<Booking> incoming = bookingService.getIncomingBookings(null, null, "alice_owner");
        assertEquals(0, incoming.size());
    }

    @Test
    void getIncomingBookingsByInstitutionPermitsAdminAndRejectsNonAdmin() {
        UUID instId = institution.getId();
        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), instId))
                .thenReturn(Optional.of(adminMembership));
        when(bookingRepository.findIncomingByInstitutionIdAndStatusWithDetails(instId, null))
                .thenReturn(List.of());

        List<Booking> incoming = bookingService.getIncomingBookings(null, instId, "charlie_admin");
        assertNotNull(incoming);

        // Non-admin user rejected
        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), instId))
                .thenReturn(Optional.of(requesterMembership)); // role is MEMBER

        assertThrows(
                BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getIncomingBookings(null, instId, "bob_requester")
        );
    }

    @Test
    void resourceBookingHistoryRequiresActiveAdministratorMembership() {
        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findByIdWithDetails(resourceId)).thenReturn(Optional.of(approvalRequiredResource));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(bookingRepository.findByResourceIdWithDetails(resourceId)).thenReturn(List.of());

        assertEquals(0, bookingService.getResourceBookingHistory(resourceId, "charlie_admin").size());
        verify(bookingRepository).findByResourceIdWithDetails(resourceId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership));
        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getResourceBookingHistory(resourceId, "bob_requester"));
    }

    @Test
    void memberBookingHistoryIsInstitutionAdminScoped() {
        UUID memberMembershipId = UUID.randomUUID();
        ReflectionTestUtils.setField(requesterMembership, "id", memberMembershipId);
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now(), Instant.now().plusSeconds(3600), null);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(membershipRepository.findByIdAndInstitution_Id(memberMembershipId, institution.getId()))
                .thenReturn(Optional.of(requesterMembership));
        when(bookingRepository.findByInstitutionIdAndRequesterMembershipIdWithDetails(
                institution.getId(), memberMembershipId)).thenReturn(List.of(booking));

        assertEquals(List.of(booking), bookingService.getMemberBookingHistory(
                institution.getId(), memberMembershipId, "charlie_admin"));
        verify(bookingRepository).findByInstitutionIdAndRequesterMembershipIdWithDetails(
                institution.getId(), memberMembershipId);
    }

    @Test
    void memberBookingHistoryRejectsNonAdminAndCrossInstitutionMembership() {
        UUID memberMembershipId = UUID.randomUUID();
        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership));
        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getMemberBookingHistory(
                        institution.getId(), memberMembershipId, "bob_requester"));

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(membershipRepository.findByIdAndInstitution_Id(memberMembershipId, institution.getId()))
                .thenReturn(Optional.empty());
        assertThrows(BookingService.BookingNotFoundException.class,
                () -> bookingService.getMemberBookingHistory(
                        institution.getId(), memberMembershipId, "charlie_admin"));
        verify(bookingRepository, never()).findByInstitutionIdAndRequesterMembershipIdWithDetails(
                institution.getId(), memberMembershipId);
    }

    @Test
    void administratorRoleInAnotherInstitutionDoesNotGrantBookingAccess() {
        Membership adminElsewhere = new Membership(strangerUser, otherInstitution, "ADMIN", "ACTIVE", Instant.now());
        when(appUserRepository.findByUsername("stranger")).thenReturn(Optional.of(strangerUser));
        when(membershipRepository.findByUser_IdAndInstitution_Id(strangerUser.getId(), institution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.getIncomingBookings(null, institution.getId(), "stranger"));
        assertNotEquals(adminElsewhere.getInstitution().getId(), institution.getId());
    }

    // -------------------------------------------------------------------------
    // 3. Approve booking tests
    // -------------------------------------------------------------------------

    @Test
    void approveBookingSucceedsAndRecordsDecision() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().plus(Duration.ofHours(3));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership, start, end, null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(bookingRepository.countOverlappingActiveBookings(resourceId, start, end, bookingId)).thenReturn(0L);
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking approved = bookingService.approveBooking(bookingId, "Approved by Alice", "charlie_admin");

        assertEquals(BookingStatus.CONFIRMED, approved.getStatus());
        assertEquals("Approved by Alice", approved.getDecisionMessage());
        assertEquals(adminMembership, approved.getDecidedByMembership());
        assertNotNull(approved.getDecidedAt());
    }

    @Test
    void approveBookingPermitsInstitutionAdmin() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().plus(Duration.ofHours(3));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership, start, end, null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(bookingRepository.countOverlappingActiveBookings(resourceId, start, end, bookingId)).thenReturn(0L);
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking approved = bookingService.approveBooking(bookingId, "Admin approval", "charlie_admin");

        assertEquals(BookingStatus.CONFIRMED, approved.getStatus());
        assertEquals(adminMembership, approved.getDecidedByMembership());
    }

    @Test
    void approveBookingRechecksConflictsAndThrowsConflictException() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().plus(Duration.ofHours(3));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership, start, end, null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));

        // Another booking was confirmed in the meantime!
        when(bookingRepository.countOverlappingActiveBookings(resourceId, start, end, bookingId)).thenReturn(1L);

        BookingService.BookingConflictException ex = assertThrows(
                BookingService.BookingConflictException.class,
                () -> bookingService.approveBooking(bookingId, "Approve", "charlie_admin")
        );
        assertEquals("Cannot approve booking: time interval conflicts with another active booking", ex.getMessage());
    }

    @Test
    void approveBookingRejectsNonPendingBooking() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        booking.setStatus(BookingStatus.CONFIRMED);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.approveBooking(bookingId, null, "charlie_admin")
        );
        assertEquals("Only PENDING bookings can be approved. Current status: CONFIRMED", ex.getMessage());
    }

    @Test
    void approveBookingRejectsUnauthorizedUser() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.of(requesterMembership)); // role is MEMBER, not OWNER or ADMIN

        assertThrows(
                BookingService.BookingAccessDeniedException.class,
                () -> bookingService.approveBooking(bookingId, null, "bob_requester")
        );
    }

    @Test
    void inactiveResourceOwnerCannotApproveBooking() {
        UUID bookingId = UUID.randomUUID();
        Membership inactiveOwner = new Membership(ownerUser, institution, "MEMBER", "SUSPENDED", null);
        ReflectionTestUtils.setField(inactiveOwner, "id", ownerMembership.getId());
        Resource inactiveOwnerResource = new Resource(
                institution, inactiveOwner, category, "Unavailable owner", ResourceType.EQUIPMENT);
        Booking booking = new Booking(institution, inactiveOwnerResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("alice_owner")).thenReturn(Optional.of(ownerUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(ownerUser.getId(), institution.getId()))
                .thenReturn(Optional.of(inactiveOwner));

        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.approveBooking(bookingId, null, "alice_owner"));
    }

    // -------------------------------------------------------------------------
    // 4. Reject booking tests
    // -------------------------------------------------------------------------

    @Test
    void rejectBookingSucceedsAndRecordsDecision() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking rejected = bookingService.rejectBooking(bookingId, "Sensor calibration scheduled", "charlie_admin");

        assertEquals(BookingStatus.REJECTED, rejected.getStatus());
        assertEquals("Sensor calibration scheduled", rejected.getDecisionMessage());
        assertEquals(adminMembership, rejected.getDecidedByMembership());
        assertNotNull(rejected.getDecidedAt());
    }

    @Test
    void rejectBookingRequiresNonBlankDecisionReason() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));

        BookingService.BookingValidationException missingReason = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.rejectBooking(bookingId, null, "charlie_admin")
        );
        assertEquals("A reason is required to reject a booking", missingReason.getMessage());

        BookingService.BookingValidationException blankReason = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.rejectBooking(bookingId, "  \t ", "charlie_admin")
        );
        assertEquals("A reason is required to reject a booking", blankReason.getMessage());
        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void rejectBookingRejectsNonPendingBooking() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        booking.setStatus(BookingStatus.CANCELLED);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("charlie_admin")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(adminUser.getId(), institution.getId()))
                .thenReturn(Optional.of(adminMembership));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.rejectBooking(bookingId, null, "charlie_admin")
        );
        assertEquals("Only PENDING bookings can be rejected. Current status: CANCELLED", ex.getMessage());
    }

    // -------------------------------------------------------------------------
    // 5. Cancel booking tests
    // -------------------------------------------------------------------------

    @Test
    void cancelBookingSucceedsForRequester() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().plus(Duration.ofHours(5));
        Instant end = start.plus(Duration.ofHours(2));

        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership, start, end, null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(bookingId, "bob_requester");

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        assertNotNull(cancelled.getCancelledAt());
    }

    @Test
    void cancelBookingRejectsTerminalBooking() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        booking.setStatus(BookingStatus.CANCELLED);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.cancelBooking(bookingId, "bob_requester")
        );
        assertEquals("Booking is already in terminal status: CANCELLED", ex.getMessage());
    }

    @Test
    void cancelBookingRejectsPastBooking() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().minus(Duration.ofHours(3));
        Instant end = Instant.now().minus(Duration.ofHours(1)); // in the past

        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership, start, end, null);
        booking.setStatus(BookingStatus.CONFIRMED);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));

        BookingService.BookingValidationException ex = assertThrows(
                BookingService.BookingValidationException.class,
                () -> bookingService.cancelBooking(bookingId, "bob_requester")
        );
        assertEquals("Past bookings cannot be cancelled", ex.getMessage());
    }

    @Test
    void cancelBookingRejectsUnauthorizedUser() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(institution, approvalRequiredResource, requesterMembership,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("stranger")).thenReturn(Optional.of(strangerUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(strangerUser.getId(), institution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(
                BookingService.BookingAccessDeniedException.class,
                () -> bookingService.cancelBooking(bookingId, "stranger")
        );
    }

    @Test
    void inactiveBookingRequesterCannotCancelBooking() {
        UUID bookingId = UUID.randomUUID();
        Membership inactiveRequester = new Membership(requesterUser, institution, "MEMBER", "REJECTED", null);
        ReflectionTestUtils.setField(inactiveRequester, "id", requesterMembership.getId());
        Booking booking = new Booking(institution, approvalRequiredResource, inactiveRequester,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null);
        ReflectionTestUtils.setField(booking, "id", bookingId);

        when(appUserRepository.findByUsername("bob_requester")).thenReturn(Optional.of(requesterUser));
        when(bookingRepository.findByIdWithDetails(bookingId)).thenReturn(Optional.of(booking));
        when(membershipRepository.findByUser_IdAndInstitution_Id(requesterUser.getId(), institution.getId()))
                .thenReturn(Optional.empty());

        assertThrows(BookingService.BookingAccessDeniedException.class,
                () -> bookingService.cancelBooking(bookingId, "bob_requester"));
    }
}
