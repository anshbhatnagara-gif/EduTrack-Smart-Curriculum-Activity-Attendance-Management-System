# EduTrack Backend Implementation Plan

Create a secure, modular, and production-ready REST API backend for **EduTrack** (Smart School Curriculum, Attendance, and Academic Management System) inside the `backend/` directory of the workspace.

---

## User Review Required

> [!IMPORTANT]
> **Database Credentials & Setup**:
> The database connection will use environment variables defined in `.env`. By default, we will attempt to connect to the local MySQL server using `root` and an empty password (or as specified by the environment variables). Please verify if your local MySQL instance has a root password, and update the `.env` file accordingly once created.
>
> **Role Isolation & Security**:
> - Strict role-based access control (RBAC) will be enforced at the middleware layer.
> - Student and Parent routes will enforce ownership checks to ensure users can only view their own or their linked children's data.

---

## Open Questions

> [!NOTE]
> None at the moment. We will proceed with the setup using the default configurations and database structures outlined by the specifications.

---

## Proposed Changes

We will group the creation of directories and files logical to the 9-phase development execution order. All Node.js code will use CommonJS syntax (`require`/`module.exports`).

---

### Component 1: Initial Backend Structure & Server Configuration (Phase 1)

Initialize the Node.js project, install the required packages, set up configurations, write core utility files, and configure the base Express app.

#### [NEW] [package.json](file:///c:/erp/backend/package.json)
Initialize Node.js package definition with the required scripts and dependencies.
- **Dependencies**: `express`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `express-validator`, `multer`, `dotenv`, `cors`, `helmet`, `morgan`, `express-rate-limit`
- **DevDependencies**: `nodemon`

#### [NEW] [.env.example](file:///c:/erp/backend/.env.example) and [c:\erp\backend\.env](file:///c:/erp/backend/.env)
Environment configurations for PORT, database connection, JWT secret, and seed admin accounts.

#### [NEW] [.gitignore](file:///c:/erp/backend/.gitignore)
Standard Git ignore file for Node.js, excluding `node_modules`, `.env`, and the `uploads/` directory content.

#### [NEW] [database.js](file:///c:/erp/backend/src/config/database.js)
Establish a MySQL connection pool using `mysql2/promise` with configuration from environment variables.

#### [NEW] [ApiError.js](file:///c:/erp/backend/src/utils/ApiError.js)
Custom API Error utility to represent HTTP errors (e.g. 400 Bad Request, 404 Not Found, 401 Unauthorized).

#### [NEW] [ApiResponse.js](file:///c:/erp/backend/src/utils/ApiResponse.js)
Standardized success and error response wrappers to match the requested format.

#### [NEW] [asyncHandler.js](file:///c:/erp/backend/src/utils/asyncHandler.js)
Express route handler wrapper to catch async errors and pass them to the central error handler.

#### [NEW] [errorHandler.js](file:///c:/erp/backend/src/middleware/errorHandler.js)
Centralized error handling middleware. Formats and prints readable errors without exposing internal database structures.

#### [NEW] [notFound.js](file:///c:/erp/backend/src/middleware/notFound.js)
Middleware to catch and respond to undefined routes (404 Handler).

#### [NEW] [app.js](file:///c:/erp/backend/src/app.js)
Initial Express app setup implementing:
- Helmet headers
- CORS (configurable via `.env`)
- Rate limiting
- Morgan logging
- JSON and URL-encoded body parsers
- Routing configuration
- Error handling middleware

#### [NEW] [server.js](file:///c:/erp/backend/src/server.js)
Entry point to start the server. Handles database connection tests and implements graceful shutdown for `SIGINT`, `SIGTERM`, `uncaughtException`, and `unhandledRejection`.

---

### Component 2: Database Schema & Seeds (Phase 2)

Create files defining the normalized MySQL database tables, relational keys, constraints, and test inputs.

#### [NEW] [schema.sql](file:///c:/erp/backend/database/schema.sql)
Creates 23 tables (from `users` to `audit_logs`) enforcing primary/foreign keys, unique constraints, and indexes.

#### [NEW] [seed.sql](file:///c:/erp/backend/database/seed.sql)
Includes default records for testing: academic sessions, classes, sections, subjects, student, teacher and parent accounts (with pre-hashed passwords), assignment prompts, and timetable slots.

#### [NEW] [reset.sql](file:///c:/erp/backend/database/reset.sql)
Combines commands to drop all tables and re-create them.

