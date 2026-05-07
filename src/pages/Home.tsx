import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'
import { useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export default function Home() {
  const { user, userStats, refreshStats } = useAuth()
  useEffect(() => {
    refreshStats()
  }, [])

  const stats = [
    { label: 'Productions', value: userStats?.productionCount ?? '—', icon: '◈' },
    { label: 'Photos', value: userStats?.imageCount ?? '—', icon: '⊡' },
    { label: 'Types', value: userStats?.types.length ?? '—', icon: '▣' },
    {
      label: 'Avg. photos',
      value: userStats && userStats.productionCount > 0
        ? Math.round(userStats.imageCount / userStats.productionCount)
        : '—',
      icon: '◻',
    },
  ]

  const recent = userStats
    ? [...userStats.productions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
    : []

  return (
    <div className="home">
      <div className="home-header">
        <div>
          <h2 className="home-heading">Welcome back {user?.name || ""}!</h2>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <section className="section">
        <h3 className="section-title">Recent productions</h3>
        {!userStats ? (
          <p className="home-sub">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <p>No productions yet. <Link to="/productions">Create your first one.</Link></p>
          </div>
        ) : (
          <table className="models-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Type</th>
                <th>Photos</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id}>
                  <td className="recent-thumb-cell">
                    {p.coverImage ? (
                      <img
                        src={`${API}${p.coverImage}`}
                        alt={p.title}
                        loading="lazy"
                        className="recent-thumb"
                        onLoad={e => e.currentTarget.classList.add('recent-thumb--loaded')}
                      />
                    ) : (
                      <div className="recent-thumb recent-thumb--empty" />
                    )}
                  </td>
                  <td>
                    <Link className="recent-link" to={`/productions/${p.id}`}>
                      {p.title}
                    </Link>
                  </td>
                  <td>{p.type ?? '—'}</td>
                  <td>{p.photoCount}</td>
                  <td>
                    {p.date
                      ? new Date(p.date).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
