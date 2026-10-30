# resourcebridge
Secure, AI-powered platform for sharing underutilized institutional resources

## Backend startup (Windows)

The Spring Boot backend requires PostgreSQL connection settings from its process environment:
`DB_URL` (a full `jdbc:postgresql://...` URL), `DB_USERNAME`, and `DB_PASSWORD`.
Spring Boot does not load `.env` files automatically; this repository has no backend dotenv loader.
Set the variables in the same PowerShell session (or in your IDE's run configuration) before starting
the application. Do not commit credentials.

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/<database>"
$env:DB_USERNAME = "<database-user>"
$env:DB_PASSWORD = "<database-password>"
Set-Location backend
.\mvnw.cmd spring-boot:run
```

Replace the example values with connection details for your existing PostgreSQL database. `DB_URL`
must contain the actual JDBC URL, not the literal text `${DB_URL}`. Flyway applies pending
migrations during startup; this does not create or reset the database.

### Local AI resource matching

Natural-language matching uses Ollama on the same machine; it does not send requests to a paid or
external AI service. Start Ollama and make the configured model available locally before using the
matching feature. Defaults are `http://localhost:11434` and `qwen2.5:3b`; override them with
`OLLAMA_BASE_URL` and `OLLAMA_MODEL`. Connection and response timeouts default to 2 and 20 seconds
and can be changed with `OLLAMA_CONNECT_TIMEOUT` and `OLLAMA_RESPONSE_TIMEOUT`.
The backend accepts only local loopback Ollama URLs and bypasses system proxies so request data
cannot be redirected to a remote AI endpoint.

The application still starts if Ollama is unavailable. Matching then returns deterministic
keyword-ranked results and marks them as a fallback. If no lexical overlap can be established, it
may show eligible resources as **unranked fallback suggestions**, clearly labeled as not relevance-
confirmed, instead of incorrectly reporting that no resources exist. Matches are limited to
resources in the user's active institution memberships. Resource status, owner membership,
self-booking, maximum duration, and optional requested-time conflicts are checked by the backend
before ranking. Without exact booking start and end times, a result is not a guarantee that the
resource is free for a particular slot. Current location values are descriptive only; physical
distance is not calculated.

The authenticated endpoint is `POST /api/resources/match`. It accepts a required `request` string
(up to 1,000 characters), the standard optional discovery filters, and optional `startTime` /
`endTime` ISO-8601 timestamps that must be supplied together. The response includes `rankingMethod`
(`AI` or `DETERMINISTIC`), whether a booking window was checked, and resource matches with
field-grounded explanations. Automated tests mock the Ollama client and do not require a model.

For deployment, Ollama is not bundled with ResourceBridge. Install a version supporting Ollama's
JSON Schema structured outputs, run it in the backend's network namespace, pull the configured
model (`ollama pull qwen2.5:3b`), and configure
`OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_CONNECT_TIMEOUT`, and `OLLAMA_RESPONSE_TIMEOUT` for the
backend process. The current security policy permits only loopback Ollama URLs; a separate host or
container service is not supported by this configuration. In a container deployment,
`localhost` means the backend container itself, so Ollama must run in that same container/network
namespace unless the deployment deliberately revises the local-only endpoint policy.

### Institution incident reports and AI summaries

Active institution members can submit incident reports through the institution detail page.
The report is stored unchanged; only its author and active institution administrators can open or
summarize it. `POST /api/institutions/{institutionId}/incidents` creates a report,
`GET /api/incidents/{incidentId}` returns an authorized original, and
`POST /api/incidents/{incidentId}/summary` returns a transient six-field AI draft. Generated drafts
are not persisted and are labeled as requiring human review. They do not establish facts or make
administrative decisions.

Students can list their own reports with `GET /api/incidents/mine`. An active institution
administrator can list institution reports with `GET /api/institutions/{institutionId}/incidents`
and update status/resolution using `PUT /api/incidents/{incidentId}`. Resolved or closed reports
require a resolution note. Administrative status and resolution are separate from the immutable
original report text.

Summaries use the same local-only Ollama endpoint and configured model as matching. They are subject
to the configured Ollama response timeout; an unavailable model or invalid response returns a
retryable service error. The input is limited to 10,000 characters. Flyway applies the additive
`V6__create_incident_reports.sql` and `V7__add_incident_status_and_resolution.sql` migrations at
backend startup; ensure the application database account is permitted to apply pending migrations
before deploying this version. Tests mock Ollama and do not require a running local model.

### Institution roles and workflows

Roles are scoped to each institution: active `ADMIN` memberships manage institutional resources,
categories, membership requests, incoming bookings, and incident resolution; active `MEMBER`
memberships are the student role and may discover resources, request bookings, and submit incidents.
Membership status (`PENDING`, `ACTIVE`, `REJECTED`, or `SUSPENDED`) is independent of role. New
institution creators receive an active `ADMIN` membership. Students can browse
`GET /api/institutions/directory` and request membership with
`POST /api/institutions/{institutionId}/membership-request`; admins approve/reject requests or
deactivate active memberships through the institution member routes.

The authenticated `GET /api/dashboard?institutionId={id}` endpoint returns metrics for the caller's
active role in that institution. Students can request bookings; only active institution admins can
approve or reject them. Rejections require a reason. Booking completion is derived from the end time
of confirmed bookings and is not stored as a separate status. Active admins can view one student's
bookings within their institution through
`GET /api/bookings/institution/{institutionId}/member/{membershipId}`; the endpoint does not expose
that student's bookings from other institutions.

### Backend tests

The Spring context test and PostgreSQL integration tests use the separate `TEST_DB_URL`,
`TEST_DB_USERNAME`, and `TEST_DB_PASSWORD` variables. `TEST_DB_URL` must point to an existing
PostgreSQL database named `resourcebridge_test`; the database tests verify that target before
connecting. Configure these variables in the same PowerShell session before running Maven tests.
They are deliberately not inferred from the production `DB_*` variables, so tests cannot silently
run against the application database. The test profile applies Flyway migrations to that database.

```powershell
$env:TEST_DB_URL = "jdbc:postgresql://localhost:5432/resourcebridge_test"
$env:TEST_DB_USERNAME = "<test-database-user>"
$env:TEST_DB_PASSWORD = "<test-database-password>"
Set-Location backend
.\mvnw.cmd test
```
