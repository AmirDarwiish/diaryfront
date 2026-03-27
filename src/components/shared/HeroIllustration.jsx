import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';

const SLIDES = [
  {
    // صورة تعكس البرمجة المتقدمة (أكواد على شاشة فخمة)
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'Web Development', ar: 'تطوير المواقع' },
    titleKey: 0,
  },
  {
    // صورة لتصميم تطبيقات الجوال (هاتف ذكي مع واجهة عصرية)
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'Mobile Apps', ar: 'تطبيقات الجوال' },
    titleKey: 1,
  },
  {
    // صورة تعكس الأنظمة المخصصة والشبكات (طابع تكنولوجي مستقبلي وفخم)
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'Custom Systems', ar: 'أنظمة مخصصة' },
    titleKey: 2,
  },
  {
    // صورة لمكتب فخم يعكس بناء المواقع وإدارتها عبر ووردبريس
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'WordPress', ar: 'ووردبريس' },
    title: { en: 'WordPress Development', ar: 'تطوير ووردبريس' },
  },
  {
    // صورة فخمة تعكس التسوق الإلكتروني الحديث
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'E-commerce', ar: 'متاجر إلكترونية' },
    title: { en: 'E-commerce Solutions', ar: 'متاجر إلكترونية' },
  },
  {
    // صورة لتحليلات البيانات والـ SEO (آيباد مع إحصائيات على مكتب احترافي)
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'SEO', ar: 'تحسين البحث' },
    title: { en: 'SEO Optimization', ar: 'تحسين محركات البحث' },
  },
  {
    // صورة تعكس تصميم تجربة المستخدم (واجهات وألوان على الشاشة)
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
    title: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
  },
  {
    // صورة لمتجر حديث أو عمليات دفع إلكترونية تعكس شوبيفاي
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1080&auto=format&fit=crop',
    tag: { en: 'Shopify', ar: 'شوبيفاي' },
    title: { en: 'Shopify Stores', ar: 'متاجر Shopify' },
  },
];

const HeroIllustration = () => {
  const { t, isRtl } = useLang();
  const [cur, setCur] = useState(0);
  const autoRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCur(prev => (prev + 1) % SLIDES.length);
  }, []);

  const resetTimer = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(nextSlide, 5000);
  }, [nextSlide]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(autoRef.current);
  }, [resetTimer]);

  const goTo = (i) => { setCur(i); resetTimer(); };

  const slide = SLIDES[cur];
  const title = slide.title
    ? (isRtl ? slide.title.ar : slide.title.en)
    : t.services.items[slide.titleKey]?.title ?? '';

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>

      {/* الإطار الخارجي */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: '#fff', borderRadius: 32, padding: 12,
        boxShadow: '0 40px 100px rgba(15,23,42,0.08)',
        border: '1px solid #f1f5f9',
      }}>

        {/* منطقة الكروسيل */}
        <div style={{
          position: 'relative', height: 380, borderRadius: 24,
          overflow: 'hidden', background: '#f8fafc',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={cur}
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <motion.img
                src={slide.image}
                animate={{ scale: [1, 1.08] }}
                transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* ظل النصوص */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, transparent 55%)',
              }} />

              {/* النصوص */}
              <div style={{
                position: 'absolute', bottom: 24,
                left: isRtl ? 'auto' : 24,
                right: isRtl ? 24 : 'auto',
                textAlign: isRtl ? 'right' : 'left',
              }}>
                <span style={{
                  display: 'inline-block', padding: '4px 12px',
                  background: 'rgba(201,169,110,0.92)', color: '#fff',
                  borderRadius: 50, fontSize: 10, fontWeight: 700,
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {isRtl ? slide.tag.ar : slide.tag.en}
                </span>
                <h4 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>
                  {title}
                </h4>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* عداد */}
          <div style={{
            position: 'absolute', top: 20,
            right: isRtl ? 'auto' : 20,
            left: isRtl ? 20 : 'auto',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            padding: '4px 10px', borderRadius: 12,
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>
            0{cur + 1} / 0{SLIDES.length}
          </div>

          {/* Arrows على الجانبين */}
          {[
            { dir: 'prev', side: isRtl ? 'right' : 'left',  onClick: () => goTo((cur - 1 + SLIDES.length) % SLIDES.length) },
            { dir: 'next', side: isRtl ? 'left'  : 'right', onClick: () => goTo((cur + 1) % SLIDES.length) },
          ].map(({ dir, side, onClick }) => (
            <button key={dir} onClick={onClick} style={{
              position: 'absolute', top: '50%', [side]: 12,
              transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
              WebkitTapHighlightColor: 'transparent',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.7)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d={dir === 'next' ? 'M6 4l4 4-4 4' : 'M10 4L6 8l4 4'}
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === cur ? 28 : 8, height: 8, borderRadius: 4,
            background: i === cur ? '#C9A96E' : '#e2e8f0',
            border: 'none', cursor: 'pointer',
            transition: 'all 0.4s ease',
            WebkitTapHighlightColor: 'transparent',
          }} />
        ))}
      </div>

      {/* ديكور */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100,
        background: '#F5EDD9', borderRadius: '50%',
        zIndex: 0, opacity: 0.5,
      }} />
    </div>
  );
};

export default HeroIllustration;