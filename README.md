# ResourceBridge

**A secure platform for sharing underutilized institutional resources.**

ResourceBridge connects educational institutions, allowing them to discover, share, request, and manage resources across campuses. It aims to improve resource utilization, reduce unnecessary spending, and encourage collaboration between institutions.

## Live Demo

**Frontend:** https://resourcebridge-jwpx-2v5o0o7rx-janvi-fe7d.vercel.app/

**Backend:** https://resourcebridge-hl2y.onrender.com

## Technology Stack

| Layer               | Technologies                             |
| ------------------- | ---------------------------------------- |
| Frontend            | React 18, TypeScript, Vite, Tailwind CSS |
| Backend             | Java 21, Spring Boot 4.1.2               |
| Security            | Spring Security                          |
| Data Access         | Spring Data JPA, Hibernate               |
| Database            | PostgreSQL, Neon                         |
| Database Migrations | Flyway                                   |
| Build Tool          | Maven                                    |
| AI Integration      | Ollama, Qwen 2.5 3B                      |
| Frontend Deployment | Vercel                                   |
| Backend Deployment  | Render                                   |

## Completed Features

### Institution Management

* Institution registration and authentication.
* Institution directory and membership requests.
* Institution-specific ADMIN and MEMBER roles.
* Membership approval, rejection, and deactivation.

### Resource Management

* Create and manage institutional resources.
* Organize resources using categories.
* Discover resources across eligible institutions.
* Backend validation of resource ownership and availability.

### Booking Management

* Submit resource booking requests.
* Admin approval and rejection workflows.
* Booking status and duration validation.
* Institution-specific booking dashboards.

### Dashboards

* Role-based institutional dashboards.
* Resource and booking information.
* Student booking visibility for authorized administrators.

### Incident Management

* Submit and view incident reports.
* Role-based access to incident information.
* Incident status updates and resolution notes.
* Original incident reports remain unchanged.

### Backend and Database

* REST API implementation.
* Authentication and authorization.
* PostgreSQL integration.
* Flyway database migrations.
* Backend tests and database integration tests.

## AI Features

ResourceBridge has backend integration for two AI-powered features using local Ollama and Qwen 2.5 3B:

1. **AI Resource Matching:** Uses natural-language requests to recommend relevant institutional resources.
2. **AI Incident Summarization:** Generates structured summaries from submitted incident reports.

The application includes deterministic fallback handling for resource matching when Ollama is unavailable. AI-generated incident summaries are drafts and require human review.

## Remaining Work

The core resource-sharing platform and its main workflows are implemented. The remaining major tasks are:

1. **Finalize the two AI tools**

   * Complete and validate AI resource matching.
   * Complete and validate AI incident summarization.
   * Verify model availability and AI functionality in the deployment environment.

2. **Implement a proper email verification system**

   * Email verification during registration.
   * Verification links or OTP-based confirmation.
   * Secure token expiry and verification handling.
   * Prevent unverified accounts from accessing protected functionality.

## Local Backend Setup (Windows)

The backend requires PostgreSQL connection settings through environment variables.

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/<database>"
$env:DB_USERNAME = "<database-user>"
$env:DB_PASSWORD = "<database-password>"

Set-Location backend
.\mvnw.cmd spring-boot:run
```

Replace the example values with your PostgreSQL connection details.

Flyway automatically applies pending database migrations during startup. It does not create or reset the database.

## Local AI Setup

Install Ollama and make the configured model available locally:

```bash
ollama pull qwen2.5:3b
```

Default configuration:

* Ollama URL: `http://localhost:11434`
* Model: `qwen2.5:3b`

The backend can start without Ollama. Resource matching uses deterministic fallback results when the AI service is unavailable.

## Running Backend Tests

Backend tests use a separate PostgreSQL database named `resourcebridge_test`.

```powershell
$env:TEST_DB_URL = "jdbc:postgresql://localhost:5432/resourcebridge_test"
$env:TEST_DB_USERNAME = "<test-database-user>"
$env:TEST_DB_PASSWORD = "<test-database-password>"

Set-Location backend
.\mvnw.cmd test
```

The test database must exist before running the tests.

## Project Goal

ResourceBridge aims to make institutional resources more accessible by creating a connected ecosystem where educational institutions can share existing facilities and reduce resource duplication.

---

**Development Status:** Core platform implemented. Final AI feature completion and email verification remain in progress.
