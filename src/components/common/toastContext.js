import { createContext, use } from 'react'

export const ToastContext = createContext(null)

// Returns showToast(message). Must be used inside ToastProvider.
export function useToast() {
  const showToast = use(ToastContext)
  if (!showToast) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return showToast
}
