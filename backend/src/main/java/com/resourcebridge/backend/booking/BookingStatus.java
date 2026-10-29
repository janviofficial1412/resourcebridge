package com.resourcebridge.backend.booking;

/**
 * Status lifecycle values for resource bookings.
 *
 * <p>Lifecycle flow:
 * <ul>
 *   <li>{@link #PENDING}: Initial state for resources requiring approval.</li>
 *   <li>{@link #CONFIRMED}: Approved by owner/admin, or auto-confirmed if no approval required.</li>
 *   <li>{@link #REJECTED}: Declined by owner/admin with optional decision message.</li>
 *   <li>{@link #CANCELLED}: Cancelled by requester or owner prior to/during booking.</li>
 * </ul>
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    REJECTED,
    CANCELLED
}
