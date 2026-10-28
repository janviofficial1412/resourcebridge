# ResourceBridge — Frontend Application

ResourceBridge is an educational resource-sharing web application enabling university members, researchers, and students to discover, reserve, and manage academic equipment and facilities across authorized institutional boundaries.

This frontend is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, designed to integrate seamlessly with an existing **Spring Boot** backend and **PostgreSQL** database.

---

## Tech Stack

* **Core Framework:** React 18, TypeScript (strict mode enabled)
* **Build Tool:** Vite 6
* **Styling:** Tailwind CSS with custom design tokens, responsive typography, and slate/brand palette
* **Routing:** React Router v6
* **Icons:** Lucide React
* **State & Authentication:** React Context, HTTP-only Cookie Sessions (`JSESSIONID`) with CSRF verification (`XSRF-TOKEN` / `X-XSRF-TOKEN`).

---

## Directory Structure

```text
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and local SVGs
│   ├── components/
│   │   ├── layout/         # Navbar, AppLayout, navigation
│   │   ├── ui/             # Reusable design system primitives (Button, etc.)
│   │   ├── resources/      # Resource cards, forms, filters (Phase 5 & 6)
│   │   └── institutions/   # Institution cards, member lists (Phase 4)
│   ├── pages/              # LandingPage, NotFoundPage, and upcoming feature pages
│   ├── types/              # TypeScript domain types mirroring backend models
│   ├── features/           # Feature-specific services and types (Phase 2+)
│   ├── services/           # Global API client and CSRF token resolver
│   ├── App.tsx             # Root router configuration
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind base styles and design tokens
├── .env.example            # Environment configuration template
├── .gitignore              # Git ignore rules for node_modules and builds
├── index.html              # HTML shell
├── INTEGRATION_NOTES.md    # Detailed backend inspection and API contract notes
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # Strict TypeScript configuration
└── vite.config.ts          # Vite build config and backend API proxying
```

---

## Getting Started

### 1. Prerequisites
* Node.js v20+ or v24+
* npm v10+

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Default configuration:
```properties
VITE_API_BASE_URL=http://localhost:8080
```
During development, requests to `/api` are automatically proxied to `http://localhost:8080` via `vite.config.ts`.

### 4. Running the Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173`

### 5. Production Build
```bash
npm run build
```
Generates a static production bundle in `frontend/dist/`.

---

## Integration Architecture & Backend Rules

* All backend integration findings, endpoint specifications, and missing API proposals are documented in [INTEGRATION_NOTES.md](./INTEGRATION_NOTES.md).
* **Stateful Sessions:** No JWTs or sensitive tokens are stored in `localStorage`. Authentication relies on `JSESSIONID` cookies.
* **CSRF Compliance:** State-changing requests (`POST`, `PUT`, `DELETE`) require the `X-XSRF-TOKEN` header containing the value from the `XSRF-TOKEN` cookie issued by Spring Security.
* **No Mocking Fallback:** UI for missing backend endpoints is clearly demarcated rather than faked with simulated mutations.

---

## Phased Development Status

- [x] **Phase 1 — Frontend Foundation:** React + TS + Vite setup, Tailwind design system, Landing Page, routing, inspection and integration notes.
- [ ] **Phase 2 — Authentication:** Session login, registration, CSRF coordination, form validation, AuthContext.
- [ ] **Phase 3 — Authenticated Shell & Dashboard:** Sidebar navigation, role-aware dashboard.
- [ ] **Phase 4 — Institution Management:** Institution directory and member management.
- [ ] **Phase 5 — Resource Management:** Equipment and space listings, details, and CRUD flows.
- [ ] **Phase 6 — Discovery & Sharing:** Search, category filters, and condition-based catalog.
- [ ] **Phase 7 — Polish & End-to-End Verification:** Cross-browser responsiveness, error resilience, final audit.
