import React, { useEffect, useState, useCallback } from 'react';
import { Category, ClickRecord, Course, SiteSettings } from '../../types.ts';
import { getGradientClasses, toBengaliNumber } from '../../utils/format.ts';
import { CourseFormModal } from './CourseFormModal.tsx';

interface AdminDashboardProps {
  authToken: string;
  adminEmail: string;
  adminName: string;
  onLogout: () => void;
  onViewPublicSite: () => void;
  onDataMutated: () => void;
}

type AdminTab = 'overview' | 'courses' | 'categories' | 'analytics' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authToken,
  adminEmail,
  adminName,
  onLogout,
  onViewPublicSite,
  onDataMutated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0,
    totalClicks: 0,
    totalCategories: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickRecord[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Course management states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<number | null>(null);

  // Category form states
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSubtitle, setCatSubtitle] = useState('');
  const [catColor, setCatColor] = useState('red');
  const [catOrder, setCatOrder] = useState(1);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<number | null>(null);

  // Settings form states
  const [siteTitle, setSiteTitle] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('');
  const [defaultAffiliateRef, setDefaultAffiliateRef] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) {
        throw new Error('অ্যাডমিন ডেটা লোড করতে ব্যর্থ হয়েছে।');
      }
      const data = await res.json();
      setStats(data.stats);
      setCourses(data.courses || []);
      setCategories(data.categories || []);
      setRecentClicks(data.recentClicks || []);
      if (data.settings) {
        setSettings(data.settings);
        setSiteTitle(data.settings.siteTitle || '');
        setWhatsappNumber(data.settings.whatsappNumber || '');
        setWhatsappLink(data.settings.whatsappLink || '');
        setHeroBadge(data.settings.heroBadge || '');
        setHeroTitle(data.settings.heroTitle || '');
        setHeroSubtitle(data.settings.heroSubtitle || '');
        setCountdownLabel(data.settings.countdownLabel || '');
        setDefaultAffiliateRef(data.settings.defaultAffiliateRef || '');
      }
    } catch (err: any) {
      setError(err.message || 'ডেটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Save (Create or Update) Course
  const handleSaveCourse = async (courseData: any, id?: number) => {
    const url = id ? `/api/admin/courses/${id}` : '/api/admin/courses';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(courseData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'কোর্স সংরক্ষণ করা যায়নি।');
    }

    await fetchOverview();
    onDataMutated();
    showToast(id ? 'কোর্স সফলভাবে আপডেট করা হয়েছে!' : 'নতুন কোর্স সফলভাবে যোগ করা হয়েছে!');
  };

  // Toggle Course Active/Inactive Status
  const handleToggleCourseStatus = async (course: Course) => {
    const nextStatus = course.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('স্ট্যাটাস পরিবর্তন করা যায়নি।');
      await fetchOverview();
      onDataMutated();
      showToast(
        nextStatus === 'active'
          ? `“${course.title}” পাবলিক ওয়েবসাইটে চালু করা হয়েছে।`
          : `“${course.title}” পাবলিক ওয়েবসাইট থেকে লুকানো (Disable) হয়েছে।`
      );
    } catch (err: any) {
      showToast(err.message || 'সমস্যা হয়েছে');
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) throw new Error('কোর্স ডিলিট করা যায়নি।');
      setConfirmDeleteCourseId(null);
      await fetchOverview();
      onDataMutated();
      showToast('কোর্স সফলভাবে ডিলিট করা হয়েছে।');
    } catch (err: any) {
      showToast(err.message || 'ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  // Create or Update Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    try {
      const url = editingCat
        ? `/api/admin/categories/${editingCat.id}`
        : '/api/admin/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: catName.trim(),
          slug: catSlug.trim(),
          subtitle: catSubtitle.trim() || 'অনলাইন ব্যাচ ও কোর্স',
          badgeColor: catColor,
          displayOrder: Number(catOrder),
          status: editingCat ? editingCat.status : 'active',
        }),
      });
      if (!res.ok) throw new Error('ক্যাটাগরি সেভ করা যায়নি।');
      setEditingCat(null);
      setCatName('');
      setCatSlug('');
      setCatSubtitle('');
      await fetchOverview();
      onDataMutated();
      showToast(editingCat ? 'ক্যাটাগরি আপডেট হয়েছে!' : 'নতুন ক্যাটাগরি তৈরি হয়েছে!');
    } catch (err: any) {
      showToast(err.message || 'সমস্যা হয়েছে');
    }
  };

  const handleToggleCategoryStatus = async (cat: Category) => {
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchOverview();
      onDataMutated();
      showToast('ক্যাটাগরি স্ট্যাটাস আপডেট করা হয়েছে।');
    } catch {
      showToast('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setConfirmDeleteCatId(null);
      await fetchOverview();
      onDataMutated();
      showToast('ক্যাটাগরি ডিলিট করা হয়েছে।');
    } catch {
      showToast('ক্যাটাগরি ডিলিট করা যায়নি (এতে কোর্স যুক্ত থাকতে পারে)।');
    }
  };

  // Save Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          siteTitle,
          whatsappNumber,
          whatsappLink,
          heroBadge,
          heroTitle,
          heroSubtitle,
          countdownLabel,
          defaultAffiliateRef,
        }),
      });
      if (!res.ok) throw new Error('সেটিংস সেভ করা যায়নি।');
      await fetchOverview();
      onDataMutated();
      showToast('ওয়েবসাইট সেটিংস সফলভাবে আপডেট করা হয়েছে!');
    } catch (err: any) {
      showToast(err.message || 'সমস্যা হয়েছে');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesCat = filterCat === 'all' || c.categorySlug === filterCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.headerTitle.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const maxClicks = Math.max(1, ...courses.map((c) => c.clickCount || 0));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span>{toast}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-slate-950 text-slate-300 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold text-white tracking-tight">
                10MS Admin Portal
              </div>
              <div className="text-[11px] text-slate-400">
                Affiliate & Course Manager
              </div>
            </div>
            <button
              type="button"
              onClick={onViewPublicSite}
              className="lg:hidden px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold"
            >
              লাইভ সাইট ↗
            </button>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'overview', label: 'ড্যাশবোর্ড ওভারভিউ', icon: 'space_dashboard' },
              { id: 'courses', label: 'কোর্স ও ইমেজ ম্যানেজমেন্ট', icon: 'menu_book' },
              { id: 'categories', label: 'ক্যাটাগরি ম্যানেজমেন্ট', icon: 'category' },
              { id: 'analytics', label: 'অ্যাফিলিয়েট ও ক্লিক অ্যানালিটিক্স', icon: 'monitoring' },
              { id: 'settings', label: 'সাইট ও হিরো সেটিংস', icon: 'settings' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-slate-800/80 space-y-3">
          <div className="text-xs">
            <div className="font-bold text-white truncate">{adminName}</div>
            <div className="text-[11px] text-slate-400 truncate">{adminEmail}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb Left — Primary Actions Right */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span className="font-bold text-slate-900 capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onViewPublicSite}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>পাবলিক ওয়েবসাইট দেখুন</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingCourse(null);
                setIsCourseModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>নতুন কোর্স যোগ করুন</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchOverview}
                className="underline cursor-pointer"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-xl bg-white border border-slate-200 p-5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* ================================================= */}
              {/* TAB 1: DASHBOARD OVERVIEW                         */}
              {/* ================================================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <span className="text-xs font-semibold text-slate-500">
                        মোট কোর্স (Total Courses)
                      </span>
                      <div className="text-3xl font-extrabold text-slate-900 mt-2">
                        {toBengaliNumber(stats.totalCourses)}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {toBengaliNumber(stats.totalCategories)}টি ক্যাটাগরিতে বিভক্ত
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <span className="text-xs font-semibold text-slate-500">
                        চালু কোর্স (Active Courses)
                      </span>
                      <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                        {toBengaliNumber(stats.activeCourses)}
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                        ● পাবলিক ওয়েবসাইটে দৃশ্যমান
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <span className="text-xs font-semibold text-slate-500">
                        বন্ধ কোর্স (Inactive / Disabled)
                      </span>
                      <div className="text-3xl font-extrabold text-amber-600 mt-2">
                        {toBengaliNumber(stats.inactiveCourses)}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        পাবলিক ওয়েবসাইটে লুকানো
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <span className="text-xs font-semibold text-slate-500">
                        মোট অ্যাফিলিয়েট ক্লিক (Total Clicks)
                      </span>
                      <div className="text-3xl font-extrabold text-blue-600 mt-2">
                        {toBengaliNumber(stats.totalClicks)}
                      </div>
                      <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                        10 Minute School রিডাইরেক্ট কাউন্ট
                      </span>
                    </div>
                  </div>

                  {/* Popular Courses & Recent Clicks Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top Clicked Courses */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">
                            জনপ্রিয় কোর্স ও ক্লিক পারফরম্যান্স
                          </h3>
                          <p className="text-xs text-slate-500">
                            কোন কোর্সে সবচেয়ে বেশি শিক্ষার্থী “কোর্সে ভর্তি হোন” চাপছে
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('courses')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          সব কোর্স ম্যানেজ করুন →
                        </button>
                      </div>

                      <div className="space-y-3 tabular-nums">
                        {courses.slice(0, 6).map((c) => {
                          const pct = Math.round(((c.clickCount || 0) / maxClicks) * 100);
                          return (
                            <div key={c.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 truncate max-w-md">
                                  {c.title}
                                </span>
                                <span className="font-mono font-bold text-slate-900">
                                  {toBengaliNumber(c.clickCount || 0)} clicks
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-red-600 rounded-full"
                                  style={{ width: `${Math.max(4, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Clicks Feed */}
                    <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          সাম্প্রতিক অ্যাফিলিয়েট ক্লিক লগ
                        </h3>
                        <p className="text-xs text-slate-500">
                          লাইভ ইউজার এনরোলমেন্ট রিডাইরেক্ট রেকর্ড
                        </p>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto tabular-nums">
                        {recentClicks.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            এখনো কোনো ক্লিক রেকর্ড হয়নি।
                          </div>
                        ) : (
                          recentClicks.slice(0, 10).map((clk) => (
                            <div
                              key={clk.id}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 truncate">
                                  {clk.courseTitle}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Source: {clk.referrer || 'direct'} · /go/{clk.courseSlug}
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-emerald-700 shrink-0">
                                Redirected ↗
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 2: COURSE & IMAGE MANAGEMENT                  */}
              {/* ================================================= */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                      <span className="material-symbols-outlined text-[20px] text-slate-400">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="কোর্সের নাম বা slug লিখে খুঁজুন..."
                        className="w-full text-xs sm:text-sm outline-none text-slate-800"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
                      >
                        <option value="all">সকল ক্যাটাগরি ({courses.length})</option>
                        {categories.map((cat) => (
                          <option key={cat.slug} value={cat.slug}>
                            {cat.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourse(null);
                          setIsCourseModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                      >
                        + Add New Course
                      </button>
                    </div>
                  </div>

                  {/* Courses Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase">
                            <th className="py-3 px-4">কোর্স ইমেজ / ব্যানার</th>
                            <th className="py-3 px-4">কোর্সের নাম ও ক্যাটাগরি</th>
                            <th className="py-3 px-4 text-right">ডিসকাউন্ট মূল্য</th>
                            <th className="py-3 px-4 text-right">ক্লিক সংখ্যা</th>
                            <th className="py-3 px-4 text-center">স্ট্যাটাস (Enable/Disable)</th>
                            <th className="py-3 px-4 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs tabular-nums">
                          {filteredCourses.map((c) => {
                            const grad = getGradientClasses(c.gradientTheme);
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-4">
                                  <div
                                    onClick={() => {
                                      setEditingCourse(c);
                                      setIsCourseModalOpen(true);
                                    }}
                                    className={`w-28 h-16 rounded-lg overflow-hidden relative ${grad.bg} text-white p-2 flex items-end cursor-pointer group`}
                                    title="ইমেজ পরিবর্তন করতে ক্লিক করুন"
                                  >
                                    {c.imageUrl && (
                                      <img
                                        src={c.imageUrl}
                                        alt={c.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/55 transition flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                                        {c.imageUrl ? ' ইমেজ এডিট' : 'ডিফল্ট ব্যানার'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 max-w-xs">
                                  <div className="font-bold text-slate-900 line-clamp-1">
                                    {c.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                    /courses/{c.slug} · <span className="font-sans font-semibold text-blue-600">{c.categorySlug.toUpperCase()}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="font-extrabold text-emerald-600 text-sm">
                                    ৳{toBengaliNumber(c.discountPrice)}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    <span className="line-through">
                                      ৳{toBengaliNumber(c.originalPrice)}
                                    </span>{' '}
                                    ({toBengaliNumber(c.discountPercent)}% ছাড়)
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                                  {toBengaliNumber(c.clickCount || 0)}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCourseStatus(c)}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                                      c.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                                    }`}
                                  >
                                    {c.status === 'active' ? '● Active (চালু)' : '○ Disabled (বন্ধ)'}
                                  </button>
                                </td>

                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  {confirmDeleteCourseId === c.id ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCourse(c.id)}
                                        className="px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        নিশ্চিত ডিলিট
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteCourseId(null)}
                                        className="px-2 py-1 rounded border border-slate-300 text-slate-600 text-[11px] cursor-pointer"
                                      >
                                        না
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCourse(c);
                                          setIsCourseModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
                                      >
                                        Edit / Image
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteCourseId(c.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 3: CATEGORY MANAGEMENT                        */}
              {/* ================================================= */}
              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Category Form */}
                  <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 h-fit">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {editingCat ? 'ক্যাটাগরি এডিট করুন' : '+ নতুন ক্যাটাগরি যোগ করুন'}
                    </h3>
                    <form onSubmit={handleSaveCategory} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ক্যাটাগরির নাম (Section Title) *
                        </label>
                        <input
                          type="text"
                          required
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="যেমন: IELTS ও ভাষা শিক্ষা"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ক্যাটাগরি Slug (ইংরেজি ছোট হাতের) *
                        </label>
                        <input
                          type="text"
                          required
                          value={catSlug}
                          onChange={(e) => setCatSlug(e.target.value)}
                          placeholder="যেমন: ielts"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          সাবটাইটেল (Section Kicker)
                        </label>
                        <input
                          type="text"
                          value={catSubtitle}
                          onChange={(e) => setCatSubtitle(e.target.value)}
                          placeholder="যেমন: উচ্চশিক্ষা ও ক্যারিয়ার"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            কালার থিম
                          </label>
                          <select
                            value={catColor}
                            onChange={(e) => setCatColor(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                          >
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="indigo">Indigo</option>
                            <option value="rose">Rose</option>
                            <option value="emerald">Emerald</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ক্রম (Display Order)
                          </label>
                          <input
                            type="number"
                            value={catOrder}
                            onChange={(e) => setCatOrder(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          {editingCat ? 'ক্যাটাগরি আপডেট করুন' : 'ক্যাটাগরি সেভ করুন'}
                        </button>
                        {editingCat && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCat(null);
                              setCatName('');
                              setCatSlug('');
                              setCatSubtitle('');
                            }}
                            className="py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer"
                          >
                            বাতিল
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Category List */}
                  <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase">
                          <th className="py-3 px-4">ক্যাটাগরি নাম</th>
                          <th className="py-3 px-4">Slug</th>
                          <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                          <th className="py-3 px-4 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{cat.name}</div>
                              <div className="text-[11px] text-slate-400">{cat.subtitle}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">{cat.slug}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryStatus(cat)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                  cat.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {cat.status === 'active' ? 'Active' : 'Disabled'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCat(cat);
                                  setCatName(cat.name);
                                  setCatSlug(cat.slug);
                                  setCatSubtitle(cat.subtitle || '');
                                  setCatColor(cat.badgeColor);
                                  setCatOrder(cat.displayOrder);
                                }}
                                className="text-blue-600 font-bold hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              {confirmDeleteCatId === cat.id ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="text-red-600 font-bold underline cursor-pointer"
                                >
                                  Confirm?
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCatId(cat.id)}
                                  className="text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 4: AFFILIATE LINKS & CLICK ANALYTICS          */}
              {/* ================================================= */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        ইন্টারনাল অ্যাফিলিয়েট রিডাইরেক্ট সিস্টেম (/go/course-slug) ও ক্লিক রিপোর্ট
                      </h3>
                      <p className="text-xs text-slate-500">
                        যেকোনো সোশ্যাল মিডিয়া, ফেসবুক পোস্ট বা হোয়াটসঅ্যাপে আপনার ইন্টারনাল ট্র্যাকিং লিংক শেয়ার করলে ক্লিক রেকর্ড হয়ে সরাসরি 10 Minute School-এ রিডাইরেক্ট হবে।
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase">
                            <th className="py-3 px-4">কোর্সের নাম</th>
                            <th className="py-3 px-4">ইন্টারনাল রিডাইরেক্ট লিংক</th>
                            <th className="py-3 px-4">টার্গেট 10MS Affiliate URL</th>
                            <th className="py-3 px-4 text-right">মোট ক্লিক</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs tabular-nums">
                          {courses.map((c) => {
                            const goUrl = `${window.location.origin}/go/${c.slug}`;
                            return (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                                  {c.title}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-800">
                                      /go/{c.slug}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(goUrl);
                                        setCopiedSlug(c.slug);
                                        setTimeout(() => setCopiedSlug(null), 2000);
                                      }}
                                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                                    >
                                      {copiedSlug === c.slug ? 'কপি হয়েছে ✓' : 'Copy'}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-500">
                                  <a
                                    href={c.affiliateUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-blue-600 underline"
                                  >
                                    {c.affiliateUrl}
                                  </a>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                                  {toBengaliNumber(c.clickCount || 0)} clicks
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 5: SITE & HERO SETTINGS                       */}
              {/* ================================================= */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-3xl space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      ওয়েবসাইট ব্র্যান্ডিং, হোয়াটসঅ্যাপ ও হিরো সেকশন সেটিংস
                    </h3>
                    <p className="text-xs text-slate-500">
                      হোমপেজের শিরোনাম, হোয়াটসঅ্যাপ সাপোর্ট নম্বর এবং কাউন্টডাউন বার্তা পরিবর্তন করুন।
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          হোয়াটসঅ্যাপ নম্বর (ডিসপ্লে টেক্সট)
                        </label>
                        <input
                          type="text"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          হোয়াটসঅ্যাপ চ্যাট লিংক (wa.me URL)
                        </label>
                        <input
                          type="url"
                          value={whatsappLink}
                          onChange={(e) => setWhatsappLink(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        হিরো টপ ব্যাজ টেক্সট
                      </label>
                      <input
                        type="text"
                        value={heroBadge}
                        onChange={(e) => setHeroBadge(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        হিরো মূল শিরোনাম (Hero Headline)
                      </label>
                      <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        হিরো সাবটাইটেল (Hero Description)
                      </label>
                      <textarea
                        rows={2}
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          কাউন্টডাউন টাইমার লেবেল
                        </label>
                        <input
                          type="text"
                          value={countdownLabel}
                          onChange={(e) => setCountdownLabel(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ডিফল্ট অ্যাফিলিয়েট রেফারেল কোড
                        </label>
                        <input
                          type="text"
                          value={defaultAffiliateRef}
                          onChange={(e) => setDefaultAffiliateRef(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {savingSettings ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Course & Image Modal */}
      {isCourseModalOpen && (
        <CourseFormModal
          course={editingCourse}
          categories={categories}
          onClose={() => setIsCourseModalOpen(false)}
          onSave={handleSaveCourse}
        />
      )}
    </div>
  );
};
