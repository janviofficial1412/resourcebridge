package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.resource.ResourceType;

import java.time.Instant;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID institutionId,
        String institutionName,
        UUID resourceId,
        String resourceName,
        ResourceType resourceType,
        UUID requesterMembershipId,
        UUID requesterUserId,
        String requesterName,
        UUID ownerMembershipId,
        UUID ownerUserId,
        String ownerName,
        BookingStatus status,
        Instant startTime,
        Instant endTime,
        String requesterMessage,
        String decisionMessage,
        UUID decidedByMembershipId,
        String decidedByName,
        Instant decidedAt,
        Instant cancelledAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static BookingResponse from(Booking booking) {
        UUID instId = booking.getInstitution() != null ? booking.getInstitution().getId() : null;
        String instName = booking.getInstitution() != null ? booking.getInstitution().getName() : null;

        UUID resId = booking.getResource() != null ? booking.getResource().getId() : null;
        String resName = booking.getResource() != null ? booking.getResource().getName() : null;
        ResourceType resType = booking.getResource() != null ? booking.getResource().getResourceType() : null;

        UUID reqMemId = booking.getRequesterMembership() != null ? booking.getRequesterMembership().getId() : null;
        UUID reqUserId = (booking.getRequesterMembership() != null && booking.getRequesterMembership().getUser() != null)
                ? booking.getRequesterMembership().getUser().getId() : null;
        String reqName = (booking.getRequesterMembership() != null && booking.getRequesterMembership().getUser() != null)
                ? booking.getRequesterMembership().getUser().getFullName() : null;

        UUID ownerMemId = null;
        UUID ownerUserId = null;
        String ownerName = null;
        if (booking.getResource() != null && booking.getResource().getOwnerMembership() != null) {
            ownerMemId = booking.getResource().getOwnerMembership().getId();
            if (booking.getResource().getOwnerMembership().getUser() != null) {
                ownerUserId = booking.getResource().getOwnerMembership().getUser().getId();
                ownerName = booking.getResource().getOwnerMembership().getUser().getFullName();
            }
        }

        UUID decMemId = booking.getDecidedByMembership() != null ? booking.getDecidedByMembership().getId() : null;
        String decName = (booking.getDecidedByMembership() != null && booking.getDecidedByMembership().getUser() != null)
                ? booking.getDecidedByMembership().getUser().getFullName() : null;

        return new BookingResponse(
                booking.getId(),
                instId,
                instName,
                resId,
                resName,
                resType,
                reqMemId,
                reqUserId,
                reqName,
                ownerMemId,
                ownerUserId,
                ownerName,
                booking.getStatus(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getRequesterMessage(),
                booking.getDecisionMessage(),
                decMemId,
                decName,
                booking.getDecidedAt(),
                booking.getCancelledAt(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
