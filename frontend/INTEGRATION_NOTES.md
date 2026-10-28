# ResourceBridge — Backend Inspection & Integration Notes

This document records the architectural findings, actual backend contracts, authentication mechanisms, and missing API endpoints discovered during the backend inspection of the ResourceBridge application.

---

## 1. Discovered Backend Architecture & Configuration

* **Framework:** Spring Boot 4.x / Spring Framework 7.x, Spring Security 7.x, Spring Data JPA, Flyway.
* **Database:** PostgreSQL with Flyway migration (`V1__initial_schema.sql`).
* **Server Port:** Default Spring Boot port `8080` (accessible at `http://localhost:8080`).
* **Context Path:** `/` (empty context path).
* **Package Structure:**
  * Base: `com.resourcebridge.backend`
  * Identity: `com.resourcebridge.backend.identity` (Controllers, Entities, DTOs, Services, Repositories)
  * Security: `com.resourcebridge.backend.security` (`SecurityConfig`)
  * Global Exceptions: `com.resourcebridge.backend.ApiExceptionHandler`

---

## 2. Authentication & Session Management

* **Authentication Type:** Stateful, session-based authentication using HTTP cookies. **No JWT.**
* **Session Cookie:** `JSESSIONID`
* **Session Creation Policy:** `SessionCreationPolicy.IF_REQUIRED`
* **Session Fixation Protection:** In `AuthController.login`, if a session already exists, `httpRequest.changeSessionId()` is invoked before creating a new `SecurityContext`.
* **Security Context Storage:** Saved in `HttpSessionSecurityContextRepository` under the session.
* **Password Encoding:** BCrypt with strength 10 (`BCryptPasswordEncoder`).
* **Unauthenticated Access:** Direct requests to protected endpoints return a bare HTTP 401 Unauthorized (`HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)`), without redirects.

### Critical Finding: Absence of Session Status Endpoint (`/api/auth/me`)
* The backend currently does **not** expose a `GET /api/auth/me` or `GET /api/auth/session` endpoint.
* `POST /api/auth/login` returns `{ "email": "<user-email>" }`.
* **Frontend Strategy:**
  * Do **not** store session tokens or passwords in `localStorage`.
  * Maintain active session state in React Memory (`AuthContext`).
  * On initial app load or refresh, probe authentication status via a lightweight authenticated check (or attempt to fetch user details if an endpoint is provided, falling back gracefully to unauthenticated state if 401 is received).

---

## 3. CSRF Protection & Token Handling

* **CSRF Status:** Enabled.
* **Repository:** `CookieCsrfTokenRepository.withHttpOnlyFalse()`
* **Cookie Name:** `XSRF-TOKEN` (readable by JavaScript / frontend SPA).
* **Header Name Expected:** `X-XSRF-TOKEN`
* **Handler:** `CsrfTokenRequestAttributeHandler`
* **Exempt Endpoints:**
  * `POST /api/auth/register` is explicitly exempt (`ignoringRequestMatchers(registerEndpoint)`).
* **Protected Endpoints:**
  * `POST /api/auth/login` requires CSRF verification.
  * `POST /api/auth/logout` requires CSRF verification.
  * All subsequent mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require CSRF verification.
* **Token Loading Mechanism (`CsrfCookieFilter`):**
  * Spring Security loads CSRF tokens lazily. `SecurityConfig` includes a custom `CsrfCookieFilter` added after `BasicAuthenticationFilter` that calls `csrfToken.getToken()`.
  * Making any GET request or calling `POST /api/auth/register` triggers the filter to issue the `Set-Cookie: XSRF-TOKEN=<token>; Path=/` response header.
* **Frontend Integration Requirements:**
  1. For state-changing requests, the frontend must read the `XSRF-TOKEN` cookie and send its value in the `X-XSRF-TOKEN` request header.
  2. All fetch requests to the backend must include `credentials: "include"` (or `same-origin`) to pass both `JSESSIONID` and `XSRF-TOKEN`.

---

## 4. Existing API Contracts

