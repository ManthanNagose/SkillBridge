# SkillBridge — Frontend to Backend Handoff

This document describes the SkillBridge frontend **as it exists in this repository today**. It is for the backend developer, or an AI assistant, connecting the frontend to Supabase.

It was written by reading the source files listed below. Claims are labelled with these statuses:

| Label | Meaning |
|---|---|
| **Verified** | Implemented and checked during this documentation task, in a running browser (see [section 12](#12-verification-evidence)). |
| **Implemented** | Present in the code and read during this task, but not exercised in this task's browser check. |
| **Mocked** | Works only against the in-memory mock store. There is no real backend behind it. |
| **Not implemented** | Required by the specification, but no code exists for it. |
| **Pending** | Depends on a backend decision or confirmation that hasn't been made. |

**About the product specification (PRD).** The frozen PRD ("SkillBridge MVP Specification", version 4) is **not stored in this repository**. It was published as a private document by the frontend developer, so ask them for access. Requirement IDs in this document (FR-…, D-…, E-…, A-…, B-…, F-…) refer to that specification, and the same IDs appear in code comments. Tracker items B-01 to B-13 and A-01 to A-05 are the backend's open decisions.

---

## 1. Project overview

**What SkillBridge does:** a web app where small teams plan projects, split work into tasks, assign tasks to members and see progress in one place.

**MVP scope** (from the PRD):

- Email and password authentication, with email verification and password reset.
- A dashboard.
- Projects that can be archived and restored.
- Per-project members with two roles, Owner and Member.
- Tasks with a fixed status set, priority, one assignee and a due date.
- A profile with a display name and avatar initials.
- A landing page.

**Current state:** the frontend MVP screens are built and run entirely on mock data. **No backend is connected.** `@supabase/supabase-js` is listed in `package.json` but is **not imported anywhere** in `src/`.

### Technology stack

Versions were read from `node_modules/*/package.json`; ranges are as declared in `package.json`.

| Package | Declared range | Installed |
|---|---|---|
| react, react-dom | ^19.3.1 | 19.3.1 |
| react-router-dom | ^7.18.5 | 7.18.5 |
| lucide-react (icons) | ^1.64.0 | 1.64.0 |
| @supabase/supabase-js | ^2.118.0 | 2.118.0 (**unused**) |
| vite (dev) | ^8.3.5 | 8.3.5 |
| @vitejs/plugin-react (dev) | ^6.1.2 | 6.1.2 |
| oxlint (dev) | ^1.89.0 | 1.90.0 |

- **Language and styling:** plain JavaScript (JSX) and plain CSS. There is no TypeScript and no CSS framework. Design tokens are in `src/styles/tokens.css`.
- **Configuration:**
  - `vite.config.js` loads only the React plugin.
  - `.oxlintrc.json` enables the `react` and `oxc` plugins, with `react/rules-of-hooks` (error) and `react/only-export-components` (warn).
- **Tests:** there is no test runner, no test script and no test files in the repository.

### Entry point and commands

- `index.html` loads `src/main.jsx`, which renders `src/app/App.jsx` inside `StrictMode`.
- Requires Node.js 20.19+ or 22.12+ (Vite's requirement, as stated in `README.md`). The commands are the `package.json` scripts:

```bash
npm install
npm run dev      # Vite dev server (default http://localhost:5173)
npm run build    # production build into dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

No environment variables are read anywhere in `src/` (no `import.meta.env` usage).

### Repository structure

```text
index.html                     Page shell; <title>SkillBridge</title>
public/favicon.svg
src/
  main.jsx                     Bootstrap
  app/App.jsx                  SessionProvider > ToastProvider > RouterProvider
  app/router.jsx               All routes (createBrowserRouter)
  components/common/           Avatar, Button, Card, ConfirmDialog, FormErrorSummary, Input,
                               NotFoundPage, SectionError, StatusBadge, ToastProvider, toastContext.js
  components/layout/           AppShell, Header, PageContainer, PublicHeader, Sidebar, UserMenu, layout.css
  data/constants.js            Status, priority and role values; field length rules; new-task defaults
  data/mockSeed.js             Seed users, mock credentials, projects, memberships and tasks
  services/serviceError.js     SERVICE_ERROR codes and the ServiceError class
  services/mock/mockDb.js      In-memory store, mock session, mockRequest() and membership helper
  hooks/useServiceData.js      Load-on-mount hook: { status, data, error, retry }
  hooks/useValidatedForm.js    Form state, validation, submit guard and error summary helper
  utils/                       avatar.js, dates.js, tasks.js (overdue rule), text.js, validation.js (email)
  features/
    auth/        services/authService.js, validation.js, authMessages.js, returnPath.js,
                 sessionContext.js, components/ (SessionProvider, RequireAuth, GuestOnly,
                 SessionLoading, AuthCard), pages/ (SignInPage, SignUpPage, CheckEmailPage)
    dashboard/   services/dashboardService.js, components/ (SummaryStats, RecentProjects, MyOpenTasks),
                 pages/DashboardPage.jsx
    landing/     pages/LandingPage.jsx
    members/     services/membersService.js, validation.js
    profile/     services/profileService.js, pages/ProfilePage.jsx
    projects/    services/projectsService.js, projectPermissions.js, projectMessages.js, projectLabels.js,
                 validation.js, components/ (ProjectCard, ProjectForm, ProjectProgress, ProjectNoAccess,
                 ProjectNotice, RestoreProjectButton), pages/ (ProjectsPage, NewProjectPage,
                 ProjectLayout, ProjectTasksTab, ProjectMembersTab, ProjectSettingsTab)
    tasks/       services/tasksService.js, taskPermissions.js, validation.js, components/TaskForm.jsx,
                 pages/ (NewTaskPage, TaskDetailPage)
  styles/                      tokens.css, base.css, primitives.css, index.css
docs/FRONTEND_BACKEND_HANDOFF.md   This file
```

---

## 2. Implemented screens and routes

Source: `src/app/router.jsx`. **Verified** means the route resolved to the expected screen in this task's browser check ([section 12](#12-verification-evidence)).

| Route | Screen | Access | Main functionality | Notable states | Status | Known limitations |
|---|---|---|---|---|---|---|
| `/` | `LandingPage` | Signed-out only (`GuestOnly`) | Product name, one-sentence description, three points, Create account and Sign in | Signed-in users go to `/dashboard` | Verified | — |
| `/login` | `SignInPage` | Signed-out only | Email and password sign-in. One generic error for a wrong email or password. Shows "You've signed out." after sign-out | Field and summary errors; "Signing in…" | Verified | Mock auth. No "verify your email first" state (FR-AUTH-12). PRD route name is `/sign-in` |
| `/signup` | `SignUpPage` | Signed-out only | Name, email and password, then a neutral result and redirect to `/check-email` | Validation; "Creating account…" | Implemented | Mock. PRD route name is `/sign-up` |
| `/check-email` | `CheckEmailPage` | Public | Names the email if passed in router state; otherwise general guidance. Says no email is sent in development | Missing email shows a generic message | Verified (renders) | No Resend email, cooldown or email field (FR-AUTH-11 not fully implemented) |
| `/dashboard` | `DashboardPage` | Signed in | Greeting; summary figures (active projects, my open tasks, my overdue tasks); up to 6 recent projects; My open tasks (up to 10); New project | Skeletons; per-section errors with Try again; new-user empty state; "Nothing assigned to you right now." | Verified (renders) | "Completed this week" figure not shown (needs completion time, B-01) |
| `/projects` and `/projects/archived` | `ProjectsPage` (`view` prop) | Signed in | Active and Archived lists as linkable routes; cards show role, members, progress and due date | Skeletons, error and retry, empty states for each view | Verified (renders) | No search, sort or filters (FR-PRJ-07, Should) |
| `/projects/new` | `NewProjectPage` | Signed in | Name (3–80), description (≤500), due date; the creator becomes owner. On success: toast, then the project's Tasks tab | Validation summary; "Creating…"; failure keeps input | Verified (create) | Mocked; lost on reload |
| `/projects/:projectId` | `ProjectLayout`, index route | Project member | Redirects to `tasks` | — | Verified | — |
| `/projects/:projectId/tasks` | `ProjectLayout` + `ProjectTasksTab` | Project member | Header with breadcrumb and Archived label, archived banner (Restore for owner), summary, tabs; task table (cards on phones); Add task (not in archived projects) | Skeleton; error and retry; "No tasks in this project yet."; unknown or no-access project shows one generic message | Verified | No task filters or Kanban (Should) |
| `/projects/:projectId/members` | `ProjectMembersTab` | Project member | Member list (name, email, role, open tasks). Owner: Add member by email (not when archived), Remove (also when archived). Member: Leave project | Inline add errors; confirmation dialogs; toasts | Verified (renders, role controls) | Mock lookup; no rate limiting |
| `/projects/:projectId/settings` | `ProjectSettingsTab` | Owner (members are redirected to `tasks`) | Edit details; Archive (with confirmation); when archived, explains that Restore is in the banner | Stale-page rejections reload the project | Verified (member redirect) | — |
| `/projects/:projectId/tasks/new` | `NewTaskPage` | Project member; archived projects redirect to `tasks` | Title, description, priority, due date; an Assignee field **for the owner only**. Always created as To Do | Validation; "Creating…"; no-access message | Verified (renders) | — |
| `/projects/:projectId/tasks/:taskId` | `TaskDetailPage` | Project member | All fields; status control (owner or assignee); assignee control (owner); Edit task (owner or creator); Delete task (owner, with confirmation) | Missing task shows "This task was deleted." (unsaved edits shown read-only if deleted while editing); access lost; permission and archive rejections reload the task | Verified (role controls) | — |
| `/profile` | `ProfilePage` | Signed in | Display name (2–50), read-only email, avatar-initials preview. Save is enabled only when the name changed and is valid | Skeleton; load error; "Saving…"; failure keeps input | Verified (renders) | No email change, deletion or avatar upload (excluded by PRD F-10) |
| `*` | `NotFoundPage` | Public | "Page not found." with Dashboard and Projects links. Uses the sidebar shell when signed in, the public header otherwise | — | Verified | — |

**Not built:** `/forgot-password`, `/auth/verify`, `/auth/reset-password` and `/auth/link-expired` (all in the PRD route map) have no routes or screens.

---

## 3. Frontend architecture

### Bootstrap and routing

- **Providers:** `src/app/App.jsx` wraps `RouterProvider` in `SessionProvider`, then `ToastProvider`.
- **Route groups** (`src/app/router.jsx`):
  - **Public group:** `AppShell` with `PublicHeader`. It holds the `GuestOnly` children `/`, `/login` and `/signup`, plus `/check-email`.
  - **Protected group:** `RequireAuth`, then `AppShell` with `Sidebar`, holding every signed-in route.
  - **Top-level `*`:** `NotFoundPage`, which picks its own shell.

### Shared layout and UI

- **`AppShell`**: skip link, optional `sidebar` or `header`, and a single `<main id="main-content">`.
- **`Sidebar`**: main navigation (Dashboard, Projects), a phone drawer and the `UserMenu`.
- **`UserMenu`**: a disclosure with avatar initials and name, containing Profile and Sign out.
- **`PublicHeader`**: brand link, Sign in, Create account.
- **`Header`** and **`PageContainer`**: page title bar and content width.
- **Common components:**
  - `Button`, with `variant` and `loading` props.
  - `Input`, which renders an input, a `textarea` (`multiline`) or a `select` (`options`), with hint, error and ARIA wiring.
  - `Card`, `StatusBadge` and `Avatar`.
- **Feedback components:**
  - `FormErrorSummary`, which takes focus and links to fields.
  - `SectionError`, a load error with Try again.
  - `ConfirmDialog`, built on native `<dialog>`; focus starts on Cancel.
  - `ToastProvider` and `useToast()`, a polite live region.

### Authentication and session state

- **`SessionProvider`** (`features/auth/components/SessionProvider.jsx`):
  - Calls `getSession()` once, then subscribes with `watchSession()`.
  - Context value: `{ status: 'loading' | 'signed-in' | 'signed-out', user, event }`, read with `useSession()` from `features/auth/sessionContext.js`.
- **Guards:**
  - `RequireAuth` shows `SessionLoading` while loading.
  - When signed out, it redirects to `/login` with `state.from` (the full path, query and hash), or `{ signedOut: true }` after an explicit sign-out.
  - `GuestOnly` sends signed-in users to `safeReturnPath(state.from) ?? '/dashboard'`.
  - `safeReturnPath` (`features/auth/returnPath.js`) accepts only internal paths: no `//`, no backslash, not an auth page.

### Service layer

- **Calling convention:** screens call only the functions in `features/*/services/*.js`. Every function returns a Promise and rejects with `ServiceError(code, message, details)` from `src/services/serviceError.js`.
- **Data loading:** reads go through `useServiceData(load)` (`src/hooks/useServiceData.js`). It returns `{ status, data, error, retry }` and reloads when `load` changes, so callers wrap `load` in `useCallback` keyed by IDs.
- **Writes** are called directly from event handlers.

### Mock data and persistence

`src/services/mock/mockDb.js`:

- **Store:** a single module-level `db`, created from `structuredClone(mockSeed)` plus `session: { userId }`.
- **`mockRequest(handler)`:** waits `MOCK_DELAY_MS` (300 ms), runs the handler against `db` and returns a `structuredClone` of the result.
- **`setSessionUser(store, userId)`:** writes or removes the `localStorage` key `skillbridge.mockSessionUserId`.
- **Stale sessions:** on load, a stored ID that doesn't match a seeded user is discarded.
- **`requireSignedInUserId(store)`:** throws `session-expired` when no one is signed in.
- **`requireProjectMembership(store, projectId)`:** returns `{ project, membership }` or throws `not-found-or-no-access`, with the same error for missing and inaccessible projects.
- **`resetMockDb()`:** exists for tests and debugging and is unused by the app.

### Form validation and feedback

- **Shared rule modules:** the validation modules are used by both the forms and the mock services:
  - `features/auth/validation.js`: `validateSignIn`, `validateSignUp`, `displayNameError`.
  - `features/projects/validation.js`: `validateProject`, `normalizeProjectInput`, `projectFieldMessages`.
  - `features/tasks/validation.js`: `validateTask`, `normalizeTaskInput`, `taskFieldMessages`.
  - `features/members/validation.js`: `validateMemberEmail`, `memberFieldMessages`.
- **Codes and messages:** rules return field codes (`required`, `too-short`, `too-long`, `invalid`), and the `*Messages` helpers turn them into PRD wording.
- **`useValidatedForm`** (`src/hooks/useValidatedForm.js`):
  - Validates before submitting and blocks a second submit while one is running.
  - Maps a `validation` error's `details.fieldErrors` onto the fields.
  - Sends other errors through `describeFailure` (giving `{ message }` or `{ fieldErrors }`).
  - Focuses the error summary.
- The sign-in and sign-up pages have their own equivalent logic, without the hook.

### Error handling

| Where | Function | Behavior |
|---|---|---|
| Load errors | `SectionError` | `network` gives "Can't reach SkillBridge…"; anything else gives "Couldn't load … Try again." |
| Project and member actions | `projectActionMessage(error, fallback)` and `isAccessLost` (`features/projects/projectMessages.js`) | Map `no-permission`, `archived`, `not-found-or-no-access`/`not-a-member` and `network` to PRD messages |
| Auth | `formErrorMessage` (`features/auth/authMessages.js`) | Maps `invalid-credentials`, `rate-limited` and `network` |
| Task actions | `TaskDetailPage` | Handles `task-not-found`, `not-found-or-no-access`, `no-permission`, `archived` and `assignee-not-member` |
| Session expiry | — | **No screen handles `session-expired`** (see [section 11](#11-known-gaps-discrepancies-and-open-questions)) |

Raw error text is never shown.

### Switching from mock to Supabase

**Not implemented.** The intended path follows from the current structure:

- Keep each exported function's name, inputs, result shape and `ServiceError` codes, and replace the `mockRequest(...)` body with Supabase calls.
- Screens import only the service modules, plus `SESSION_EVENT` and `watchSession`, so they shouldn't need changes when contracts are kept.
- `watchSession` already mirrors the callback shape of Supabase `onAuthStateChange`, as `(event, session)`. Events used are `SIGNED_IN`, `SIGNED_OUT` and `USER_UPDATED`.
- `mockDb.js`, `mockSeed.js` and the mock credential check can be removed once nothing imports them.

---

## 4. Service/API contract

All of these are **Mocked**: implemented against `mockDb.js`, with no real backend. The "Proposed backend" column is **a proposal only**; none of it exists.

Shared errors any operation can raise:

- `session-expired`, when no one is signed in (mock).
- In the future: `network` and `unexpected`.

All functions are async.

### Auth: `src/features/auth/services/authService.js`

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `getSession()` | Current session | — | `{ user: { id, displayName, email } }` or `null` | — | `SessionProvider` | `supabase.auth.getSession()` plus a profile row |
| `watchSession(cb)` | Subscribe to changes (synchronous) | `cb(event, session)` | Unsubscribe function | — | `SessionProvider` | `supabase.auth.onAuthStateChange` |
| `refreshSession()` | Re-read the session and emit `USER_UPDATED` | — | Session or `null` | — | `ProfilePage` after a save | Re-fetch the profile; emit an update |
| `signIn({ email, password })` | Start a session; emits `SIGNED_IN` | Strings; email normalized | `{ user }` | `validation` (`fieldErrors.email` or `.password`), `invalid-credentials` | `SignInPage` | `signInWithPassword`. PRD adds `email-not-verified` and `rate-limited` |
| `signUp({ displayName, email, password })` | Create an account; **does not sign in** | displayName 2–50 trimmed, valid email, password ≥ 8 | `{ status: 'verification-pending', email }`, the same whether or not the email was new | `validation` | `SignUpPage` | `auth.signUp` with display name metadata; profile created automatically (B-04) |
| `signOut()` | End the session; emits `SIGNED_OUT` | — | `null` | Never rejects in the mock | `UserMenu` | `auth.signOut()` |

`SESSION_EVENT` values are `SIGNED_IN`, `SIGNED_OUT` and `USER_UPDATED`. The source lists these as **deferred**: `resendVerification`, `completeVerification`, `requestPasswordReset`, `openResetLink`, `setNewPassword`.

### Profile: `src/features/profile/services/profileService.js`

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `getMyProfile()` | Load my profile | — | `{ id, displayName, email }` | `not-found-or-no-access` | `ProfilePage` | Select own row from a `profiles` table, with the email from auth |
| `updateMyProfile({ displayName })` | Change my display name | String, 2–50 after trimming | Updated `{ id, displayName, email }` | `validation` (`fieldErrors.displayName`) | `ProfilePage` | Update own `profiles` row (RLS: own row only) |

### Projects: `src/features/projects/services/projectsService.js`

Every project read returns a **ProjectSummary**:

- The project's own fields: `id, name, description, dueDate, archivedAt, createdAt, updatedAt`.
- Derived fields: `role, memberCount, taskCount, completedTaskCount, overdueTaskCount`.

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `listMyProjects({ view, sort, limit })` | My projects | `view`: `PROJECT_VIEW.ACTIVE` (default) or `.ARCHIVED`; `sort`: `PROJECT_SORT.LAST_UPDATED` (optional); `limit` (optional) | `ProjectSummary[]` | — | `ProjectsPage`, `RecentProjects` (active, last-updated, limit 6) | View or RPC joining memberships, projects and task counts for `auth.uid()` |
| `getProject(projectId)` | One project | string | `ProjectSummary` | `not-found-or-no-access` | `ProjectLayout`, `NewTaskPage`, `TaskDetailPage` | The same, filtered by ID; RLS hides non-members |
| `createProject({ name, description, dueDate })` | Create; caller becomes owner | name 3–80, description ≤500, dueDate `YYYY-MM-DD` or empty | `ProjectSummary` (role `owner`) | `validation` | `NewProjectPage` | RPC or transaction inserting the project and the owner membership |
| `updateProject(projectId, changes)` | Edit details | Only changed keys among `name`, `description`, `dueDate` | `ProjectSummary` | `not-found-or-no-access`, `no-permission`, `archived`, `validation` | `ProjectSettingsTab` | Update, with RLS for owner only and not archived |
| `archiveProject(projectId)` | Archive | string | `ProjectSummary` with `archivedAt` set | `not-found-or-no-access`, `no-permission`, `already-archived` | `ProjectSettingsTab` | Set `archived_at` (A-01); owner only (A-02) |
| `restoreProject(projectId)` | Restore | string | `ProjectSummary` with `archivedAt: null` | `not-found-or-no-access`, `no-permission`, `not-archived` | `RestoreProjectButton` | Clear `archived_at`; owner only |

### Tasks: `src/features/tasks/services/tasksService.js`

A **Task** has the fields `id, projectId, title, description, status, priority, assigneeId, createdBy, dueDate, createdAt, updatedAt`.

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `listTasks(projectId)` | Tasks in a project | string | `Task[]` (full objects) | `not-found-or-no-access` | `ProjectTasksTab` | Select by project ID; RLS for members |
| `getTask(projectId, taskId)` | One task | strings | `Task` | `not-found-or-no-access`, `task-not-found` | `TaskDetailPage` | Select by both IDs |
| `createTask(projectId, { title, description, priority, dueDate, assigneeId? })` | Create; always `To Do`; caller recorded as `createdBy` | title 3–120, description ≤2000, priority Low/Medium/High (default Medium); `assigneeId` optional, empty or null means unassigned | `Task` | `not-found-or-no-access`, `archived`, `validation`, `no-permission` (assignee sent by a non-owner), `assignee-not-member` | `NewTaskPage` (sends `assigneeId` only for the owner) | Insert, with the status default enforced server-side |
| `updateTaskDetails(taskId, changes)` | Edit title, description, priority, due date | Only changed keys | `Task` | `task-not-found`, `not-found-or-no-access`, `archived`, `no-permission`, `validation` | `TaskDetailPage` | Update; owner or current-member creator |
| `changeTaskStatus(taskId, status)` | Change status | `'To Do'`, `'In Progress'` or `'Completed'` | `Task` | `task-not-found`, `not-found-or-no-access`, `archived`, `validation`, `no-permission` | `TaskDetailPage` | Update `status`; owner or assignee |
| `assignTask(taskId, assigneeId)` | Assign or unassign | user ID or `null` | `Task` | `task-not-found`, `not-found-or-no-access`, `archived`, `no-permission`, `assignee-not-member` | `TaskDetailPage` | Update `assignee_id`; owner only; assignee must be a member |
| `deleteTask(taskId)` | Delete permanently | string | `null` | `task-not-found`, `not-found-or-no-access`, `archived`, `no-permission` | `TaskDetailPage` | Delete; owner only |

### Members: `src/features/members/services/membersService.js`

A **MemberSummary** has the fields `userId, displayName, email, role, openTaskCount`.

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `listMembers(projectId)` | Project members | string | `MemberSummary[]` | `not-found-or-no-access` | `ProjectMembersTab`, `ProjectTasksTab` (assignee names), `NewTaskPage` and `TaskDetailPage` (assignee picker, creator name) | Join memberships and profiles |
| `addMemberByEmail(projectId, email)` | Add an existing account (no invitation) | Valid email | `MemberSummary` (role `member`) | `not-found-or-no-access`, `no-permission`, `archived`, `validation`, `user-not-found`, `already-member` (PRD also lists `rate-limited`) | `ProjectMembersTab` | **Must be a trusted RPC or Edge Function**: owner only, minimal data, rate limited (B-12, FR-TEAM-07) |
| `removeMember(projectId, userId)` | Remove a member; their assigned tasks become unassigned | strings | `{ unassignedTaskCount }` (not shown in the UI) | `not-found-or-no-access`, `no-permission`, `not-a-member`, `cannot-remove-owner` | `ProjectMembersTab` | RPC: delete the membership and clear the assignee in one transaction |
| `leaveProject(projectId)` | Leave; assigned tasks become unassigned | string | `null` | `not-a-member`, `owner-cannot-leave` | `ProjectMembersTab` | The same RPC pattern, for the caller |

### Dashboard: `src/features/dashboard/services/dashboardService.js`

| Function | Purpose | Input | Returns | Errors | Caller | Proposed backend |
|---|---|---|---|---|---|---|
| `getDashboardSummary()` | Figures, leaving out archived projects | — | `{ activeProjectCount, myOpenTaskCount, myOverdueTaskCount }` | `session-expired` | `SummaryStats` | RPC or view. The PRD also wants "completed this week" (needs a completion timestamp, B-01) |
| `listMyOpenTasks({ limit = 10 })` | My open tasks in active projects; soonest due date first, no date last | number | `(Task & { projectName })[]` | `session-expired` | `MyOpenTasks` | Query or RPC |

**Error codes** (`SERVICE_ERROR` in `src/services/serviceError.js`):

- **Shared:** `validation`, `not-found-or-no-access`, `no-permission`, `archived`, `rate-limited`, `network`, `session-expired`, `unexpected`.
- **Operation-specific:** `task-not-found`, `invalid-credentials`, `assignee-not-member`, `already-archived`, `not-archived`, `owner-cannot-leave`, `not-a-member`, `user-not-found`, `already-member`, `cannot-remove-owner`.
- **Defined but never raised:** the mock never produces `rate-limited`, `network` or `unexpected`, although the UI maps the first two.

---

## 5. Data model expected by the frontend

These are observed in `src/data/mockSeed.js` and the services. **Field names are provisional** (the seed file says so; PRD B-01). This is **not a database schema**.

**User / profile**

- Fields: `id` (string, for example `user-1`; new users get `user-<uuid>`), `displayName` (string, 2–50 after trimming), `email` (string, stored lowercased and trimmed).
- Credentials are a separate mock-only list, `credentials: [{ userId, password }]`. They must not exist in the real system, where Supabase Auth owns them.
- **Pending (B-04):** the PRD expects a profile created automatically at sign-up with the sign-up display name.
- **Inferred:** the frontend treats the auth user ID and the profile ID as the same value.

**Project**

- Fields: `id` (string), `name` (3–80), `description` (string, ≤500; `''` when empty, after trimming), `dueDate` (`YYYY-MM-DD` or `null`), `archivedAt` (ISO timestamp or `null`; `null` means active), `createdAt` and `updatedAt` (ISO timestamps).
- There is no `ownerId` field. Ownership is a membership role.
- **Ambiguity:** `updatedAt` changes on project edit, archive and restore, but **not** when the project's tasks change. Recent projects sort by it, so what "last updated" means needs confirming.

**Project membership**

- Fields: `{ projectId, userId, role }`, where `role` is `'owner'` or `'member'` (`PROJECT_ROLE`).
- The mock assumes exactly one owner per project (PRD F-04, **pending B-03**). The owner can't leave or be removed.
- There is no separate Team entity. A project's team is its memberships.

**Task**

- Fields: `id`, `projectId`, `title` (3–120), `description` (≤2000, `''` when empty), `status`, `priority`, `assigneeId` (user ID or `null`), `createdBy` (user ID), `dueDate` (`YYYY-MM-DD` or `null`), `createdAt`, `updatedAt`.
- Defaults (`NEW_TASK_DEFAULTS`): status `'To Do'`, priority `'Medium'`, assignee `null`.
- The `createdBy` record is kept even if the creator leaves. The UI then shows "Former member".

**Task status:** `TASK_STATUS` = `'To Do'`, `'In Progress'`, `'Completed'`.

- **The stored values are the display labels.** How these are stored in the database (an enum or codes) is **pending B-01**.
- Any transition between the three is allowed. No order is enforced.
- **Overdue** (`isTaskOverdue` in `src/utils/tasks.js`): `dueDate` is before today and status isn't Completed. Today is computed in the **browser's local time zone**.

**Priority:** `TASK_PRIORITY` = `'Low'`, `'Medium'`, `'High'`. Same storage question (B-01).

**Assignment:** at most one assignee, who must be a current member of the project. Removing a member or having them leave sets their tasks' `assigneeId` to `null` in that project.

**Archive and restore:** this is purely `archivedAt` (matches the A-01 proposal). Archived projects:

- are left out of the Active list and the dashboard;
- remain readable by members;
- reject all task changes and adding members;
- still allow removing members and leaving.

**Derived values the frontend expects from reads:**

- **ProjectSummary:** `role` (the caller's), `memberCount`, `taskCount`, `completedTaskCount`, `overdueTaskCount`.
- **MemberSummary:** `openTaskCount` (assigned and not Completed).
- **My open tasks:** each item also carries `projectName`.

---

## 6. Authentication and session behavior

All of this is **Mocked**. **It is not secure:** mock passwords sit in plain text in `src/data/mockSeed.js` and in memory, and anyone can edit the stored user ID in `localStorage`.

**Sign in** (Verified)

- Validates, then checks the email against users and the password against the mock credentials list.
- A wrong email or password gives the same `invalid-credentials` error, shown as "Email or password is incorrect."
- On success, the user ID goes to `localStorage` and `SIGNED_IN` is emitted. `GuestOnly` then redirects to the return path or `/dashboard`.

**Sign up** (Implemented)

- Creates an in-memory user and credential only if the email is new, and always returns the same neutral result.
- The user goes to `/check-email` with the email in router state and is **not signed in**.
- Mock accounts can sign in immediately. **Email verification isn't simulated**, and no email is sent.

**Sign out** (Verified)

- Clears the stored ID and emits `SIGNED_OUT`.
- `RequireAuth` redirects to `/login` with "You've signed out." and no return path.
- **Gap:** `UserMenu.handleSignOut` doesn't catch errors. FR-AUTH-03 requires the app to clear its session even if the network request fails.

**Guards and return path**

- Verified: protected routes redirect to `/login` with `state.from`, and the user returns there after sign-in if `safeReturnPath` accepts it.
- Verified: signed-in users opening `/`, `/login` or `/signup` go to `/dashboard`.

**Loading:** while the first `getSession()` runs, the guards show `SessionLoading`, whose text appears after 400 ms. There is no sign-in-page flash (FR-AUTH-06).

**Session persistence** (Verified)

- A seeded user stays signed in after a reload, because only the user ID is stored.
- Sign-up accounts and all data changes are **lost on reload**: the store is rebuilt from the seed, and a stored ID for a non-seeded user is discarded.

**Session update**

- After a profile save, `ProfilePage` calls `refreshSession()`, which emits `USER_UPDATED`. The sidebar user menu and dashboard greeting then show the new name.

**Session expiry: Not implemented (FR-AUTH-07).**

- The mock raises `session-expired` only if no one is signed in.
- No screen redirects with "Your session has expired. Sign in again."

**Still needs real Supabase Auth:**

- Sign-up and sign-in.
- Email verification: FR-AUTH-09, -11, -12, -14.
- Password reset: FR-AUTH-08, -15.
- Expired links: FR-AUTH-13.
- Token refresh and expiry handling.
- Mapping provider errors (duplicate sign-up, unverified email, rate limits; B-08, B-10, B-11).
- The password policy (B-09; the frontend assumes at least 8 characters).

---

## 7. Permission and authorization matrix

Rules live in `src/features/tasks/taskPermissions.js` and `src/features/projects/projectPermissions.js`. **Both the UI and the mock services use these same functions.**

**Rule functions** (all assume current membership):

- `canChangeTaskStatus({ role, assigneeId, userId })`: owner, or the assignee.
- `canAssignTask({ role })`: owner.
- `canEditTaskDetails({ role, createdBy, userId })`: owner, or the creator.
- `canDeleteTask({ role })`: owner.
- `canManageProject({ role })`: owner.
- `canManageMembers({ role })`: owner.
- `canLeaveProject({ role })`: member, but not the owner.

| Action | Owner | Member (creator) | Member (assignee) | Other member | No access | Archived project |
|---|---|---|---|---|---|---|
| View project, tasks, members | Yes | Yes | Yes | Yes | No (generic not-found) | Read allowed |
| Create task | Yes, can set an assignee | Yes, unassigned only | Yes, unassigned only | Yes, unassigned only | No | **Rejected** (`archived`); UI hides Add task and redirects `/tasks/new` |
| Edit task details | Any task | Own tasks only | No, unless also the creator | No | No | Rejected |
| Delete task | Yes | No (E-02) | No | No | No | Rejected |
| Change status | Any task | **No**, unless also the assignee (E-01 pending) | Yes | No | No | Rejected |
| Assign, reassign, unassign | Yes, current members only | No | No | No | No | Rejected |
| Add member | Yes | No | No | No | No | **Rejected** (F-09) |
| Remove member | Yes, not the owner | No | No | No | No | **Allowed** (A-05) |
| Edit project details | Yes | No | No | No | No | Rejected |
| Archive or restore | Yes | No | No | No | No | Restore only |
| Leave project | **No** (E-08) | Yes | Yes | Yes | — | **Allowed** (A-05) |

**UI compared with the mock service checks:**

- **Where they agree:** the UI hides each control the rule function forbids. Members don't see the Settings tab, and opening it redirects them. In archived projects the UI hides every task control, plus Add task and Add member. The services reject the same actions.
- **Order of checks differs.** `updateProject` checks permission before the archived state. Task mutations check the archived state before permission. So in an archived project, a member editing a task gets `archived`, not `no-permission`.
- **Possible information leak.** Task mutations look up a task by ID **across all projects**:
  - a missing task gives `task-not-found`;
  - an existing task in a project the caller can't access gives `not-found-or-no-access`.
  So a non-member can tell whether a task ID exists. The backend should avoid revealing this.
- **UI hides more than the service forbids.** The UI never sends an assignee from a member, and the service rejects one anyway.
- **Verified this task (service level, as a member):**
  - Editing someone else's task, deleting, a creator changing status, assigning, editing the project and adding a member all return `no-permission`.
  - A non-member reading a project gets `not-found-or-no-access`.
  - Creating a task or adding a member in an archived project returns `archived`.
  - The owner leaving returns `owner-cannot-leave`.

**These checks are not a security boundary.** They run in the browser against in-memory data, and anyone can bypass them. Every rule must be enforced by Supabase Row Level Security and/or trusted backend logic (PRD B-13). The backend's answer is final.

---

## 8. Mock data and demo behavior

**Seed data** (`src/data/mockSeed.js`):

- **Users:**
  - `user-1` Asha Patel (`asha@example.com`).
  - `user-2` Leo Martin (`leo@example.com`).
  - Both use the shared development password in `mockSeed.js` (also given in `README.md`). It isn't repeated here and is not a real credential.
- **Projects:**
  - `project-1` "Capstone Website" (active): Asha is owner, Leo is member.
  - `project-2` "Hackathon Demo" (archived): Asha is owner and the only member.
- **Tasks** (all in project-1):
  - `task-1`: Completed, assigned to Asha, created by Asha.
  - `task-2`: In Progress, assigned to Leo, created by Asha.
  - `task-3`: To Do, unassigned, created by Leo.

**Run:** `npm install`, then `npm run dev`, and sign in with a seeded email.

**What each action does:**

| Action | Where it lives | Survives reload? |
|---|---|---|
| Sign in (seeded user) | User ID in `localStorage` (`skillbridge.mockSessionUserId`) | Yes |
| Sign up | In-memory user and credential | **No**: the account disappears, and any stored ID for it is discarded |
| Create or edit a project, archive, restore | In-memory `db` | **No** (verified for project creation) |
| Task create, edit, status, assignment, delete | In-memory `db` | No |
| Add, remove or leave membership | In-memory `db` | No |
| Profile name change | In-memory `db` | No |
| Sign out | `localStorage` key removed | — |

Data resets because `mockDb.js` rebuilds `db` from the seed every time the JavaScript module loads.

**Mock limitations:**

- Every request waits about 300 ms.
- No email of any kind is sent, verification isn't simulated, and there is no password reset.
- The mock never produces rate limiting or network failures.
- Overdue is computed against the browser's current date. The seed's due dates are fixed in 2026, so overdue results change over time.

---

## 9. Backend integration plan

Every step below is **Pending**; none has started.

| # | Step | Depends on | Likely files | Acceptance criterion |
|---|---|---|---|---|
| 1 | Agree the schema: tables for profiles, projects, project_members (with role) and tasks; how status, priority and role values are stored; timestamps; a task completion time if "completed this week" is wanted | PRD B-01, B-02, B-03, A-01 | (Backend.) Frontend: `src/data/constants.js` if stored values differ | A written schema both developers sign off, with every field in [section 5](#5-data-model-expected-by-the-frontend) mapped |
| 2 | Confirm Supabase Auth: profile auto-created at sign-up (B-04); redirect URLs `/auth/verify` and `/auth/reset-password` (B-05); auto sign-in after verify or reset (B-06, B-07); duplicate and unverified responses (B-08); password policy (B-09); rate limits and cooldown (B-10, B-11) | 1 | `features/auth/services/authService.js`, `features/profile/services/profileService.js` | Sign-up creates a profile with the display name; sign-in returns `{ user: { id, displayName, email } }` |
| 3 | Map each service function in [section 4](#4-serviceapi-contract) to a Supabase query, RPC or Edge Function, keeping its name, inputs, result shape and error codes | 1, 2 | `features/*/services/*.js`, plus a new Supabase client module (for example `src/services/supabaseClient.js`) reading `.env.local` | Each function returns the documented shape against a test project |
| 4 | Enforce authorization with RLS and trusted functions: membership on every read and write; owner-only rules; assignee and creator rules; archived read-only; secure member lookup | 1, PRD B-12, B-13, A-02, A-03 | (Backend SQL and policies) | Every row in the [section 7](#7-permission-and-authorization-matrix) matrix is enforced server-side, and direct API calls that break a rule fail |
| 5 | Replace the mock bodies; remove `mockDb.js` and `mockSeed.js` imports; keep `watchSession` semantics using `onAuthStateChange` (emit `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`) | 3, 4 | The service modules; `src/services/mock/` deleted at the end | `grep mockRequest src` finds nothing; screens are unchanged; build and lint pass |
| 6 | Map Supabase and PostgREST errors to `SERVICE_ERROR` codes (RLS denial or empty result to `not-found-or-no-access` or `no-permission`; network to `network`; others to `unexpected`) | 3 | A new shared error-mapping helper beside `src/services/serviceError.js` | No raw backend text reaches the UI; each screen shows its documented message |
| 7 | Handle session expiry (FR-AUTH-07: redirect with "Your session has expired. Sign in again."); make sign-out clear local state even if the request fails (FR-AUTH-03) | 2, 6 | `SessionProvider.jsx`, `RequireAuth.jsx`, `SignInPage.jsx`, `UserMenu.jsx` | An expired token mid-session redirects to Sign in with that message; sign-out offline still signs out locally |
| 8 | Build the missing auth screens: Forgot password, Reset password, Verify, Link expired, Resend on Check your email | 2 | New pages under `features/auth/pages/`, `router.jsx`, `authService.js` | FR-AUTH-08, -09, -11, -12, -13, -14, -15 are met |
| 9 | Verify behavior end to end: membership add, remove and leave (assignees cleared); assignment limited to members; status rules; archive and restore effects (dashboard exclusion, read-only); profile updates showing everywhere | 5–7 | — | A manual or automated test covering each row of [section 7](#7-permission-and-authorization-matrix) passes |
| 10 | Test cross-user access: user B can't read or write user A's projects, tasks or members through the UI **or direct API calls**; non-owners can't run owner operations | 4, 5 | — | All unauthorized attempts fail server-side |
| 11 | Run `npm run build`, `npm run lint` and end-to-end checks; consider adding a test runner (none exists) | all | `package.json` (with agreement) | Build and lint pass; the end-to-end suite passes against the staging backend |

---

## 10. Security and data integrity requirements

**Exists today (frontend only, not security):**

- UI controls are hidden by role.
- The mock services repeat the same checks.
- Inaccessible and missing projects give one generic message.
- Return paths are checked by `safeReturnPath`.
- Inputs are validated and trimmed in both the form and the mock service.
- Sign-up wording is neutral, so it doesn't reveal registered emails.
- No raw error text is shown.

**Backend must implement and verify** (PRD B-12, B-13, A-02, A-03, FR-TEAM-07). None of this exists yet:

1. **Membership gate:** every read and write of projects, tasks and memberships requires a current membership row for `auth.uid()`. Non-members must get no data, and must not be able to tell a missing record from a forbidden one.
2. **Owner-only actions:** editing, archiving or restoring a project; adding or removing members; assigning or reassigning; deleting tasks.
3. **Assignee status rule:** a member can change the status only of tasks where they are the assignee. A creator who isn't the assignee gets no status rights until E-01 is decided.
4. **Creator edit rule:** a member can edit the details (title, description, priority, due date) of tasks they created, only while they're still a member (B-02, E-04). Assignment never grants editing or deleting.
5. **Assignment integrity:** the assignee must be a current member of the same project. Removing a member or having them leave unassigns their tasks in that project (FR-TSK-07). One owner per project, who can't leave or be removed, pending B-03.
6. **New tasks:** status is forced to To Do server-side. An assignee from a non-owner is rejected (E-03). `createdBy` is set from `auth.uid()`, never from client input.
7. **Archived read-only:** reject all task changes, project detail edits and adding members. Allow removing members and leaving (A-03, A-05).
8. **Member lookup by email:** owner only, rate limited, returning only `added`, `not found` or `already a member` plus the member-list fields. Never expose a user search (FR-TEAM-07, B-12).
9. **Cross-project protection:** IDs from the client (project, task, user) must be checked against memberships server-side. Changing an ID in a request must not reach another project's data.
10. **Input handling:** enforce the length and format rules server-side (`src/data/constants.js`). Store user text as data and never render it as HTML. The frontend uses React text rendering only.
11. **Keys:** only the Supabase URL and the anon key go in the frontend `.env.local` (git-ignored by the existing `*.local` rule). The service-role key must never reach frontend code.

---

## 11. Known gaps, discrepancies, and open questions

| # | Item | Evidence | Needs |
|---|---|---|---|
| 1 | No backend or Supabase integration; all data is mocked | `@supabase/supabase-js` is never imported; every service calls `mockRequest` | Integration ([section 9](#9-backend-integration-plan)) |
| 2 | No RLS or server-side authorization | No backend code in the repo | Backend (B-13) |
| 3 | Email verification, resend, password reset and link-expired flows not built | Deferred list in `authService.js`; no routes in `router.jsx` | Backend (B-05 to B-11) and frontend pages |
| 4 | `CheckEmailPage` has no Resend button or email field (FR-AUTH-11) | `features/auth/pages/CheckEmailPage.jsx` | Frontend, after B-11 |
| 5 | No "verify your email first" sign-in state (FR-AUTH-12) | `SignInPage.jsx`; no such error code | Backend answer to B-08 |
| 6 | Session expiry not handled (FR-AUTH-07) | No reference to `session-expired` in any `.jsx` file | Frontend and backend |
| 7 | Sign-out doesn't handle request failure (FR-AUTH-03) | `UserMenu.jsx` `handleSignOut` has no try/catch | Frontend fix during integration |
| 8 | Mock data and sign-ups reset on reload | `mockDb.js` `createDb()`; verified in the browser | Expected until integration |
| 9 | **Route-name discrepancy:** the code uses `/login` and `/signup`; the PRD route map proposes `/sign-in` and `/sign-up` | `router.jsx`, `returnPath.js` (`AUTH_PATHS`) | Decision: rename routes or record the deviation. B-05 redirect URLs don't depend on these |
| 10 | Dashboard "tasks completed this week" missing (FR-DASH-02) | `dashboardService.js` comment; no completion timestamp in the task model | Backend decision (B-01) |
| 11 | Should and Could items not built: project search and sort (FR-PRJ-07), task filters (FR-TSK-08), Kanban (FR-TSK-09), Due this week (FR-DASH-06), activity feed (FR-DASH-07), ownership transfer (FR-TEAM-05, pending B-03) | No code | Product priority |
| 12 | Meaning of project "last updated" | `updatedAt` isn't touched by task changes (`tasksService.js`) | Confirm with the backend |
| 13 | Status, priority and role stored as display strings | `constants.js` comment points to B-01 | Backend decision |
| 14 | Overdue uses the browser's local date | `utils/tasks.js` `todayDateString()` | Confirm whether server-side figures should use another time zone |
| 15 | Task mutations reveal whether a task ID exists | `requireChangeableTask` in `tasksService.js` | Backend should not reproduce this |
| 16 | Member-to-member visibility of emails | `MemberSummary` includes `email`, matching FR-TEAM-01 | Confirm under B-12 |
| 17 | `rate-limited` never produced by the mock | `SERVICE_ERROR` is defined but never thrown | Test with the real backend |
| 18 | Creator status rights | `taskPermissions.js` follows the restrictive E-01 default | Decision E-01 |
| 19 | No automated tests in the repository | No test files or test script | Consider adding tests (needs a dependency decision) |
| 20 | Assistive technology: no screen reader testing evidence | — | Manual testing |

**No conflicts were found** between the current UI and the PRD's permission matrix or task-creation rule (FR-TSK-01) in the code that was read.

---

## 12. Verification evidence

**Commands run during this documentation task:**

| Command | Result |
|---|---|
| `npm run build` | Passed. Output `dist/assets/index-*.js` 393.53 kB (119.06 kB gzipped); CSS 28.28 kB |
| `npm run lint` | Passed: exit code 0, no warnings or errors printed |
| A temporary browser smoke check | **40/40 checks passed**, no console errors or warnings |

**About the browser check:**

- It was a temporary Node script driving headless Microsoft Edge over the DevTools protocol, against `npx vite --port 5199`.
- It is not committed to the repository and was deleted afterwards, so it can't be re-run from the repo.
- It covered:
  - **Routes:** 20 routes, signed out and as the seeded owner and member, including redirects, the 404 page, an unknown project, a missing task and the member Settings redirect.
  - **Auth:** wrong password rejected; seeded sign-in; session kept after reload; sign-out through the user menu.
  - **Persistence:** a created project is gone after reload.
  - **Role controls:** owner and assignee controls on task detail.
  - **Service rules:** nine service-level permission and archive checks (listed in [section 7](#7-permission-and-authorization-matrix)).
  - **Archived UI:** banner and Restore shown, no Add task.
  - **Layout:** no horizontal scrolling at 360 px on 7 routes.

**Not verified in this task** (labelled **Implemented**):

- **Account flows:** sign-up end to end, profile save, project edit, archive and restore through the UI.
- **Members:** adding, removing and leaving through the UI.
- **Tasks:** creating, editing, deleting, changing status and assigning through the UI. Only the owner's task creation was checked, in earlier work.
- **Interaction details:** toasts, dialogs and keyboard behavior.

Earlier development sessions tested these with similar temporary scripts, but those scripts aren't in the repository and weren't re-run, so they aren't counted as evidence here.

**Not available:** automated tests (none exist) and accessibility audits.

---

## 13. Handoff summary for another AI

```text
PROJECT: SkillBridge, a React 19 + Vite 8 + React Router 7 SPA (plain JS and CSS) for small-team
project and task management. The frontend MVP is complete against MOCK data. No backend is connected.
@supabase/supabase-js is installed but not imported anywhere.

WHAT EXISTS: landing (/), /login, /signup, /check-email, /dashboard, /projects, /projects/archived,
/projects/new, /projects/:id/{tasks,members,settings}, /projects/:id/tasks/new,
/projects/:id/tasks/:taskId, /profile, and a 404 page. Routes are in src/app/router.jsx.
Guards: RequireAuth and GuestOnly (src/features/auth/components). Session context: useSession().

WHAT IS MOCKED: every service function wraps mockRequest() in src/services/mock/mockDb.js, which is
an in-memory store cloned from src/data/mockSeed.js. Only the signed-in user ID persists, in
localStorage (skillbridge.mockSessionUserId). All other changes reset on reload. Mock auth is NOT
secure: plain-text dev passwords live in the seed. No emails, verification or password reset.

SERVICE CONTRACTS (keep names, inputs, result shapes and ServiceError codes):
  auth:      getSession, watchSession, refreshSession, signIn, signUp, signOut (+ SESSION_EVENT)
  profile:   getMyProfile, updateMyProfile
  projects:  listMyProjects({view,sort,limit}), getProject, createProject, updateProject,
             archiveProject, restoreProject (+ PROJECT_VIEW, PROJECT_SORT)
  tasks:     listTasks, getTask(projectId,taskId), createTask, updateTaskDetails, changeTaskStatus,
             assignTask, deleteTask
  members:   listMembers, addMemberByEmail, removeMember, leaveProject
  dashboard: getDashboardSummary, listMyOpenTasks({limit})
  Errors: SERVICE_ERROR in src/services/serviceError.js. Throw ServiceError(code, msg, details);
  validation errors carry details.fieldErrors.

PERMISSION RULES (src/features/tasks/taskPermissions.js, src/features/projects/projectPermissions.js):
  owner: everything (edit/archive/restore project, add/remove members, assign, delete tasks, any status);
  member: create tasks (unassigned only), edit own-created tasks, change status only when assignee,
  leave; the owner can't leave or be removed. Archived: no task changes, no adding members; removal
  and leaving allowed. Creator-without-assignment gets no status rights (E-01 pending).
  New tasks always start "To Do". These checks are UI/mock only; the backend MUST enforce them (RLS).

IMMEDIATE NEXT TASKS:
  1) Agree the schema and stored values (PRD B-01..B-04, A-01).
  2) Add a Supabase client from .env.local (URL + anon key only).
  3) Reimplement each service function against Supabase with RLS plus trusted RPCs: member lookup
     by email, membership removal that unassigns tasks, project creation with the owner membership.
  4) Map Supabase errors to SERVICE_ERROR.
  5) Handle session-expired and offline sign-out.
  6) Build the verification and reset screens.
  7) Test cross-user access.

INSPECT FIRST: docs/FRONTEND_BACKEND_HANDOFF.md, src/app/router.jsx, src/services/mock/mockDb.js,
src/services/serviceError.js, src/data/constants.js, src/data/mockSeed.js, all
src/features/*/services/*.js, src/features/*/{taskPermissions,projectPermissions}.js,
src/features/auth/components/SessionProvider.jsx.

CONSTRAINTS: The PRD is frozen (not in the repo; ask the frontend developer). Don't change UI behavior
or permission rules without agreement. Keep screens calling only service functions. Never put the
service-role key in frontend code. No secrets in the repo. Don't present mock auth as secure.
```
