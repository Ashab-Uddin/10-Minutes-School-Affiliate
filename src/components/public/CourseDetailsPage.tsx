import React, { useState } from 'react';
import { Category, Course } from '../../types.ts';
import { getGradientClasses, parseFeatures, toBengaliNumber } from '../../utils/format.ts';
import { CourseCard } from './CourseCard.tsx';

interface CourseDetailsPageProps {
  course: Course;
  categories: Category[];
  relatedCourses: Course[];
  whatsappNumber: string;
  whatsappLink: string;
  onBack: () => void;
  onSelectCourse: (slug: string) => void;
  onEnrollClick: (course: Course, referrer: string) => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  course,
  categories,
  relatedCourses,
  whatsappNumber,
  whatsappLink,
  onBack,
  onSelectCourse,
  onEnrollClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const gradient = getGradientClasses(course.gradientTheme);
  const features = parseFeatures(course.features);
  const categoryObj = categories.find((c) => c.slug === course.categorySlug);
  const savingsAmount = Math.max(0, course.originalPrice - course.discountPrice);
  const hasValidImage = Boolean(course.imageUrl && course.imageUrl.trim() !== '' && !imgError);
  const internalAffiliateUrl = `${window.location.origin}/go/${course.slug}`;

  const handleCopyAffiliateLink = () => {
    navigator.clipboard.writeText(internalAffiliateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Dark Hero Breadcrumb & Summary */}
      <div className="bg-gradient-to-b from-[#0B0F19] via-[#111827] to-[#0B0F19] text-white pt-8 pb-14 border-b border-slate-800">
        <div className="wrap">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-6">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white flex items-center gap-1 font-semibold text-slate-300 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              হোমপেজে ফিরে যান
            </button>
            <span aria-hidden="true">/</span>
            <span>{categoryObj ? categoryObj.name : course.categorySlug.toUpperCase()}</span>
            <span aria-hidden="true">/</span>
            <span className="text-rose-400 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Course Info */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-rose-300 font-semibold">
                <span>{course.shortBadge}</span>
                <span aria-hidden="true">·</span>
                <span>{course.headerTitle} ({course.headerSubtitle})</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">১০০% অফিশিয়াল ডিসকাউন্টেড লিংক</span>
              </div>

              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {course.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {course.fullDescription || course.description}
              </p>

              {/* Key Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80 tabular-nums">
                <div>
                  <span className="text-xs text-slate-400 block">কোর্স রেটিং</span>
                  <div className="text-base font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">star</span>
                    {course.rating} / ৫.০
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">ভর্তিকৃত শিক্ষার্থী</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {course.studentCount}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">কোর্সের মেয়াদ</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {course.duration}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">কাদের জন্য</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate">
                    {course.targetStudents || 'সকল শিক্ষার্থী'}
                  </div>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    {course.instructorIcon || 'school'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-slate-400">কোর্স ইন্সট্রাক্টর ও মেন্টর প্যানেল</div>
                  <div className="text-sm font-bold text-white">{course.instructorInfo}</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Sticky Purchase & Affiliate Card */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
                {/* Course Visual Header */}
                <div
                  className={`relative h-52 ${gradient.bg} text-white p-6 flex flex-col justify-between overflow-hidden`}
                >
                  {hasValidImage && (
                    <>
                      <img
                        src={course.imageUrl!}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                    </>
                  )}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/15">
                      {course.shortBadge}
                    </span>
                    <span
                      className={`bg-white ${gradient.badgeText} text-xs font-black px-3 py-1 rounded-lg shadow-xs`}
                    >
                      {course.discountBadgeText}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="text-3xl font-black tracking-tight text-white">
                      {course.headerTitle}
                    </div>
                    <div className="text-xs text-white/90 font-semibold mt-0.5">
                      {course.headerSubtitle}
                    </div>
                  </div>
                </div>

                {/* Pricing & Primary CTA */}
                <div className="p-6 space-y-5">
                  <div className="flex items-baseline justify-between pb-4 border-b border-slate-100 tabular-nums">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">
                        স্পেশাল ডিসকাউন্ট ফি (এককালীন)
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-1">
                        <span className="text-3xl font-black text-emerald-600">
                          ৳{toBengaliNumber(course.discountPrice)}
                        </span>
                        {course.originalPrice > course.discountPrice && (
                          <span className="text-sm text-slate-400 line-through">
                            ৳{toBengaliNumber(course.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    {savingsAmount > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-red-600 block">
                          {toBengaliNumber(course.discountPercent)}% সেভিংস
                        </span>
                        <span className="text-[11px] text-slate-500">
                          সাশ্রয় ৳{toBengaliNumber(savingsAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnrollClick(course, 'course_details_primary')}
                    className="btn-shine w-full text-white text-center py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>কোর্সে ভর্তি হোন / Enroll Now</span>
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    “কোর্সে ভর্তি হোন” বাটনে ক্লিক করলে আপনাকে সরাসরি ১০ মিনিট স্কুলের অফিশিয়াল ওয়েবসাইটে নিয়ে যাওয়া হবে, যেখানে বিকাশ/নগদ/কার্ডের মাধ্যমে পেমেন্ট সম্পন্ন করতে পারবেন।
                  </p>

                  {/* Features Checklist */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-900">
                      এই কোর্সে যা যা থাকছে:
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700 font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">
                            check_circle
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Direct Share / Tracking Link Box */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 truncate">
                      ডিসকাউন্ট লিংক: <span className="font-mono text-slate-700">/go/{course.slug}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAffiliateLink}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer"
                    >
                      {copiedLink ? 'কপি হয়েছে ✓' : 'লিংক কপি করুন'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Content */}
      <div className="wrap py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                কোর্স সম্পর্কে বিস্তারিত তথ্য
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {course.fullDescription || course.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">টার্গেট শিক্ষার্থী</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {course.targetStudents || 'সকল শিক্ষার্থী'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">কোর্সের সময়কাল ও এক্সেস</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {course.duration}
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Step Guide */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                কীভাবে ডিসকাউন্ট মূল্যে ভর্তি হবেন?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="font-bold text-red-600">০১. লিংকে ক্লিক করুন</div>
                  <p className="text-slate-600 leading-relaxed">
                    উপরের “কোর্সে ভর্তি হোন” বাটনে ক্লিক করলে স্বয়ংক্রিয়ভাবে আমাদের অনুমোদিত ডিসকাউন্ট অ্যাপ্লাই হয়ে যাবে।
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="font-bold text-blue-600">০২. লগইন করুন</div>
                  <p className="text-slate-600 leading-relaxed">
                    ১০ মিনিট স্কুলের অফিশিয়াল ওয়েবসাইটে আপনার মোবাইল নম্বর বা ইমেইল দিয়ে লগইন করুন।
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="font-bold text-emerald-600">০৩. পেমেন্ট ও ক্লাস শুরু</div>
                  <p className="text-slate-600 leading-relaxed">
                    বিকাশ, নগদ বা কার্ডে পেমেন্ট সম্পন্ন করার সাথে সাথেই কোর্সের লাইভ ও রেকর্ডেড ক্লাসে এক্সেস পাবেন।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Sidebar */}
          <div className="space-y-6">
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                ভর্তি সংক্রান্ত যেকোনো সাহায্য প্রয়োজন?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                কোর্সটি আপনার জন্য উপযুক্ত কি না বা পেমেন্ট করতে কোনো অসুবিধা হলে আমাদের অফিশিয়াল হোয়াটসঅ্যাপ হেল্পলাইনে মেসেজ দিন।
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>হোয়াটসঅ্যাপ: {whatsappNumber}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <div className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-red-600">সমজাতীয় কোর্স</span>
                <h3 className="text-xl font-black text-slate-900">
                  এই ক্যাটাগরির অন্যান্য জনপ্রিয় কোর্সসমূহ
                </h3>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                সব কোর্স দেখুন →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedCourses.slice(0, 4).map((rel) => (
                <CourseCard
                  key={rel.id}
                  course={rel}
                  onSelectCourse={onSelectCourse}
                  onEnrollClick={onEnrollClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
