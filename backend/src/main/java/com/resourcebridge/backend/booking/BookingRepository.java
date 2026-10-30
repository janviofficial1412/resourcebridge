package com.resourcebridge.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByInstitution_Id(UUID institutionId);

    List<Booking> findByResource_Id(UUID resourceId);

    List<Booking> findByRequesterMembership_Id(UUID requesterMembershipId);

    List<Booking> findByRequesterMembership_User_Id(UUID userId);

    List<Booking> findByInstitution_IdAndStatus(UUID institutionId, BookingStatus status);

    List<Booking> findByResource_IdAndStatus(UUID resourceId, BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b " +
            "WHERE b.resource.id = :resourceId " +
            "AND b.status IN (com.resourcebridge.backend.booking.BookingStatus.PENDING, com.resourcebridge.backend.booking.BookingStatus.CONFIRMED) " +
            "AND (:excludeBookingId IS NULL OR b.id != :excludeBookingId) " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    long countOverlappingActiveBookings(@Param("resourceId") UUID resourceId,
                                       @Param("startTime") Instant startTime,
                                       @Param("endTime") Instant endTime,
                                       @Param("excludeBookingId") UUID excludeBookingId);

    @Query("SELECT b FROM Booking b " +
            "WHERE b.resource.id = :resourceId " +
            "AND b.status IN (com.resourcebridge.backend.booking.BookingStatus.PENDING, com.resourcebridge.backend.booking.BookingStatus.CONFIRMED) " +
            "AND (:excludeBookingId IS NULL OR b.id != :excludeBookingId) " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    List<Booking> findOverlappingActiveBookings(@Param("resourceId") UUID resourceId,
                                               @Param("startTime") Instant startTime,
                                               @Param("endTime") Instant endTime,
                                               @Param("excludeBookingId") UUID excludeBookingId);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "LEFT JOIN FETCH b.decidedByMembership dm " +
            "LEFT JOIN FETCH dm.user " +
            "WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user u " +
            "LEFT JOIN FETCH b.decidedByMembership dm " +
            "LEFT JOIN FETCH dm.user " +
            "WHERE u.id = :userId " +
            "AND (:status IS NULL OR b.status = :status) " +
            "ORDER BY b.startTime DESC")
    List<Booking> findByRequesterUserIdAndStatusWithDetails(@Param("userId") UUID userId,
                                                           @Param("status") BookingStatus status);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "LEFT JOIN FETCH b.decidedByMembership dm " +
            "LEFT JOIN FETCH dm.user " +
            "WHERE r.ownerMembership.user.id = :ownerUserId " +
            "AND (:status IS NULL OR b.status = :status) " +
            "ORDER BY b.startTime DESC")
    List<Booking> findIncomingByOwnerUserIdAndStatusWithDetails(@Param("ownerUserId") UUID ownerUserId,
                                                               @Param("status") BookingStatus status);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "LEFT JOIN FETCH b.decidedByMembership dm " +
            "LEFT JOIN FETCH dm.user " +
            "WHERE b.institution.id = :institutionId " +
            "AND (:status IS NULL OR b.status = :status) " +
            "ORDER BY b.startTime DESC")
    List<Booking> findIncomingByInstitutionIdAndStatusWithDetails(@Param("institutionId") UUID institutionId,
                                                                 @Param("status") BookingStatus status);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "WHERE b.resource.id = :resourceId " +
            "ORDER BY b.startTime DESC")
    List<Booking> findByResourceIdWithDetails(@Param("resourceId") UUID resourceId);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "LEFT JOIN FETCH b.decidedByMembership dm " +
            "LEFT JOIN FETCH dm.user " +
            "WHERE b.institution.id = :institutionId " +
            "AND b.requesterMembership.id = :membershipId " +
            "ORDER BY b.startTime DESC")
    List<Booking> findByInstitutionIdAndRequesterMembershipIdWithDetails(
            @Param("institutionId") UUID institutionId,
            @Param("membershipId") UUID membershipId);

    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.institution " +
            "JOIN FETCH b.resource r " +
            "JOIN FETCH r.category " +
            "JOIN FETCH b.requesterMembership rm " +
            "JOIN FETCH rm.user " +
            "WHERE b.institution.id = :institutionId " +
            "ORDER BY b.startTime DESC")
    List<Booking> findByInstitutionIdWithDetails(@Param("institutionId") UUID institutionId);

    long countByInstitution_IdAndStatus(UUID institutionId, BookingStatus status);

    long countByInstitution_IdAndRequesterMembership_User_IdAndStatus(
            UUID institutionId, UUID userId, BookingStatus status);

    long countByInstitution_IdAndRequesterMembership_User_Id(UUID institutionId, UUID userId);
}
