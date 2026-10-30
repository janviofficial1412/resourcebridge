package com.resourcebridge.backend.dashboard;

import com.resourcebridge.backend.booking.BookingRepository;
import com.resourcebridge.backend.booking.BookingStatus;
import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.identity.AppUserRepository;
import com.resourcebridge.backend.incident.IncidentReportRepository;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.institution.MembershipRepository;
import com.resourcebridge.backend.institution.InstitutionService;
import com.resourcebridge.backend.resource.ResourceRepository;
import com.resourcebridge.backend.resource.ResourceStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class DashboardService {

    private final AppUserRepository appUserRepository;
    private final MembershipRepository membershipRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final IncidentReportRepository incidentReportRepository;

    public DashboardService(AppUserRepository appUserRepository,
                            MembershipRepository membershipRepository,
                            ResourceRepository resourceRepository,
                            BookingRepository bookingRepository,
                            IncidentReportRepository incidentReportRepository) {
        this.appUserRepository = appUserRepository;
        this.membershipRepository = membershipRepository;
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.incidentReportRepository = incidentReportRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse get(UUID institutionId, String username) {
        AppUser user = appUserRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        Membership membership = membershipRepository.findByUser_IdAndInstitution_Id(user.getId(), institutionId)
                .filter(value -> "ACTIVE".equalsIgnoreCase(value.getStatus())
                        && ("ADMIN".equalsIgnoreCase(value.getRole())
                        || "MEMBER".equalsIgnoreCase(value.getRole())))
                .orElseThrow(() -> new InstitutionService.InstitutionAccessDeniedException(
                        "An active membership in this institution is required"));
        Institution institution = membership.getInstitution();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(membership.getRole());

        if (isAdmin) {
            return new DashboardResponse(
                    institution.getId(),
                    institution.getName(),
                    membership.getRole(),
                    resourceRepository.countByInstitution_Id(institutionId),
                    resourceRepository.countByInstitution_IdAndStatus(institutionId, ResourceStatus.AVAILABLE),
                    bookingRepository.countByInstitution_IdAndStatus(institutionId, BookingStatus.PENDING),
                    membershipRepository.countByInstitution_IdAndRoleAndStatus(institutionId, "MEMBER", "ACTIVE"),
                    incidentReportRepository.countByInstitution_IdAndStatusIn(
                            institutionId, List.of("OPEN", "IN_PROGRESS")),
                    0, 0, 0);
        }

        return new DashboardResponse(
                institution.getId(),
                institution.getName(),
                membership.getRole(),
                0,
                resourceRepository.countDiscoverableForMember(institutionId, user.getId()),
                0,
                0,
                0,
                bookingRepository.countByInstitution_IdAndRequesterMembership_User_Id(institutionId, user.getId()),
                bookingRepository.countByInstitution_IdAndRequesterMembership_User_IdAndStatus(
                        institutionId, user.getId(), BookingStatus.PENDING),
                incidentReportRepository.countByInstitution_IdAndReporterMembership_User_Id(institutionId, user.getId()));
    }
}
