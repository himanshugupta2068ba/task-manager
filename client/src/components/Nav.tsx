import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Nav() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="nav">
      <div className="row">
        <strong>Team Task Manager</strong>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>
      </div>
      <div className="row">
        <span className="muted">{user?.email}</span>
        <button
          className="secondary"
          onClick={async () => {
            await logout()
            nav('/login')
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

