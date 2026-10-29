package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.ApiExceptionHandler;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    private MockMvc mockMvc;

    private UUID institutionId;
    private UUID resourceId;
    private UUID bookingId;

    private AppUser requesterUser;
    private AppUser ownerUser;
    private Institution testInstitution;
    private Membership requesterMembership;
    private Membership ownerMembership;
    private ResourceCategory testCategory;
    private Resource testResource;
    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        BookingController controller = new BookingController(bookingService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        institutionId = UUID.randomUUID();
        resourceId = UUID.randomUUID();
        bookingId = UUID.randomUUID();

        testInstitution = new Institution("Apex Nanotech Lab", "apex-nano", "UTC");
        ReflectionTestUtils.setField(testInstitution, "id", institutionId);

        requesterUser = new AppUser("bob_requester", "bob@example.com", "hash", "Bob Requester");
        ReflectionTestUtils.setField(requesterUser, "id", UUID.randomUUID());

        ownerUser = new AppUser("alice_owner", "alice@example.com", "hash", "Alice Owner");
        ReflectionTestUtils.setField(ownerUser, "id", UUID.randomUUID());

        requesterMembership = new Membership(requesterUser, testInstitution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(requesterMembership, "id", UUID.randomUUID());

        ownerMembership = new Membership(ownerUser, testInstitution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(ownerMembership, "id", UUID.randomUUID());

        testCategory = new ResourceCategory(testInstitution, "Microscopy", "EM scopes");
        ReflectionTestUtils.setField(testCategory, "id", UUID.randomUUID());

        testResource = new Resource(
                testInstitution,
                ownerMembership,
                testCategory,
                "Cryo-EM Station",
                "Advanced Cryo-EM",
                ResourceType.EQUIPMENT,
                "Room 101",
                ConditionRating.NEW,
                ResourceStatus.AVAILABLE,
                true,
                240
        );
        ReflectionTestUtils.setField(testResource, "id", resourceId);

        Instant start = Instant.parse("2026-11-01T10:00:00Z");
        Instant end = Instant.parse("2026-11-01T12:00:00Z");
        sampleBooking = new Booking(
                testInstitution,
                testResource,
                requesterMembership,
                start,
                end,
                "Need scope for imaging"
        );
        ReflectionTestUtils.setField(sampleBooking, "id", bookingId);
    }

    // -------------------------------------------------------------------------
    // 1. POST /api/bookings (Create)
    // -------------------------------------------------------------------------

    @Test
    void createBookingSucceedsWith201() throws Exception {
        String requestJson = String.format("""
                {
                    "resourceId": "%s",
                    "startTime": "2026-11-01T10:00:00Z",
                    "endTime": "2026-11-01T12:00:00Z",
                    "requesterMessage": "Need scope for imaging"
                }
                """, resourceId);

        when(bookingService.createBooking(any(BookingService.CreateBookingCommand.class), eq("bob_requester")))
                .thenReturn(sampleBooking);

        mockMvc.perform(post("/api/bookings")
                        .principal(new TestingAuthenticationToken("bob_requester", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(bookingId.toString())))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.resourceName", is("Cryo-EM Station")))
                .andExpect(jsonPath("$.requesterName", is("Bob Requester")))
                .andExpect(jsonPath("$.institutionName", is("Apex Nanotech Lab")))
                .andExpect(jsonPath("$.requesterMessage", is("Need scope for imaging")));
    }

    @Test
    void createBookingRejectsMissingRequiredFieldsWith400() throws Exception {
        String invalidJson = "{\"requesterMessage\": \"Missing times and resourceId\"}";

        mockMvc.perform(post("/api/bookings")
                        .principal(new TestingAuthenticationToken("bob_requester", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createBookingUnauthenticatedReturns401() throws Exception {
        String requestJson = String.format("""
                {
                    "resourceId": "%s",
                    "startTime": "2026-11-01T10:00:00Z",
                    "endTime": "2026-11-01T12:00:00Z"
                }
                """, resourceId);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("User must be authenticated")));
    }

    @Test
    void createBookingConflictReturns409() throws Exception {
        String requestJson = String.format("""
                {
                    "resourceId": "%s",
                    "startTime": "2026-11-01T10:00:00Z",
                    "endTime": "2026-11-01T12:00:00Z"
                }
                """, resourceId);

        when(bookingService.createBooking(any(BookingService.CreateBookingCommand.class), eq("bob_requester")))
                .thenThrow(new BookingService.BookingConflictException("The requested time interval overlaps with an existing booking"));

        mockMvc.perform(post("/api/bookings")
                        .principal(new TestingAuthenticationToken("bob_requester", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("The requested time interval overlaps with an existing booking")));
    }

    // -------------------------------------------------------------------------
    // 2. GET /api/bookings/my
    // -------------------------------------------------------------------------

    @Test
    void getMyBookingsReturns200WithList() throws Exception {
        when(bookingService.getMyBookings(isNull(), eq("bob_requester"))).thenReturn(List.of(sampleBooking));

        mockMvc.perform(get("/api/bookings/my")
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(bookingId.toString())))
                .andExpect(jsonPath("$[0].status", is("PENDING")));
    }

    @Test
    void getMyBookingsWithStatusFilter() throws Exception {
        when(bookingService.getMyBookings(eq(BookingStatus.CONFIRMED), eq("bob_requester")))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/my")
                        .param("status", "CONFIRMED")
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // -------------------------------------------------------------------------
    // 3. GET /api/bookings/{id}
    // -------------------------------------------------------------------------

    @Test
    void getBookingDetailsReturns200() throws Exception {
        when(bookingService.getBookingDetails(bookingId, "bob_requester")).thenReturn(sampleBooking);

        mockMvc.perform(get("/api/bookings/{id}", bookingId)
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(bookingId.toString())))
                .andExpect(jsonPath("$.resourceName", is("Cryo-EM Station")));
    }

    @Test
    void getBookingDetailsNotFoundReturns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(bookingService.getBookingDetails(nonExistentId, "bob_requester"))
                .thenThrow(new BookingService.BookingNotFoundException("Booking not found with ID: " + nonExistentId));

        mockMvc.perform(get("/api/bookings/{id}", nonExistentId)
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    void getBookingDetailsForbiddenReturns403() throws Exception {
        when(bookingService.getBookingDetails(bookingId, "stranger"))
                .thenThrow(new BookingService.BookingAccessDeniedException("You do not have permission to view this booking"));

        mockMvc.perform(get("/api/bookings/{id}", bookingId)
                        .principal(new TestingAuthenticationToken("stranger", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    // -------------------------------------------------------------------------
    // 4. GET /api/bookings/incoming
    // -------------------------------------------------------------------------

    @Test
    void getIncomingBookingsReturns200WithList() throws Exception {
        when(bookingService.getIncomingBookings(isNull(), isNull(), eq("alice_owner")))
                .thenReturn(List.of(sampleBooking));

        mockMvc.perform(get("/api/bookings/incoming")
                        .principal(new TestingAuthenticationToken("alice_owner", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ownerName", is("Alice Owner")));
    }

    // -------------------------------------------------------------------------
    // 5. POST /api/bookings/{id}/approve
    // -------------------------------------------------------------------------

    @Test
    void approveBookingSucceedsWith200() throws Exception {
        sampleBooking.setStatus(BookingStatus.CONFIRMED);
        sampleBooking.setDecidedByMembership(ownerMembership);
        sampleBooking.setDecidedAt(Instant.now());
        sampleBooking.setDecisionMessage("Approved by Alice");

        when(bookingService.approveBooking(eq(bookingId), eq("Approved by Alice"), eq("alice_owner")))
                .thenReturn(sampleBooking);

        mockMvc.perform(post("/api/bookings/{id}/approve", bookingId)
                        .principal(new TestingAuthenticationToken("alice_owner", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decisionMessage\": \"Approved by Alice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(bookingId.toString())))
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.decisionMessage", is("Approved by Alice")));
    }

    @Test
    void approveBookingConflictReturns409() throws Exception {
        when(bookingService.approveBooking(eq(bookingId), isNull(), eq("alice_owner")))
                .thenThrow(new BookingService.BookingConflictException(
                        "Cannot approve booking: time interval conflicts with another active booking"));

        mockMvc.perform(post("/api/bookings/{id}/approve", bookingId)
                        .principal(new TestingAuthenticationToken("alice_owner", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("Cannot approve booking: time interval conflicts with another active booking")));
    }

    @Test
    void approveBookingForbiddenReturns403() throws Exception {
        when(bookingService.approveBooking(eq(bookingId), isNull(), eq("bob_requester")))
                .thenThrow(new BookingService.BookingAccessDeniedException("You do not have permission to decide this booking"));

        mockMvc.perform(post("/api/bookings/{id}/approve", bookingId)
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    // -------------------------------------------------------------------------
    // 6. POST /api/bookings/{id}/reject
    // -------------------------------------------------------------------------

    @Test
    void rejectBookingSucceedsWith200() throws Exception {
        sampleBooking.setStatus(BookingStatus.REJECTED);
        sampleBooking.setDecidedByMembership(ownerMembership);
        sampleBooking.setDecidedAt(Instant.now());
        sampleBooking.setDecisionMessage("Unavailable");

        when(bookingService.rejectBooking(eq(bookingId), eq("Unavailable"), eq("alice_owner")))
                .thenReturn(sampleBooking);

        mockMvc.perform(post("/api/bookings/{id}/reject", bookingId)
                        .principal(new TestingAuthenticationToken("alice_owner", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decisionMessage\": \"Unavailable\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(bookingId.toString())))
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.decisionMessage", is("Unavailable")));
    }

    // -------------------------------------------------------------------------
    // 7. POST /api/bookings/{id}/cancel
    // -------------------------------------------------------------------------

    @Test
    void cancelBookingSucceedsWith200() throws Exception {
        sampleBooking.setStatus(BookingStatus.CANCELLED);
        sampleBooking.setCancelledAt(Instant.now());

        when(bookingService.cancelBooking(eq(bookingId), eq("bob_requester")))
                .thenReturn(sampleBooking);

        mockMvc.perform(post("/api/bookings/{id}/cancel", bookingId)
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(bookingId.toString())))
                .andExpect(jsonPath("$.status", is("CANCELLED")));
    }

    @Test
    void cancelBookingForbiddenReturns403() throws Exception {
        when(bookingService.cancelBooking(eq(bookingId), eq("stranger")))
                .thenThrow(new BookingService.BookingAccessDeniedException("You do not have permission to cancel this booking"));

        mockMvc.perform(post("/api/bookings/{id}/cancel", bookingId)
                        .principal(new TestingAuthenticationToken("stranger", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    void invalidStatusParameterReturns400() throws Exception {
        mockMvc.perform(get("/api/bookings/my")
                        .param("status", "INVALID_STATUS")
                        .principal(new TestingAuthenticationToken("bob_requester", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }
}
