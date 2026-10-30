# SkillBridge

SkillBridge is a project management and team collaboration app for small teams. Teams plan projects, split work into tasks, assign those tasks to members and see progress in one place.

## Project status

The frontend MVP is built and runs entirely on **mock data**. The Supabase backend is being developed separately and is **not connected yet**, so nothing is saved to a server and the sign-in is not real authentication.

## What the frontend covers

- **Landing page** with Create account and Sign in. Signed-in visitors go straight to the dashboard.
- **Sign up, sign in and sign out.** Sign-up leads to a "Check your email" page. No email is actually sent.
- **Protected pages.** Signed-out visitors are sent to Sign in and returned to the page they asked for afterwards.
- **Dashboard:** a greeting, summary figures (active projects, my open tasks, my overdue tasks), up to six recent projects and "My open tasks".
- **Projects:** Active and Archived lists, and creating a project.
  - Each project has a Tasks tab, a Members tab and an owner-only Settings tab.
  - In Settings the owner can edit details, archive or restore the project.
- **Members:**
  - The owner adds people who already have an account, by email, and can remove members.
  - Members can leave a project.
- **Tasks:**
  - Any member can create a task. New tasks always start as To Do, and only the owner can pick an assignee.
  - Each task has its own detail page with status and assignee controls.
  - Details can be edited, and tasks deleted after confirming.
- **Profile:** change your display name and preview your avatar initials. The email is shown read-only.
- **Shared behavior:**
  - Every page has loading, empty and error states.
  - Successful actions show toasts, and destructive ones ask for confirmation.
  - Layouts are responsive down to 360 px, with a navigation drawer on phones.

### Permissions

The screens and the mock services follow the permission matrix in the product specification:

- Only the **owner** edits, archives and restores a project, adds and removes members, assigns tasks and deletes tasks.
- A **member** can create tasks and edit the ones they created, and can change the status only of tasks assigned to them. Being assigned to a task doesn't allow editing or deleting it.
- A task's creator gets no status control unless they're the assignee. This rule is pending confirmation (E-01).
- **Archived projects** are read-only. Removing members and leaving still work; adding members doesn't.

These checks only shape what the frontend shows. They are **not security**: the backend must enforce the same rules.

## Tech stack

| Area | Choice |
|---|---|
| UI | React 19, JavaScript |
| Routing | React Router 7 |
| Build tool | Vite 8 |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) |
| Icons | lucide-react |
| Linting | Oxlint |
| Backend (planned) | Supabase. `@supabase/supabase-js` is installed but **not used yet**. |

## Repository structure

```text
src/
├── main.jsx            Entry point
├── app/                App root and route map (router.jsx)
├── components/
│   ├── common/         Shared UI: Button, Input, Card, dialogs, toasts, 404 page
│   └── layout/         App shell, sidebar, user menu, headers
├── features/           One folder per area, each with pages/, components/ and services/
│   ├── auth/           Sign in, sign up, session handling and route guards
│   ├── dashboard/
│   ├── landing/
│   ├── members/
│   ├── profile/
│   ├── projects/
│   └── tasks/
├── services/           Shared service errors and the in-memory mock store (mock/mockDb.js)
├── data/               Mock seed data and shared constants
├── hooks/              Shared hooks: data loading and form handling
├── styles/             Design tokens, base styles and shared component styles
└── utils/              Small helpers: dates, task rules, initials, validation
```

Screens read and change data only through the `services/` functions in each feature. Today those functions use the mock store. When the backend is ready, they will call Supabase instead and the screens won't need to change.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or later, or 22.12 or later (required by Vite)
- npm, which comes with Node.js

## Getting started

```bash
git clone https://github.com/ManthanNagose/SkillBridge.git
cd SkillBridge
npm install
npm run dev
```

Open the address Vite prints in the terminal, usually http://localhost:5173.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload. |
| `npm run build` | Creates a production build in the `dist/` folder. |
| `npm run lint` | Checks the code with Oxlint. |
| `npm run preview` | Serves the production build locally. |

## Demo accounts

Both accounts use the password `skillbridge-demo`.

| Email | Name | Role in the demo data |
|---|---|---|
| `asha@example.com` | Asha Patel | Owner of "Capstone Website" (active) and "Hackathon Demo" (archived) |
| `leo@example.com` | Leo Martin | Member of "Capstone Website", with one task assigned |

These are development placeholders, not real accounts or secrets.

## How the mock data behaves

- **Starting data:** each page load starts from `src/data/mockSeed.js`, held in memory.
- **Changes reset on reload:** projects, tasks, members and profile edits made in the app last only until the page is reloaded.
- **Sign-ups reset too:** new accounts work for signing in until the page is reloaded, then they disappear.
- **Sessions:** only the signed-in user's ID is kept in the browser's `localStorage` (key `skillbridge.mockSessionUserId`), so a demo account stays signed in after a reload. Passwords are never written to browser storage.
- **Delays:** every mock request waits about 300 ms, so loading states are visible.
- **Email verification** isn't simulated. Mock accounts can sign in straight away, and no email is ever sent.

## Routes

| Path | Screen | Access |
|---|---|---|
| `/` | Landing page | Signed-out only |
| `/login`, `/signup` | Sign in, Sign up | Signed-out only |
| `/check-email` | Check your email | Public |
| `/dashboard` | Dashboard | Signed in |
| `/projects`, `/projects/archived` | Projects, Active and Archived views | Signed in |
| `/projects/new` | New project | Signed in |
| `/projects/:projectId/tasks`, `…/members`, `…/settings` | Project tabs (Settings for the owner only) | Project members |
| `/projects/:projectId/tasks/new` | New task | Project members |
| `/projects/:projectId/tasks/:taskId` | Task detail | Project members |
| `/profile` | Profile | Signed in |

Signed-in visitors to `/`, `/login` or `/signup` go to the dashboard. Unknown paths show a "Page not found" page.

## Current limitations

- **The mock authentication is not secure.**
  - The demo passwords are plain text in the source code.
  - Anyone can change the stored user ID in `localStorage`.
  - It exists only to build and test the screens, and will be replaced by Supabase Auth.
- **No backend.** Nothing is saved to a server, and all data resets on reload. Supabase tables, Row Level Security policies and the service contract still need to be built and agreed with the backend developer.
- **Not built yet:**
  - **Auth flows:** password reset, the email verification and link-expired pages, and resending verification emails.
  - **Session expiry:** redirecting to Sign in when a session expires.
  - **Dashboard:** the "tasks completed this week" figure, which needs a completion date the data model doesn't have yet.
  - **Lists:** search, sort and filters for projects and tasks.
  - **Optional extras:** the Kanban board, "Due this week" and the activity feed.
  - **Ownership:** transferring a project to another owner (pending backend confirmation).
- **Rate limiting and network failures** are handled in the screens, but the mock never produces them.
- **Route names differ from the specification.** The sign-in and sign-up routes are `/login` and `/signup`; the product specification proposes `/sign-in` and `/sign-up`.

## Environment variables

None are needed: the app runs entirely on mock data. When Supabase integration begins, the project URL and the public anon key will go in a `.env.local` file, which git already ignores. Never commit the Supabase service-role key or put it in frontend code.