#### [NEW] [testDatabase.js](file:///c:/erp/backend/scripts/testDatabase.js)
Script to test connection and run a simple query to verify database health.

#### [NEW] [createAdmin.js](file:///c:/erp/backend/scripts/createAdmin.js)
Command-line script to check if the Admin user exists from `.env` values, hash the password, and insert the record into `users`.

---

### Component 3: Authentication & Auth Routes (Phase 3)

Build authentication services, tokens, validate inputs, and enforce role authorization.

#### [NEW] [generateToken.js](file:///c:/erp/backend/src/utils/generateToken.js)
Helper to sign JWT access tokens containing user ID, email, and role.

#### [NEW] [authenticate.js](file:///c:/erp/backend/src/middleware/authenticate.js)
Middleware verifying the bearer JWT token in the `Authorization` header and fetching active user profile.

#### [NEW] [authorizeRoles.js](file:///c:/erp/backend/src/middleware/authorizeRoles.js)
Middleware validating if the authenticated user's role matches permitted scopes.

#### [NEW] [validateRequest.js](file:///c:/erp/backend/src/middleware/validateRequest.js)
Helper mapping validation outputs from `express-validator` to a standard error format.

#### [NEW] [auth.validator.js](file:///c:/erp/backend/src/validators/auth.validator.js)
Defines validation checks for user logins, change-password, and registration.

#### [NEW] [auth.service.js](file:///c:/erp/backend/src/services/auth.service.js)
Handles password comparison, user queries, token generation, and updating `last_login_at`.

#### [NEW] [auth.controller.js](file:///c:/erp/backend/src/controllers/auth.controller.js)
Handlers for login, current user session (`/me`), logout, and password change.

#### [NEW] [auth.routes.js](file:///c:/erp/backend/src/routes/auth.routes.js)
Declares POST `/login`, GET `/me`, POST `/logout`, and PUT `/change-password` routes.

---

### Component 4: Admin CRUD & Academic Operations (Phase 4)

Implement core database service operations and REST controllers for Admin to manage users and school structures.

#### [NEW] [user.validator.js](file:///c:/erp/backend/src/validators/user.validator.js) and [academic.validator.js](file:///c:/erp/backend/src/validators/academic.validator.js)
Validation constraints for teachers, students, parents, sessions, classes, sections, and subjects.

#### [NEW] [academic.service.js](file:///c:/erp/backend/src/services/academic.service.js)
Service containing transactional business logic for user creation (combining `users` and `teachers`/`students`/`parents` inside SQL Transactions), class assignment, course enrollments, and parent-student links.

#### [NEW] [admin.controller.js](file:///c:/erp/backend/src/controllers/admin.controller.js)
Admin controller routing user management (CRUD) actions.

#### [NEW] [academic.controller.js](file:///c:/erp/backend/src/controllers/academic.controller.js)
Academic structures management (Sessions, Classes, Sections, Subjects, and Enrollments).

#### [NEW] [admin.routes.js](file:///c:/erp/backend/src/routes/admin.routes.js) and [academic.routes.js](file:///c:/erp/backend/src/routes/academic.routes.js)
Defines routing patterns for endpoints such as `GET /api/admin/teachers`, `POST /api/admin/teachers`, `PUT /api/admin/teachers/:id`, etc.

---

### Component 5: Attendance Module & Audit Logs (Phase 5)

Implement teacher class assignments queries, dynamic calculations, low-attendance warnings, and audit logging.

#### [NEW] [attendance.validator.js](file:///c:/erp/backend/src/validators/attendance.validator.js)
Validation requirements for attendance logging and record updates.

#### [NEW] [calculateAttendance.js](file:///c:/erp/backend/src/utils/calculateAttendance.js)
Core calculations utility computing total, present, late, absent, and leave counts and percentages.

#### [NEW] [attendance.service.js](file:///c:/erp/backend/src/services/attendance.service.js)
Handles queries to insert/update attendance sessions, process bulk updates under transaction, compute dynamic limits, trigger low-attendance warnings (< 75%), and log changes in `audit_logs`.

#### [NEW] [attendance.controller.js](file:///c:/erp/backend/src/controllers/attendance.controller.js)
Exposes endpoint handlers for marking, viewing, and correcting attendance.

#### [NEW] [attendance.routes.js](file:///c:/erp/backend/src/routes/attendance.routes.js)
Attendance routing, mapping endpoints to teacher and admin authorization checks.

