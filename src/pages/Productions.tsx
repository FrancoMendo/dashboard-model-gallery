import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Productions.css'

const API = import.meta.env.VITE_API_URL

interface Production {
  id: string
  title: string
  description: string | null
  date: number | null
  location: string | null
  createdAt: number
}

interface NewProd {
  title: string
  description: string
  date: string
  location: string
}

const EMPTY: NewProd = { title: '', description: '', date: '', location: '' }

export default function Productions() {
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewProd>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/productions`)
      .then(r => r.json<{ productions: Production[] }>())
      .then(d => setProductions(d.productions))
      .catch(() => setError('Failed to load productions'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API}/productions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'temp-user',
          title: form.title,
          description: form.description || undefined,
          date: form.date || undefined,
          location: form.location || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const { production } = await res.json<{ production: Production }>()
      setProductions(p => [production, ...p])
      setForm(EMPTY)
      setShowForm(false)
    } catch {
      setError('Failed to create production')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${API}/productions/${id}`, { method: 'DELETE' })
    setProductions(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="productions">
      <div className="productions-header">
        <h2 className="productions-title">Productions</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New production'}
        </button>
      </div>

      {showForm && (
        <form className="prod-form" onSubmit={handleCreate}>
          <div className="prod-form-grid">
            <div className="field">
              <label>Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="field field--full">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      {error && <p className="error-msg">{error}</p>}

      {loading ? (
        <p className="empty-msg">Loading…</p>
      ) : productions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">◈</span>
          <p>No productions yet.</p>
        </div>
      ) : (
        <div className="prod-grid">
          {productions.map(p => (
            <div key={p.id} className="prod-card">
              <Link className="prod-card-body" to={`/productions/${p.id}`}>
                <h3 className="prod-card-title">{p.title}</h3>
                {p.location && <p className="prod-card-meta">📍 {p.location}</p>}
                {p.date && (
                  <p className="prod-card-meta">
                    {new Date(p.date * 1000).toLocaleDateString()}
                  </p>
                )}
                {p.description && (
                  <p className="prod-card-desc">{p.description}</p>
                )}
              </Link>
              <div className="prod-card-actions">
                <Link className="btn-secondary" to={`/productions/${p.id}`}>
                  View images
                </Link>
                <Link
                  className="btn-secondary"
                  to={`/upload?productionId=${p.id}`}
                >
                  Upload
                </Link>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
