import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './Productions.css'

const API = import.meta.env.VITE_API_URL

export default function EditProduction() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'General',
  })
  
  // Opciones predeterminadas para el datalist
  const uniqueTypes = ["General", "Polaroid", "Artística", "Editorial", "Comercial", "Retrato", "Lookbook"]

  useEffect(() => {
    fetch(`${API}/productions/${id}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.error) throw new Error(d.error)
        const p = d.production.production || d.production // Maneja si la API lo anida
        setForm({
          title: p.title || '',
          description: p.description || '',
          date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
          location: p.location || '',
          type: p.type || 'General',
        })
      })
      .catch((e) => {
        console.error(e)
        setError('Failed to load production details')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API}/productions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          date: form.date || undefined,
          location: form.location || undefined,
          type: form.type || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      navigate('/productions')
    } catch {
      setError('Failed to update production')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="productions"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="productions">
      <div className="productions-header">
        <h2 className="productions-title">Edit Production</h2>
        <button className="btn-secondary" onClick={() => navigate('/productions')}>
          Back
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <form className="prod-form" onSubmit={handleUpdate}>
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
            <label>Type</label>
            <input
              list="type-options"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              placeholder="Ej: General, Polaroid..."
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <datalist id="type-options">
              {uniqueTypes.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
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
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
