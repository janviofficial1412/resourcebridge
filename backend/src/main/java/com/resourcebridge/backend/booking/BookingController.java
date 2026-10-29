package com.resourcebridge.backend.booking;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request,
                                         Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        BookingService.CreateBookingCommand command = new BookingService.CreateBookingCommand(
                request.resourceId(),
                request.startTime(),
                request.endTime(),
                request.requesterMessage()
        );
        Booking created = bookingService.createBooking(command, username);
        return BookingResponse.from(created);
    }

    @GetMapping("/my")
    public List<BookingResponse> getMyBookings(@RequestParam(required = false) BookingStatus status,
                                               Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        List<Booking> bookings = bookingService.getMyBookings(status, username);
        return bookings.stream().map(BookingResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BookingResponse getBookingDetails(@PathVariable UUID id,
                                             Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        Booking booking = bookingService.getBookingDetails(id, username);
        return BookingResponse.from(booking);
    }

    @GetMapping("/incoming")
    public List<BookingResponse> getIncomingBookings(@RequestParam(required = false) BookingStatus status,
                                                     @RequestParam(required = false) UUID institutionId,
                                                     Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        List<Booking> bookings = bookingService.getIncomingBookings(status, institutionId, username);
        return bookings.stream().map(BookingResponse::from).toList();
    }

    @PostMapping("/{id}/approve")
    public BookingResponse approveBooking(@PathVariable UUID id,
                                          @Valid @RequestBody(required = false) DecisionRequest request,
                                          Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        String decisionMessage = request != null ? request.decisionMessage() : null;
        Booking approved = bookingService.approveBooking(id, decisionMessage, username);
        return BookingResponse.from(approved);
    }

    @PostMapping("/{id}/reject")
    public BookingResponse rejectBooking(@PathVariable UUID id,
                                         @Valid @RequestBody(required = false) DecisionRequest request,
                                         Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        String decisionMessage = request != null ? request.decisionMessage() : null;
        Booking rejected = bookingService.rejectBooking(id, decisionMessage, username);
        return BookingResponse.from(rejected);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancelBooking(@PathVariable UUID id,
                                         Authentication authentication) {
        String username = getAuthenticatedUsername(authentication);
        Booking cancelled = bookingService.cancelBooking(id, username);
        return BookingResponse.from(cancelled);
    }

    private String getAuthenticatedUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("User must be authenticated");
        }
        return authentication.getName();
    }
}
