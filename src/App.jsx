/**
 * src/App.jsx — ZEIIA Project
 * أُضيف: ThemeProvider + PrivateRoute + NotFound + SessionExpired
 */

import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LangProvider, useLang }  from './context/LangContext'
import { ThemeProvider }          from './context/ThemeContext'
import ScrollToTop                from './components/ScrollToTop'

// ── Layout ─────────────────────────────────────────────────
import Navbar      from './Navbar'
import Footer      from './components/Footer'
import IntroScreen from './components/IntroScreen'

// ── Public Pages ────────────────────────────────────────────
import HomePage     from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import WhyUsPage    from './pages/WhyUsPage'
import ContactPage  from './pages/ContactPage'

// ── Dashboard Pages ─────────────────────────────────────────
import DashboardLogin     from './pages/dashboard/login'
import Dashboard          from './pages/dashboard/index'
import UsersPage          from './pages/dashboard/users'
import UserActivityReport from './pages/dashboard/Useractivityreport'

// ── Projects Pages ──────────────────────────────────────────
import ProjectsList   from './pages/projects/ProjectsList'
import ProjectDetails from './pages/projects/ProjectDetails'

import './index.css'

/* ── isLoggedIn ────────────────────────────────────────────── */
const isLoggedIn = () => !!localStorage.getItem('token')

/* ── PrivateRoute ──────────────────────────────────────────── */
function PrivateRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/dashboard/login" replace />
  return children
}

/* ── 404 ───────────────────────────────────────────────────── */
function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#080d16', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cairo',sans-serif", direction:'rtl', padding:20 }}>
      <div style={{ background:'#0d1420', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, padding:'48px 40px', maxWidth:420, width:'100%', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, left:0, height:3, background:'linear-gradient(90deg,#C9A96E,#d4a855,transparent)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:72, fontWeight:900, lineHeight:1, background:'linear-gradient(135deg,#C9A96E,#d4a855)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:12 }}>404</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#e8edf5', marginBottom:10 }}>الصفحة غير موجودة</div>
        <div style={{ fontSize:13, color:'#6b7891', lineHeight:1.8, marginBottom:28 }}>الصفحة دي مش موجودة. تأكد من الرابط وحاول مجدداً.</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => navigate(-1)} style={{ height:38, padding:'0 16px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}>← رجوع</button>
          <button onClick={() => navigate('/dashboard')} style={{ height:38, padding:'0 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#d4a855,#C9A96E)', color:'#080d16', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}>الداشبورد</button>
        </div>
      </div>
    </div>
  )
}

/* ── Session Expired ───────────────────────────────────────── */
function SessionExpired() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#080d16', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cairo',sans-serif", direction:'rtl', padding:20 }}>
      <div style={{ background:'#0d1420', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, padding:'48px 40px', maxWidth:420, width:'100%', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, left:0, height:3, background:'linear-gradient(90deg,#fbbf24,transparent)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:72, fontWeight:900, lineHeight:1, background:'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:12 }}>401</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#e8edf5', marginBottom:10 }}>انتهت الجلسة</div>
        <div style={{ fontSize:13, color:'#6b7891', lineHeight:1.8, marginBottom:28 }}>انتهت مدة جلستك. سجّل الدخول مجدداً للمتابعة.</div>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/dashboard/login') }}
          style={{ height:38, padding:'0 20px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#d4a855,#C9A96E)', color:'#080d16', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}>
          تسجيل الدخول
        </button>
      </div>
    </div>
  )
}

/* ── WhatsApp btn ──────────────────────────────────────────── */
const WhatsAppBtn = () => {
  const { isRtl } = useLang()
  return (
    <a href="https://wa.me/201207715484" target="_blank" rel="noopener noreferrer"
      style={{ position:'fixed', bottom:32, left:isRtl?32:'auto', right:isRtl?'auto':32, zIndex:999, width:56, height:56, borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(37,211,102,.4)', transition:'transform .2s', textDecoration:'none' }}
      onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2C7.373 2 2 7.373 2 14c0 2.15.57 4.17 1.57 5.91L2 26l6.26-1.54A11.94 11.94 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="white"/>
        <path d="M19.5 16.9c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" fill="#25d366"/>
      </svg>
    </a>
  )
}

/* ── Public Layout ─────────────────────────────────────────── */
const PublicLayout = ({ children }) => {
  const { isRtl } = useLang()
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight:'100vh', background:'#fff', color:'#0f172a', overflowX:'hidden' }}>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppBtn />
    </div>
  )
}

/* ── Public Routes with Intro ──────────────────────────────── */
const PublicRoutes = () => {
  const [showIntro,  setShowIntro]  = useState(true)
  const [introLeave, setIntroLeave] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setIntroLeave(true), 2800)
    const t2 = setTimeout(() => setShowIntro(false), 4400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <>
      {showIntro && <IntroScreen leaving={introLeave} />}
      <PublicLayout>
        <Routes>
          <Route path="/"         element={<HomePage />}    />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/why-us"   element={<WhyUsPage />}   />
          <Route path="/contact"  element={<ContactPage />}  />
          <Route path="*"         element={<NotFound />}     />
        </Routes>
      </PublicLayout>
    </>
  )
}

/* ── Root ──────────────────────────────────────────────────── */
const App = () => (
  <ThemeProvider>
    <LangProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public dashboard auth routes */}
          <Route path="/dashboard/login"           element={<DashboardLogin />} />
          <Route path="/dashboard/session-expired" element={<SessionExpired />} />

          {/* Protected dashboard routes */}
          <Route path="/dashboard"                    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard/users"              element={<PrivateRoute><UsersPage /></PrivateRoute>} />
          <Route path="/dashboard/reports/activity"   element={<PrivateRoute><UserActivityReport /></PrivateRoute>} />
          <Route path="/dashboard/projects"           element={<PrivateRoute><ProjectsList /></PrivateRoute>} />
          <Route path="/dashboard/projects/:id"       element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />

          {/* Unknown dashboard routes → 404 */}
          <Route path="/dashboard/*"                  element={<NotFound />} />

          {/* Public website */}
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </Router>
    </LangProvider>
  </ThemeProvider>
)

export default App