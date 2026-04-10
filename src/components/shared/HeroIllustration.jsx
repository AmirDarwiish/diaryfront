import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';

const SLIDES = [
  {
    // Web Development - كود بتصميم عصري ومظلم
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775811860/65b5bd00-77a1-4286-81b4-bafb8a9544cc_gepcg0.jpg',
    tag: { en: 'Web Development', ar: 'تطوير المواقع' },
    titleKey: 0,
  },
  {
    // Mobile Apps - هاتف ذكي في بيئة عمل حديثة
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812206/6537923e-32fd-4609-8dbe-e30c4be871d6_eurwcp.jpg',
    tag: { en: 'Mobile Apps', ar: 'تطبيقات الجوال' },
    titleKey: 1,
  },
  {
    // Custom Systems - سيرفرات أو شبكات معمارية
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812310/385ddff9-1e39-4db2-a71e-d94de0eff619_q8nwuw.jpg',
    tag: { en: 'Custom Systems', ar: 'أنظمة مخصصة' },
    title: { en: 'Fully Customized systems', ar: 'أنظمة مخصصة بالكامل' },  },
  {
    // WordPress - مكتب احترافي بسيط
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812409/fc1c3bad-244f-4fb4-ae7c-9c1e0187f160_or1bxa.jpg',
    tag: { en: 'WordPress', ar: 'ووردبريس' },
    title: { en: 'WordPress Development', ar: 'تطوير ووردبريس' },
  },
  {
    // E-commerce - شاشة دفع وتسوق متطورة
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812524/476b16aa-5a08-4da7-a593-bc98959a9bd2_i38cid.jpg',
    tag: { en: 'E-commerce', ar: 'متاجر إلكترونية' },
    title: { en: 'E-commerce Solutions', ar: 'متاجر إلكترونية' },
  },
  {
    // SEO - إحصائيات وبيانات بشكل فني
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812637/a3701b66-21e0-4b13-b5af-934bd6d4f800_bztpir.jpg',
    tag: { en: 'SEO', ar: 'تحسين البحث' },
    title: { en: 'SEO Optimization', ar: 'تحسين محركات البحث' },
  },
  {
    // UI/UX - ألوان وتصميم واجهات
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812745/b0b592a0-5a92-4bfb-9237-2a9a78a37464_dujjn9.jpg',
    tag: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
    title: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
  },
  {
    // Shopify - مفهوم التسوق الحديث
    image: 'https://res.cloudinary.com/dsh6m0lko/image/upload/v1775812853/6adb64fe-9c8a-4cf5-8c0f-d2f2e6a39b1f_u72qfv.jpg',
    tag: { en: 'Shopify', ar: 'شوبيفاي' },
    title: { en: 'Shopify Stores', ar: 'متاجر Shopify' },
  },
];

// إعدادات الأنيميشن الذكي (بيتحرك يمين أو شمال حسب الضغطة)
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

const HeroIllustration = () => {
  const { t, isRtl } = useLang();
  const [[page, direction], setPage] = useState([0, 0]);
  const autoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // حساب الـ Index الحالي عشان يلف في دائرة مغلقة
  const imageIndex = ((page % SLIDES.length) + SLIDES.length) % SLIDES.length;

  const paginate = useCallback((newDirection) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  const resetTimer = useCallback(() => {
    clearInterval(autoRef.current);
    if (!isHovered) {
      autoRef.current = setInterval(() => paginate(1), 5000);
    }
  }, [paginate, isHovered]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(autoRef.current);
  }, [resetTimer]);

  const goTo = (i) => {
    const newDirection = i > imageIndex ? 1 : -1;
    setPage([i, newDirection]);
  };

  const slide = SLIDES[imageIndex];
  const title = slide.title
    ? (isRtl ? slide.title.ar : slide.title.en)
    : t.services.items[slide.titleKey]?.title ?? '';

  return (
    <div 
      style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          overflow: 'hidden', background: '#0f172a', // خلفية داكنة للتحميل
        }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              style={{ position: 'absolute', inset: 0, cursor: 'grab' }}
              whileTap={{ cursor: "grabbing" }}
            >
              <motion.img
                src={slide.image}
                alt={title}
                animate={{ scale: [1, 1.05] }}
                transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />

              {/* ظل النصوص المحسن */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 40%, transparent 100%)',
              }} />

              {/* النصوص */}
              <div style={{
                position: 'absolute', bottom: 30,
                left: isRtl ? 'auto' : 24,
                right: isRtl ? 24 : 'auto',
                textAlign: isRtl ? 'right' : 'left',
              }}>
                <span style={{
                  display: 'inline-block', padding: '6px 14px',
                  background: 'rgba(201,169,110,0.95)', color: '#fff',
                  borderRadius: 50, fontSize: 11, fontWeight: 700,
                  marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(201,169,110,0.3)'
                }}>
                  {isRtl ? slide.tag.ar : slide.tag.en}
                </span>
                <h4 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {title}
                </h4>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* عداد رقمي أنيق */}
          <div style={{
            position: 'absolute', top: 20,
            right: isRtl ? 'auto' : 20,
            left: isRtl ? 20 : 'auto',
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: 20,
            color: '#fff', fontSize: 13, fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10
          }}>
            {imageIndex + 1} / {SLIDES.length}
          </div>

          {/* Arrows المحسنة */}
          {[
            { dir: 'prev', side: isRtl ? 'right' : 'left', onClick: () => paginate(isRtl ? 1 : -1) },
            { dir: 'next', side: isRtl ? 'left' : 'right', onClick: () => paginate(isRtl ? -1 : 1) },
          ].map(({ dir, side, onClick }) => (
            <button key={dir} onClick={onClick} aria-label={`Go to ${dir} slide`} style={{
              position: 'absolute', top: '50%', [side]: 12,
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .3s ease',
              WebkitTapHighlightColor: 'transparent',
              zIndex: 10
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(201,169,110,0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(15,23,42,0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d={dir === 'next' ? 'M6 4l4 4-4 4' : 'M10 4L6 8l4 4'}
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Dots (Pagination) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`} style={{
            width: i === imageIndex ? 32 : 8, height: 8, borderRadius: 4,
            background: i === imageIndex ? '#C9A96E' : '#cbd5e1',
            border: 'none', cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            WebkitTapHighlightColor: 'transparent',
          }} />
        ))}
      </div>

      {/* ديكور الخلفية */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120,
        background: 'linear-gradient(135deg, #F5EDD9 0%, transparent 100%)', 
        borderRadius: '50%',
        zIndex: 0, opacity: 0.6,
      }} />
    </div>
  );
};

export default HeroIllustration;