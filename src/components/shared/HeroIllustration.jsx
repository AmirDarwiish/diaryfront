import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';

const CDN = 'https://res.cloudinary.com/dsh6m0lko/image/upload/f_auto,q_auto,w_1000';

const SLIDES = [
  {
    image: `${CDN}/v1775811860/65b5bd00-77a1-4286-81b4-bafb8a9544cc_gepcg0.jpg`,
    tag: { en: 'Web Development', ar: 'تطوير المواقع' },
    titleKey: 0,
  },
  {
    image: `${CDN}/v1775812206/6537923e-32fd-4609-8dbe-e30c4be871d6_eurwcp.jpg`,
    tag: { en: 'Mobile Apps', ar: 'تطبيقات الجوال' },
    titleKey: 1,
  },
  {
    image: `${CDN}/v1775812310/385ddff9-1e39-4db2-a71e-d94de0eff619_q8nwuw.jpg`,
    tag: { en: 'Custom Systems', ar: 'أنظمة مخصصة' },
    title: { en: 'Fully Customized systems', ar: 'أنظمة مخصصة بالكامل' },
  },
  {
    image: `${CDN}/v1775812409/fc1c3bad-244f-4fb4-ae7c-9c1e0187f160_or1bxa.jpg`,
    tag: { en: 'WordPress', ar: 'ووردبريس' },
    title: { en: 'WordPress Development', ar: 'تطوير ووردبريس' },
  },
  {
    image: `${CDN}/v1775812524/476b16aa-5a08-4da7-a593-bc98959a9bd2_i38cid.jpg`,
    tag: { en: 'E-commerce', ar: 'متاجر إلكترونية' },
    title: { en: 'E-commerce Solutions', ar: 'متاجر إلكترونية' },
  },
  {
    image: `${CDN}/v1775812637/a3701b66-21e0-4b13-b5af-934bd6d4f800_bztpir.jpg`,
    tag: { en: 'SEO', ar: 'تحسين البحث' },
    title: { en: 'SEO Optimization', ar: 'تحسين محركات البحث' },
  },
  {
    image: `${CDN}/v1775812745/b0b592a0-5a92-4bfb-9237-2a9a78a37464_dujjn9.jpg`,
    tag: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
    title: { en: 'UI/UX Design', ar: 'تصميم UI/UX' },
  },
  {
    image: `${CDN}/v1775812853/6adb64fe-9c8a-4cf5-8c0f-d2f2e6a39b1f_u72qfv.jpg`,
    tag: { en: 'Shopify', ar: 'شوبيفاي' },
    title: { en: 'Shopify Stores', ar: 'متاجر Shopify' },
  },
];

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0, scale: 0.95 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0, scale: 0.95 }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

const HeroIllustration = () => {
  const { t, isRtl } = useLang();
  const [[page, direction], setPage] = useState([0, 0]);
  const autoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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

  useEffect(() => {
    const nextIndex = (imageIndex + 1) % SLIDES.length;
    const img = new Image();
    img.src = SLIDES[nextIndex].image;
  }, [imageIndex]);

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
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'linear-gradient(145deg, #ffffff, #fdfbf7)', // خلفية مضيئة وفخمة
        borderRadius: 32, padding: 16, // مساحة أوسع قليلاً للفخامة
        boxShadow: '0 30px 60px -12px rgba(212, 175, 55, 0.1), 0 18px 36px -18px rgba(0, 0, 0, 0.1)', // ظل يجمع بين الذهبي والأسود
        border: '1px solid rgba(212, 175, 55, 0.15)', // إطار ذهبي خفيييف جداً
      }}>
        <div style={{
          position: 'relative', height: 400, borderRadius: 24,
          overflow: 'hidden', background: '#0a0a0a',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', // انعكاس داخلي للصورة
        }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) paginate(1);
                else if (swipe > swipeConfidenceThreshold) paginate(-1);
              }}
              style={{ position: 'absolute', inset: 0, cursor: 'grab', willChange: 'transform' }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <motion.div
                animate={{ scale: [1, 1.05] }}
                transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
                style={{ width: '100%', height: '100%', willChange: 'transform' }}
              >
                <img
                  src={slide.image}
                  alt={title}
                  loading={imageIndex === 0 ? 'eager' : 'lazy'}
                  fetchpriority={imageIndex === 0 ? 'high' : 'auto'}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    pointerEvents: 'none', display: 'block',
                  }}
                />
              </motion.div>

              {/* gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                // تدرج لوني أعمق بيعطي مظهر سينمائي فخم
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 45%, rgba(255,255,255,0.05) 100%)',
              }} />

              {/* النصوص */}
              <div style={{
                position: 'absolute', bottom: 60,
                left: isRtl ? 'auto' : 28,
                right: isRtl ? 28 : 'auto',
                textAlign: isRtl ? 'right' : 'left',
              }}>
                <span style={{
                  display: 'inline-block', padding: '6px 16px',
                  background: 'rgba(212, 175, 55, 0.1)', // ذهبي شفاف
                  backdropFilter: 'blur(8px)', // تأثير الزجاج الفخم
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#E5C158',
                  borderRadius: 30, fontSize: 11, fontWeight: 600,
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.15em',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {isRtl ? slide.tag.ar : slide.tag.en}
                </span>
                <h4 style={{
                  color: '#ffffff', fontSize: 26, fontWeight: 700,
                  margin: 0, 
                  // ظل نصي مزدوج عشان يبرز الكلمة بشكل أنيق
                  textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(212, 175, 55, 0.15)',
                  letterSpacing: isRtl ? 0 : '0.02em',
                }}>
                  {title}
                </h4>
              </div>

              {/* النقط — premium */}
              <div style={{
                position: 'absolute', bottom: 24,
                left: 0, right: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                zIndex: 10,
              }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      width: 32, height: 32,
                      border: 'none', background: 'none',
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{
                      display: 'block',
                      width: i === imageIndex ? 32 : 5, // رفعنا التباين بين النقطة المختارة والغير مختارة
                      height: 5,
                      borderRadius: 4,
                      background: i === imageIndex
                        ? '#D4AF37'
                        : 'rgba(255,255,255,0.4)',
                      boxShadow: i === imageIndex ? '0 0 12px rgba(212, 175, 55, 0.7)' : 'none', // توهج خفيف للنقطة النشطة
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </button>
                ))}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ديكور */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 250, height: 250, // كبرنا الديكور وخليناه توهج بدل دائرة صلبة
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0, filter: 'blur(20px)',
      }} />
    </div>
  );
};

export default HeroIllustration;