import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Category, Course, SiteSettings } from './types.ts';
import { CourseCard } from './components/public/CourseCard.tsx';
import { CourseDetailsPage } from './components/public/CourseDetailsPage.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { toBengaliNumber } from './utils/format.ts';

type RouteState =
  | { view: 'home' }
  | { view: 'course_details'; slug: string }
  | { view: 'admin_login' }
  | { view: 'admin_dashboard' };

function parseCurrentRoute(pathname: string): RouteState {
  if (pathname.startsWith('/admin/dashboard')) {
    return { view: 'admin_dashboard' };
  }
  if (pathname.startsWith('/admin')) {
    return { view: 'admin_login' };
  }
  if (pathname.startsWith('/courses/')) {
    const slug = pathname.replace('/courses/', '').split('/')[0];
    if (slug) {
      return { view: 'course_details', slug };
    }
  }
  return { view: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    parseCurrentRoute(window.location.pathname)
  );

  // Auth state kept in memory (never localStorage per security guidelines)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');

  // Public portal data from PostgreSQL
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Discovery Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [onlyPopular, setOnlyPopular] = useState<boolean>(false);

  // Affiliate Redirect Modal State
  const [redirectCourse, setRedirectCourse] = useState<Course | null>(null);
  const [recordingClick, setRecordingClick] = useState<boolean>(false);

  // Live Countdown State
  const [countdown, setCountdown] = useState({ d: '02', h: '08', m: '26', s: '55' });

  // Horizontal scroll refs by category slug
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parseCurrentRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Countdown timer effect matching user's original script
  useEffect(() => {
    const target = new Date();
    target.setHours(
      target.getHours() + 56,
      target.getMinutes() + 42,
      target.getSeconds() + 15,
      0
    );

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        d: String(d).padStart(2, '0'),
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPublicData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/data');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setCourses(data.courses || []);
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.siteTitle) {
            document.title = data.settings.siteTitle;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  // Handle Affiliate Click & Redirect Flow
  const handleEnrollClick = async (course: Course, referrer: string) => {
    setRedirectCourse(course);
    setRecordingClick(true);
    try {
      await fetch(`/api/public/click/${course.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer }),
      });
      // Update local click count in memory
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, clickCount: (c.clickCount || 0) + 1 } : c
        )
      );
    } catch (err) {
      console.error('Click tracking error:', err);
    } finally {
      setRecordingClick(false);
    }
  };

  const scrollRow = (slug: string, dir: number) => {
    const el = rowRefs.current[slug];
    if (el) {
      el.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  const handleQuickFilterSelect = (catSlug: string, queryText = '') => {
    setSelectedCategory(catSlug);
    setSearchQuery(queryText);
    const coursesEl = document.getElementById('courses');
    if (coursesEl) {
      coursesEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappNumber = settings?.whatsappNumber || '01608-949565';
  const whatsappLink = settings?.whatsappLink || 'https://wa.me/8801814946474';

  // =========================================================
  // ADMIN ROUTES (/admin/login & /admin/dashboard)
  // =========================================================

  if (route.view === 'admin_login') {
    return (
      <AdminLogin
        onLoginSuccess={(token, email, name) => {
          setAuthToken(token);
          setAdminEmail(email);
          setAdminName(name);
          navigate('/admin/dashboard');
        }}
        onBackToSite={() => navigate('/')}
      />
    );
  }

  if (route.view === 'admin_dashboard') {
    if (!authToken) {
      return (
        <AdminLogin
          onLoginSuccess={(token, email, name) => {
            setAuthToken(token);
            setAdminEmail(email);
            setAdminName(name);
          }}
          onBackToSite={() => navigate('/')}
        />
      );
    }

    return (
      <AdminDashboard
        authToken={authToken}
        adminEmail={adminEmail}
        adminName={adminName}
        onLogout={() => {
          setAuthToken(null);
          navigate('/');
        }}
        onViewPublicSite={() => navigate('/')}
        onDataMutated={fetchPublicData}
      />
    );
  }

  // Filter logic for Search & Discovery
  const isFilteringActive =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    priceFilter !== 'all' ||
    onlyPopular;

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.headerTitle.toLowerCase().includes(q) ||
      c.headerSubtitle.toLowerCase().includes(q) ||
      c.categorySlug.toLowerCase().includes(q) ||
      c.features.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'all' || c.categorySlug === selectedCategory;

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'under3000' && c.discountPrice <= 3000) ||
      (priceFilter === '3000to5000' &&
        c.discountPrice > 3000 &&
        c.discountPrice <= 5000) ||
      (priceFilter === 'above5000' && c.discountPrice > 5000);

    const matchesPopular = !onlyPopular || c.isPopular;

    return matchesSearch && matchesCategory && matchesPrice && matchesPopular;
  });

  // =========================================================
  // PUBLIC HEADER + COURSE DETAILS OR HOMEPAGE
  // =========================================================

  const activeCourseForDetails =
    route.view === 'course_details'
      ? courses.find((c) => c.slug === route.slug) || null
      : null;

  return (
    <div className="relative min-h-screen">
      {/* Subtle Background Educational Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='none' stroke='%23E22B2B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.045'%3E%3Cpath d='M18 30c8-4 18-4 24 0v26c-6-4-16-4-24 0z'/%3E%3Cpath d='M66 30c-8-4-18-4-24 0v26c6-4 16-4 24 0z'/%3E%3Cpath d='M120 24l14 14-30 30-16 3 3-16z'/%3E%3Cpath d='M131 35l-6-6'/%3E%3Cpath d='M170 100l30-12-30-12-30 12z'/%3E%3Cpath d='M155 92v16c0 5 8 9 15 9s15-4 15-9V92'/%3E%3Cpath d='M200 89v18'/%3E%3Ccircle cx='40' cy='140' r='14'/%3E%3Cpath d='M34 158h12'/%3E%3Cpath d='M36 152h8'/%3E%3Crect x='100' y='150' width='60' height='14' rx='2' transform='rotate(-12 100 150)'/%3E%3Cpath d='M188 150l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '220px 220px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* TOP HEADER (Strict 3-Zone Contract: Brand | Nav Links | Primary Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-left text-lg sm:text-xl font-black tracking-tight text-slate-900 cursor-pointer whitespace-nowrap"
          >
            10 Minute <span className="text-red-600">School</span> Portal
          </button>

          {/* Zone 2: Clean Typography Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[14px] font-bold text-slate-700">
            <a
              className="hover:text-red-600 transition whitespace-nowrap"
              href="#hsc-section"
              onClick={(e) => {
                if (route.view !== 'home') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              HSC ব্যাচ
            </a>
            <a
              className="hover:text-red-600 transition whitespace-nowrap"
              href="#school-section"
              onClick={(e) => {
                if (route.view !== 'home') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              ক্লাস ৬–১০
            </a>
            <a
              className="hover:text-red-600 transition whitespace-nowrap"
              href="#skills-section"
              onClick={(e) => {
                if (route.view !== 'home') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              স্কিলস
            </a>
            <a
              className="hover:text-red-600 transition whitespace-nowrap"
              href="#admission-section"
              onClick={(e) => {
                if (route.view !== 'home') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              ভর্তি পরীক্ষা
            </a>
            <a
              className="hover:text-red-600 transition whitespace-nowrap"
              href="#reviews"
              onClick={(e) => {
                if (route.view !== 'home') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              অভিজ্ঞতা
            </a>
          </nav>

          {/* Zone 3: Primary Actions (WhatsApp + Admin Panel) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                navigate(authToken ? '/admin/dashboard' : '/admin/login')
              }
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer whitespace-nowrap"
            >
              অ্যাডমিন প্যানেল
            </button>
            <a
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition whitespace-nowrap"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[17px]">chat</span>
              <span>{whatsappNumber}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ROUTE VIEW: COURSE DETAILS PAGE */}
      {route.view === 'course_details' && (
        <div className="relative z-10">
          {loading ? (
            <div className="wrap py-20 text-center text-sm text-slate-500">
              কোর্স তথ্য লোড হচ্ছে...
            </div>
          ) : !activeCourseForDetails ? (
            <div className="wrap py-20 text-center space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">
                দুঃখিত, এই কোর্সটি খুঁজে পাওয়া যায়নি
              </h2>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                হোমপেজে ফিরে যান
              </button>
            </div>
          ) : (
            <CourseDetailsPage
              course={activeCourseForDetails}
              categories={categories}
              relatedCourses={courses.filter(
                (c) =>
                  c.categorySlug === activeCourseForDetails.categorySlug &&
                  c.id !== activeCourseForDetails.id
              )}
              whatsappNumber={whatsappNumber}
              whatsappLink={whatsappLink}
              onBack={() => navigate('/')}
              onSelectCourse={(slug) => navigate(`/courses/${slug}`)}
              onEnrollClick={handleEnrollClick}
            />
          )}
        </div>
      )}

      {/* ROUTE VIEW: PUBLIC HOMEPAGE */}
      {route.view === 'home' && (
        <main className="relative z-10">
          {/* HERO SECTION WITH 3D CATEGORY SELECTOR */}
          <section className="relative bg-gradient-to-b from-[#0B0F19] via-[#111827] to-[#0B0F19] text-white pt-10 pb-20 overflow-hidden border-b border-slate-800">
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='none' stroke='%23E22B2B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.14'%3E%3Cpath d='M18 30c8-4 18-4 24 0v26c-6-4-16-4-24 0z'/%3E%3Cpath d='M66 30c-8-4-18-4-24 0v26c6-4 16-4 24 0z'/%3E%3Cpath d='M120 24l14 14-30 30-16 3 3-16z'/%3E%3Cpath d='M131 35l-6-6'/%3E%3Cpath d='M170 100l30-12-30-12-30 12z'/%3E%3Cpath d='M155 92v16c0 5 8 9 15 9s15-4 15-9V92'/%3E%3Cpath d='M200 89v18'/%3E%3Ccircle cx='40' cy='140' r='14'/%3E%3Cpath d='M34 158h12'/%3E%3Cpath d='M36 152h8'/%3E%3Crect x='100' y='150' width='60' height='14' rx='2' transform='rotate(-12 100 150)'/%3E%3Cpath d='M188 150l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '220px 220px',
                backgroundRepeat: 'repeat',
              }}
            />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="wrap relative z-10 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>
                  {settings?.heroBadge ||
                    '১০ মিনিট স্কুল সব কোর্সে সর্বোচ্চ লাইভ প্রাথমিক ছাড়'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">অফিশিয়াল অনুমোদিত অ্যাফিলিয়েট</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 max-w-3xl mx-auto"
                style={{ textWrap: 'balance' }}
              >
                টেন মিনিট স্কুল{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-orange-400">
                  অফিশিয়াল কোর্স পোর্টাল
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-6 font-normal">
                {settings?.heroSubtitle ||
                  'সরাসরি সর্বোচ্চ প্রাথমিক ছাড়ে যেকোনো একাডেমিক ও ক্যারিয়ার স্কিল প্রোগ্রামে ভর্তি হোন। কোনো প্রোমো কোডের ঝামেলা ছাড়াই ১০০% ডিসকাউন্টেড লাইভ এক্সেস।'}
              </p>

              {/* Urgent Countdown Timer */}
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-slate-900/90 border border-red-500/40 backdrop-blur-md px-5 py-2.5 rounded-2xl mb-7 shadow-xl tabular-nums">
                <div className="flex items-center gap-2 text-rose-300 text-xs sm:text-sm font-bold">
                  <span className="material-symbols-outlined text-[20px] text-red-500">
                    alarm
                  </span>
                  <span>
                    {settings?.countdownLabel ||
                      'HSC ২৮ আর্লি বার্ড স্পেশাল উপহার সহ ছাড়ে বাকি:'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-center min-w-[48px]">
                    <b className="text-base sm:text-lg text-white block leading-none font-bold font-mono">
                      {countdown.d}
                    </b>
                    <span className="text-[10px] text-slate-400">দিন</span>
                  </div>
                  <span className="text-rose-400 font-bold">:</span>
                  <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-center min-w-[48px]">
                    <b className="text-base sm:text-lg text-white block leading-none font-bold font-mono">
                      {countdown.h}
                    </b>
                    <span className="text-[10px] text-slate-400">ঘণ্টা</span>
                  </div>
                  <span className="text-rose-400 font-bold">:</span>
                  <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-center min-w-[48px]">
                    <b className="text-base sm:text-lg text-white block leading-none font-bold font-mono">
                      {countdown.m}
                    </b>
                    <span className="text-[10px] text-slate-400">মিনিট</span>
                  </div>
                  <span className="text-rose-400 font-bold">:</span>
                  <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-center min-w-[48px]">
                    <b className="text-base sm:text-lg text-red-400 block leading-none font-bold font-mono">
                      {countdown.s}
                    </b>
                    <span className="text-[10px] text-slate-400">সেকেন্ড</span>
                  </div>
                </div>
              </div>

              {/* Interactive Search Bar */}
              <div className="max-w-2xl mx-auto mb-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('courses');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-2xl focus-within:border-red-500/80 transition"
                >
                  <span className="material-symbols-outlined text-[22px] text-slate-300 ml-3 shrink-0">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm text-white placeholder-slate-400 font-medium"
                    placeholder="কোর্স, বিষয় কিংবা পরীক্ষার নাম লিখুন (যেমন: HSC 28, IELTS, Spoken, Web Dev)..."
                    type="text"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white px-2 text-xs cursor-pointer"
                    >
                      মুছুন
                    </button>
                  )}
                  <button
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition shrink-0 cursor-pointer whitespace-nowrap"
                    type="submit"
                  >
                    খুঁজুন
                  </button>
                </form>

                {/* Popular Search Filter Buttons */}
                <div className="mt-3 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-slate-300 font-semibold">জনপ্রিয় অনুসন্ধান:</span>
                  {[
                    { label: 'HSC 28 PCMB', cat: 'hsc', q: 'PCMB' },
                    { label: 'HSC 28 BEI', cat: 'hsc', q: 'BEI' },
                    { label: 'Spoken English', cat: 'skills', q: 'Spoken' },
                    { label: 'IELTS Complete', cat: 'skills', q: 'IELTS' },
                    { label: 'Class 6 Full Year', cat: 'school', q: '৬ষ্ঠ' },
                    { label: 'Varsity A Unit', cat: 'admission', q: 'Unit A' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleQuickFilterSelect(item.cat, item.q)}
                      className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-slate-200 transition cursor-pointer whitespace-nowrap"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3D CATEGORY & CLASS SELECTOR STRIP */}
            <div className="wrap relative z-20">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                  <span className="text-xs font-extrabold text-orange-400">
                    ইন্টারেক্টিভ ক্লাস সিলেক্টর ও লাইভ ব্যাচ
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  সরাসরি কাঙ্ক্ষিত ব্যাচ নির্বাচনে ক্লিক করুন
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-2xl shadow-2xl">
                {/* HSC 26 */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('admission', '')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] glow-orange-ring rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-xl tracking-tighter leading-none text-center drop-shadow-md">
                        HSC
                        <br />
                        <span className="text-2xl font-black">26</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        emoji_events
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base mt-2.5 group-hover:text-orange-400 transition">
                      HSC ২৬
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-bold text-orange-400 whitespace-nowrap">
                    এডমিশন কোর্সে ভর্তি চলছে
                  </span>
                </button>

                {/* HSC 27 */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('hsc', 'HSC 27')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] glow-orange-ring rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-xl tracking-tighter leading-none text-center drop-shadow-md">
                        HSC
                        <br />
                        <span className="text-2xl font-black">27</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        ads_click
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base mt-2.5 group-hover:text-orange-400 transition">
                      HSC ২৭
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-bold text-orange-400 whitespace-nowrap">
                    অনলাইন ব্যাচে ভর্তি চলছে
                  </span>
                </button>

                {/* HSC 28 */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('hsc', 'HSC 28')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] glow-orange-ring rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-xl tracking-tighter leading-none text-center drop-shadow-md">
                        HSC
                        <br />
                        <span className="text-2xl font-black">28</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        school
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base mt-2.5 group-hover:text-orange-400 transition">
                      HSC ২৮
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-bold text-orange-400 whitespace-nowrap">
                    অনলাইন ব্যাচে ভর্তি চলছে
                  </span>
                </button>

                {/* SSC 27 (Class 10) */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('school', 'SSC 27')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] border border-slate-800 hover:border-amber-500/70 rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#fb923c] via-[#f97316] to-[#ea580c] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-lg tracking-tighter leading-tight text-center drop-shadow-md">
                        SSC
                        <br />
                        <span className="text-2xl font-black">27</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        menu_book
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base mt-2.5 group-hover:text-amber-400 transition">
                      দশম শ্রেণি
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    SSC ২০২৭ ব্যাচ
                  </span>
                </button>

                {/* Class 9 */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('school', '৯ম')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] border border-slate-800 hover:border-emerald-500/70 rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-sm tracking-tight uppercase leading-none text-center drop-shadow-md">
                        CLASS
                        <br />
                        <span className="text-2xl sm:text-3xl font-black">9</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        auto_stories
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base mt-2.5 group-hover:text-emerald-400 transition">
                      ৯ম শ্রেণি
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    নতুন কারিকুলাম
                  </span>
                </button>

                {/* Class 6, 7, 8 */}
                <button
                  type="button"
                  onClick={() => handleQuickFilterSelect('school', '')}
                  className="capsule-card group flex flex-col items-center cursor-pointer text-left"
                >
                  <div className="w-full bg-[#0F141F] border border-slate-800 hover:border-teal-500/70 rounded-[26px] p-3 flex flex-col items-center transition-all">
                    <div className="w-full aspect-[1.25/1] rounded-[18px] bg-gradient-to-b from-[#2dd4bf] via-[#0d9488] to-[#115e59] p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                      <div className="text-white font-extrabold text-xs tracking-tight uppercase leading-none text-center drop-shadow-md">
                        CLASS
                        <br />
                        <span className="text-xl font-black">6,7,8</span>
                      </div>
                      <span className="material-symbols-outlined text-white/80 text-xl absolute bottom-1.5 right-2">
                        backpack
                      </span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm mt-2.5 group-hover:text-teal-400 transition">
                      ৬ষ্ঠ, ৭ম, ৮ম শ্রেণি
                    </span>
                  </div>
                  <span className="mt-2.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    বার্ষিক অনলাইন ব্যাচ
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* 3 MAIN PATHWAYS (Academic, Skills, Admission) */}
          <section className="py-12" id="pathways">
            <div className="wrap">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Academic Pathway */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:-translate-y-1 transition duration-200 flex flex-col">
                  <div className="h-28 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 flex items-center justify-between text-white">
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-rose-200">
                        স্কুল ও কলেজ
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        একাডেমিক পূর্ণাঙ্গ প্রস্তুতি
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-white/85">
                      library_books
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        এক্সপার্ট টিচারদের রেগুলার লাইভ ক্লাস, মাস্টারবুক, মডেল টেস্ট ও ডেইলি ডাউট সলভিং নিয়ে সারা বছর A+ অর্জনের পারফেক্ট প্ল্যান।
                      </p>
                      <div className="text-xs text-slate-500 font-semibold mb-4">
                        HSC ২০২৮ · HSC ২০২৭ · ১০ম শ্রেণি · ৬ষ্ঠ–৯ম শ্রেণি
                      </div>
                    </div>
                    <a
                      className="w-full text-center py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition"
                      href="#hsc-section"
                    >
                      অনলাইন ব্যাচ সমূহ দেখুন →
                    </a>
                  </div>
                </div>

                {/* Skills Pathway */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:-translate-y-1 transition duration-200 flex flex-col">
                  <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 flex items-center justify-between text-white">
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-indigo-300">
                        ক্যারিয়ার ও ফ্রিল্যান্সিং
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        দেশসেরা স্কিল প্ল্যাটফর্ম
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-white/85">
                      terminal
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        দেশসেরা শিক্ষক, ৫ লাখ+ শিক্ষার্থী ও ৭০+ প্রফেশনাল অনলাইন কোর্স! স্পোকেন ইংলিশ, ফ্রিল্যান্সিং ও টেক স্কিলের পূর্ণাঙ্গ ভাণ্ডার।
                      </p>
                      <div className="text-xs text-slate-500 font-semibold mb-4">
                        Spoken English · IELTS Complete · Web Dev · মার্কেটিং
                      </div>
                    </div>
                    <a
                      className="w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition"
                      href="#skills-section"
                    >
                      সকল স্কিলস কোর্স দেখুন →
                    </a>
                  </div>
                </div>

                {/* Admission Pathway */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:-translate-y-1 transition duration-200 flex flex-col">
                  <div className="h-28 bg-gradient-to-r from-red-800 via-rose-900 to-red-900 p-5 flex items-center justify-between text-white">
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-rose-300">
                        স্বপ্নের বিশ্ববিদ্যালয়
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        ভার্সিটি + গুচ্ছ এডমিশন
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-white/85">
                      account_balance
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        বুয়েট, মেডিকেল, ঢাবি ‘ক’, ‘খ’, ‘গ’ ইউনিট এবং গুচ্ছ ভর্তি পরীক্ষার সম্পূর্ণ প্রশ্নব্যাংক সমাধান ও দেশসেরা মক টেস্ট সিরিজ।
                      </p>
                      <div className="text-xs text-slate-500 font-semibold mb-4">
                        Unit A (Science) · Unit B (Arts) · Unit C (Commerce)
                      </div>
                    </div>
                    <a
                      className="w-full text-center py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold transition"
                      href="#admission-section"
                    >
                      এডমিশন কোর্সসমূহ দেখুন →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DYNAMIC COURSE SECTIONS & INTERACTIVE FILTER BAR */}
          <section className="py-10" id="courses">
            <div className="wrap">
              {/* Top Section Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl mb-8">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 mb-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    সর্বোচ্চ রেটেড ও ট্রেন্ডিং
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    জনপ্রিয় লাইভ কোর্স ও অনলাইন ব্যাচ
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    টেন মিনিট স্কুলের শীর্ষ মেন্টরদের পরিচালিত কোর্সসমূহ এক নজরে দেখে সরাসরি ডিসকাউন্টেড মূল্যে নিশ্চিন্তে এনরোল করুন।
                  </p>
                </div>
                <span className="material-symbols-outlined text-5xl text-sky-400 shrink-0">
                  verified
                </span>
              </div>

              {/* Interactive Discovery & Filter Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-10 flex flex-wrap items-center justify-between gap-3">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    সব ক্যাটাগরি ({toBengaliNumber(courses.length)})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.slug
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Price Range & Popular Toggle */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="all">সকল মূল্য সীমা</option>
                    <option value="under3000">৳৩,০০০ এর নিচে</option>
                    <option value="3000to5000">৳৩,০০০ – ৳৫,০০০</option>
                    <option value="above5000">৳৫,০০০ এর উপরে</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setOnlyPopular(!onlyPopular)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                      onlyPopular
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ★ জনপ্রিয় কোর্স
                  </button>

                  {isFilteringActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setPriceFilter('all');
                        setOnlyPopular(false);
                      }}
                      className="text-xs font-bold text-red-600 hover:underline px-2 cursor-pointer whitespace-nowrap"
                    >
                      ফিল্টার রিসেট ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Loading Skeleton */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-96 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
                    />
                  ))}
                </div>
              ) : isFilteringActive ? (
                /* FILTERED / SEARCH RESULTS VIEW */
                <div className="space-y-5 mb-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">
                      অনুসন্ধান ফলাফল ({toBengaliNumber(filteredCourses.length)}টি কোর্স পাওয়া গেছে)
                    </h3>
                  </div>

                  {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                      <span className="material-symbols-outlined text-4xl text-slate-400">
                        search_off
                      </span>
                      <div className="text-base font-bold text-slate-800">
                        আপনার অনুসন্ধানের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setPriceFilter('all');
                          setOnlyPopular(false);
                        }}
                        className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                      >
                        সকল কোর্স দেখুন
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onSelectCourse={(slug) => navigate(`/courses/${slug}`)}
                          onEnrollClick={handleEnrollClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* DEFAULT CATEGORY-WISE SECTIONS (Replicating user's exact layout dynamically) */
                categories.map((cat) => {
                  const catCourses = courses.filter((c) => c.categorySlug === cat.slug);
                  if (catCourses.length === 0) return null;

                  const sectionId = `${cat.slug}-section`;
                  const isGridSection = cat.slug === 'hsc';

                  return (
                    <div key={cat.id} className="mb-14" id={sectionId}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <span className="text-xs font-extrabold tracking-wider text-red-600">
                            {cat.subtitle || 'অনলাইন প্রোগ্রাম'}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                            {cat.name}
                          </h3>
                        </div>

                        {!isGridSection && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollRow(cat.slug, -1)}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[19px]">
                                chevron_left
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollRow(cat.slug, 1)}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[19px]">
                                chevron_right
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isGridSection ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {catCourses.map((course) => (
                            <div key={course.id}>
                              <CourseCard
                                course={course}
                                onSelectCourse={(slug) => navigate(`/courses/${slug}`)}
                                onEnrollClick={handleEnrollClick}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="scroll-row"
                          ref={(el) => {
                            rowRefs.current[cat.slug] = el;
                          }}
                        >
                          {catCourses.map((course) => (
                            <div key={course.id}>
                              <CourseCard
                                course={course}
                                onSelectCourse={(slug) => navigate(`/courses/${slug}`)}
                                onEnrollClick={handleEnrollClick}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* STUDENT REVIEWS & EXPERIENCE SECTION */}
          <section className="py-12 border-t border-slate-200/70 bg-slate-50/60" id="reviews">
            <div className="wrap space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-extrabold text-red-600">
                  শিক্ষার্থীদের সাফল্য ও অভিজ্ঞতা
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  দেশজুড়ে লাখো শিক্ষার্থীর আস্থার প্ল্যাটফর্ম
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  আমাদের অনুমোদিত ডিসকাউন্ট লিংকের মাধ্যমে ভর্তি হয়ে শিক্ষার্থীরা যেভাবে তাদের একাডেমিক ও স্কিল প্রস্তুতিতে এগিয়ে যাচ্ছে।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    quote:
                      'HSC 28 PCMB সাইকেল ১-এ ভর্তি হওয়ার পর ফিজিক্স ও ম্যাথের ভীতি পুরোপুরি কেটে গেছে। প্রিন্টেড মাস্টারবুক এবং লাইভ ডাউট সলভিং ক্লাসগুলো অসাধারণ।',
                    name: 'তানভীর আহমেদ',
                    role: 'HSC ২৮ ব্যাচ, নটর ডেম কলেজ, ঢাকা',
                    course: 'HSC 28 PCMB অনলাইন ব্যাচ',
                  },
                  {
                    quote:
                      'মুনজেরিন আপুর Spoken English ও IELTS কোর্স দুটি করে আমার স্পিকিং ফ্লুয়েন্সি অনেক বেড়েছে। অফিশিয়াল ডিসকাউন্টে সরাসরি ভর্তি হতে পেরেছি।',
                    name: 'সাদিয়া ইসলাম প্রমি',
                    role: 'শিক্ষার্থী, ঢাকা বিশ্ববিদ্যালয় (Overall Band 7.5)',
                    course: 'IELTS Complete Preparation',
                  },
                  {
                    quote:
                      'ভার্সিটি A Unit + GST কোর্সের প্রশ্নব্যাংক অ্যানালাইসিস ও সেন্ট্রাল মক টেস্টগুলো আমাকে ভর্তি পরীক্ষার প্রশ্নের ধরন বুঝতে সবচেয়ে বেশি সাহায্য করেছে।',
                    name: 'মাহমুদুল হাসান রাহাত',
                    role: 'ভর্তিচ্ছু শিক্ষার্থী, HSC ২৬ ব্যাচ, রাজশাহী কলেজ',
                    course: 'ভার্সিটি A Unit + GST এডমিশন',
                  },
                ].map((rev, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4"
                  >
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      “{rev.quote}”
                    </p>
                    <div className="pt-3 border-t border-slate-100">
                      <div className="font-bold text-sm text-slate-900">{rev.name}</div>
                      <div className="text-xs text-slate-500">{rev.role}</div>
                      <div className="text-[11px] font-semibold text-red-600 mt-1">
                        কোর্স: {rev.course}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DIRECT ADMISSION SUPPORT BAR */}
          <section className="py-8">
            <div className="wrap">
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 sm:p-6 rounded-2xl border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-[28px]">
                      support_agent
                    </span>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      সরাসরি কোর্স অ্যাডমিশন সহায়তা ও যেকোনো জিজ্ঞাসা
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      আমাদের সার্বক্ষণিক সাপোর্ট টিম দ্রুততম সময়ে আপনাকে সঠিক কোর্স বেছে নিতে সহায়তা করবে।
                    </div>
                  </div>
                </div>
                <a
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition shrink-0 whitespace-nowrap"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>{whatsappNumber} (WhatsApp)</span>
                </a>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 pt-12 pb-8 border-t border-slate-800">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="text-lg font-black text-white mb-3">
                10 Minute <span className="text-red-500">School</span> Portal
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                ১০ মিনিট স্কুলের সকল কোর্সে সর্বোচ্চ অনুমোদিত প্রাথমিক ছাড়ে ভর্তি নিশ্চিত করার জন্য ডেডিকেটেড অ্যাফিলিয়েট প্ল্যাটফর্ম।
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>অনুমোদিত অফিশিয়াল অ্যাফিলিয়েট পার্টনার</span>
              </div>
            </div>

            <div>
              <h5 className="text-white text-sm font-bold mb-3">একাডেমিক প্রোগ্রাম</h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => handleQuickFilterSelect('school', '')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    ৬ষ্ঠ–১০ম অনলাইন ব্যাচ
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleQuickFilterSelect('school', 'SSC')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    SSC ২০২৭ ও ২০২৮ প্রস্তুতি
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/hsc-27-science-bundle')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    HSC 27 ফুল সায়েন্স বান্ডেল
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/hsc-28-pcmb')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    HSC 28 অনলাইন ব্যাচ
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white text-sm font-bold mb-3">স্কিলস ও ভর্তি</h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/spoken-english-munzereen')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    ঘরে বসে Spoken English
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/ielts-complete-munzereen')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    IELTS Complete Course
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/fullstack-web-dev-mern')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/courses/varsity-a-unit-gst-2026')}
                    className="hover:text-red-400 transition cursor-pointer"
                  >
                    ভার্সিটি ও গুচ্ছ এডমিশন
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white text-sm font-bold mb-3">যোগাযোগ ও সহায়তা</h5>
              <p className="text-xs mb-2">
                WhatsApp: <b className="text-white">{whatsappNumber}</b>
              </p>
              <p className="text-xs mb-4">
                সরাসরি চ্যাটে সহায়তা পেতে আমাদের টিম সার্বক্ষণিক প্রস্তুত।
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-2 rounded-lg border border-white/10 transition"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">
                    chat
                  </span>
                  <span>হোয়াটসঅ্যাপে মেসেজ দিন</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    navigate(authToken ? '/admin/dashboard' : '/admin/login')
                  }
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-800 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    admin_panel_settings
                  </span>
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              © ২০২৬ | 10 Minute School Courses (10msallcourse.com)। সর্বস্বত্ব সংরক্ষিত।
            </div>
            <div>ডিজাইন — টেন মিনিট স্কুল অনুমোদিত ডিসকাউন্ট প্ল্যাটফর্ম</div>
          </div>
        </div>
      </footer>

      {/* AFFILIATE REDIRECT CONFIRMATION MODAL */}
      {redirectCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-extrabold text-emerald-700">
                ডিসকাউন্ট অ্যাক্টিভেটেড ({toBengaliNumber(redirectCourse.discountPercent)}% সাশ্রয়)
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {redirectCourse.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার স্পেশাল ডিসকাউন্ট মূল্য{' '}
                <b className="text-emerald-700 font-extrabold">
                  ৳{toBengaliNumber(redirectCourse.discountPrice)}
                </b>{' '}
                (রেগুলার ফি ৳{toBengaliNumber(redirectCourse.originalPrice)})। পেমেন্ট ও এনরোলমেন্ট সম্পন্ন করতে নিচের বাটনে ক্লিক করে ১০ মিনিট স্কুলের অফিশিয়াল পেজে যান।
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href={redirectCourse.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setRedirectCourse(null)}
                className="btn-shine w-full text-white py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <span>১০ মিনিট স্কুল অফিশিয়াল ওয়েবসাইটে যান</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>

              <button
                type="button"
                onClick={() => setRedirectCourse(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              {recordingClick
                ? 'ক্লিক ট্র্যাক করা হচ্ছে...'
                : `Tracking Link: /go/${redirectCourse.slug}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
