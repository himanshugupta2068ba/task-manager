import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function SignupPage() {
  const { signup } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
        <h2>Create account</h2>
        <div style={{ height: 12 }} />
        <div className="row">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={async () => {
              setError(null)
              try {
                await signup(name, email, password)
                nav('/dashboard')
              } catch (e: any) {
                setError(e?.message || 'Signup failed')
              }
            }}
          >
            Sign up
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

