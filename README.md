# SkillBridge

SkillBridge is a project management and team collaboration platform for small teams. It helps teams plan projects, split work into tasks, assign them to members and track progress in one place.

## Project status

SkillBridge is in early development. This repository currently contains the default React + Vite starter app. No product features have been built yet: authentication, the dashboard, project management and task management are all still to come.

## Tech stack

- **Frontend:** React, JavaScript, Vite and CSS
- **Backend:** Supabase, developed separately by another team member

## Development approach

The frontend is being built against mock data first. Screens will read and change data only through service functions, which return mock data during development. Once the backend contract is agreed, those functions will be connected to Supabase, so the screens don't need to change.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or later, or 22.12 or later (required by Vite)
- npm, which comes with Node.js

Check your versions:

```bash
node -v
npm -v
```

## Getting started

Clone the repository and install dependencies:

```bash
git clone https://github.com/ManthanNagose/SkillBridge.git
cd SkillBridge
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload. Vite prints the local address in the terminal. |
| `npm run build` | Creates a production build in the `dist/` folder. |
| `npm run lint` | Checks the code with Oxlint. |
| `npm run preview` | Serves the production build locally, so you can check it before deploying. |

## Environment variables

None are needed yet, because the app runs entirely on mock data. When Supabase integration begins, the project URL and the public anon key will go in a `.env.local` file, which git already ignores. Never commit the Supabase service-role key or put it in frontend code.