### 4.1. User Registration
* **Endpoint:** `POST /api/auth/register`
* **Authorization:** Public (`permitAll`)
* **CSRF Protection:** Exempt
* **Content-Type:** `application/json`
* **Request Body (`RegistrationRequest`):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "fullName": "Jane Doe"
  }
  ```
  * **Validation Rules:**
    * `email`: Not blank, valid email format, max 254 chars, converted to lowercase trim.
    * `password`: Not blank, min 8 characters, max 72 bytes in UTF-8 (`@MaxUtf8Bytes(72)`).
    * `fullName`: Not blank, max 200 characters.
* **Success Response:** HTTP `201 Created`
  ```json
  {
    "id": "e7b0c95a-2e4b-4b1e-bfa1-5a6361a92440",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "createdAt": "2026-10-28T12:00:00Z"
  }
  ```
* **Error Responses:**
  * HTTP `400 Bad Request` — Validation failed (`ApiError` with `fieldErrors` array).
  * HTTP `409 Conflict` — Email already registered (`An account with this email already exists`).

### 4.2. User Login
* **Endpoint:** `POST /api/auth/login`
* **Authorization:** Public (`permitAll`)
* **CSRF Protection:** **Enforced** (Must provide `X-XSRF-TOKEN` header matching `XSRF-TOKEN` cookie).
* **Content-Type:** `application/json`
* **Request Body (`LoginRequest`):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
  * **Validation Rules:**
    * `email`: Not blank, max 254 chars, converted to lowercase trim.
    * `password`: Not blank.
* **Success Response:** HTTP `200 OK`
  * Sets `JSESSIONID` cookie (HttpOnly).
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Error Responses:**
  * HTTP `401 Unauthorized` — Bad credentials or disabled account:
    ```json
    {
      "status": 401,
      "error": "Unauthorized",
      "message": "Invalid email or password",
      "fieldErrors": []
    }
    ```
  * HTTP `403 Forbidden` — CSRF token missing or mismatch.

### 4.3. User Logout
* **Endpoint:** `POST /api/auth/logout`
* **Authorization:** Authenticated / Public
* **CSRF Protection:** **Enforced** (`X-XSRF-TOKEN` header required).
* **Request Body:** None
* **Success Response:** HTTP `204 No Content`
  * Invalidates session on server, clears `SecurityContext`.

### 4.4. Standard API Error Response Format
All errors handled by `ApiExceptionHandler` follow the `ApiError` structure:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": [
    {
      "field": "email",
      "message": "must be a well-formed email address"
    }
  ]
}
```

---

## 5. Database Schema vs Missing API Endpoints

The Flyway migration (`V1__initial_schema.sql`) defines rich domain tables that **do not currently have corresponding Spring Boot controllers or REST endpoints**:

| Domain Table | Database Details | Existing Controller / API | Status & Action |
| :--- | :--- | :--- | :--- |
| `app_user` | `id`, `email`, `password_hash`, `full_name`, `enabled`, `created_at`, `updated_at` | `RegistrationController`, `AuthController` | Fully integrated for Register & Login. **Missing:** `GET /api/auth/me`. |
| `institution` | `id`, `name`, `slug`, `timezone`, `status` (`ACTIVE`/`SUSPENDED`) | **None** | Needs controller & service. |
| `membership` | `id`, `user_id`, `institution_id`, `role` (`INSTITUTION_ADMIN`, `RESOURCE_OWNER`, `TRAINER`, `MEMBER`, `BORROWER`), `status` (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`) | **None** | Needs membership controller & service. |
| `resource_category` | `id`, `institution_id`, `name`, `description` | **None** | Needs category controller & service. |
| `resource` | `id`, `institution_id`, `owner_membership_id`, `category_id`, `name`, `description`, `resource_type` (`EQUIPMENT`/`SPACE`), `condition_rating`, `status`, `requires_approval`, `max_booking_minutes` | **None** | Needs resource CRUD controller & service. |
| `audit_log` | `id`, `institution_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `details`, `occurred_at` | **None** | Append-only database table. |

---

## 6. Proposed Missing API Contracts

To facilitate future backend implementation without breaking frontend code, the frontend defines standard service interfaces conforming to these proposed contracts:

### 6.1. Current User Profile: `GET /api/auth/me`
* **Response:**
  ```json
  {
    "id": "e7b0c95a-2e4b-4b1e-bfa1-5a6361a92440",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "createdAt": "2026-10-28T12:00:00Z"
  }
  ```

### 6.2. Institutions API
* `GET /api/institutions` — List institutions accessible to user.
* `POST /api/institutions` — Create institution:
  ```json
  {
    "name": "Oakridge University",
    "slug": "oakridge-univ",
    "timezone": "UTC"
  }
  ```
* `GET /api/institutions/{id}` — Get institution details.
* `GET /api/institutions/{id}/members` — List institution members.

### 6.3. Resources API
* `GET /api/resources?institutionId={id}&category={category}&query={q}` — Filtered resource discovery.
* `GET /api/resources/{id}` — Resource details with owner & category info.
* `POST /api/resources` — Create resource:
  ```json
  {
    "institutionId": "...",
    "categoryId": "...",
    "name": "3D Printer Ender 3",
    "description": "High precision printer in Lab 4",
    "resourceType": "EQUIPMENT",
    "conditionRating": "GOOD",
    "requiresApproval": true,
    "maxBookingMinutes": 240
  }
  ```
* `PUT /api/resources/{id}` — Update resource details.
* `DELETE /api/resources/{id}` — Delete or retire resource.

### 6.4. Resource Categories API
* `GET /api/institutions/{id}/categories` — Categories within an institution.
* `POST /api/institutions/{id}/categories` — Create category.

---

## 7. Frontend Integration Strategy for Missing Endpoints

1. **No Fake Backend Mocking:** We never simulate network successes or store fake mutations in localStorage.
2. **Clear UI States:** When an institution or resource feature depends on a missing API, the UI clearly displays "Backend API Pending Integration" or provides disabled action states with explanatory tooltips.
3. **Graceful Degradation:** The UI application structure is fully built and responsive, with dedicated typed service layers ready to connect as soon as backend endpoints are added.
