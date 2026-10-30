package com.resourcebridge.backend.dashboard;

import com.resourcebridge.backend.booking.BookingRepository;
import com.resourcebridge.backend.booking.BookingStatus;
import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.incident.IncidentReportRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.resource.ResourceRepository;
import com.resourcebridge.backend.resource.ResourceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private AppUserRepository appUserRepository;
    @Mock private MembershipRepository membershipRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private IncidentReportRepository incidentReportRepository;

    private DashboardService service;
    private AppUser user;
    private Institution institution;
    private UUID userId;
    private UUID institutionId;

    @BeforeEach
    void setUp() {
        service = new DashboardService(appUserRepository, membershipRepository, resourceRepository,
                bookingRepository, incidentReportRepository);
        userId = UUID.randomUUID();
        institutionId = UUID.randomUUID();
        user = new AppUser("student", "student@example.com", "hash", "Student");
        ReflectionTestUtils.setField(user, "id", userId);
        institution = new Institution("Example", "example", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        when(appUserRepository.findByUsername("student")).thenReturn(Optional.of(user));
    }

    @Test
    void adminMetricsAreScopedToTheSelectedInstitution() {
        Membership admin = new Membership(user, institution, "ADMIN", "ACTIVE", null);
        when(membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId))
                .thenReturn(Optional.of(admin));
        when(resourceRepository.countByInstitution_Id(institutionId)).thenReturn(12L);
        when(resourceRepository.countByInstitution_IdAndStatus(institutionId, ResourceStatus.AVAILABLE))
                .thenReturn(8L);
        when(bookingRepository.countByInstitution_IdAndStatus(institutionId, BookingStatus.PENDING))
                .thenReturn(3L);
        when(membershipRepository.countByInstitution_IdAndRoleAndStatus(institutionId, "MEMBER", "ACTIVE"))
                .thenReturn(24L);
        when(incidentReportRepository.countByInstitution_IdAndStatusIn(
                institutionId, List.of("OPEN", "IN_PROGRESS"))).thenReturn(2L);

        DashboardResponse response = service.get(institutionId, "student");

        assertEquals("ADMIN", response.role());
        assertEquals(12L, response.totalResources());
        assertEquals(8L, response.availableResources());
        assertEquals(3L, response.pendingBookingRequests());
        assertEquals(24L, response.activeStudents());
        assertEquals(2L, response.pendingIncidents());
        verify(resourceRepository).countByInstitution_Id(institutionId);
    }

    @Test
    void studentMetricsExcludeSelfOwnedResourcesAndStayPersonal() {
        Membership member = new Membership(user, institution, "MEMBER", "ACTIVE", null);
        when(membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId))
                .thenReturn(Optional.of(member));
        when(resourceRepository.countDiscoverableForMember(institutionId, userId)).thenReturn(7L);
        when(bookingRepository.countByInstitution_IdAndRequesterMembership_User_Id(institutionId, userId))
                .thenReturn(4L);
        when(bookingRepository.countByInstitution_IdAndRequesterMembership_User_IdAndStatus(
                institutionId, userId, BookingStatus.PENDING)).thenReturn(1L);
        when(incidentReportRepository.countByInstitution_IdAndReporterMembership_User_Id(institutionId, userId))
                .thenReturn(2L);

        DashboardResponse response = service.get(institutionId, "student");

        assertEquals("MEMBER", response.role());
        assertEquals(7L, response.availableResources());
        assertEquals(4L, response.myBookings());
        assertEquals(1L, response.myPendingBookings());
        assertEquals(2L, response.myIncidents());
        assertEquals(0L, response.totalResources());
        verify(resourceRepository).countDiscoverableForMember(institutionId, userId);
    }

    @Test
    void inactiveMembershipCannotAccessDashboardMetrics() {
        Membership inactive = new Membership(user, institution, "ADMIN", "SUSPENDED", null);
        when(membershipRepository.findByUser_IdAndInstitution_Id(userId, institutionId))
                .thenReturn(Optional.of(inactive));

        assertThrows(RuntimeException.class, () -> service.get(institutionId, "student"));
    }
}
