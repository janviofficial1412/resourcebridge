package com.resourcebridge.backend.booking;

import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.resource.Resource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_membership_id", nullable = false)
    private Membership requesterMembership;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "requester_message", columnDefinition = "text")
    private String requesterMessage;

    @Column(name = "decision_message", columnDefinition = "text")
    private String decisionMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_membership_id")
    private Membership decidedByMembership;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Booking() {
    }

    public Booking(Institution institution,
                   Resource resource,
                   Membership requesterMembership,
                   Instant startTime,
                   Instant endTime,
                   String requesterMessage) {
        this.institution = institution;
        this.resource = resource;
        this.requesterMembership = requesterMembership;
        this.startTime = startTime;
        this.endTime = endTime;
        this.requesterMessage = requesterMessage;
        this.status = BookingStatus.PENDING;
    }

    public Booking(Institution institution,
                   Resource resource,
                   Membership requesterMembership,
                   BookingStatus status,
                   Instant startTime,
                   Instant endTime,
                   String requesterMessage,
                   String decisionMessage,
                   Membership decidedByMembership,
                   Instant decidedAt,
                   Instant cancelledAt) {
        this.institution = institution;
        this.resource = resource;
        this.requesterMembership = requesterMembership;
        this.status = (status == null) ? BookingStatus.PENDING : status;
        this.startTime = startTime;
        this.endTime = endTime;
        this.requesterMessage = requesterMessage;
        this.decisionMessage = decisionMessage;
        this.decidedByMembership = decidedByMembership;
        this.decidedAt = decidedAt;
        this.cancelledAt = cancelledAt;
    }

    public UUID getId() {
        return id;
    }

    public Institution getInstitution() {
        return institution;
    }

    public void setInstitution(Institution institution) {
        this.institution = institution;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public Membership getRequesterMembership() {
        return requesterMembership;
    }

    public void setRequesterMembership(Membership requesterMembership) {
        this.requesterMembership = requesterMembership;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public String getRequesterMessage() {
        return requesterMessage;
    }

    public void setRequesterMessage(String requesterMessage) {
        this.requesterMessage = requesterMessage;
    }

    public String getDecisionMessage() {
        return decisionMessage;
    }

    public void setDecisionMessage(String decisionMessage) {
        this.decisionMessage = decisionMessage;
    }

    public Membership getDecidedByMembership() {
        return decidedByMembership;
    }

    public void setDecidedByMembership(Membership decidedByMembership) {
        this.decidedByMembership = decidedByMembership;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
