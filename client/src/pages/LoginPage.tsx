import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: '40px auto' }}>
        <h2>Login</h2>
        <p className="muted">Use your account to access projects and tasks.</p>
        <div style={{ height: 12 }} />
        <div className="row">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={async () => {
              setError(null)
              try {
                await login(email, password)
                nav('/dashboard')
              } catch (e: any) {
                setError(e?.message || 'Login failed')
              }
            }}
          >
            Login
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <p className="muted">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

