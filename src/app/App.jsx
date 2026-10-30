import { RouterProvider } from 'react-router-dom'
import ToastProvider from '../components/common/ToastProvider.jsx'
import SessionProvider from '../features/auth/components/SessionProvider.jsx'
import { router } from './router.jsx'

function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </SessionProvider>
  )
}

export default App
