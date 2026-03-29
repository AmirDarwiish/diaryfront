import { useState, useEffect } from 'react';
// ملاحظة: الـ index.jsx محتاج تضيف فيه السطرين دول:
// import { useNavigate } from 'react-router-dom'   ← في الأعلى مع الـ imports
// const navigate = useNavigate()                   ← جوه الـ Dashboard function
// وفي الهيدر جنب زرار تسجيل الخروج:
// <button onClick={() => navigate('/dashboard/users')} style={{...btnSec, height:36, padding:'0 12px', fontSize:13}}>المستخدمين</button>
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LangProvider, useLang } from './context/LangContext';
import ScrollToTop from './components/ScrollToTop';

// Layout
import Navbar       from './Navbar';
import Footer       from './components/Footer';
import IntroScreen  from './components/IntroScreen';

// Pages
import HomePage     from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import WhyUsPage    from './pages/WhyUsPage';
import ContactPage  from './pages/ContactPage';
import DashboardLogin from './pages/dashboard/login'
import Dashboard      from './pages/dashboard/index'
import UsersPage      from './pages/dashboard/users'   
import UserActivityReport from './pages/dashboard/Useractivityreport'  


import './index.css';

/* ─────────────────────────────────────────────────────────────
   Layout wrapper — Navbar + page content + Footer
───────────────────────────────────────────────────────────── */
const Layout = ({ children }) => {
  const { isRtl } = useLang();
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ minHeight: '100vh', background: '#fff', color: '#0f172a', overflowX: 'hidden' }}
    >
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppBtn />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   WhatsApp floating button
───────────────────────────────────────────────────────────── */
const WhatsAppBtn = () => {
  const { isRtl } = useLang();
  return (
    <a
      href="https://wa.me/201207715484"
      target="_blank" rel="noopener noreferrer"
      style={{
        position: 'fixed', bottom: 32,
        left: isRtl ? 32 : 'auto', right: isRtl ? 'auto' : 32,
        zIndex: 999, width: 56, height: 56, borderRadius: '50%',
        background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37,211,102,.4)', transition: 'transform .2s, box-shadow .2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,211,102,.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,.4)'; }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2C7.373 2 2 7.373 2 14c0 2.15.57 4.17 1.57 5.91L2 26l6.26-1.54A11.94 11.94 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="white"/>
        <path d="M19.5 16.9c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" fill="#25d366"/>
      </svg>
    </a>
  );
};

/* ─────────────────────────────────────────────────────────────
   App routes
───────────────────────────────────────────────────────────── */
const AppRoutes = () => {
  const [showIntro,  setShowIntro]  = useState(true);
  const [introLeave, setIntroLeave] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroLeave(true),  2800);
    const t2 = setTimeout(() => setShowIntro(false),  4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      {showIntro && <IntroScreen leaving={introLeave} />}
      <Layout>
        <Routes>
          <Route path="/"         element={<HomePage />}    />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/why-us"   element={<WhyUsPage />}   />
          <Route path="/contact"  element={<ContactPage />} />
        </Routes>
      </Layout>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   Root
───────────────────────────────────────────────────────────── */
const App = () => (
  <Router>
    <ScrollToTop />
    <LangProvider>
      <Routes>
        {/* الداشبورد — من غير Navbar/Footer */}
        <Route path="/dashboard/login" element={<DashboardLogin />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/dashboard/users" element={<UsersPage />} />  {/* ← جديد */}
        <Route path="/dashboard/reports/activity" element={<UserActivityReport />} />

        {/* باقي الموقع — مع Navbar/Footer */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </LangProvider>
  </Router>
);

export default App;