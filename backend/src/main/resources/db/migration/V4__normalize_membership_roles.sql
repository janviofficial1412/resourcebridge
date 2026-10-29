-- Normalize institution roles while retaining BORROWER's restricted legacy behavior.
ALTER TABLE membership DROP CONSTRAINT ck_membership_role;

UPDATE membership
SET role = CASE role
    WHEN 'INSTITUTION_ADMIN' THEN 'ADMIN'
    WHEN 'RESOURCE_OWNER' THEN 'MEMBER'
    WHEN 'TRAINER' THEN 'MEMBER'
    ELSE role
END;

ALTER TABLE membership
    ADD CONSTRAINT ck_membership_role
        CHECK (role IN ('ADMIN', 'MEMBER', 'BORROWER'));
