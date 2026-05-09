import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import SignupPage from './pages/SignupPage'

function Private({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="container">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <Private>
              <DashboardPage />
            </Private>
          }
        />
        <Route
          path="/projects"
          element={
            <Private>
              <ProjectsPage />
            </Private>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <Private>
              <ProjectPage />
            </Private>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

