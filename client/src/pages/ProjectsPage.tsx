import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import { api } from '../lib/api'

type Project = { id: string; name: string; description: string; role: 'ADMIN' | 'MEMBER' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await api<{ projects: Project[] }>('/api/projects')
    setProjects(res.projects)
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.message || 'Failed to load projects'))
  }, [])

  return (
    <div className="container">
      <Nav />
      <div className="card">
        <h2>Projects</h2>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={async () => {
              setError(null)
              try {
                await api('/api/projects', { method: 'POST', json: { name, description } })
                setName('')
                setDescription('')
                await load()
              } catch (e: any) {
                setError(e?.message || 'Failed to create project')
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
      <div style={{ height: 12 }} />
      <div className="grid">
        {projects.map((p) => (
          <div className="card" key={p.id}>
            <h2 style={{ marginTop: 0 }}>{p.name}</h2>
            <p className="muted">{p.description || '—'}</p>
            <p className="muted">Role: {p.role}</p>
            <Link to={`/projects/${p.id}`}>Open →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

