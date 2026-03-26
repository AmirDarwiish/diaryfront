import { useEffect } from 'react';
import { useLang } from '../context/LangContext';

const seoData = {
  '/': {
    ar: {
      title: 'زيا | تطوير مواقع وتطبيقات احترافية',
      description: 'زيا – نحول أفكارك إلى منتجات رقمية متميزة. تطوير مواقع، تطبيقات، وهوية بصرية.',
    },
    en: {
      title: 'Zeiia | Professional Web & App Development',
      description: 'Zeiia – We turn your ideas into outstanding digital products. Websites, apps, and branding.',
    },
  },
  '/services': {
    ar: {
      title: 'خدماتنا | زيا',
      description: 'تطوير مواقع الويب، تطبيقات الجوال، وتصميم الهوية البصرية بأعلى معايير الجودة.',
    },
    en: {
      title: 'Our Services | Zeiia',
      description: 'Web development, mobile apps, and visual identity design at the highest quality standards.',
    },
  },
  '/why-us': {
    ar: {
      title: 'لماذا زيا؟',
      description: 'نتميز بالخبرة والكفاءة والالتزام بالمواعيد. اكتشف لماذا يختارنا عملاؤنا.',
    },
    en: {
      title: 'Why Zeiia?',
      description: 'Experience, efficiency, and commitment. Discover why our clients choose us.',
    },
  },
  '/contact': {
    ar: {
      title: 'تواصل معنا | زيا',
      description: 'تواصل مع فريق زيا لبدء مشروعك الرقمي اليوم.',
    },
    en: {
      title: 'Contact Us | Zeiia',
      description: 'Get in touch with the Zeiia team to start your digital project today.',
    },
  },
};

const SEOHead = ({ path }) => {
  const { lang } = useLang();
  const data = seoData[path]?.[lang] || seoData['/'][lang];

  useEffect(() => {
    document.title = data.title;
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';

    let meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = data.description;
  }, [data, lang]);

  return null;
};

export default SEOHead;