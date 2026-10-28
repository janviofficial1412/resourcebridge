package com.resourcebridge.backend.resource;

import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
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
@Table(name = "resource")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_membership_id", nullable = false)
    private Membership ownerMembership;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ResourceCategory category;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    private String description = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 20)
    private ResourceType resourceType;

    @Column(name = "location", length = 300)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_rating", nullable = false, length = 20)
    private ConditionRating conditionRating = ConditionRating.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ResourceStatus status = ResourceStatus.DRAFT;

    @Column(name = "requires_approval", nullable = false)
    private boolean requiresApproval = true;

    @Column(name = "max_booking_minutes")
    private Integer maxBookingMinutes;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Resource() {
    }

    public Resource(Institution institution,
                    Membership ownerMembership,
                    ResourceCategory category,
                    String name,
                    ResourceType resourceType) {
        this.institution = institution;
        this.ownerMembership = ownerMembership;
        this.category = category;
        this.name = name;
        this.resourceType = resourceType;
        this.description = "";
        this.conditionRating = ConditionRating.GOOD;
        this.status = ResourceStatus.DRAFT;
        this.requiresApproval = true;
    }

    public Resource(Institution institution,
                    Membership ownerMembership,
                    ResourceCategory category,
                    String name,
                    String description,
                    ResourceType resourceType,
                    String location,
                    ConditionRating conditionRating,
                    ResourceStatus status,
                    boolean requiresApproval,
                    Integer maxBookingMinutes) {
        this.institution = institution;
        this.ownerMembership = ownerMembership;
        this.category = category;
        this.name = name;
        this.description = (description == null) ? "" : description;
        this.resourceType = resourceType;
        this.location = location;
        this.conditionRating = (conditionRating == null) ? ConditionRating.GOOD : conditionRating;
        this.status = (status == null) ? ResourceStatus.DRAFT : status;
        this.requiresApproval = requiresApproval;
        this.maxBookingMinutes = maxBookingMinutes;
    }

    public UUID getId() {
        return id;
    }

    public Institution getInstitution() {
        return institution;
    }

    public Membership getOwnerMembership() {
        return ownerMembership;
    }

    public ResourceCategory getCategory() {
        return category;
    }

    public void setCategory(ResourceCategory category) {
        this.category = category;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = (description == null) ? "" : description;
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public ConditionRating getConditionRating() {
        return conditionRating;
    }

    public void setConditionRating(ConditionRating conditionRating) {
        this.conditionRating = conditionRating;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
    }

    public boolean isRequiresApproval() {
        return requiresApproval;
    }

    public void setRequiresApproval(boolean requiresApproval) {
        this.requiresApproval = requiresApproval;
    }

    public Integer getMaxBookingMinutes() {
        return maxBookingMinutes;
    }

    public void setMaxBookingMinutes(Integer maxBookingMinutes) {
        this.maxBookingMinutes = maxBookingMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
