import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import { api } from '../lib/api'

type Member = { id: string; role: 'ADMIN' | 'MEMBER'; user: { id: string; name: string; email: string } }
type ProjectRes = {
  project: { id: string; name: string; description: string }
  membership: { role: 'ADMIN' | 'MEMBER'; projectId: string }
  members: Member[]
  stats: { TODO: number; IN_PROGRESS: number; DONE: number }
}
type Task = {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  dueDate: string | null
  assignee: { id: string; name: string; email: string } | null
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<ProjectRes | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')

  const isAdmin = project?.membership.role === 'ADMIN'

  const memberOptions = useMemo(() => project?.members || [], [project])

  async function load() {
    if (!projectId) return
    const p = await api<ProjectRes>(`/api/projects/${projectId}`)
    setProject(p)
    const t = await api<{ tasks: Task[] }>(`/api/tasks/project/${projectId}`)
    setTasks(t.tasks)
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.message || 'Failed to load project'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="container">
      <Nav />
      {error && <p className="error">{error}</p>}
      {!project ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>{project.project.name}</h2>
            <p className="muted">{project.project.description || '—'}</p>
            <p className="muted">Stats: {JSON.stringify(project.stats)}</p>
          </div>

          <div style={{ height: 12 }} />

          <div className="grid">
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Team</h2>
              <ul>
                {project.members.map((m) => (
                  <li key={m.id}>
                    {m.user.email} <span className="muted">({m.role})</span>
                  </li>
                ))}
              </ul>
              {isAdmin && (
                <>
                  <div style={{ height: 8 }} />
                  <div className="row">
                    <input
                      placeholder="Invite by email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={async () => {
                        setError(null)
                        try {
                          await api(`/api/projects/${projectId}/members`, {
                            method: 'POST',
                            json: { email: inviteEmail, role: inviteRole },
                          })
                          setInviteEmail('')
                          await load()
                        } catch (e: any) {
                          setError(e?.message || 'Invite failed')
                        }
                      }}
                    >
                      Add member
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0 }}>Create task</h2>
              <div className="row">
                <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ minWidth: 180 }}
                />
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={{ minWidth: 220 }}>
                  <option value="">Unassigned</option>
                  {memberOptions.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    setError(null)
                    try {
                      await api('/api/tasks', {
                        method: 'POST',
                        json: {
                          projectId,
                          title,
                          assigneeId: assigneeId || null,
                          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                        },
                      })
                      setTitle('')
                      setDueDate('')
                      setAssigneeId('')
                      await load()
                    } catch (e: any) {
                      setError(e?.message || 'Task create failed')
                    }
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Tasks</h2>
            {tasks.length === 0 ? (
              <p className="muted">No tasks yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th align="left">Title</th>
                    <th align="left">Assignee</th>
                    <th align="left">Due</th>
                    <th align="left">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div>
                          <strong>{t.title}</strong>
                        </div>
                        {t.description && <div className="muted">{t.description}</div>}
                      </td>
                      <td>{t.assignee?.email || '—'}</td>
                      <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <select
                          value={t.status}
                          onChange={async (e) => {
                            const nextStatus = e.target.value as Task['status']
                            const prev = t.status
                            setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, status: nextStatus } : x)))
                            try {
                              setError(null)
                              await api(`/api/tasks/${t.id}`, {
                                method: 'PATCH',
                                json: { status: nextStatus },
                              })
                              await load()
                            } catch (err: any) {
                              // revert on failure
                              setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, status: prev } : x)))
                              setError(err?.message || 'Failed to update status')
                            }
                          }}
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="DONE">DONE</option>
                        </select>
                      </td>
                      <td align="right">
                        <button
                          className="secondary"
                          onClick={async () => {
                            await api(`/api/tasks/${t.id}`, { method: 'PATCH', json: { assigneeId: null } })
                            await load()
                          }}
                        >
                          Unassign
                        </button>{' '}
                        {isAdmin && (
                          <button
                            className="secondary"
                            onClick={async () => {
                              await api(`/api/tasks/${t.id}`, { method: 'DELETE' })
                              await load()
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

