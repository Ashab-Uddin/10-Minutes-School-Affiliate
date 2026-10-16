import React, { useState } from 'react';
import { Course } from '../../types.ts';
import { getGradientClasses, parseFeatures, toBengaliNumber } from '../../utils/format.ts';

interface CourseCardProps {
  course: Course;
  onSelectCourse: (slug: string) => void;
  onEnrollClick: (course: Course, referrer: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onSelectCourse,
  onEnrollClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const gradient = getGradientClasses(course.gradientTheme);
  const features = parseFeatures(course.features);
  const hasValidImage = Boolean(course.imageUrl && course.imageUrl.trim() !== '' && !imgError);

  return (
    <div className="course-card-pro h-full group">
      {/* Top Banner / Dynamic Course Image */}
      <div
        onClick={() => onSelectCourse(course.slug)}
        className={`relative cursor-pointer overflow-hidden ${
          hasValidImage ? 'h-44' : 'h-32'
        } ${gradient.bg} text-white p-4 flex items-end justify-between`}
      >
        {hasValidImage && (
          <>
            <img
              src={course.imageUrl!}
              alt={course.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />
          </>
        )}

        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <span className="text-[11px] font-semibold text-white/90 tracking-wide block mb-0.5">
              {course.shortBadge}
            </span>
            <div className="text-2xl font-black tracking-tight text-white drop-shadow-xs">
              {course.headerTitle}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`bg-white ${gradient.badgeText} text-xs font-black px-2.5 py-1 rounded-lg shadow-xs inline-block whitespace-nowrap`}
            >
              {course.discountBadgeText}
            </span>
            <div className="text-[11px] text-white/90 font-semibold mt-1">
              {course.headerSubtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Metadata Row (Zero-Pill clean typographic metadata) */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-amber-600 font-bold tabular-nums">
              <span className="material-symbols-outlined text-[15px] text-amber-500">star</span>
              {course.rating}
              <span aria-hidden="true" className="text-slate-300 mx-0.5">·</span>
              <span className="text-slate-600 font-medium">{course.studentCount}</span>
            </span>
            <span className="text-emerald-700 font-semibold text-[11px]">
              অফিশিয়াল ব্যাচ
            </span>
          </div>

          {/* Course Title */}
          <h4
            onClick={() => onSelectCourse(course.slug)}
            className="font-bold text-slate-900 text-[15px] leading-snug hover:text-red-600 transition-colors cursor-pointer line-clamp-2"
          >
            {course.title}
          </h4>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Instructor Row */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-700">
            <span className="material-symbols-outlined text-[17px] text-red-600 shrink-0">
              {course.instructorIcon || 'school'}
            </span>
            <span className="font-semibold truncate">{course.instructorInfo}</span>
          </div>

          {/* Clean Unboxed Feature List with Middot Separators */}
          {features.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 pt-0.5">
              {features.slice(0, 3).map((feat, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                  <span>{feat}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Actions Footer */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3 tabular-nums">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                কোর্স ফি (এককালীন)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-600">
                  ৳{toBengaliNumber(course.discountPrice)}
                </span>
                {course.originalPrice > course.discountPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    ৳{toBengaliNumber(course.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            {course.discountPercent > 0 && (
              <span className="text-xs font-bold text-red-600">
                {toBengaliNumber(course.discountPercent)}% সেভিংস
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => onSelectCourse(course.slug)}
              className="col-span-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition whitespace-nowrap"
            >
              বিস্তারিত
            </button>
            <button
              type="button"
              onClick={() => onEnrollClick(course, 'course_card')}
              className="col-span-3 btn-shine text-white text-center py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>কোর্সে ভর্তি হোন</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
