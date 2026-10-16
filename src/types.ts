export interface Category {
  id: number;
  name: string;
  slug: string;
  subtitle: string | null;
  badgeColor: string;
  displayOrder: number;
  status: string;
  createdAt?: string | null;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  categoryId: number | null;
  categorySlug: string;
  shortBadge: string;
  headerTitle: string;
  headerSubtitle: string;
  discountBadgeText: string;
  gradientTheme: string;
  description: string;
  fullDescription: string | null;
  imageUrl: string | null;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  rating: string;
  studentCount: string;
  duration: string;
  targetStudents: string | null;
  instructorInfo: string;
  instructorIcon: string;
  features: string; // JSON string array
  affiliateUrl: string;
  isPopular: boolean;
  status: string;
  clickCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ClickRecord {
  id: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  referrer: string | null;
  userAgent: string | null;
  clickedAt: string;
}

export interface SiteSettings {
  id: number;
  siteTitle: string;
  whatsappNumber: string;
  whatsappLink: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  countdownLabel: string;
  defaultAffiliateRef: string;
  updatedAt?: string | null;
}
