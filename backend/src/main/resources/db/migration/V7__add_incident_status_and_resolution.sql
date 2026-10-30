ALTER TABLE incident_report
    ADD COLUMN status varchar(20) NOT NULL DEFAULT 'OPEN',
    ADD COLUMN resolution text,
    ADD COLUMN resolved_by_membership_id uuid REFERENCES membership (id),
    ADD COLUMN resolved_at timestamptz;

ALTER TABLE incident_report
    ADD CONSTRAINT chk_incident_report_status
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'));
