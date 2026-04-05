/**
 * src/pages/dashboard/DashboardLayout.jsx
 * ─────────────────────────────────────────────────────
 * الـ layout الموحّد للداشبورد — sidebar + header
 * كل صفحات الداشبورد تتلفّ بيه
 *
 * الاستخدام:
 *   <DashboardLayout title="Leads" breadcrumb="الداشبورد">
 *     {page content}
 *   </DashboardLayout>
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API_BASE_URL from '../../config'
import { useTheme } from '../../context/ThemeContext'
import NotificationBell from './NotificationBell'
import '../../styles/dashboard.css'

/* ── Auth helper ─────────────────────────────────────────── */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/* ── SVG Icons ───────────────────────────────────────────── */
const Ico = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const IcoDash     = () => <Ico><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Ico>
const IcoLeads    = () => <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>
const IcoProjects = () => <Ico><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Ico>
const IcoUsers    = () => <Ico><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>
const IcoReport   = () => <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ico>
const IcoLogout   = () => <Ico><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>
const IcoMenu     = () => <Ico><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></Ico>
const IcoChevron  = ({ dir }) => <Ico size={16}>{dir === 'right' ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}</Ico>
const IcoSun      = () => <Ico><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Ico>
const IcoMoon     = () => <Ico><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Ico>
const IcoCollapse = () => <Ico size={16}><polyline points="15 18 9 12 15 6"/></Ico>
const IcoExpand   = () => <Ico size={16}><polyline points="9 18 15 12 9 6"/></Ico>

/* ── Nav Items ───────────────────────────────────────────── */
const NAV = [
  {
    section: 'الرئيسية',
    items: [
      { path: '/dashboard',         label: 'الليدز',         Icon: IcoLeads    },
      { path: '/dashboard/projects',label: 'البروجكتات',    Icon: IcoProjects },
    ],
  },
  {
    section: 'الإدارة',
    items: [
      { path: '/dashboard/users',              label: 'المستخدمون',   Icon: IcoUsers  },
      { path: '/dashboard/reports/activity',   label: 'تقارير النشاط', Icon: IcoReport },
    ],
  },
]

/* ── User Profile Dropdown ───────────────────────────────── */
function ProfileDropdown({ onClose }) {
  const navigate = useNavigate()
  const ref = useRef()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const name  = localStorage.getItem('user-name')  || 'المستخدم'
  const email = localStorage.getItem('user-email') || ''

  const handleLogout = async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method:'POST', headers:authHeaders(), credentials:'include' }) } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user-name')
    localStorage.removeItem('user-email')
    navigate('/dashboard/login')
  }

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      minWidth: 220,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-md)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-modal)',
      overflow: 'hidden',
      zIndex: 300,
      direction: 'rtl',
    }}>
      {/* User info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{name}</div>
        {email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email}</div>}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '12px 16px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          color: 'var(--red)', fontSize: 13, fontWeight: 700,
          fontFamily: "'Cairo', sans-serif", textAlign: 'right',
          transition: 'background .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <IcoLogout /> تسجيل الخروج
      </button>
    </div>
  )
}

/* ── NavItem ─────────────────────────────────────────────── */
function NavItem({ item, collapsed, badge }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = location.pathname === item.path

  return (
    <button
      onClick={() => navigate(item.path)}
      className={`db-nav-item${isActive ? ' db-nav-item--active' : ''}`}
      title={collapsed ? item.label : ''}
    >
      <span className="db-nav-item__icon"><item.Icon /></span>
      <span className="db-nav-item__label">{item.label}</span>
      {badge > 0 && <span className="db-nav-item__badge">{badge > 9 ? '9+' : badge}</span>}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Main Export
═══════════════════════════════════════════════════════════ */
export default function DashboardLayout({
  children,
  title = '',
  breadcrumb = 'الداشبورد',
  headerActions = null,
  onOpenLead = null,
}) {
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [collapsed,   setCollapsed]   = useState(() => window.innerWidth < 1200)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [todayBadge,  setTodayBadge]  = useState(0)
  const [drawerLead,  setDrawerLead]  = useState(null)

  /* close mobile on route change */
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  /* responsive collapse */
  useEffect(() => {
    const fn = () => { if (window.innerWidth < 1200) setCollapsed(true) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  /* follow-ups badge */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads/follow-ups?today=true`, { headers: authHeaders(), credentials: 'include' })
        if (res.ok) { const d = await res.json(); setTodayBadge(Array.isArray(d) ? d.length : (d?.data?.length || 0)) }
      } catch {}
    }
    load()
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <div className="db-shell" style={{ direction: 'rtl' }}>

      {/* ── Sidebar ────────────────────────────────────── */}
      {mobileOpen && <div className="db-sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`db-sidebar${collapsed && !isMobile ? ' db-sidebar--collapsed' : ''}${mobileOpen ? ' db-sidebar--open' : ''}`}>

        {/* Logo */}
        <div className="db-sidebar__logo">
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#080d16',
          }}>Z</div>
          <span className="db-sidebar__logo-text">ZEIIA CRM</span>
        </div>

        {/* Nav */}
        <nav className="db-nav">
          {NAV.map(section => (
            <div key={section.section} className="db-nav-section">
              <div className="db-nav-label">{section.section}</div>
              {section.items.map(item => (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed && !mobileOpen}
                  badge={item.path === '/dashboard' ? todayBadge : 0}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: collapse toggle */}
        <div className="db-sidebar__footer">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="db-nav-item"
            style={{ width: '100%' }}
            title={collapsed ? 'توسيع' : 'تصغير'}
          >
            <span className="db-nav-item__icon">
              {collapsed ? <IcoExpand /> : <IcoCollapse />}
            </span>
            <span className="db-nav-item__label">{collapsed ? 'توسيع' : 'تصغير'}</span>
          </button>
        </div>
      </aside>

      {/* ── Wrapper (header + content) ─────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Header ───────────────────────────────────── */}
        <header className={`db-header${collapsed && !isMobile ? ' db-header--collapsed' : ''}`}>

          {/* Right: hamburger + breadcrumb */}
          <div className="db-header__right" style={{ gap: 12 }}>
            {/* Mobile hamburger */}
            <button
              className="db-btn--icon"
              onClick={() => setMobileOpen(o => !o)}
              style={{ display: isMobile ? 'flex' : 'none' }}
            >
              <IcoMenu />
            </button>

            {/* Page title */}
            <div style={{ minWidth: 0 }}>
              {breadcrumb && (
                <div className="db-header__breadcrumb" style={{ fontSize: 11, marginBottom: 1 }}>
                  {breadcrumb}
                </div>
              )}
              {title && <div className="db-header__title">{title}</div>}
            </div>
          </div>

          {/* Left: actions */}
          <div className="db-header__actions">
            {/* Custom page actions */}
            {headerActions}

            {/* Notifications */}
            <NotificationBell
              onOpenLead={(leadId) => {
                if (onOpenLead) onOpenLead(leadId)
                else navigate('/dashboard')
              }}
            />

            {/* Theme toggle */}
            <button
              className="db-btn--icon"
              onClick={toggleTheme}
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {isDark ? <IcoSun /> : <IcoMoon />}
            </button>

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <div
                className="db-avatar"
                onClick={() => setProfileOpen(o => !o)}
                title="الملف الشخصي"
              >
                {(localStorage.getItem('user-name') || 'M')[0].toUpperCase()}
              </div>
              {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────── */}
        <main className="db-main db-animate-in" style={{
          // margin already handled by CSS classes but we need inline for collapsed state
          marginRight: isMobile ? 0 : (collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)'),
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}