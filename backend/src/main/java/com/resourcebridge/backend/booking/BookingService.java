package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceRepository;
import com.resourcebridge.backend.resource.ResourceService;
import com.resourcebridge.backend.resource.ResourceStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository appUserRepository;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          MembershipRepository membershipRepository,
                          AppUserRepository appUserRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.membershipRepository = membershipRepository;
        this.appUserRepository = appUserRepository;
    }

    public record CreateBookingCommand(
            UUID resourceId,
            Instant startTime,
            Instant endTime,
            String requesterMessage
    ) {}

    @Transactional
    public Booking createBooking(CreateBookingCommand command, String currentUsername) {
        validateCreateCommand(command);

        AppUser user = getAuthenticatedUser(currentUsername);

        // Disallow booking in the past (allowing 60-second grace period for clock skew)
        if (command.startTime().isBefore(Instant.now().minus(Duration.ofMinutes(1)))) {
            throw new BookingValidationException("Booking start time cannot be in the past");
        }

        // Lock resource row for update to serialize concurrent booking attempts on the same resource
        Resource resource = resourceRepository.findByIdForUpdate(command.resourceId())
                .orElseThrow(() -> new ResourceService.ResourceNotFoundException(
                        "Resource not found with ID: " + command.resourceId()));

        if (resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new BookingValidationException("Resource is not available for booking");
        }

        // Disallow self-booking
        if (resource.getOwnerMembership().getUser().getId().equals(user.getId())) {
            throw new BookingValidationException("You cannot book your own resource");
        }

        // Validate max duration if configured
        if (resource.getMaxBookingMinutes() != null) {
            long durationMinutes = Duration.between(command.startTime(), command.endTime()).toMinutes();
            if (durationMinutes > resource.getMaxBookingMinutes()) {
                throw new BookingValidationException("Booking duration exceeds maximum allowed duration of "
                        + resource.getMaxBookingMinutes() + " minutes");
            }
        }

        // Validate requester has active membership in the resource's institution
        Membership requesterMembership = membershipRepository.findByUser_IdAndInstitution_Id(
                user.getId(), resource.getInstitution().getId())
                .orElseThrow(() -> new BookingAccessDeniedException("You do not belong to the resource's institution"));

        if (!"ACTIVE".equalsIgnoreCase(requesterMembership.getStatus())) {
            throw new BookingAccessDeniedException("Your membership in this institution is not active");
        }

        // Check for active (PENDING or CONFIRMED) booking conflicts
        if (bookingRepository.countOverlappingActiveBookings(resource.getId(), command.startTime(), command.endTime(), null) > 0) {
            throw new BookingConflictException("The requested time interval overlaps with an existing booking");
        }

        BookingStatus initialStatus = resource.isRequiresApproval() ? BookingStatus.PENDING : BookingStatus.CONFIRMED;
        String trimmedMessage = (command.requesterMessage() != null && !command.requesterMessage().isBlank())
                ? command.requesterMessage().trim() : null;

        Booking booking = new Booking(
                resource.getInstitution(),
                resource,
                requesterMembership,
                command.startTime(),
                command.endTime(),
                trimmedMessage
        );
        booking.setStatus(initialStatus);

        return bookingRepository.saveAndFlush(booking);
    }

    @Transactional(readOnly = true)
    public List<Booking> getMyBookings(BookingStatus status, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);
        return bookingRepository.findByRequesterUserIdAndStatusWithDetails(user.getId(), status);
    }

    @Transactional(readOnly = true)
    public Booking getBookingDetails(UUID bookingId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        boolean isRequester = booking.getRequesterMembership().getUser().getId().equals(user.getId());
        boolean isOwner = booking.getResource().getOwnerMembership().getUser().getId().equals(user.getId());
        boolean isAdmin = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), booking.getInstitution().getId())
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && "INSTITUTION_ADMIN".equalsIgnoreCase(m.getRole()))
                .isPresent();

        if (!isRequester && !isOwner && !isAdmin) {
            throw new BookingAccessDeniedException("You do not have permission to view this booking");
        }

        return booking;
    }

    @Transactional(readOnly = true)
    public List<Booking> getIncomingBookings(BookingStatus status, UUID institutionId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        if (institutionId != null) {
            boolean isAdmin = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institutionId)
                    .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && "INSTITUTION_ADMIN".equalsIgnoreCase(m.getRole()))
                    .isPresent();

            if (!isAdmin) {
                throw new BookingAccessDeniedException("You do not have administrative access to this institution");
            }
            return bookingRepository.findIncomingByInstitutionIdAndStatusWithDetails(institutionId, status);
        }

        return bookingRepository.findIncomingByOwnerUserIdAndStatusWithDetails(user.getId(), status);
    }

    @Transactional
    public Booking approveBooking(UUID bookingId, String decisionMessage, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        Membership deciderMembership = verifyCanDecideBooking(user, booking);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingValidationException(
                    "Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        // Lock resource row and recheck conflicts prior to confirming
        resourceRepository.findByIdForUpdate(booking.getResource().getId());

        if (bookingRepository.countOverlappingActiveBookings(
                booking.getResource().getId(), booking.getStartTime(), booking.getEndTime(), booking.getId()) > 0) {
            throw new BookingConflictException(
                    "Cannot approve booking: time interval conflicts with another active booking");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setDecidedByMembership(deciderMembership);
        booking.setDecidedAt(Instant.now());
        if (decisionMessage != null && !decisionMessage.isBlank()) {
            booking.setDecisionMessage(decisionMessage.trim());
        }

        return bookingRepository.saveAndFlush(booking);
    }

    @Transactional
    public Booking rejectBooking(UUID bookingId, String decisionMessage, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        Membership deciderMembership = verifyCanDecideBooking(user, booking);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingValidationException(
                    "Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setDecidedByMembership(deciderMembership);
        booking.setDecidedAt(Instant.now());
        if (decisionMessage != null && !decisionMessage.isBlank()) {
            booking.setDecisionMessage(decisionMessage.trim());
        }

        return bookingRepository.saveAndFlush(booking);
    }

    @Transactional
    public Booking cancelBooking(UUID bookingId, String currentUsername) {
        AppUser user = getAuthenticatedUser(currentUsername);

        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        boolean isRequester = booking.getRequesterMembership().getUser().getId().equals(user.getId());
        boolean isOwner = booking.getResource().getOwnerMembership().getUser().getId().equals(user.getId());
        boolean isAdmin = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), booking.getInstitution().getId())
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && "INSTITUTION_ADMIN".equalsIgnoreCase(m.getRole()))
                .isPresent();

        if (!isRequester && !isOwner && !isAdmin) {
            throw new BookingAccessDeniedException("You do not have permission to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
            throw new BookingValidationException("Booking is already in terminal status: " + booking.getStatus());
        }

        if (booking.getEndTime().isBefore(Instant.now())) {
            throw new BookingValidationException("Past bookings cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());

        return bookingRepository.saveAndFlush(booking);
    }

    private void validateCreateCommand(CreateBookingCommand command) {
        if (command == null) {
            throw new BookingValidationException("Booking command must not be null");
        }
        if (command.resourceId() == null) {
            throw new BookingValidationException("Resource ID is required");
        }
        if (command.startTime() == null) {
            throw new BookingValidationException("Start time is required");
        }
        if (command.endTime() == null) {
            throw new BookingValidationException("End time is required");
        }
        if (!command.startTime().isBefore(command.endTime())) {
            throw new BookingValidationException("Start time must precede end time");
        }
        if (command.requesterMessage() != null && command.requesterMessage().length() > 2000) {
            throw new BookingValidationException("Requester message must not exceed 2000 characters");
        }
    }

    private Membership verifyCanDecideBooking(AppUser user, Booking booking) {
        boolean isOwner = booking.getResource().getOwnerMembership().getUser().getId().equals(user.getId());
        if (isOwner) {
            return membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), booking.getInstitution().getId())
                    .orElse(booking.getResource().getOwnerMembership());
        }

        return membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), booking.getInstitution().getId())
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && "INSTITUTION_ADMIN".equalsIgnoreCase(m.getRole()))
                .orElseThrow(() -> new BookingAccessDeniedException("You do not have permission to decide this booking"));
    }

    private AppUser getAuthenticatedUser(String username) {
        return appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // --- Domain Exceptions ---

    public static class BookingNotFoundException extends RuntimeException {
        public BookingNotFoundException(String message) {
            super(message);
        }
    }

    public static class BookingAccessDeniedException extends RuntimeException {
        public BookingAccessDeniedException(String message) {
            super(message);
        }
    }

    public static class BookingValidationException extends RuntimeException {
        public BookingValidationException(String message) {
            super(message);
        }
    }

    public static class BookingConflictException extends RuntimeException {
        public BookingConflictException(String message) {
            super(message);
        }
    }
}
