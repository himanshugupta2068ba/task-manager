import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { api } from '../lib/api'

type Dash = {
  summary: { assigned: number; overdue: number; byStatus: Record<string, number> }
  overdue: { id: string; projectId: string; title: string; status: string; dueDate: string }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        setData(await api<Dash>('/api/dashboard'))
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard')
      }
    })()
  }, [])

  return (
    <div className="container">
      <Nav />
      <div className="grid">
        <div className="card">
          <h2>Overview</h2>
          {error && <p className="error">{error}</p>}
          {!data ? (
            <p className="muted">Loading…</p>
          ) : (
            <>
              <p>
                <strong>Assigned:</strong> {data.summary.assigned}
              </p>
              <p>
                <strong>Overdue:</strong> {data.summary.overdue}
              </p>
              <p className="muted">By status: {JSON.stringify(data.summary.byStatus)}</p>
            </>
          )}
        </div>
        <div className="card">
          <h2>Overdue tasks</h2>
          {!data ? (
            <p className="muted">Loading…</p>
          ) : data.overdue.length === 0 ? (
            <p className="muted">No overdue tasks.</p>
          ) : (
            <ul>
              {data.overdue.map((t) => (
                <li key={t.id}>
                  {t.title} <span className="muted">({t.status})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

