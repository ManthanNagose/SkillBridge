import { PROJECT_ROLE, TASK_PRIORITY, TASK_STATUS } from './constants.js'

// Representative mock records for frontend development only. They are not real
// users, and nothing here provides authentication, authorization or security.
//
// Conventions:
// - IDs are strings. Timestamps are ISO 8601 strings; due dates are date-only (YYYY-MM-DD) or null.
// - Field names are provisional until the backend schema is agreed (PRD B-01).
// - A project's team is its project memberships. There is no separate Team entity.
// - Each project has exactly one owner membership (PRD F-04, pending B-03).
// - archivedAt is null for active projects.
// - Every task records createdBy. assigneeId is null when the task is unassigned.
//
// Only services/mock/mockDb.js reads this file; everything else goes through services.

export const mockSeed = {
  users: [
    { id: 'user-1', displayName: 'Asha Patel', email: 'asha@example.com' },
    { id: 'user-2', displayName: 'Leo Martin', email: 'leo@example.com' },
  ],

  // Mock sign-in passwords, kept apart from users so no service ever returns
  // them. Development-only placeholders: not secrets, and not how real
  // passwords are handled. Supabase Auth replaces this entirely.
  credentials: [
    { userId: 'user-1', password: 'skillbridge-demo' },
    { userId: 'user-2', password: 'skillbridge-demo' },
  ],

  projects: [
    {
      id: 'project-1',
      name: 'Capstone Website',
      description: 'Course capstone: a website for the student design society.',
      dueDate: '2026-12-11',
      archivedAt: null,
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-28T16:30:00Z',
    },
    {
      id: 'project-2',
      name: 'Hackathon Demo',
      description: 'Weekend hackathon entry.',
      dueDate: '2026-09-14',
      archivedAt: '2026-09-20T10:00:00Z',
      createdAt: '2026-09-10T08:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ],

  projectMemberships: [
    { projectId: 'project-1', userId: 'user-1', role: PROJECT_ROLE.OWNER },
    { projectId: 'project-1', userId: 'user-2', role: PROJECT_ROLE.MEMBER },
    { projectId: 'project-2', userId: 'user-1', role: PROJECT_ROLE.OWNER },
  ],

  tasks: [
    {
      id: 'task-1',
      projectId: 'project-1',
      title: 'Draft the project brief',
      description: 'Agree on goals and scope with the society committee.',
      status: TASK_STATUS.COMPLETED,
      priority: TASK_PRIORITY.HIGH,
      assigneeId: 'user-1',
      createdBy: 'user-1',
      dueDate: '2026-10-20',
      createdAt: '2026-10-01T09:15:00Z',
      updatedAt: '2026-10-18T14:00:00Z',
    },
    {
      id: 'task-2',
      projectId: 'project-1',
      title: 'Build the landing page',
      description: '',
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.MEDIUM,
      assigneeId: 'user-2',
      createdBy: 'user-1',
      dueDate: '2026-11-20',
      createdAt: '2026-10-05T11:00:00Z',
      updatedAt: '2026-10-28T16:30:00Z',
    },
    {
      // Created by a member, so it starts unassigned with status To Do.
      id: 'task-3',
      projectId: 'project-1',
      title: 'Write the user guide',
      description: '',
      status: TASK_STATUS.TO_DO,
      priority: TASK_PRIORITY.LOW,
      assigneeId: null,
      createdBy: 'user-2',
      dueDate: null,
      createdAt: '2026-10-27T13:00:00Z',
      updatedAt: '2026-10-27T13:00:00Z',
    },
  ],
}
