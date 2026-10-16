import React, { useState, useRef } from 'react';
import { Category, Course } from '../../types.ts';
import {
  getGradientClasses,
  parseFeatures,
  PRESET_COURSE_IMAGES,
  toBengaliNumber,
} from '../../utils/format.ts';

interface CourseFormModalProps {
  course: Course | null; // null means creating a new course
  categories: Category[];
  onClose: () => void;
  onSave: (courseData: any, id?: number) => Promise<void>;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  course,
  categories,
  onClose,
  onSave,
}) => {
  const initialFeatures = course ? parseFeatures(course.features).join(', ') : '৮০+ লাইভ ক্লাস, পিডিএফ লেকচার শিট, মডেল টেস্ট';

  const [title, setTitle] = useState(course?.title || '');
  const [slug, setSlug] = useState(course?.slug || '');
  const [categorySlug, setCategorySlug] = useState(
    course?.categorySlug || (categories[0]?.slug ?? 'hsc')
  );
  const [shortBadge, setShortBadge] = useState(course?.shortBadge || 'লাইভ ব্যাচ চলমান');
  const [headerTitle, setHeaderTitle] = useState(course?.headerTitle || 'HSC 28');
  const [headerSubtitle, setHeaderSubtitle] = useState(course?.headerSubtitle || 'অনলাইন ব্যাচ');
  const [discountBadgeText, setDiscountBadgeText] = useState(
    course?.discountBadgeText || 'স্পেশাল ছাড়'
  );
  const [gradientTheme, setGradientTheme] = useState(course?.gradientTheme || 'red');
  const [description, setDescription] = useState(course?.description || '');
  const [fullDescription, setFullDescription] = useState(course?.fullDescription || '');
  const [imageUrl, setImageUrl] = useState(course?.imageUrl || '');
  const [originalPrice, setOriginalPrice] = useState(course?.originalPrice ?? 5000);
  const [discountPrice, setDiscountPrice] = useState(course?.discountPrice ?? 2500);
  const [rating, setRating] = useState(course?.rating || '৪.৯');
  const [studentCount, setStudentCount] = useState(course?.studentCount || '১০k+ শিক্ষার্থী');
  const [duration, setDuration] = useState(course?.duration || '৬ মাস');
  const [targetStudents, setTargetStudents] = useState(
    course?.targetStudents || 'সকল শিক্ষার্থী'
  );
  const [instructorInfo, setInstructorInfo] = useState(
    course?.instructorInfo || 'টেন মিনিট স্কুলের শীর্ষ শিক্ষক প্যানেল'
  );
  const [instructorIcon, setInstructorIcon] = useState(course?.instructorIcon || 'school');
  const [featuresText, setFeaturesText] = useState(initialFeatures);
  const [affiliateUrl, setAffiliateUrl] = useState(
    course?.affiliateUrl || 'https://10minuteschool.com/?ref=10ms_affiliate'
  );
  const [isPopular, setIsPopular] = useState(course?.isPopular ?? true);
  const [status, setStatus] = useState(course?.status || 'active');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const computedDiscountPercent =
    originalPrice > 0 && originalPrice > discountPrice
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0;

  const computedFlatSavings = Math.max(0, originalPrice - discountPrice);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!course) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 50);
      setSlug(autoSlug || `course-${Date.now()}`);
    }
  };

  // Compress and resize uploaded image on the client so it stores cleanly and loads fast
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const maxH = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          setImageUrl(dataUrl);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        setError('ইমেজ ফাইলটি লোড করা যায়নি। অনুগ্রহ করে JPG/PNG/WebP ফাইল নির্বাচন করুন।');
        setUploadingImage(false);
      };
      img.src = String(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !affiliateUrl.trim()) {
      setError('কোর্সের নাম, Slug এবং Affiliate URL অবশ্যই পূরণ করতে হবে।');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const matchedCat = categories.find((c) => c.slug === categorySlug);
      const featuresArray = featuresText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave(
        {
          title: title.trim(),
          slug: slug.trim(),
          categoryId: matchedCat ? matchedCat.id : null,
          categorySlug,
          shortBadge: shortBadge.trim(),
          headerTitle: headerTitle.trim(),
          headerSubtitle: headerSubtitle.trim(),
          discountBadgeText:
            discountBadgeText.trim() ||
            `${toBengaliNumber(computedFlatSavings)}৳ ছাড়`,
          gradientTheme,
          description: description.trim(),
          fullDescription: fullDescription.trim() || description.trim(),
          imageUrl: imageUrl.trim(),
          originalPrice: Number(originalPrice),
          discountPrice: Number(discountPrice),
          discountPercent: computedDiscountPercent,
          rating: rating.trim(),
          studentCount: studentCount.trim(),
          duration: duration.trim(),
          targetStudents: targetStudents.trim(),
          instructorInfo: instructorInfo.trim(),
          instructorIcon: instructorIcon.trim(),
          features: JSON.stringify(featuresArray),
          affiliateUrl: affiliateUrl.trim(),
          isPopular,
          status,
        },
        course?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'কোর্স সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const gradientPreview = getGradientClasses(gradientTheme);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {course ? 'কোর্স তথ্য ও ইমেজ এডিট করুন' : '+ নতুন কোর্স তৈরি করুন'}
            </h2>
            <p className="text-xs text-slate-500">
              পরিবর্তন সেভ করার সাথে সাথেই পাবলিক ওয়েবসাইটে আপডেট হয়ে যাবে।
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* SECTION 1: COURSE IMAGE MANAGEMENT */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-red-600">
                    image
                  </span>
                  কোর্স ইমেজ ম্যানেজমেন্ট (Upload / Replace / Remove / Placeholder)
                </h3>
                <p className="text-xs text-slate-500">
                  কম্পিউটার থেকে নতুন ইমেজ আপলোড করুন, প্রিসেট থাম্বনেইল বেছে নিন অথবা ডিফল্ট গ্র্যাডিয়েন্ট ব্যানার ব্যবহার করুন।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>{imageUrl ? 'নতুন ইমেজ রিপ্লেস করুন' : 'ইমেজ আপলোড করুন'}</span>
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>ইমেজ রিমুভ (ডিফল্ট ব্যানার)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Live Card Header Preview */}
              <div className="md:col-span-5">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                  লাইভ কোর্স কার্ড হেডার প্রিভিউ:
                </div>
                <div
                  className={`relative h-40 rounded-xl overflow-hidden ${gradientPreview.bg} text-white p-4 flex items-end justify-between shadow-sm`}
                >
                  {imageUrl && (
                    <>
                      <img
                        src={imageUrl}
                        alt="Course preview"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />
                    </>
                  )}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                      <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md mb-1 inline-block">
                        {shortBadge || 'লাইভ ব্যাচ'}
                      </span>
                      <div className="text-xl font-black tracking-tight">
                        {headerTitle || 'HSC 28'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`bg-white ${gradientPreview.badgeText} text-xs font-black px-2 py-0.5 rounded-md shadow-xs`}
                      >
                        {discountBadgeText || `${toBengaliNumber(computedFlatSavings)}৳ ছাড়`}
                      </span>
                      <div className="text-[10px] text-white/90 font-semibold mt-1">
                        {headerSubtitle || 'অনলাইন ব্যাচ'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image URL input & Presets */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সরাসরি ইমেজ URL অথবা আপলোডকৃত ডেটা:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... অথবা ফাঁকা রাখলে ডিফল্ট গ্র্যাডিয়েন্ট ব্যানার দেখাবে"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none bg-white"
                  />
                  {uploadingImage && (
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                      ইমেজ অপ্টিমাইজ ও আপলোড হচ্ছে...
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    অথবা এইচডি প্রিসেট কভার সিলেক্ট করুন:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_COURSE_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                          imageUrl === preset.url
                            ? 'border-blue-600 bg-blue-50/60'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-11 object-cover rounded"
                        />
                        <span className="block text-[10px] font-semibold text-slate-700 truncate mt-1">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CORE COURSE INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোর্সের পূর্ণ নাম (Course Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="যেমন: HSC 28 অনলাইন ব্যাচ — PCMB সাইকেল ১"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোর্স URL Slug (ইউনিক) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hsc-28-pcmb"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ক্যাটাগরি (Category) *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 outline-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 3: PRICING, DISCOUNT & AFFILIATE LINK */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              মূল্য, ডিসকাউন্ট ও অ্যাফিলিয়েট লিংক (Price & Affiliate Setup)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  রেগুলার প্রাইস / Original Price (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডিসকাউন্ট প্রাইস / Discount Price (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-500 text-sm font-bold text-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  স্বয়ংক্রিয় ডিসকাউন্ট হিসাব
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-extrabold text-red-600 flex items-center justify-between">
                  <span>{toBengaliNumber(computedDiscountPercent)}% সেভিংস</span>
                  <span className="text-xs text-slate-500">
                    (৳{toBengaliNumber(computedFlatSavings)} ছাড়)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                10 Minute School অফিশিয়াল অ্যাফিলিয়েট লিংক (Affiliate URL) *
              </label>
              <input
                type="url"
                required
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://10minuteschool.com/product/.../?ref=your_affiliate_id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono bg-white focus:border-blue-600 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ইউজার “কোর্সে ভর্তি হোন” চাপলে ক্লিক রেকর্ড হয়ে সরাসরি এই লিংকে চলে যাবে। ইন্টারনাল লিংক হবে: <code className="font-mono text-slate-700">/go/{slug || 'course-slug'}</code>
              </span>
            </div>
          </div>

          {/* SECTION 4: CARD HEADER & METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                হেডার টাইটেল (যেমন: HSC 28)
              </label>
              <input
                type="text"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                হেডার সাবটাইটেল (যেমন: PCMB সাইকেল ১)
              </label>
              <input
                type="text"
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                টপ ব্যাজ (যেমন: লাইভ ব্যাচ চলমান)
              </label>
              <input
                type="text"
                value={shortBadge}
                onChange={(e) => setShortBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ছাড় ব্যাজ টেক্সট (যেমন: ৮,১০০৳ ছাড়)
              </label>
              <input
                type="text"
                value={discountBadgeText}
                onChange={(e) => setDiscountBadgeText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                রেটিং (Rating)
              </label>
              <input
                type="text"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শিক্ষার্থী সংখ্যা (Student Count)
              </label>
              <input
                type="text"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোর্সের মেয়াদ (Duration)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                গ্র্যাডিয়েন্ট থিম কালার
              </label>
              <select
                value={gradientTheme}
                onChange={(e) => setGradientTheme(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="red">Red / Crimson (HSC)</option>
                <option value="slate">Dark Slate (BEI / B Unit)</option>
                <option value="rose">Deep Rose (Bundle)</option>
                <option value="emerald">Emerald Teal (Class 6)</option>
                <option value="amber">Amber Orange (Class 8 / SSC)</option>
                <option value="indigo">Deep Indigo (Spoken English)</option>
                <option value="blue">Royal Navy (Web Dev)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মেন্টর / শিক্ষক প্যানেল তথ্য
              </label>
              <input
                type="text"
                value={instructorInfo}
                onChange={(e) => setInstructorInfo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোর্স ফিচারসমূহ (কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="৮০+ লাইভ ক্লাস, হার্ডকপি বুক ফ্রি, সাপ্তাহিক এক্সাম"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সংক্ষিপ্ত বিবরণ (Card Description) *
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বিস্তারিত বিবরণ (Course Details Page Description)
              </label>
              <textarea
                rows={2}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Status & Popular Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={status === 'active'}
                  onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  পাবলিক ওয়েবসাইটে চালু (Active Course)
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  জনপ্রিয় কোর্স (Popular / Featured)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'সেভ হচ্ছে...' : 'কোর্স সেভ ও পাবলিশ করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
