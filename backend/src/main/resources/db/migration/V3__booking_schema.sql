-- ==============================================================================
-- Migration V3: Introduce Booking domain schema and composite tenant isolation
-- ==============================================================================

-- 1. Add composite unique constraint on resource (id, institution_id)
--    so that booking can reference (resource_id, institution_id) for tenant isolation
ALTER TABLE resource ADD CONSTRAINT uq_resource_id_institution UNIQUE (id, institution_id);

-- 2. Create booking table
CREATE TABLE booking (
    id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id             uuid        NOT NULL REFERENCES institution (id),
    resource_id                uuid        NOT NULL,
    requester_membership_id    uuid        NOT NULL,
    status                     varchar(20) NOT NULL DEFAULT 'PENDING',
    start_time                 timestamptz NOT NULL,
    end_time                   timestamptz NOT NULL,
    requester_message          text,
    decision_message           text,
    decided_by_membership_id   uuid,
    decided_at                 timestamptz,
    cancelled_at               timestamptz,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),

    -- Unique constraint for composite tenant isolation targets
    CONSTRAINT uq_booking_id_institution UNIQUE (id, institution_id),

    -- Status validity check
    CONSTRAINT ck_booking_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')),

    -- Time range validity: strictly positive duration
    CONSTRAINT ck_booking_time_range CHECK (start_time < end_time),

    -- Database-enforced tenant isolation:
    -- Resource must belong to the booking's institution
    CONSTRAINT fk_booking_resource FOREIGN KEY (resource_id, institution_id)
        REFERENCES resource (id, institution_id),

    -- Requester membership must belong to the booking's institution
    CONSTRAINT fk_booking_requester FOREIGN KEY (requester_membership_id, institution_id)
        REFERENCES membership (id, institution_id),

    -- Decider membership (if present) must belong to the booking's institution
    CONSTRAINT fk_booking_decision_maker FOREIGN KEY (decided_by_membership_id, institution_id)
        REFERENCES membership (id, institution_id)
);

-- 3. Indexes for query optimization
CREATE INDEX idx_booking_institution_status ON booking (institution_id, status);
CREATE INDEX idx_booking_resource_status_time ON booking (resource_id, status, start_time, end_time);
CREATE INDEX idx_booking_requester ON booking (requester_membership_id);

-- 4. Automatically maintain updated_at timestamp
CREATE TRIGGER trg_booking_updated_at BEFORE UPDATE ON booking
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
