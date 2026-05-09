import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './Productions.css'
import './EditProfile.css'

const API = import.meta.env.VITE_API_URL

interface Experience {
  id: string
  category: string
  title: string
  year: string
  description: string
}

interface AboutMeData {
  bio: string
  skills: string[]
  experience: Experience[]
}

const CATEGORIES = [
  'Editorial',
  'Comercial',
  'Pasarela',
  'Catálogo',
  'Publicidad',
  'Lookbook',
  'Digital',
  'Artística',
]

const CURRENT_YEAR = new Date().getFullYear().toString()

function parseAboutMe(raw: string | null | undefined): AboutMeData {
  if (!raw) return { bio: '', skills: [], experience: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return {
        bio: typeof parsed.bio === 'string' ? parsed.bio : '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        // support old key "experiences" in case already saved
        experience: Array.isArray(parsed.experience)
          ? parsed.experience
          : Array.isArray(parsed.experiences)
          ? parsed.experiences
          : [],
      }
    }
  } catch {}
  return { bio: raw, skills: [], experience: [] }
}

function makeId() {
  return Math.random().toString(36).slice(2, 8)
}

const BLANK_EXP = { category: CATEGORIES[0], title: '', year: CURRENT_YEAR, description: '' }

export default function EditProfile() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [experience, setExperience] = useState<Experience[]>([])

  const [skillInput, setSkillInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [newExp, setNewExp] = useState({ ...BLANK_EXP })
  const [editingId, setEditingId] = useState<string | null>(null)

  const skillInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${API}/users/${user!.id}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.error) throw new Error(d.error)
        const p = d.profile
        setName(p.name || '')
        setEmail(p.email || '')
        const parsed = parseAboutMe(p.aboutMe)
        setBio(parsed.bio)
        setSkills(parsed.skills)
        setExperience(parsed.experience)
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const aboutMe: AboutMeData = { bio, skills, experience }
      const res = await fetch(`${API}/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, aboutMe: JSON.stringify(aboutMe) }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function addSkill() {
    const trimmed = skillInput.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills(prev => [...prev, trimmed])
    setSkillInput('')
    skillInputRef.current?.focus()
  }

  function removeSkill(skill: string) {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  function addExperience() {
    if (!newExp.title.trim()) return
    setExperience(prev => [...prev, { ...newExp, id: makeId() }])
    setNewExp({ ...BLANK_EXP })
    setAdding(false)
  }

  function removeExperience(id: string) {
    setExperience(prev => prev.filter(e => e.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function updateExp(id: string, field: keyof Omit<Experience, 'id'>, value: string) {
    setExperience(prev => prev.map(e => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function moveExp(id: string, dir: -1 | 1) {
    setExperience(prev => {
      const idx = prev.findIndex(e => e.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  if (loading) return <div className="ep-page"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="ep-page">
      <div className="productions-header">
        <h2 className="productions-title">Edit Profile</h2>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="ep-success">Profile saved!</p>}

      <form onSubmit={handleSave} className="ep-sections">

        {/* Basic info */}
        <section className="ep-card">
          <h3 className="ep-section-title">Basic Info</h3>
          <div className="prod-form-grid">
            <div className="field">
              <label>Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="field field--full">
              <label>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Short intro about you…"
              />
            </div>
          </div>
        </section>

        {/* Skills / Especialidades */}
        <section className="ep-card">
          <h3 className="ep-section-title">Especialidades</h3>
          <div className="ep-skills-input">
            <input
              ref={skillInputRef}
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              placeholder="Ej: Editorial, Pasarela, Actuación…"
            />
            <button type="button" className="btn-secondary" onClick={addSkill}>
              + Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="ep-skills-list">
              {skills.map(skill => (
                <span key={skill} className="ep-skill-tag">
                  {skill}
                  <button
                    type="button"
                    className="ep-skill-remove"
                    onClick={() => removeSkill(skill)}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {skills.length === 0 && (
            <p className="empty-msg">No specialties yet.</p>
          )}
        </section>

        {/* Experience */}
        <section className="ep-card">
          <div className="ep-section-header">
            <h3 className="ep-section-title">Experiencia Reciente</h3>
            {!adding && (
              <button type="button" className="btn-secondary" onClick={() => setAdding(true)}>
                + Add
              </button>
            )}
          </div>

          {adding && (
            <div className="ep-exp-form">
              <div className="prod-form-grid">
                <div className="field">
                  <label>Category</label>
                  <select
                    value={newExp.category}
                    onChange={e => setNewExp(n => ({ ...n, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Year</label>
                  <input
                    value={newExp.year}
                    onChange={e => setNewExp(n => ({ ...n, year: e.target.value }))}
                    placeholder="2024"
                  />
                </div>
                <div className="field field--full">
                  <label>Title / Project *</label>
                  <input
                    value={newExp.title}
                    onChange={e => setNewExp(n => ({ ...n, title: e.target.value }))}
                    placeholder="Vogue México, Nike Campaign…"
                    autoFocus
                  />
                </div>
                <div className="field field--full">
                  <label>Description</label>
                  <textarea
                    value={newExp.description}
                    onChange={e => setNewExp(n => ({ ...n, description: e.target.value }))}
                    rows={2}
                    placeholder="Optional details…"
                  />
                </div>
              </div>
              <div className="ep-exp-form-actions">
                <button type="button" className="btn-primary" onClick={addExperience}>
                  Add
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setAdding(false); setNewExp({ ...BLANK_EXP }) }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="ep-exp-list">
            {experience.length === 0 && !adding && (
              <p className="empty-msg">No experiences yet.</p>
            )}
            {experience.map((exp, idx) => (
              <div key={exp.id} className="ep-exp-item">
                {editingId === exp.id ? (
                  <div className="ep-exp-edit-form">
                    <div className="prod-form-grid">
                      <div className="field">
                        <label>Category</label>
                        <select
                          value={exp.category}
                          onChange={e => updateExp(exp.id, 'category', e.target.value)}
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Year</label>
                        <input
                          value={exp.year}
                          onChange={e => updateExp(exp.id, 'year', e.target.value)}
                        />
                      </div>
                      <div className="field field--full">
                        <label>Title / Project</label>
                        <input
                          value={exp.title}
                          onChange={e => updateExp(exp.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="field field--full">
                        <label>Description</label>
                        <textarea
                          value={exp.description}
                          onChange={e => updateExp(exp.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="ep-exp-row">
                    <div className="ep-exp-info">
                      <span className="ep-exp-badge">{exp.category}</span>
                      <span className="ep-exp-year">{exp.year}</span>
                      <span className="ep-exp-title">{exp.title}</span>
                      {exp.description && (
                        <span className="ep-exp-desc">{exp.description}</span>
                      )}
                    </div>
                    <div className="ep-exp-btns">
                      <button
                        type="button"
                        className="ep-order-btn"
                        onClick={() => moveExp(exp.id, -1)}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ep-order-btn"
                        onClick={() => moveExp(exp.id, 1)}
                        disabled={idx === experience.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingId(exp.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => removeExperience(exp.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
