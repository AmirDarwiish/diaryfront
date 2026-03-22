import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  Code,
  Smartphone,
  Layout,
  Settings,
  Zap,
  ShieldCheck,
  BarChart,
  Headphones,
  Search,
  PenTool,
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  Menu,
  X,
  Globe
} from 'lucide-react';
import logoBase64 from './logoBase64';

/* ─── Tailwind-free inline style helpers ─── */
const css = {
  navWrap: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #f1f5f9',
  },
  navInner: {
    maxWidth: 1280, margin: '0 auto', padding: '0 24px',
    height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
};

/* ─── Reusable tiny components ─── */
const Tag = ({ children }) => (
  <span style={{
    display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#C9A96E', marginBottom: 16,
  }}>{children}</span>
);

const Btn = ({ href, primary, children, style = {} }) => (
  <a href={href} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
    borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none',
    transition: 'all .2s',
    background: primary ? '#C9A96E' : '#f1f5f9',
    color: primary ? '#fff' : '#334155',
    boxShadow: primary ? '0 8px 24px rgba(201,169,110,.25)' : 'none',
    ...style,
  }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >{children}</a>
);

/* ─── Section wrapper ─── */
const Section = ({ id, bg, children, style = {} }) => (
  <section id={id} style={{
    padding: '64px 24px',
    background: bg || '#fff',
    ...style,
  }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>{children}</div>
  </section>
);

/* ─── Hero illustration ─── */
const HeroIllustration = ({ isRtl }) => {
  const services = isRtl ? [
    { title: 'تطوير المواقع', desc: 'منصات ويب قابلة للتوسع ومبنية للأداء العالي' },
    { title: 'تطبيقات الجوال', desc: 'تطبيقات iOS و Android احترافية' },
    { title: 'أنظمة مخصصة', desc: 'برمجيات وأنظمة متكاملة لأعمالك' },
  ] : [
    { title: 'Web Development', desc: 'Scalable web platforms built for performance' },
    { title: 'Mobile Apps', desc: 'Native iOS & Android apps users love' },
    { title: 'Custom Systems', desc: 'End-to-end business software & integrations' },
  ];

  const icons = [
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="2" y="5" width="24" height="18" rx="3" stroke="#C9A96E" strokeWidth="1.8"/>
      <line x1="2" y1="10" x2="26" y2="10" stroke="#C9A96E" strokeWidth="1.8"/>
      <circle cx="6" cy="7.5" r="1" fill="#C9A96E"/>
      <circle cx="10" cy="7.5" r="1" fill="#C9A96E"/>
      <circle cx="14" cy="7.5" r="1" fill="#C9A96E"/>
      <line x1="7" y1="15" x2="21" y2="15" stroke="#F5EDD9" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="7" y1="19" x2="16" y2="19" stroke="#F5EDD9" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>,
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="8" y="2" width="12" height="24" rx="3" stroke="#C9A96E" strokeWidth="1.8"/>
      <line x1="8" y1="7" x2="20" y2="7" stroke="#C9A96E" strokeWidth="1.8"/>
      <line x1="8" y1="21" x2="20" y2="21" stroke="#C9A96E" strokeWidth="1.8"/>
      <circle cx="14" cy="24" r="1" fill="#C9A96E"/>
      <line x1="11" y1="13" x2="17" y2="13" stroke="#F5EDD9" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="11" y1="16" x2="15" y2="16" stroke="#F5EDD9" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>,
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="9" height="9" rx="2" stroke="#C9A96E" strokeWidth="1.8"/>
      <rect x="16" y="3" width="9" height="9" rx="2" stroke="#C9A96E" strokeWidth="1.8"/>
      <rect x="3" y="16" width="9" height="9" rx="2" stroke="#C9A96E" strokeWidth="1.8"/>
      <rect x="16" y="16" width="9" height="9" rx="2" stroke="#F5EDD9" strokeWidth="1.8"/>
      <line x1="12" y1="7.5" x2="16" y2="7.5" stroke="#C9A96E" strokeWidth="1.5" strokeDasharray="1.5 1.5"/>
      <line x1="7.5" y1="12" x2="7.5" y2="16" stroke="#C9A96E" strokeWidth="1.5" strokeDasharray="1.5 1.5"/>
      <line x1="20.5" y1="12" x2="20.5" y2="16" stroke="#C9A96E" strokeWidth="1.5" strokeDasharray="1.5 1.5"/>
    </svg>,
  ];

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', top: -40, right: isRtl ? 'auto' : -40, left: isRtl ? -40 : 'auto',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, #F5EDD9 0%, transparent 70%)',
        filter: 'blur(32px)', opacity: 0.7,
      }} className="animate-blob" />

      <div style={{
        position: 'relative', zIndex: 2, background: '#fff',
        borderRadius: 24, border: '1px solid #f1f5f9',
        boxShadow: '0 32px 80px rgba(15,23,42,.1)',
        padding: 32, width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
      {/* header */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
  <svg width="120" height="48" viewBox="0 0 120 48" fill="none">
    <circle cx="24" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="44" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="34" cy="24" r="18" stroke="#C9A96E" strokeWidth="1.5" opacity="0.6"/>
    <circle cx="34" cy="24" r="3" fill="#C9A96E"/>
    <line x1="68" y1="12" x2="115" y2="12" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="68" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="68" y1="28" x2="108" y2="28" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="68" y1="36" x2="90" y2="36" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  <div style={{
    padding: '6px 16px', borderRadius: 50, fontSize: 11, fontWeight: 700,
    background: '#F5EDD9', color: '#C9A96E', border: '1px solid #E8D5B0',
  }}>{isRtl ? 'خدماتنا' : 'Our Services'}</div>
</div>
        {/* service cards */}
        {services.map((service, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 18px', borderRadius: 16,
            background: i === 0 ? '#F5EDD9' : '#f8fafc',
            border: `1px solid ${i === 0 ? '#E8D5B0' : '#f1f5f9'}`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: '#fff', border: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
            }}>{icons[i]}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{service.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{service.desc}</div>
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d={isRtl ? "M11 4L6 9L11 14" : "M7 4L12 9L7 14"} stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*                  MAIN APP                   */
/* ═══════════════════════════════════════════ */
const App = () => {
  const [lang, setLang] = useState('ar');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const isRtl = lang === 'ar';

  const translations = {
    en: {
      companyName: "zeiia",
      nav: { services: "Services", whyUs: "Why Us", process: "Process", contact: "Get Started" },
      hero: {
        badge: "Your tech partner to build your next project",
        title: "We Build ",
        titleAccent: "Smart",
        titleEnd: " Digital Solutions.",
        sub: "We partner with ambitious startups and established businesses to engineer scalable software that drives growth and simplifies complexity.",
        cta1: "Free Consultation",
        cta2: "Our Services"
      },
      services: {
        tag: "Core Expertise",
        title: "End-to-end development services tailored to your needs",
        items: [
          { title: "Web Development", desc: "Custom enterprise-grade web applications built with modern frameworks." },
          { title: "Mobile Apps", desc: "Native and cross-platform mobile solutions for iOS and Android." },
          { title: "UI/UX Design", desc: "User-centric design focused on conversion and intuitive navigation." },
          { title: "System Integration", desc: "Connecting your software systems to eliminate data silos." }
        ]
      },
      whyUs: {
        tag: "The Advantage",
        title: "Why forward-thinking brands choose zeiia",
        items: [
          { title: "Fast Delivery", desc: "Agile methodologies that ensure quick turnarounds." },
          { title: "Scalable Solutions", desc: "Architecture designed to grow with your business." },
          { title: "Business-Oriented", desc: "We solve business problems to drive your ROI." },
          { title: "Dedicated Support", desc: "Ongoing maintenance to keep you running smoothly." }
        ],
        quote: "zeiia doesn't just build apps; they build the future of your company. Their technical prowess is unmatched."
      },
      process: {
        tag: "Our Workflow",
        title: "Simple. Transparent. Effective.",
        steps: [
          { title: "Understand", desc: "Deep analysis of your requirements and goals." },
          { title: "Design", desc: "Crafting the visual identity and user journey." },
          { title: "Develop", desc: "High-quality coding with continuous feedback." },
          { title: "Launch", desc: "Deployment and ongoing optimization." }
        ]
      },
      about: {
        tag: "About Us",
        title: "A vision for digital excellence.",
        desc: "Founded by engineers and product thinkers, zeiia bridges the gap between complex technology and meaningful human experience. We empower startups with world-class technology."
      },
      contact: {
        tag: "Contact",
        title: "Let's talk about your project.",
        sub: "Fill out the form, or reach out directly. We respond within 12 hours.",
        formName: "Full Name",
        formEmail: "Email Address",
        formMsg: "How can we help?",
        formBtn: "Send Message",
        success: "Message Sent!",
        successSub: "Our team will get back to you shortly."
      },
      footer: {
        desc: "Engineering digital foundations for the world's next great companies.",
        rights: "© 2026 zeiia. All rights reserved."
      }
    },
    ar: {
      companyName: "زيا",
      nav: { services: "خدماتنا", whyUs: "لماذا نحن", process: "آلية العمل", contact: "ابدأ مشروعك" },
      hero: {
        badge: "شريكك التقني لبناء مشروعك",
        title: "نبني حلولاً رقمية ",
        titleAccent: "ذكية",
        titleEnd: " لأعمالك.",
        sub: "نحن شريكك التقني لبناء برمجيات قابلة للتوسع، تساعد الشركات الناشئة والكبرى على النمو وتبسيط العمليات المعقدة.",
        cta1: "استشارة مجانية",
        cta2: "عرض الخدمات"
      },
      services: {
        tag: "خبراتنا الأساسية",
        title: "خدمات تطوير متكاملة مصممة خصيصاً لاحتياجاتك",
        items: [
          { title: "تطوير المواقع", desc: "تطبيقات ويب مخصصة للمؤسسات مبنية بأحدث الإطارات البرمجية." },
          { title: "تطبيقات الجوال", desc: "حلول أصلية وعابرة للمنصات بنظامي iOS و Android." },
          { title: "تصميم UI/UX", desc: "تصميم يركز على المستخدم لضمان سهولة الاستخدام وزيادة التحويل." },
          { title: "تكامل الأنظمة", desc: "ربط أنظمتك البرمجية المختلفة لضمان تدفق البيانات بسلاسة." }
        ]
      },
      whyUs: {
        tag: "الميزة التنافسية",
        title: "لماذا تختار العلامات الطموحة شركة زيا",
        items: [
          { title: "سرعة التنفيذ", desc: "منهجيات مرنة تضمن تسليم المشاريع في أوقات قياسية." },
          { title: "حلول قابلة للتوسع", desc: "بنية تحتية مصممة لتنمو مع نمو حجم أعمالك." },
          { title: "توجه تجاري", desc: "نحن لا نكتب كوداً فقط، بل نحل مشاكل العمل لزيادة عوائدك." },
          { title: "دعم مخصص", desc: "صيانة مستمرة لضمان عمل برمجياتك بكفاءة على مدار الساعة." }
        ],
        quote: "زيا لا تبني تطبيقات فقط؛ بل تبني مستقبل شركتك. براعتهم التقنية تفوق التوقعات."
      },
      process: {
        tag: "آلية العمل",
        title: "بسيطة. شفافة. فعالة.",
        steps: [
          { title: "الفهم", desc: "تحليل دقيق لمتطلباتك وأهدافك." },
          { title: "التصميم", desc: "رسم الهوية البصرية ورحلة المستخدم." },
          { title: "التطوير", desc: "برمجة عالية الجودة مع تحديثات مستمرة." },
          { title: "الإطلاق", desc: "النشر والتحسين المستمر بعد الإطلاق." }
        ]
      },
      about: {
        tag: "عن زيا",
        title: "رؤية للتميز الرقمي.",
        desc: "تأسست زيا على يد مهندسين ومفكري منتجات، لسد الفجوة بين التكنولوجيا المعقدة والتجربة الإنسانية الهادفة. نحن نمكن الشركات من امتلاك تقنيات عالمية."
      },
      contact: {
        tag: "اتصل بنا",
        title: "لنناقش مشروعك القادم.",
        sub: "املأ النموذج أو تواصل معنا مباشرة. نرد عادةً خلال 12 ساعة.",
        formName: "الاسم الكامل",
        formEmail: "البريد الإلكتروني",
        formMsg: "كيف يمكننا مساعدتك؟",
        formBtn: "إرسال الرسالة",
        success: "تم الإرسال بنجاح!",
        successSub: "سيتواصل معك فريقنا في أقرب وقت ممكن."
      },
      footer: {
        desc: "هندسة الأسس الرقمية لأعظم شركات المستقبل.",
        rights: "© 2026 زيا. جميع الحقوق محفوظة."
      }
    }
  };

  const t = translations[lang];

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

  const serviceIcons = [<Code size={22}/>, <Smartphone size={22}/>, <Layout size={22}/>, <Settings size={22}/>];
  const whyIcons = [<Zap size={18}/>, <BarChart size={18}/>, <ShieldCheck size={18}/>, <Headphones size={18}/>];
  const processIcons = [<Search size={24}/>, <PenTool size={24}/>, <Code size={24}/>, <Rocket size={24}/>];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#fff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={css.navWrap}>
        <div style={css.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-dark.PNG" alt="zeiia logo" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          </div>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontWeight: 600, fontSize: 14, color: '#475569' }}
            className="desktop-nav">
            {[['#services', t.nav.services], ['#why-us', t.nav.whyUs], ['#process', t.nav.process]].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#475569', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = '#C9A96E'}
                onMouseLeave={e => e.target.style.color = '#475569'}>{label}</a>
            ))}
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 10, border: '1px solid #e2e8f0', background: 'transparent',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'Cairo, sans-serif',
            }}>
              <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <a href="#contact" style={{
              padding: '10px 24px', background: '#0f172a', color: '#fff',
              borderRadius: 50, textDecoration: 'none', fontWeight: 700, fontSize: 13,
              transition: 'background .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#C9A96E'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
            >{t.nav.contact}</a>
          </div>

          {/* Mobile buttons */}
          <div style={{ display: 'flex', gap: 8 }} className="mobile-nav">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{
              padding: 8, border: '1px solid #f1f5f9', borderRadius: 10, background: '#f8fafc', cursor: 'pointer', color: '#475569',
            }}><Globe size={18} /></button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{
              padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#0f172a',
            }}>{isMenuOpen ? <X size={24}/> : <Menu size={24}/>}</button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute', top: 80, left: 0, right: 0,
            background: '#fff', borderBottom: '1px solid #f1f5f9',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,.08)',
          }}>
            {[['#services', t.nav.services], ['#why-us', t.nav.whyUs], ['#process', t.nav.process], ['#contact', t.nav.contact]].map(([href, label], i) => (
              <a key={href} href={href} onClick={() => setIsMenuOpen(false)} style={{
                fontSize: 20, fontWeight: 800, color: i === 3 ? '#C9A96E' : '#0f172a',
                textDecoration: 'none', paddingBottom: i < 3 ? 16 : 0,
                borderBottom: i < 3 ? '1px solid #f8fafc' : 'none',
              }}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 96, padding: '140px 24px 96px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, right: isRtl ? 'auto' : 0, left: isRtl ? 0 : 'auto',
          width: '50%', height: '100%', zIndex: 0,
          background: 'linear-gradient(to left, #f8fafc, transparent)', opacity: 0.6,
        }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }} className="hero-grid">
          <div>
            {/* badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 50, background: '#F5EDD9',
              color: '#C9A96E', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{ position: 'relative', width: 8, height: 8 }}>
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '50%', background: '#C9A96E', opacity: 0.7,
                  animation: 'ping 1.5s cubic-bezier(0,0,.2,1) infinite',
                }} />
                <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#A8864F' }} />
              </span>
              {t.hero.badge}
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 900, lineHeight: 1.35, marginBottom: 28, color: '#0f172a' }}>
              {t.hero.title}<span style={{ color: '#C9A96E' }}>{t.hero.titleAccent}</span>{t.hero.titleEnd}
            </h1>
            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.75, marginBottom: 40, maxWidth: 520 }}>
              {t.hero.sub}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Btn href="#contact" primary>{t.hero.cta1} {isRtl ? <ArrowRight size={16} style={{transform:'rotate(180deg)'}}/> : <ChevronRight size={16}/>}</Btn>
              <Btn href="#services">{t.hero.cta2}</Btn>
            </div>
          </div>

          <div className="hero-illustration">
            <HeroIllustration isRtl={isRtl} />
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <Section id="services" bg="#f8fafc">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px' }}>
          <Tag>{t.services.tag}</Tag>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>{t.services.title}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {t.services.items.map((s, i) => (
            <div key={i} style={{
              background: '#fff', padding: '36px 28px', borderRadius: 20,
              border: '1px solid #f1f5f9', transition: 'all .25s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 48px rgba(201,169,110,.12)'; e.currentTarget.style.borderColor = '#E8D5B0'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: '#F5EDD9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#C9A96E', marginBottom: 24,
              }}>{serviceIcons[i]}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── WHY US ── */}
      <Section id="why-us">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="why-grid">
          <div>
            <Tag>{t.whyUs.tag}</Tag>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 40 }}>{t.whyUs.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {t.whyUs.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#0f172a',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{whyIcons[i]}</div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{item.title}</h4>
                    <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Problems/Solutions cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                problem: isRtl ? 'عندي فكرة بس مش عارف أبدأ منين' : "I have an idea but don't know where to start",
                solution: isRtl ? 'نحول فكرتك لمنتج حقيقي من الصفر' : 'We turn your idea into a real product from scratch',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              },
              {
                problem: isRtl ? 'جربت شركات تانية وخذلتني' : 'I tried other agencies and got disappointed',
                solution: isRtl ? 'نلتزم بالمواعيد والجودة من أول يوم' : 'We commit to deadlines and quality from day one',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              },
              {
                problem: isRtl ? 'مش عارف التقنية المناسبة لمشروعي' : "I don't know the right tech for my project",
                solution: isRtl ? 'نختار أنسب تقنية لاحتياجك وميزانيتك' : 'We pick the right tech for your needs and budget',
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '20px 24px', borderRadius: 18,
                background: i === 0 ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = i === 0 ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = i === 0 ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(201,169,110,0.2)', color: '#C9A96E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, lineHeight: 1.5 }}>
                      "{item.problem}"
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A96E', lineHeight: 1.5 }}>
                      → {item.solution}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PROCESS ── */}
      <Section id="process" bg="#f8fafc" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Tag>{t.process.tag}</Tag>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800 }}>{t.process.title}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 44, left: '8%', right: '8%', height: 1, background: '#e2e8f0' }} className="process-line" />
          {t.process.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', background: '#fff',
                border: '3px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#C9A96E', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,.06)',
                transition: 'transform .3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >{processIcons[i]}</div>
              <div style={{
                fontSize: 12, fontWeight: 800, color: '#C9A96E', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>0{i + 1}</div>
              <h4 style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{step.title}</h4>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, maxWidth: 180 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <Section>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Tag>{t.about.tag}</Tag>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, marginBottom: 20 }}>{t.about.title}</h2>
          <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.8 }}>{t.about.desc}</p>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact" bg="#f8fafc">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }} className="contact-grid">
          <div>
            <Tag>{t.contact.tag}</Tag>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>{t.contact.title}</h2>
            <p style={{ color: '#64748b', fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>{t.contact.sub}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { Icon: Mail, label: isRtl ? 'راسلنا' : 'Email us', value: 'sales@zeiia.com' },
                { Icon: Phone, label: isRtl ? 'اتصل / واتساب' : 'Call / WhatsApp', value: '+20 100 000 0000' },
              ].map(({ Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: 18, background: '#fff', borderRadius: 18,
                  border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                  transition: 'all .2s', cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#E8D5B0'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }} dir="ltr">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ background: '#fff', padding: '48px 40px', borderRadius: 28, border: '1px solid #f1f5f9', boxShadow: '0 32px 64px rgba(0,0,0,.08)' }}>
            {formStatus === 'success' ? (
              <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <ShieldCheck size={36} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t.contact.success}</h3>
                <p style={{ color: '#64748b' }}>{t.contact.successSub}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* name + email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                      {t.contact.formName}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={isRtl ? 'محمد أحمد' : 'John Doe'}
                      value={formData.name}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^[\u0600-\u06FFa-zA-Z\s]*$/.test(val)) {
                          setFormData({ ...formData, name: val });
                        }
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none',
                        transition: 'border-color .2s', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#C9A96E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                      {t.contact.formEmail}
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none',
                        transition: 'border-color .2s', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#C9A96E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                {/* phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    required
                    type="tel"
                    dir="ltr"
                    placeholder="+20 100 000 0000"
                    value={formData.phone}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^[0-9+\s()-]*$/.test(val)) {
                        setFormData({ ...formData, phone: val });
                      }
                    }}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: `1.5px solid ${formData.phone && !/^[0-9+\s()-]{7,15}$/.test(formData.phone) ? '#f87171' : '#e2e8f0'}`,
                      background: '#f8fafc',
                      fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none',
                      transition: 'border-color .2s', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => {
                      if (formData.phone && !/^[0-9+\s()-]{7,15}$/.test(formData.phone)) {
                        e.target.style.borderColor = '#f87171';
                      } else {
                        e.target.style.borderColor = '#e2e8f0';
                      }
                    }}
                  />
                  {formData.phone && !/^[0-9+\s()-]{7,15}$/.test(formData.phone) && (
                    <p style={{ fontSize: 11, color: '#f87171', marginTop: 6, fontWeight: 600 }}>
                      {isRtl ? 'رقم الهاتف غير صحيح' : 'Invalid phone number'}
                    </p>
                  )}
                </div>

                {/* message */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    {t.contact.formMsg}
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Tell us about your project...'}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '1.5px solid #e2e8f0', background: '#f8fafc',
                      fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none',
                      resize: 'none', transition: 'border-color .2s', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* submit */}
                <button
                  type="submit"
                  style={{
                    padding: '16px', background: '#0f172a', color: '#fff',
                    borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none',
                    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background .2s', boxShadow: '0 8px 24px rgba(15,23,42,.15)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#C9A96E'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                >
                  {t.contact.formBtn}
                  <ArrowRight size={18} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                </button>

              </form>
            )}
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '80px 24px 40px', borderRadius: '24px 24px 0 0', margin: '0 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 48, marginBottom: 56, paddingBottom: 48, borderBottom: '1px solid #1e293b' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <img src={logoBase64} alt="zeiia" style={{ width: 80, height: 80, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>{t.footer.desc}</p>
            </div>
            <div>
              <h5 style={{ color: '#fff', fontWeight: 800, marginBottom: 24, fontSize: 15 }}>{t.companyName}</h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[[t.nav.services,'#services'],[t.nav.whyUs,'#why-us'],[t.nav.process,'#process']].map(([label, href]) => (
                  <li key={href}><a href={href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'color .2s' }}
                    onMouseEnter={e => e.target.style.color = '#C9A96E'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 style={{ color: '#fff', fontWeight: 800, marginBottom: 24, fontSize: 15 }}>
                {isRtl ? 'الدعم' : 'Support'}
              </h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  [isRtl ? 'مركز المساعدة' : 'Help Center', '#'],
                  [isRtl ? 'سياسة الخصوصية' : 'Privacy Policy', '#'],
                  [isRtl ? 'الشروط والأحكام' : 'Terms', '#'],
                ].map(([label, href]) => (
                  <li key={label}><a href={href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'color .2s' }}
                    onMouseEnter={e => e.target.style.color = '#C9A96E'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 style={{ color: '#fff', fontWeight: 800, marginBottom: 24, fontSize: 15 }}>{isRtl ? 'التواصل الاجتماعي' : 'Social'}</h5>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  {
                    label: 'Fb',
                    href: 'https://www.facebook.com/your-page',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 12a10 10 0 10-11.5 9.87v-6.99h-2.7V12h2.7V9.8c0-2.66 1.58-4.13 4-4.13 1.16 0 2.38.2 2.38.2v2.62h-1.34c-1.32 0-1.73.82-1.73 1.66V12h2.94l-.47 2.88h-2.47v6.99A10 10 0 0022 12z"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Li',
                    href: 'https://www.linkedin.com/company/zeiia',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                        <circle cx="4" cy="4" r="2"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Tk',
                    href: 'https://www.tiktok.com/@your-account',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.75 2h3.5a5.75 5.75 0 005.75 5.75v3.5a9.25 9.25 0 01-5.75-1.96v6.96a6.5 6.5 0 11-6.5-6.5c.27 0 .53.02.79.06v3.58a3 3 0 103 3V2z"/>
                      </svg>
                    ),
                  },
                ].map(({ label, icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: '#1e293b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#94a3b8', transition: 'all .2s', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#C9A96E'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, flexWrap: 'wrap', gap: 12 }}>
            <p>{t.footer.rights}</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['English','عربي'].map(l => (
                <span key={l} style={{ cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── RESPONSIVE CSS ── */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        html { scroll-behavior: smooth; }

        @media (max-width: 900px) {
          .hero-grid, .why-grid, .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-illustration { display: none; }
          .process-line { display: none; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/201000000000"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed', bottom: 32,
          left: isRtl ? 32 : 'auto', right: isRtl ? 'auto' : 32,
          zIndex: 999, width: 56, height: 56, borderRadius: '50%',
          background: '#25d366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37,211,102,.4)',
          transition: 'transform .2s, box-shadow .2s', textDecoration: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,211,102,.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,.4)'; }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C7.373 2 2 7.373 2 14c0 2.15.57 4.17 1.57 5.91L2 26l6.26-1.54A11.94 11.94 0 0014 26c6.627 0 12-5.373 12-12S20.627 2 14 2z" fill="white"/>
          <path d="M19.5 16.9c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" fill="#25d366"/>
        </svg>
      </a>

    </div>
  );
};

export default App;