import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, ArrowRight, Cpu, TabletSmartphone, Gem, 
  ShieldCheck, Search, PenTool, CodeXml, Rocket,
  Globe, ShoppingCart, BarChart2, Layers, ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import HeroIllustration from '../components/shared/HeroIllustration';
import useReveal from '../hooks/useReveal';
import countries from '../constants/countries';

/* ─────────────────────────────────────────────
   GLASS TOKENS
───────────────────────────────────────────── */
const glass = {
  light: {
    bg:     'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.35)',
    blur:   'blur(18px)',
    shadow: '0 8px 32px rgba(201,169,110,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  medium: {
    bg:     'rgba(255,255,255,0.28)',
    border: '1px solid rgba(255,255,255,0.45)',
    blur:   'blur(24px)',
    shadow: '0 16px 48px rgba(201,169,110,0.13), inset 0 1px 0 rgba(255,255,255,0.6)',
  },
  dark: {
    bg:     'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    blur:   'blur(20px)',
    shadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  input: {
    bg:     'rgba(255,255,255,0.22)',
    border: '1.5px solid rgba(255,255,255,0.40)',
    blur:   'blur(12px)',
  },
};

/* ── Helper: Glass Box ── */
const GlassBox = React.forwardRef(({ children, variant = 'light', style = {}, ...rest }, ref) => {
  const g = glass[variant];
  return (
    <div
      ref={ref}
      style={{
        background:           g.bg,
        backdropFilter:       g.blur,
        WebkitBackdropFilter: g.blur,
        border:               g.border,
        boxShadow:            g.shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ══════════════════════════════════════════════════════
   LIQUID GLASS HOOK
══════════════════════════════════════════════════════ */
const useLiquidGlass = ({ stiffness = 280, damping = 18, pressScale = 0.055 } = {}) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let scaleX = 1, scaleY = 1;
    let velX = 0, velY = 0;
    let targetX = 1, targetY = 1;
    let originX = '50%', originY = '50%';
    let pressing  = false;
    let rafId;
    let startY    = 0;
    let didScroll = false;

    const spring = (cur, tgt, vel) => {
      const force = -stiffness * (cur - tgt) - damping * vel;
      const nVel  = vel + (force / 1) * 0.016;
      const nPos  = cur + nVel * 0.016;
      return { pos: nPos, vel: nVel };
    };

    const animate = () => {
      const rx = spring(scaleX, targetX, velX);
      const ry = spring(scaleY, targetY, velY);
      scaleX = rx.pos; velX = rx.vel;
      scaleY = ry.pos; velY = ry.vel;

      el.style.transformOrigin = `${originX} ${originY}`;
      el.style.transform = `scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)})`;

      const done = !pressing
        && Math.abs(scaleX - 1) < 0.0005 && Math.abs(scaleY - 1) < 0.0005
        && Math.abs(velX) < 0.0005 && Math.abs(velY) < 0.0005;

      if (!done) rafId = requestAnimationFrame(animate);
      else {
        scaleX = 1; scaleY = 1;
        el.style.transform      = 'none';
        el.style.transformOrigin = '50% 50%';
      }
    };

    const onPress = e => {
      if (e.touches) {
        startY    = e.touches[0].clientY;
        didScroll = false;
      }
      pressing = true;
      const r  = el.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const px = (cx - r.left) / r.width;
      const py = (cy - r.top)  / r.height;
      originX  = `${(px * 100).toFixed(1)}%`;
      originY  = `${(py * 100).toFixed(1)}%`;
      targetX  = 1 - pressScale * (px < 0.5 ? (1 - px) : px);
      targetY  = 1 - pressScale * (py < 0.5 ? (1 - py) : py);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };

    const onTouchMove = e => {
      if (Math.abs(e.touches[0].clientY - startY) > 8) {
        didScroll = true;
        pressing  = false;
        targetX   = 1; targetY = 1;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(animate);
      }
    };

    const onRelease = e => {
      if (!pressing) return;
      pressing = false;
      targetX  = 1; targetY = 1;
      velX += (1 - scaleX) * 4;
      velY += (1 - scaleY) * 4;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);

      // ← trigger click manually on touch if user didn't scroll
      if (e?.type === 'touchend' && !didScroll) {
        el.click();
      }
    };

    el.addEventListener('mousedown',  onPress,     { passive: true });
    el.addEventListener('touchstart', onPress,     { passive: true });
    el.addEventListener('touchmove',  onTouchMove, { passive: true });
    window.addEventListener('mouseup',  onRelease);
    window.addEventListener('touchend', onRelease);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mousedown',  onPress);
      el.removeEventListener('touchstart', onPress);
      el.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('mouseup',  onRelease);
      window.removeEventListener('touchend', onRelease);
    };
  }, [stiffness, damping, pressScale]);

  return ref;
};

/* ── Shared Components ── */
const Tag = ({ children, style = {} }) => (
  <span style={{
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#C9A96E', marginBottom: 16, ...style,
  }}>
    {children}
  </span>
);

const Btn = ({ href, to, primary, children, style = {} }) => {
  const lgRef = useLiquidGlass({ pressScale: 0.045 });
  const shared = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 32px', borderRadius: 14, fontWeight: 700,
    fontSize: 15, textDecoration: 'none', transition: 'opacity .2s',
    willChange: 'transform',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    ...(primary ? {
      background: 'linear-gradient(135deg,#C9A96E,#A8864F)',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(201,169,110,.35), inset 0 1px 0 rgba(255,255,255,.2)',
      border: '1px solid rgba(201,169,110,.4)',
    } : {
      background: glass.light.bg,
      backdropFilter: glass.light.blur,
      WebkitBackdropFilter: glass.light.blur,
      color: '#334155',
      border: glass.light.border,
      boxShadow: glass.light.shadow,
    }),
    ...style,
  };
  const enter = e => (e.currentTarget.style.opacity = '0.85');
  const leave = e => (e.currentTarget.style.opacity = '1');
  if (to)   return <Link ref={lgRef} to={to} style={shared} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>;
  return <a ref={lgRef} href={href} style={shared} onMouseEnter={enter} onMouseLeave={leave}>{children}</a>;
};