---

### Component 6: Materials & Assignments Module (Phase 6)

Build Multer-powered uploads, file routing, materials mapping, assignment publishing, and student submissions.

#### [NEW] [upload.js](file:///c:/erp/backend/src/middleware/upload.js)
Multer upload setup configuring maximum size (from `MAX_FILE_SIZE_MB` in `.env`) and checking MIME types (PDF, Word, PPT, image).

#### [NEW] [assignment.validator.js](file:///c:/erp/backend/src/validators/assignment.validator.js)
Validation checks for adding assignments or filing submissions.

#### [NEW] [assignment.service.js](file:///c:/erp/backend/src/services/assignment.service.js)
Encapsulates operations for posting assignments, evaluating submissions, and calculating student response statuses (pending, late, evaluated).

#### [NEW] [material.controller.js](file:///c:/erp/backend/src/controllers/material.controller.js) and [assignment.controller.js](file:///c:/erp/backend/src/controllers/assignment.controller.js)
Handles request contexts and maps service outputs to structured API responses.

#### [NEW] [material.routes.js](file:///c:/erp/backend/src/routes/material.routes.js) and [assignment.routes.js](file:///c:/erp/backend/src/routes/assignment.routes.js)
Declares POST, GET, PUT, and DELETE endpoints with file upload hook and appropriate validators.

---

### Component 7: Exams, Marks & Timetables (Phase 7)

Implement exam schedules, marks recording with validation, grade mapping calculations, and timetable collision prevention.

#### [NEW] [marks.controller.js](file:///c:/erp/backend/src/controllers/marks.controller.js) and [timetable.controller.js](file:///c:/erp/backend/src/controllers/timetable.controller.js)
Controllers handling marks insertion, grade computation, and timetable scheduling.

#### [NEW] [marks.routes.js](file:///c:/erp/backend/src/routes/marks.routes.js) and [timetable.routes.js](file:///c:/erp/backend/src/routes/timetable.routes.js)
Defines routes. Enforces timetable validations (verifying that no teacher, class/section, or room has scheduling conflicts at the same time).

---

### Component 8: Announcements, Notifications, Dashboards & Analytics (Phase 8)

Aggregated reports, simple rule-based student risk evaluation, in-app notifications, and custom dashboards.

#### [NEW] [announcement.controller.js](file:///c:/erp/backend/src/controllers/announcement.controller.js), [notification.controller.js](file:///c:/erp/backend/src/controllers/notification.controller.js), and [report.controller.js](file:///c:/erp/backend/src/controllers/report.controller.js)
Processes target-role announcements, marks notifications as read, and structures statistics.

#### [NEW] [report.service.js](file:///c:/erp/backend/src/services/report.service.js)
Gathers metrics for dashboard queries. Evaluates simple rule-based student categorization (GOOD, AVERAGE, NEEDS_ATTENTION, AT_RISK) with concrete reasons.

#### [NEW] [announcement.routes.js](file:///c:/erp/backend/src/routes/announcement.routes.js), [notification.routes.js](file:///c:/erp/backend/src/routes/notification.routes.js), and [report.routes.js](file:///c:/erp/backend/src/routes/report.routes.js)
Exposes route definitions for notifications, announcements, and roles dashboards.

---

### Component 9: Testing, Verification & Integration (Phase 9)

Automated verification scripts to validate basic features (health API, authorization levels, databases).

#### [NEW] [health.test.js](file:///c:/erp/backend/tests/health.test.js) and [auth.test.js](file:///c:/erp/backend/tests/auth.test.js)
Node.js test runner tests using the built-in runner `node --test`.

#### [NEW] [API_TESTING.md](file:///c:/erp/backend/API_TESTING.md)
Document describing typical request/response bodies and HTTP queries.

#### [NEW] [README.md](file:///c:/erp/backend/README.md)
Details architecture, setup commands, MySQL commands, credentials, and configuration steps.

---

## Verification Plan

We will run integration verification checks to ensure security and robustness.

### Automated Tests
- Test database health:
  ```bash
  npm run db:test
  ```
- Seed default credentials:
  ```bash
  npm run seed:admin
  ```
- Run Node test suites:
  ```bash
  npm test
  ```

### Manual Verification
- We will test REST end-to-end flows using a script.
- Verify JWT verification, role-based authorization blocks, and timetable time collision checks.
- Test duplicate attendance logs and low attendance threshold alerts.
