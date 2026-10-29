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

### Institution incident reports and AI summaries

Active institution members can submit incident reports through the institution detail page.
The report is stored unchanged; only its author and active institution administrators can open or
summarize it. `POST /api/institutions/{institutionId}/incidents` creates a report,
`GET /api/incidents/{incidentId}` returns an authorized original, and
`POST /api/incidents/{incidentId}/summary` returns a transient six-field AI draft. Generated drafts
are not persisted and are labeled as requiring human review. They do not establish facts or make
administrative decisions.

Summaries use the same local-only Ollama endpoint and configured model as matching. They are subject
to the configured Ollama response timeout; an unavailable model or invalid response returns a
retryable service error. The input is limited to 10,000 characters. Flyway applies the additive
`V6__create_incident_reports.sql` migration at backend startup; ensure the application database
account is permitted to apply pending migrations before deploying this version. Tests mock Ollama
and do not require a running local model.

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
