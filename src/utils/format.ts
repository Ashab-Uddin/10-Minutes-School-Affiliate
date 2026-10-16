const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(value: number | string): string {
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  const formatted = !isNaN(num) ? num.toLocaleString('en-IN') : String(value);
  return formatted.replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export function parseFeatures(featuresRaw: string): string[] {
  if (!featuresRaw) return [];
  try {
    const parsed = JSON.parse(featuresRaw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated string
  }
  return featuresRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getGradientClasses(theme: string): {
  bg: string;
  badgeText: string;
} {
  switch (theme) {
    case 'slate':
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950',
        badgeText: 'text-slate-900',
      };
    case 'rose':
      return {
        bg: 'bg-gradient-to-br from-red-900 via-rose-800 to-rose-950',
        badgeText: 'text-red-800',
      };
    case 'emerald':
      return {
        bg: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800',
        badgeText: 'text-emerald-800',
      };
    case 'amber':
      return {
        bg: 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800',
        badgeText: 'text-amber-800',
      };
    case 'indigo':
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
        badgeText: 'text-indigo-950',
      };
    case 'blue':
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
        badgeText: 'text-blue-950',
      };
    case 'red':
    default:
      return {
        bg: 'bg-gradient-to-br from-red-600 via-rose-600 to-red-800',
        badgeText: 'text-red-700',
      };
  }
}

export const PRESET_COURSE_IMAGES = [
  {
    label: 'HSC Science 3D Cover',
    url: '/images/course_hsc_science_1791228377506.jpg',
  },
  {
    label: 'Spoken English & IELTS Cover',
    url: '/images/course_spoken_english_1791228393736.jpg',
  },
  {
    label: 'Web Development & Coding Cover',
    url: '/images/course_web_development_1791228405497.jpg',
  },
  {
    label: 'Varsity Admission Cover',
    url: '/images/course_varsity_admission_1791228416821.jpg',
  },
];
