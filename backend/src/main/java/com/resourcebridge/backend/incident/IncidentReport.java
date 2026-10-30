package com.resourcebridge.backend.incident;

import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_report")
public class IncidentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_membership_id", nullable = false)
    private Membership reporterMembership;

    @Column(name = "report_text", nullable = false, columnDefinition = "text", updatable = false)
    private String reportText;

    @Column(name = "status", nullable = false, length = 20)
    private String status = IncidentStatus.OPEN.name();

    @Column(name = "resolution", columnDefinition = "text")
    private String resolution;

    @Column(name = "resolved_by_membership_id")
    private UUID resolvedByMembershipId;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected IncidentReport() {
    }

    public IncidentReport(Institution institution, Membership reporterMembership, String reportText) {
        this.institution = institution;
        this.reporterMembership = reporterMembership;
        this.reportText = reportText;
    }

    public UUID getId() {
        return id;
    }

    public Institution getInstitution() {
        return institution;
    }

    public Membership getReporterMembership() {
        return reporterMembership;
    }

    public String getReportText() {
        return reportText;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public UUID getResolvedByMembershipId() {
        return resolvedByMembershipId;
    }

    public void setResolvedByMembershipId(UUID resolvedByMembershipId) {
        this.resolvedByMembershipId = resolvedByMembershipId;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
