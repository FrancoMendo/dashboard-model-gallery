import { useAuth } from '../context/AuthContext'
import './Home.css'

const STATS = [
  { label: 'Total Models', value: '—', icon: '◈' },
  { label: 'Published', value: '—', icon: '▣' },
  { label: 'Drafts', value: '—', icon: '◻' },
  { label: 'Media Files', value: '—', icon: '⊡' },
]

const RECENT: { name: string; status: 'published' | 'draft'; updated: string }[] = []

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="home">
      <div className="home-header">
        <div>
          <h2 className="home-heading">Welcome back</h2>
          <p className="home-sub">{(user as any)?.name || "-"}</p>
        </div>
      </div>

      <div className="stats-grid">
        {STATS.map(({ label, value, icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <section className="section">
        <h3 className="section-title">Recent models</h3>
        {RECENT.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <p>No models yet. Add your first model to get started.</p>
          </div>
        ) : (
          <table className="models-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map(m => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>
                    <span className={`badge badge--${m.status}`}>{m.status}</span>
                  </td>
                  <td>{m.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
