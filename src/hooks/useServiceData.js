import { useCallback, useEffect, useState } from 'react'

// Loads data from a service call when the component mounts, and again when
// `load` changes. `load` must be stable: defined outside the component, or
// wrapped in useCallback (for example, keyed by a project ID).
// Returns { status: 'loading' | 'success' | 'error', data, error, retry }.
export function useServiceData(load) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    load().then(
      (data) => current && setResult({ load, attempt, status: 'success', data, error: null }),
      (error) => current && setResult({ load, attempt, status: 'error', data: null, error }),
    )
    return () => {
      current = false
    }
  }, [load, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // A result for an earlier loader or attempt is stale: show loading instead.
  if (!result || result.load !== load || result.attempt !== attempt) {
    return { status: 'loading', data: null, error: null, retry }
  }
  return { status: result.status, data: result.data, error: result.error, retry }
}
