CREATE TABLE incident_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id uuid NOT NULL REFERENCES institution (id) ON DELETE CASCADE,
    reporter_membership_id uuid NOT NULL,
    report_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_incident_report_reporter_institution
        FOREIGN KEY (reporter_membership_id, institution_id)
        REFERENCES membership (id, institution_id)
);

CREATE INDEX idx_incident_report_institution_created
    ON incident_report (institution_id, created_at DESC);
CREATE INDEX idx_incident_report_reporter_created
    ON incident_report (reporter_membership_id, created_at DESC);
