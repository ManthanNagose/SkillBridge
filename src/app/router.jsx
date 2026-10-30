import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import PublicHeader from '../components/layout/PublicHeader.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import NotFoundPage from '../components/common/NotFoundPage.jsx'
import GuestOnly from '../features/auth/components/GuestOnly.jsx'
import RequireAuth from '../features/auth/components/RequireAuth.jsx'
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx'
import ProjectLayout from '../features/projects/pages/ProjectLayout.jsx'
import NewProjectPage from '../features/projects/pages/NewProjectPage.jsx'
import ProjectMembersTab from '../features/projects/pages/ProjectMembersTab.jsx'
import ProjectSettingsTab from '../features/projects/pages/ProjectSettingsTab.jsx'
import ProjectsPage from '../features/projects/pages/ProjectsPage.jsx'
import ProjectTasksTab from '../features/projects/pages/ProjectTasksTab.jsx'
import NewTaskPage from '../features/tasks/pages/NewTaskPage.jsx'
import TaskDetailPage from '../features/tasks/pages/TaskDetailPage.jsx'
import ProfilePage from '../features/profile/pages/ProfilePage.jsx'
import { PROJECT_VIEW } from '../features/projects/services/projectsService.js'
import LandingPage from '../features/landing/pages/LandingPage.jsx'
import CheckEmailPage from '../features/auth/pages/CheckEmailPage.jsx'
import SignInPage from '../features/auth/pages/SignInPage.jsx'
import SignUpPage from '../features/auth/pages/SignUpPage.jsx'

// Route map (PRD section 04).
export const router = createBrowserRouter([
  // Public pages: the shell with the public header, no app navigation.
  {
    element: (
      <AppShell header={<PublicHeader />}>
        <Outlet />
      </AppShell>
    ),
    children: [
      // Signed-in users are sent on to the dashboard or their return path
      // (FR-AUTH-05, FR-LAND-02).
      {
        element: <GuestOnly />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/login', element: <SignInPage /> },
          { path: '/signup', element: <SignUpPage /> },
        ],
      },
      { path: '/check-email', element: <CheckEmailPage /> },
    ],
  },

  // App pages: signed-in only, in the shell with the sidebar. The guard sits
  // outside the shell, so signed-out visitors never see the sidebar.
  {
    element: <RequireAuth />,
    children: [
      {
        element: (
          <AppShell sidebar={<Sidebar />}>
            <Outlet />
          </AppShell>
        ),
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage view={PROJECT_VIEW.ACTIVE} /> },
          { path: '/projects/archived', element: <ProjectsPage view={PROJECT_VIEW.ARCHIVED} /> },
          { path: '/projects/new', element: <NewProjectPage /> },
          // Project pages share the project header; /projects/:projectId opens the Tasks tab.
          {
            path: '/projects/:projectId',
            element: <ProjectLayout />,
            children: [
              { index: true, element: <Navigate to="tasks" replace /> },
              { path: 'tasks', element: <ProjectTasksTab /> },
              { path: 'members', element: <ProjectMembersTab /> },
              { path: 'settings', element: <ProjectSettingsTab /> },
            ],
          },
          { path: '/projects/:projectId/tasks/new', element: <NewTaskPage /> },
          {
            path: '/projects/:projectId/tasks/:taskId',
            element: <TaskDetailPage />,
          },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // 404 chooses its own shell: with the sidebar when signed in (route map).
  { path: '*', element: <NotFoundPage /> },
])
