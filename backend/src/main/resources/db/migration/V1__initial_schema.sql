CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------- institution
CREATE TABLE institution (
                             id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                             name        varchar(200) NOT NULL,
                             slug        varchar(64)  NOT NULL,
                             timezone    varchar(64)  NOT NULL DEFAULT 'UTC',
                             status      varchar(20)  NOT NULL DEFAULT 'ACTIVE',
                             created_at  timestamptz  NOT NULL DEFAULT now(),
                             updated_at  timestamptz  NOT NULL DEFAULT now(),
                             CONSTRAINT uq_institution_slug   UNIQUE (slug),
                             CONSTRAINT ck_institution_slug   CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_institution_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

-- ------------------------------------------------------------------- app_user
CREATE TABLE app_user (
                          id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                          email          varchar(254) NOT NULL,
                          password_hash  varchar(100) NOT NULL,
                          full_name      varchar(200) NOT NULL,
                          enabled        boolean      NOT NULL DEFAULT true,
                          created_at     timestamptz  NOT NULL DEFAULT now(),
                          updated_at     timestamptz  NOT NULL DEFAULT now(),
                          CONSTRAINT uq_app_user_email       UNIQUE (email),
                          CONSTRAINT ck_app_user_email_lower CHECK (email = lower(email)),
                          CONSTRAINT ck_app_user_email_shape CHECK (position('@' IN email) > 1)
);

-- ----------------------------------------------------------------- membership
CREATE TABLE membership (
                            id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id                   uuid        NOT NULL REFERENCES app_user (id),
                            institution_id            uuid        NOT NULL REFERENCES institution (id),
                            role                      varchar(30) NOT NULL,
                            status                    varchar(20) NOT NULL DEFAULT 'PENDING',
                            verified_by_membership_id uuid,
                            verified_at               timestamptz,
                            created_at                timestamptz NOT NULL DEFAULT now(),
                            updated_at                timestamptz NOT NULL DEFAULT now(),
                            CONSTRAINT uq_membership_user_institution UNIQUE (user_id, institution_id),
    -- Target for composite foreign keys that must stay inside one institution.
                            CONSTRAINT uq_membership_id_institution   UNIQUE (id, institution_id),
                            CONSTRAINT ck_membership_role   CHECK (role IN
                                                                   ('INSTITUTION_ADMIN', 'RESOURCE_OWNER', 'TRAINER', 'MEMBER', 'BORROWER')),
                            CONSTRAINT ck_membership_status CHECK (status IN
                                                                   ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
                            CONSTRAINT ck_membership_active_verified CHECK (status <> 'ACTIVE' OR verified_at IS NOT NULL),
    -- The verifier must be a membership of the SAME institution.
                            CONSTRAINT fk_membership_verifier FOREIGN KEY (verified_by_membership_id, institution_id)
                                REFERENCES membership (id, institution_id)
);
CREATE INDEX idx_membership_institution_status ON membership (institution_id, status);

-- ------------------------------------------------------------ resource_category
CREATE TABLE resource_category (
                                   id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                                   institution_id uuid         NOT NULL REFERENCES institution (id),
                                   name           varchar(100) NOT NULL,
                                   description    varchar(500),
                                   created_at     timestamptz  NOT NULL DEFAULT now(),
                                   updated_at     timestamptz  NOT NULL DEFAULT now(),
                                   CONSTRAINT uq_resource_category_id_institution UNIQUE (id, institution_id)
);
CREATE UNIQUE INDEX uq_resource_category_name
    ON resource_category (institution_id, lower(name));

-- ------------------------------------------------------------------- resource
CREATE TABLE resource (
                          id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                          institution_id       uuid         NOT NULL REFERENCES institution (id),
                          owner_membership_id  uuid         NOT NULL,
                          category_id          uuid         NOT NULL,
                          name                 varchar(200) NOT NULL,
                          description          text         NOT NULL DEFAULT '',
                          resource_type        varchar(20)  NOT NULL,
                          location             varchar(300),
                          condition_rating     varchar(20)  NOT NULL DEFAULT 'GOOD',
                          status               varchar(20)  NOT NULL DEFAULT 'DRAFT',
                          requires_approval    boolean      NOT NULL DEFAULT true,
                          max_booking_minutes  integer,
                          created_at           timestamptz  NOT NULL DEFAULT now(),
                          updated_at           timestamptz  NOT NULL DEFAULT now(),
                          CONSTRAINT ck_resource_type      CHECK (resource_type IN ('EQUIPMENT', 'SPACE')),
                          CONSTRAINT ck_resource_condition CHECK (condition_rating IN ('NEW', 'GOOD', 'FAIR', 'POOR')),
                          CONSTRAINT ck_resource_status    CHECK (status IN ('DRAFT', 'AVAILABLE', 'MAINTENANCE', 'RETIRED')),
                          CONSTRAINT ck_resource_max_minutes CHECK (max_booking_minutes IS NULL OR max_booking_minutes > 0),
    -- Tenant isolation enforced by the database: owner and category must belong to the same institution.
                          CONSTRAINT fk_resource_owner    FOREIGN KEY (owner_membership_id, institution_id)
                              REFERENCES membership (id, institution_id),
                          CONSTRAINT fk_resource_category FOREIGN KEY (category_id, institution_id)
                              REFERENCES resource_category (id, institution_id)
);
CREATE INDEX idx_resource_institution_status   ON resource (institution_id, status);
CREATE INDEX idx_resource_institution_category ON resource (institution_id, category_id);
CREATE INDEX idx_resource_owner                ON resource (owner_membership_id);

-- ------------------------------------------------------------------ audit_log
CREATE TABLE audit_log (
                           id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                           institution_id uuid         REFERENCES institution (id),   -- NULL for platform-level events (e.g. login)
                           actor_user_id  uuid         REFERENCES app_user (id),      -- NULL for system actions
                           action         varchar(100) NOT NULL,
                           entity_type    varchar(50),
                           entity_id      uuid,
                           details        jsonb        NOT NULL DEFAULT '{}'::jsonb,
                           occurred_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_institution_time ON audit_log (institution_id, occurred_at DESC);
CREATE INDEX idx_audit_log_entity           ON audit_log (entity_type, entity_id);

CREATE FUNCTION audit_log_block_modification() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only (% is not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update_delete
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_modification();
CREATE TRIGGER trg_audit_log_no_truncate
    BEFORE TRUNCATE ON audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_modification();

-- ------------------------------------------------------- updated_at triggers
CREATE TRIGGER trg_institution_updated_at       BEFORE UPDATE ON institution
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_user_updated_at          BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_membership_updated_at        BEFORE UPDATE ON membership
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resource_category_updated_at BEFORE UPDATE ON resource_category
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resource_updated_at          BEFORE UPDATE ON resource
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();