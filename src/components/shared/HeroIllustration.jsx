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
    image: `${CDN}/v17758112206/6537923e-32fd-4609-8dbe-e30c4be871d6_eurwcp.jpg`,
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

// **هوك بسيط لمعرفة عرض الشاشة**
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined });
  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth });
    }
    window.addEventListener("resize", handleResize);
    handleResize(); // تعيين العرض الأولي
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};

const HeroIllustration = () => {
  const { t, isRtl } = useLang();
  const [[page, direction], setPage] = useState([0, 0]);
  const autoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const { width } = useWindowSize(); // استخدام الهوك هنا

  // **متغيرات التجاوب (Responsive Variables)**
  const isMobile = width < 768; // أقل من حجم التابلت
  const isSmallMobile = width < 480; // موبايل صغير

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
      style={{ 
        position: 'relative', 
        width: '100%', 
        // الموبايل يأخذ العرض كاملاً، الديسك توب محدد
        maxWidth: isMobile ? '100%' : 500, 
        margin: '0 auto',
        padding: isMobile ? '0 10px' : '0' // مسافة جانبية بسيطة على الموبايل
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'linear-gradient(145deg, #ffffff, #fdfbf7)',
        // حواف أصغر قليلاً للموبايل
        borderRadius: isMobile ? 24 : 32, 
        // حشو أصغر للموبايل
        padding: isMobile ? 8 : 16, 
        boxShadow: '0 30px 60px -12px rgba(212, 175, 55, 0.1), 0 18px 36px -18px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(212, 175, 55, 0.15)',
      }}>
        <div style={{
          position: 'relative', 
          // **أهم تغيير:** طول الصورة يتناقص على الموبايل
          height: isSmallMobile ? 280 : isMobile ? 350 : 400, 
          borderRadius: isMobile ? 20 : 24,
          overflow: 'hidden', background: '#0a0a0a',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
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
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(255,255,255,0.05) 100%)',
              }} />

              {/* النصوص */}
              <div style={{
                position: 'absolute', 
                // نرفع النص قليلاً على الموبايل لإفساح مجال للنقط
                bottom: isSmallMobile ? 55 : isMobile ? 60 : 60,
                left: isRtl ? 'auto' : (isMobile ? 16 : 28),
                right: isRtl ? (isMobile ? 16 : 28) : 'auto',
                textAlign: isRtl ? 'right' : 'left',
                // نحدد أقصى عرض للنص على الموبايل
                maxWidth: isMobile ? '80%' : '100%'
              }}>
                <span style={{
                  display: 'inline-block', 
                  // حجم أصغر وحشو أقل للموبايل
                  padding: isMobile ? '4px 12px' : '6px 16px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#E5C158',
                  borderRadius: 30, 
                  fontSize: isSmallMobile ? 9 : 11, // تصغير الخط
                  fontWeight: 600,
                  marginBottom: isMobile ? 8 : 12, 
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {isRtl ? slide.tag.ar : slide.tag.en}
                </span>
                <h4 style={{
                  color: '#ffffff', 
                  // تصغير حجم العنوان بشكل ملحوظ للموبايل ليتناسب مع المساحة
                  fontSize: isSmallMobile ? 18 : isMobile ? 22 : 26, 
                  fontWeight: 700,
                  margin: 0, 
                  textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(212, 175, 55, 0.15)',
                  letterSpacing: isRtl ? 0 : '0.02em',
                  lineHeight: 1.2 // تحسين تباعد الأسطر
                }}>
                  {title}
                </h4>
              </div>

              {/* النقط — premium */}
              <div style={{
                position: 'absolute', 
                bottom: isSmallMobile ? 16 : isMobile ? 20 : 24, // تقريب النقط للحافة على الموبايل
                left: 0, right: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center', 
                gap: isMobile ? 6 : 10, // تقليل المسافة بين النقط
                zIndex: 10,
              }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      // تصغير مساحة الضغط للموبايل قليلاً
                      width: isMobile ? 24 : 32, 
                      height: isMobile ? 24 : 32,
                      border: 'none', background: 'none',
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{
                      display: 'block',
                      // تصغير حجم النقط نفسها
                      width: i === imageIndex ? (isMobile ? 24 : 32) : (isMobile ? 4 : 5),
                      height: isMobile ? 4 : 5,
                      borderRadius: 4,
                      background: i === imageIndex
                        ? '#D4AF37'
                        : 'rgba(255,255,255,0.4)',
                      boxShadow: i === imageIndex ? '0 0 12px rgba(212, 175, 55, 0.7)' : 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </button>
                ))}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ديكور الخلفية - نخفيه على الموبايل الصغير جداً لأنه قد يسبب مشاكل في العرض */}
      {!isSmallMobile && (
        <div style={{
          position: 'absolute', 
          top: isMobile ? -20 : -40, 
          right: isMobile ? -20 : -40,
          width: isMobile ? 150 : 250, 
          height: isMobile ? 150 : 250,
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0, filter: 'blur(20px)',
        }} />
      )}
    </div>
  );
};

export default HeroIllustration;