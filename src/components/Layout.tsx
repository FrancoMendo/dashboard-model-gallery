import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '⊞' },
  { to: '/productions', label: 'Productions', icon: '◈' },
  { to: '/upload', label: 'Upload', icon: '⊡' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">ModelGallery</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' nav-item--active' : ''}`
              }
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.[0]?.toUpperCase()}</div>
            <span className="user-email">{user}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="brand-icon">◈</span>
            <span className="brand-name">ModelGallery</span>
          </div>
          <div className="topbar-actions">
            <div className="user-avatar topbar-avatar">{user?.[0]?.toUpperCase()}</div>
            <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
