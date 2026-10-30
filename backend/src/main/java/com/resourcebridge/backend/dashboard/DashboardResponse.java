package com.resourcebridge.backend.dashboard;

import java.util.UUID;

public record DashboardResponse(
        UUID institutionId,
        String institutionName,
        String role,
        long totalResources,
        long availableResources,
        long pendingBookingRequests,
        long activeStudents,
        long pendingIncidents,
        long myBookings,
        long myPendingBookings,
        long myIncidents
) {}
