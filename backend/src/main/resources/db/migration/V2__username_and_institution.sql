-- ==============================================================================
-- Migration V2: Introduce unique username and relax email constraint
-- ==============================================================================

-- 1. Add username column as nullable first to allow backfilling existing records
ALTER TABLE app_user ADD COLUMN username varchar(50);

-- 2. Backfill existing records if any exist using the local part of the email
UPDATE app_user
SET username = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9_.-]', '_', 'g'))
WHERE username IS NULL;

-- Ensure all backfilled usernames satisfy the minimum length requirement (>= 3 chars)
UPDATE app_user
SET username = lower(substring(replace(id::text, '-', ''), 1, 8))
WHERE length(username) < 3;

-- 3. Enforce NOT NULL, uniqueness, and formatting constraints on username
ALTER TABLE app_user ALTER COLUMN username SET NOT NULL;
ALTER TABLE app_user ADD CONSTRAINT uq_app_user_username UNIQUE (username);
ALTER TABLE app_user ADD CONSTRAINT ck_app_user_username_lower CHECK (username = lower(username));
ALTER TABLE app_user ADD CONSTRAINT ck_app_user_username_format CHECK (username ~ '^[a-z0-9_.-]{3,50}$');

-- 4. Relax email to optional while retaining format and uniqueness when populated
ALTER TABLE app_user ALTER COLUMN email DROP NOT NULL;
ALTER TABLE app_user DROP CONSTRAINT ck_app_user_email_shape;
ALTER TABLE app_user ADD CONSTRAINT ck_app_user_email_shape CHECK (email IS NULL OR position('@' IN email) > 1);
ALTER TABLE app_user DROP CONSTRAINT ck_app_user_email_lower;
ALTER TABLE app_user ADD CONSTRAINT ck_app_user_email_lower CHECK (email IS NULL OR email = lower(email));
