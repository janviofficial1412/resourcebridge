CREATE TABLE image_asset (
    id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key         varchar(80)  NOT NULL UNIQUE,
    content_type        varchar(30)  NOT NULL,
    size_bytes          bigint       NOT NULL,
    width               integer      NOT NULL,
    height              integer      NOT NULL,
    resource_id         uuid         REFERENCES resource (id) ON DELETE CASCADE,
    institution_id      uuid         REFERENCES institution (id) ON DELETE CASCADE,
    uploaded_by_user_id uuid         NOT NULL REFERENCES app_user (id),
    created_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_image_asset_content_type
        CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT ck_image_asset_size CHECK (size_bytes > 0 AND size_bytes <= 5242880),
    CONSTRAINT ck_image_asset_dimensions CHECK (width > 0 AND height > 0),
    CONSTRAINT ck_image_asset_target CHECK (
        (resource_id IS NOT NULL AND institution_id IS NULL)
        OR (resource_id IS NULL AND institution_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_image_asset_resource ON image_asset (resource_id) WHERE resource_id IS NOT NULL;
CREATE UNIQUE INDEX uq_image_asset_institution ON image_asset (institution_id) WHERE institution_id IS NOT NULL;
