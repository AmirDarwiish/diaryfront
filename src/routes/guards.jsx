/**
 * src/routes/guards.jsx
 * ─────────────────────────────────────────────────────
 * PrivateRoute   — يحمي الـ dashboard routes
 * NotFound       — 404
 * Unauthorized   — 403
 * SessionExpired — 401
 * ─────────────────────────────────────────────────────
 */

import { Navigate, useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'

const isLoggedIn = () => !!localStorage.getItem('token')

/* ══════════════════════════════════════════════
   PrivateRoute
   لو مفيش token → redirect لـ login
══════════════════════════════════════════════ */
export function PrivateRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/dashboard/login" replace />
  }
  return children
}

/* ══════════════════════════════════════════════
   Shared Page Shell
══════════════════════════════════════════════ */
function ErrorPage({ accentColor, iconColor, iconBg, codeBg, code, title, desc, extra, actions }) {
  return (
    <div className="db-error-page">
      <div className="db-error-page-card db-animate-in">
        {/* accent top bar */}
        <div style={{
          position: 'absolute', top: 0, right: 0, left: 0, height: 3,
          background: accentColor,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* icon */}
        <div className="db-error-page-icon" style={{ background: iconBg }}>
          {iconColor}
        </div>

        {/* code */}
        <div className="db-error-page-code" style={{ backgroundImage: codeBg }}>
          {code}
        </div>

        <div className="db-error-page-title">{title}</div>
        <div className="db-error-page-desc">{desc}</div>

        {extra}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {actions}
        </div>

        <div className="db-error-page-brand">ZEIIA CRM</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   404 — Not Found
══════════════════════════════════════════════ */
export function NotFound() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      accentColor="linear-gradient(90deg,#C9A96E,#d4a855,transparent)"
      iconBg="rgba(201,169,110,.08)"
      codeBg="linear-gradient(135deg,#C9A96E,#d4a855)"
      code="404"
      iconColor={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <line x1="11" y1="8" x2="11" y2="11"/>
          <circle cx="11" cy="14" r=".5" fill="#C9A96E"/>
        </svg>
      }
      title="الصفحة غير موجودة"
      desc={<>الصفحة اللي بتدور عليها مش موجودة أو اتحذفت.<br />تأكد من الرابط وحاول مجدداً.</>}
      actions={<>
        <button onClick={() => navigate(-1)} className="db-btn db-btn-ghost">← رجوع</button>
        <button onClick={() => navigate('/dashboard')} className="db-btn db-btn-gold">الداشبورد الرئيسي</button>
      </>}
    />
  )
}

/* ══════════════════════════════════════════════
   403 — Unauthorized
══════════════════════════════════════════════ */
export function Unauthorized({ reason = 'ليس لديك صلاحية للوصول لهذه الصفحة.' }) {
  const navigate = useNavigate()
  return (
    <ErrorPage
      accentColor="linear-gradient(90deg,#f87171,transparent)"
      iconBg="rgba(248,113,113,.08)"
      codeBg="linear-gradient(135deg,#f87171,#ef4444)"
      code="403"
      iconColor={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      }
      title="وصول مرفوض"
      desc={reason}
      extra={
        <div style={{
          background: 'rgba(248,113,113,.06)',
          border: '1px solid rgba(248,113,113,.15)',
          borderRadius: 10, padding: '12px 16px',
          fontSize: 12, color: '#94a3b8',
          marginBottom: 28, textAlign: 'right', lineHeight: 1.8,
        }}>
          لو عندك أي استفسار، تواصل مع مسؤول النظام.
        </div>
      }
      actions={<>
        <button onClick={() => navigate(-1)} className="db-btn db-btn-ghost">← رجوع</button>
        <button onClick={() => navigate('/dashboard')} className="db-btn db-btn-gold">الداشبورد الرئيسي</button>
      </>}
    />
  )
}

/* ══════════════════════════════════════════════
   401 — Session Expired
══════════════════════════════════════════════ */
export function SessionExpired() {
  const navigate = useNavigate()
  const handleLogin = () => {
    localStorage.removeItem('token')
    navigate('/dashboard/login')
  }
  return (
    <ErrorPage
      accentColor="linear-gradient(90deg,#fbbf24,transparent)"
      iconBg="rgba(251,191,36,.08)"
      codeBg="linear-gradient(135deg,#fbbf24,#f59e0b)"
      code="401"
      iconColor={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      }
      title="انتهت الجلسة"
      desc="انتهت مدة جلستك. سجّل الدخول مجدداً للمتابعة."
      actions={
        <button onClick={handleLogin} className="db-btn db-btn-gold" style={{ margin: '0 auto' }}>
          تسجيل الدخول
        </button>
      }
    />
  )
}