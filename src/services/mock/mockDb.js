import { mockSeed } from '../../data/mockSeed.js'
import { SERVICE_ERROR, ServiceError } from '../serviceError.js'

// The single in-memory store behind every mock service. It starts as a copy of
// the seed data and resets on page reload. Frontend development only: nothing
// here is real authentication or security.
//
// Session: starts signed out. Only the signed-in user's ID is kept in
// localStorage, so a session for a seeded user survives a reload. Passwords
// are never written to browser storage.

export const MOCK_DELAY_MS = 300
const SESSION_STORAGE_KEY = 'skillbridge.mockSessionUserId'

// localStorage can be missing or blocked (private windows, tests), so every
// access is guarded and failure simply means "not persisted".
function readStoredUserId() {
  try {
    return globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function writeStoredUserId(userId) {
  try {
    if (userId) {
      globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, userId)
    } else {
      globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {
    // Not persisted; the in-memory session still works.
  }
}

let db = createDb()

function createDb() {
  const seed = structuredClone(mockSeed)
  const storedUserId = readStoredUserId()
  // A stored ID for an account that no longer exists (for example one created
  // by sign-up before a reload) is discarded.
  const userId = seed.users.some((u) => u.id === storedUserId) ? storedUserId : null
  if (storedUserId && !userId) writeStoredUserId(null)
  return { ...seed, session: { userId } }
}

// Restores the seed data and signs out. Intended for tests and debugging.
export function resetMockDb() {
  writeStoredUserId(null)
  db = createDb()
}

export function setSessionUser(store, userId) {
  store.session.userId = userId
  writeStoredUserId(userId)
}

// Runs a handler against the store after a short delay, so screens show
// realistic loading states. Returns a copy, so callers can't change the store.
export async function mockRequest(handler) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
  return structuredClone(handler(db))
}

export function requireSignedInUserId(store) {
  if (!store.session.userId) {
    throw new ServiceError(SERVICE_ERROR.SESSION_EXPIRED)
  }
  return store.session.userId
}

// Returns the signed-in user's membership of a project. Projects they don't
// belong to are reported exactly like missing ones (PRD section 08).
export function requireProjectMembership(store, projectId) {
  const userId = requireSignedInUserId(store)
  const membership = store.projectMemberships.find(
    (m) => m.projectId === projectId && m.userId === userId,
  )
  const project = store.projects.find((p) => p.id === projectId)
  if (!membership || !project) {
    throw new ServiceError(SERVICE_ERROR.NOT_FOUND_OR_NO_ACCESS)
  }
  return { project, membership }
}