/* ── Service Card ── */
const ServiceCard = ({ icon, title, desc }) => {
  const lgRef = useLiquidGlass({ pressScale: 0.04, stiffness: 260, damping: 16 });
  return (
    <GlassBox
      ref={lgRef}
      variant="light"
      style={{
        padding: '36px 28px', borderRadius: 22,
        transition: 'box-shadow .35s, border-color .35s', cursor: 'default',
        willChange: 'transform',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow   = '0 24px 56px rgba(201,169,110,.18), inset 0 1px 0 rgba(255,255,255,.6)';
        e.currentTarget.style.borderColor = 'rgba(201,169,110,.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow   = glass.light.shadow;
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)';
      }}
    >
      <div style={{ width:56, height:56, borderRadius:16, background:'rgba(201,169,110,.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(201,169,110,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C9A96E', marginBottom:24 }}>
        {icon}
      </div>
      <h3 style={{ fontSize:18, fontWeight:800, marginBottom:10, color:'#0f172a' }}>{title}</h3>
      <p  style={{ fontSize:14, color:'#64748b', lineHeight:1.7 }}>{desc}</p>
    </GlassBox>
  );
};

/* ── View All Button ── */
const ViewAllBtn = ({ isRtl }) => {
  const lgRef = useLiquidGlass({ pressScale: 0.05, stiffness: 300, damping: 18 });
  return (
    <Link
      ref={lgRef}
      to="/services"
      style={{
        display:'inline-flex', alignItems:'center', gap:8,
        padding:'12px 28px', borderRadius:50,
        background: glass.light.bg,
        backdropFilter: glass.light.blur,
        WebkitBackdropFilter: glass.light.blur,
        border: '1px solid rgba(201,169,110,.3)',
        color:'#0f172a', textDecoration:'none', fontWeight:700, fontSize:14,
        transition:'background .25s, color .25s', whiteSpace:'nowrap',
        boxShadow: '0 4px 16px rgba(201,169,110,.12)',
        willChange: 'transform',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(201,169,110,.2)'; e.currentTarget.style.color='#A8864F'; }}
      onMouseLeave={e => { e.currentTarget.style.background=glass.light.bg; e.currentTarget.style.color='#0f172a'; }}
    >
      {isRtl ? 'شوف الكل' : 'View All'}
      {isRtl
        ? <ArrowRight size={16} strokeWidth={1.5} style={{ transform:'rotate(180deg)' }} />
        : <ArrowRight size={16} strokeWidth={1.5} />}
    </Link>
  );
};

/* ── Golden Dots ── */
const GoldenDots = () => {
  const dots = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    coreSize:        Math.random() * 2 + 1.5,
    hazeSize:        Math.random() * 10 + 8,
    left:            `${Math.random() * 100}%`,
    top:             `${Math.random() * 100}%`,
    twinkleDuration: Math.random() * 2.5 + 1.5,
    initialOpacity:  Math.random() * 0.7 + 0.3,
    glowShadow:      `0 0 ${Math.random() * 8 + 4}px rgba(201,169,110,0.9)`,
  })), []);

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', zIndex:0, pointerEvents:'none' }}>
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          initial={{ opacity: dot.initialOpacity, scale: 1 }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.25, 1] }}
          transition={{ duration: dot.twinkleDuration, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position:'absolute', left:dot.left, top:dot.top, display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <div style={{ width:dot.coreSize, height:dot.coreSize, borderRadius:'50%', background:'#C9A96E', boxShadow:dot.glowShadow, zIndex:1 }} />
          <div style={{ position:'absolute', width:dot.hazeSize, height:dot.hazeSize, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,169,110,.35) 0%, rgba(201,169,110,.05) 50%, rgba(201,169,110,0) 80%)', zIndex:0 }} />
        </motion.div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════ */
const HeroTextPanel = () => {
  const { t, isRtl } = useLang();
  const lgRef = useLiquidGlass({ pressScale: 0.025, stiffness: 200, damping: 20 });
  return (
    <GlassBox ref={lgRef} variant="medium" className="section-animate"
      style={{ padding:32, borderRadius:28, willChange:'transform', cursor:'default', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:50, background:'rgba(201,169,110,.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(201,169,110,.25)', color:'#C9A96E', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:28 }}>
        <span style={{ position:'relative', width:8, height:8 }}>
          <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#C9A96E', opacity:.7, animation:'ping 1.5s cubic-bezier(0,0,.2,1) infinite' }} />
          <span style={{ position:'relative', display:'block', width:8, height:8, borderRadius:'50%', background:'#A8864F' }} />
        </span>
        {t.hero.badge}
      </div>
      <h1 style={{ fontSize:'clamp(36px,5vw,68px)', fontWeight:900, lineHeight:1.35, marginBottom:28, color:'#0f172a' }}>
        {t.hero.title}
        <span style={{ color:'#C9A96E' }}>{t.hero.titleAccent}</span>
        {t.hero.titleEnd}
      </h1>
      <p style={{ fontSize:17, color:'#475569', lineHeight:1.75, marginBottom:40, maxWidth:520 }}>{t.hero.sub}</p>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <Btn to="/contact" primary>
          {t.hero.cta1}
          {isRtl
            ? <ArrowRight size={16} strokeWidth={1.5} style={{ transform:'rotate(180deg)' }} />
            : <ChevronRight size={16} strokeWidth={1.5} />}
        </Btn>
        <Btn to="/services">{t.hero.cta2}</Btn>
      </div>
    </GlassBox>
  );
};

const HeroIllustrationPanel = () => {
  const lgRef = useLiquidGlass({ pressScale: 0.02, stiffness: 180, damping: 22 });
  return (
    <GlassBox ref={lgRef} variant="medium" className="hero-illustration"
      style={{ padding:24, borderRadius:28, willChange:'transform', cursor:'default', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
      <HeroIllustration />
    </GlassBox>
  );
};

const HeroSection = () => {
  const { isRtl } = useLang();
  return (
    <section style={{
      padding: '104px 24px 60px',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #f0e9d6 0%, #f8f5ee 40%, #eef2f8 100%)',
    }}>
      <div style={{ position:'absolute', top:'-10%', right: isRtl ? 'auto' : '-5%', left: isRtl ? '-5%' : 'auto', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,169,110,.18) 0%, transparent 70%)', filter:'blur(60px)', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-10%', left: isRtl ? 'auto' : '10%', right: isRtl ? '10%' : 'auto', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,164,220,.15) 0%, transparent 70%)', filter:'blur(50px)', zIndex:0 }} />
      <GoldenDots />
      <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center', position:'relative', zIndex:1 }} className="hero-grid">
        <HeroTextPanel />
        <HeroIllustrationPanel />
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════
   SERVICES PREVIEW
══════════════════════════════════════════════════════ */
const ServicesPreview = () => {
  const { t, isRtl } = useLang();
  const ref = useReveal();

  const icons = [
    <Cpu size={26} strokeWidth={1.2} />,
    <TabletSmartphone size={26} strokeWidth={1.2} />,
    <Gem size={26} strokeWidth={1.2} />,
  ];
  const preview = t.services.items.slice(0, 3);

  return (
    <section style={{
      padding: '60px 24px',
      background: 'linear-gradient(160deg, #f8f5ee 0%, #eef2f8 60%, #f4f0e8 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:'20%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,169,110,.12) 0%, transparent 70%)', filter:'blur(50px)', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'10%', right:'8%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,164,220,.10) 0%, transparent 70%)', filter:'blur(40px)', zIndex:0 }} />
      <GoldenDots />

      <div style={{ maxWidth:1280, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div ref={ref} className="section-animate">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:56, flexWrap:'wrap', gap:16 }}>
            <div>
              <Tag>{t.services.tag}</Tag>
              <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:'#0f172a', lineHeight:1.2, maxWidth:500 }}>
                {t.services.title}
              </h2>
            </div>
            <ViewAllBtn isRtl={isRtl} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24 }}>
            {preview.map((s, i) => (
              <ServiceCard key={i} icon={icons[i]} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Process Step ── */
const ProcessStep = ({ step, icon, index }) => {
  const circleRef = useLiquidGlass({ pressScale: 0.06, stiffness: 320, damping: 20 });
  const cardRef   = useLiquidGlass({ pressScale: 0.035, stiffness: 240, damping: 16 });
  return (
    <motion.div
      animate={{ y:[0,-6,0] }}
      transition={{ duration:6, repeat:Infinity, ease:'easeInOut', delay:index*0.5 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 12px', position:'relative', zIndex:1 }}
    >
      <div style={{ fontSize:13, fontWeight:800, color:'#C9A96E', marginBottom:24, letterSpacing:'0.1em', fontFamily:'sans-serif' }}>
        0{index + 1}
      </div>

      <motion.div
        ref={circleRef}
        animate={{ boxShadow:['0 10px 30px rgba(0,0,0,.3)','0 15px 40px rgba(201,169,110,.18)','0 10px 30px rgba(0,0,0,.3)'] }}
        transition={{ duration:4, repeat:Infinity, ease:'easeInOut', delay:index*0.5 }}
        style={{
          width:100, height:100, borderRadius:'50%',
          background: glass.dark.bg,
          backdropFilter: glass.dark.blur,
          WebkitBackdropFilter: glass.dark.blur,
          border: '1px solid rgba(201,169,110,.25)',
          boxShadow: glass.dark.shadow,
          color: index % 2 === 0 ? '#fff' : '#C9A96E',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:32, position:'relative', zIndex:2,
          cursor:'pointer', willChange:'transform',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'1px dashed rgba(201,169,110,.25)', animation:'spin 20s linear infinite' }} />
        {icon}
      </motion.div>

      <GlassBox ref={cardRef} variant="dark" style={{ borderRadius:16, padding:'16px 20px', width:'100%', boxSizing:'border-box', cursor:'pointer', willChange:'transform', WebkitTapHighlightColor:'transparent', touchAction:'manipulation' }}>
        <h3 style={{ fontSize:19, fontWeight:800, marginBottom:10, color:'#fff', letterSpacing:'-0.01em' }}>{step.title}</h3>
        <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.8, maxWidth:260, margin:'0 auto' }}>{step.desc}</p>
      </GlassBox>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════
   PROCESS
══════════════════════════════════════════════════════ */
const ProcessSection = () => {
  const { t, isRtl } = useLang();

  const stepIcons = [
    <Search  size={32} strokeWidth={1} />,
    <PenTool size={32} strokeWidth={1} />,
    <CodeXml size={32} strokeWidth={1} />,
    <Rocket  size={32} strokeWidth={1} />,
  ];

  return (
    <section style={{
      padding:'80px 24px',
      background:'linear-gradient(135deg,#0a1020 0%,#0f172a 60%,#121e35 100%)',
      overflow:'hidden', position:'relative',
    }}>
      <div style={{ position:'absolute', top:'-15%', left:'30%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,169,110,.07) 0%, transparent 65%)', filter:'blur(80px)', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(80,110,200,.07) 0%, transparent 65%)', filter:'blur(60px)', zIndex:0 }} />
      <GoldenDots />

      <style>{`
        .process-grid-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
        }
        .process-line-mobile { display: none; }
        @media (max-width: 1024px) {
          .process-grid-container { grid-template-columns:1fr; gap:64px; max-width:400px; margin:0 auto; }
          .process-line-desktop { display:none !important; }
          .process-line-mobile  { display:block !important; }
        }
        @keyframes spin { 100% { transform:rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth:1280, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 60px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16 }}>
            <span style={{ width:30, height:1, background:'#C9A96E' }} />
            <Tag style={{ marginBottom:0, letterSpacing:'0.15em' }}>{t.process.tag}</Tag>
            <span style={{ width:30, height:1, background:'#C9A96E' }} />
          </div>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'#fff', lineHeight:1.2, letterSpacing:'-0.02em' }}>
            {t.process.title}
          </h2>
        </div>

        <div className="process-grid-container">
          <div className="process-line-desktop" style={{ position:'absolute', top:50, left:'12%', right:'12%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)', zIndex:0 }}>
            <motion.div
              animate={{ left: isRtl ? ['100%','0%'] : ['0%','100%'], opacity:[0,1,1,0] }}
              transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
              style={{ position:'absolute', top:-1, width:80, height:3, background:'linear-gradient(90deg,transparent,#C9A96E,transparent)', boxShadow:'0 0 12px rgba(201,169,110,.8)', borderRadius:'50%' }}
            />
          </div>

          <div className="process-line-mobile" style={{ position:'absolute', top:50, bottom:50, left:'50%', width:1, transform:'translateX(-50%)', background:'linear-gradient(180deg,transparent,rgba(255,255,255,.08),transparent)', zIndex:0 }}>
            <motion.div
              animate={{ top:['0%','100%'], opacity:[0,1,1,0] }}
              transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
              style={{ position:'absolute', left:-1, height:80, width:3, background:'linear-gradient(180deg,transparent,#C9A96E,transparent)', boxShadow:'0 0 12px rgba(201,169,110,.8)', borderRadius:'50%' }}
            />
          </div>

          {t.process.steps.map((step, i) => (
            <ProcessStep key={i} step={step} icon={stepIcons[i]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════
   QUICK CONTACT
══════════════════════════════════════════════════════ */
const QuickContactSection = () => {
  const { t, isRtl } = useLang();
  const ref = useReveal();

  const [formStatus,   setFormStatus]   = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData,     setFormData]     = useState({ name:'', email:'', phone:'', countryCode:'+20', message:'' });

  useEffect(() => {
    const handler = e => { if (!e.target.closest('.country-dropdown')) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const map = { EG:'+20',SA:'+966',AE:'+971',KW:'+965',QA:'+974',BH:'+973',OM:'+968',JO:'+962',LB:'+961',GB:'+44',US:'+1' };
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (map[d.country_code]) setFormData(p => ({ ...p, countryCode:map[d.country_code] })); })
      .catch(() => {});
  }, []);

 const API = 'https://aura-crm.runasp.net';

const handleSubmit = async (e) => {
  e.preventDefault();
  setFormStatus('sending');

  try {
    const res = await fetch(`${API}/api/public/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: formData.name,
        email: formData.email,
        phone: formData.countryCode + formData.phone.replace(/\s/g, ''),
        message: formData.message,
      }),
    });

    if (res.ok) {
      setFormStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        countryCode: '+20',
        message: '',
      });
    } else {
      setFormStatus('error');
    }
  } catch (err) {
    setFormStatus('error');
  }
};
  const selectedCountry = countries.find(c => c.code === formData.countryCode);

  const inputStyle = {
    width:'100%', padding:'16px 20px', borderRadius:16,
    border: glass.input.border,
    background: glass.input.bg,
    backdropFilter: glass.input.blur,
    WebkitBackdropFilter: glass.input.blur,
    fontSize:14, fontFamily:'Tajawal,sans-serif',
    outline:'none', transition:'all .2s', boxSizing:'border-box',
    color:'#0f172a',
    touchAction: 'manipulation',
  };
  const focusInput = e => { e.target.style.borderColor='#C9A96E'; e.target.style.background='rgba(255,255,255,.55)'; e.target.style.boxShadow='0 0 0 4px rgba(201,169,110,.12)'; };
  const blurInput  = e => { e.target.style.borderColor='rgba(255,255,255,.40)'; e.target.style.background=glass.input.bg; e.target.style.boxShadow='none'; };

  const submitRef = useLiquidGlass({ pressScale: 0.04, stiffness: 300, damping: 18 });

  return (
    <section style={{
      padding:'60px 24px',
      background:'linear-gradient(160deg,#f5edd9 0%,#eef2f8 50%,#f0e9d6 100%)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:'-10%', left:'20%', width:450, height:450, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,169,110,.15) 0%, transparent 70%)', filter:'blur(60px)', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'15%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,164,220,.12) 0%, transparent 70%)', filter:'blur(50px)', zIndex:0 }} />
      <GoldenDots />

      <div style={{ maxWidth:840, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div ref={ref} className="section-animate">

          <div style={{ textAlign:'center', marginBottom:48 }}>
            <Tag>{isRtl ? 'دعنا نتحدث' : "Let's Talk"}</Tag>
            <h2 style={{ fontSize:'clamp(28px,3vw,42px)', fontWeight:800, color:'#0f172a', marginBottom:16 }}>
              {isRtl ? 'جاهز تبدأ مشروعك؟' : 'Ready to start your project?'}
            </h2>
            <p style={{ color:'#64748b', fontSize:16, maxWidth:500, margin:'0 auto' }}>
              {isRtl ? 'سجل بياناتك وسنقوم بالتواصل معك في أقرب وقت لبدء رحلة نجاحك.' : 'Drop your details below and our team will get back to you shortly.'}
            </p>
          </div>

          <GlassBox variant="medium" style={{ padding:'clamp(32px,5vw,56px)', borderRadius:32 }}>
            {formStatus === 'success' ? (
              <div style={{ minHeight:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
                <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(34,197,94,.3)', color:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, boxShadow:'0 8px 24px rgba(34,197,94,.2)' }}>
                  <ShieldCheck size={40} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize:24, fontWeight:800, marginBottom:8, color:'#0f172a' }}>{t.contact.success}</h3>
                <p style={{ color:'#64748b', fontSize:16 }}>{t.contact.successSub}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:24 }}>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
                  {[
                    { key:'name',  label:t.contact.formName,  type:'text',  placeholder: isRtl?'محمد أحمد':'John Doe',
                      onChange: v => /^[\u0600-\u06FFa-zA-Z\s]*$/.test(v) && setFormData(p=>({...p,name:v})) },
                    { key:'email', label:t.contact.formEmail, type:'email', placeholder:'hello@example.com',
                      onChange: v => setFormData(p=>({...p,email:v})) },
                  ].map(({ key, label, type, placeholder, onChange }) => (
                    <div key={key}>
                      <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 }}>{label}</label>
                      <input
                        required type={type} placeholder={placeholder} value={formData[key]}
                        onChange={e => onChange(e.target.value)}
                        style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 }}>
                    {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <div style={{ display:'flex', gap:12 }}>
                    <div className="country-dropdown" style={{ position:'relative', flexShrink:0 }}>
                      <div
                        onClick={() => setDropdownOpen(o => !o)}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'16px 14px', borderRadius:16, minWidth:120, ...inputStyle, cursor:'pointer', userSelect:'none', width:'auto', WebkitTapHighlightColor:'transparent', touchAction:'manipulation' }}
                      >
                        <img src={`https://flagcdn.com/w20/${selectedCountry?.iso}.png`} width="20" height="14" style={{ borderRadius:2, objectFit:'cover', flexShrink:0 }} />
                        <span style={{ color:'#0f172a', fontWeight:600 }}>{formData.countryCode}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginInlineStart:'auto', color:'#94a3b8', transform:dropdownOpen?'rotate(180deg)':'none', transition:'transform .2s' }}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {dropdownOpen && (
                        <div style={{ position:'absolute', top:'110%', left:0, background:'rgba(255,255,255,.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,.5)', borderRadius:16, boxShadow:'0 20px 48px rgba(0,0,0,.12)', zIndex:100, maxHeight:220, overflowY:'auto', minWidth:170 }}>
                          {countries.map(c => (
                            <div
                              key={c.code}
                              onClick={() => { setFormData(p=>({...p,countryCode:c.code})); setDropdownOpen(false); }}
                              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer', fontSize:13, fontFamily:'Tajawal,sans-serif', background: formData.countryCode===c.code ? 'rgba(201,169,110,.18)' : 'transparent', color: formData.countryCode===c.code ? '#C9A96E' : '#334155', transition:'background .2s', WebkitTapHighlightColor:'transparent', touchAction:'manipulation' }}
                              onMouseEnter={e => { if (formData.countryCode!==c.code) e.currentTarget.style.background='rgba(201,169,110,.08)'; }}
                              onMouseLeave={e => { if (formData.countryCode!==c.code) e.currentTarget.style.background='transparent'; }}
                            >
                              <img src={`https://flagcdn.com/w20/${c.iso}.png`} width="20" height="14" style={{ borderRadius:2, objectFit:'cover', flexShrink:0 }} />
                              <span style={{ fontWeight:600, color:'#64748b', minWidth:38 }}>{c.code}</span>
                              <span>{c.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      required type="tel" dir="ltr"
                      placeholder={selectedCountry?.placeholder || '000 000 0000'}
                      value={formData.phone}
                      onChange={e => { const v=e.target.value; if(/^[0-9\s]*$/.test(v)) setFormData(p=>({...p,phone:v})); }}
                      style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#334155', marginBottom:8 }}>{t.contact.formMsg}</label>
                  <textarea
                    required rows={4}
                    placeholder={isRtl ? 'اكتب تفاصيل مشروعك أو استفسارك هنا...' : 'Tell us about your project or inquiry...'}
                    value={formData.message}
                    onChange={e => setFormData(p=>({...p,message:e.target.value}))}
                    style={{ ...inputStyle, resize:'none' }}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>

                <button
                  ref={submitRef}
                  type="submit"
                  style={{
                    padding:'18px 24px',
                    background: formStatus==='sending' ? 'rgba(100,116,139,.4)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
                    backdropFilter: 'blur(8px)',
                    color:'#fff', borderRadius:16, fontWeight:800, fontSize:15,
                    border:'1px solid rgba(255,255,255,.12)',
                    cursor: formStatus==='sending' ? 'wait' : 'pointer',
                    fontFamily:'Tajawal,sans-serif',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transition:'background .3s, box-shadow .3s',
                    boxShadow:'0 8px 24px rgba(15,23,42,.18)', marginTop:8,
                    willChange:'transform',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                  disabled={formStatus==='sending'}
                  onMouseEnter={e => { if(formStatus!=='sending'){ e.currentTarget.style.background='linear-gradient(135deg,#C9A96E,#A8864F)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(201,169,110,.35)'; }}}
                  onMouseLeave={e => { if(formStatus!=='sending'){ e.currentTarget.style.background='linear-gradient(135deg,#1e293b,#0f172a)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(15,23,42,.18)'; }}}
                >
                  {formStatus==='sending'
                    ? (isRtl ? 'جاري الإرسال...' : 'Sending...')
                    : (isRtl ? 'إرسال طلب استشارة' : 'Send Consultation Request')}
                  {formStatus!=='sending' && <ArrowRight size={18} strokeWidth={1.5} style={{ transform:isRtl?'rotate(180deg)':'none' }} />}
                </button>

              </form>
            )}
          </GlassBox>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
const HomePage = () => (
  <>
    <HeroSection />
    <ServicesPreview />
    <ProcessSection />
    <QuickContactSection />
  </>
);

export default HomePage;