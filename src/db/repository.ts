import { asc, desc, eq } from 'drizzle-orm';
import { assertDb } from './index.ts';
import { categories, clicks, courses, siteSettings } from './schema.ts';

export async function getPublicPortalData() {
  const database = assertDb();

  try {
    const [allCategories, allCourses, settingsRows] = await Promise.all([
      database.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.id)),
      database.select().from(courses).orderBy(desc(courses.isPopular), asc(courses.id)),
      database.select().from(siteSettings).limit(1),
    ]);

    const activeCategories = allCategories.filter((c) => c.status === 'active');
    const activeCourses = allCourses.filter((c) => c.status === 'active');

    return {
      categories: activeCategories,
      courses: activeCourses,
      settings: settingsRows[0] || null,
    };
  } catch (error) {
    console.error('Database query failed in getPublicPortalData:', error);
    throw new Error('Failed to load public course data.', { cause: error });
  }
}

export async function getCourseBySlug(slug: string) {
  const database = assertDb();

  try {
    const rows = await database.select().from(courses).where(eq(courses.slug, slug)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getCourseBySlug:', error);
    throw new Error('Failed to load course details.', { cause: error });
  }
}

export async function recordCourseClick(slug: string, referrer?: string, userAgent?: string) {
  const database = assertDb();

  try {
    const courseRows = await database.select().from(courses).where(eq(courses.slug, slug)).limit(1);
    const course = courseRows[0];
    if (!course) {
      return null;
    }

    const updatedClickCount = (course.clickCount || 0) + 1;

    await Promise.all([
      database
        .update(courses)
        .set({ clickCount: updatedClickCount, updatedAt: new Date() })
        .where(eq(courses.id, course.id)),
      database.insert(clicks).values({
        courseId: course.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        referrer: referrer || 'direct',
        userAgent: userAgent || 'unknown',
      }),
    ]);

    return {
      affiliateUrl: course.affiliateUrl,
      courseTitle: course.title,
      clickCount: updatedClickCount,
    };
  } catch (error) {
    console.error('Database query failed in recordCourseClick:', error);
    throw new Error('Failed to record affiliate click.', { cause: error });
  }
}

export async function getAdminOverviewData() {
  const database = assertDb();

  try {
    const [allCategories, allCourses, recentClicks, settingsRows] = await Promise.all([
      database.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.id)),
      database.select().from(courses).orderBy(desc(courses.clickCount), asc(courses.id)),
      database.select().from(clicks).orderBy(desc(clicks.clickedAt)).limit(50),
      database.select().from(siteSettings).limit(1),
    ]);

    const totalCourses = allCourses.length;
    const activeCourses = allCourses.filter((c) => c.status === 'active').length;
    const inactiveCourses = totalCourses - activeCourses;
    const totalClicks = allCourses.reduce((sum, c) => sum + (c.clickCount || 0), 0);

    return {
      stats: {
        totalCourses,
        activeCourses,
        inactiveCourses,
        totalClicks,
        totalCategories: allCategories.length,
      },
      categories: allCategories,
      courses: allCourses,
      recentClicks,
      settings: settingsRows[0] || null,
    };
  } catch (error) {
    console.error('Database query failed in getAdminOverviewData:', error);
    throw new Error('Failed to load admin overview data.', { cause: error });
  }
}

export async function createNewCourse(input: {
  title: string;
  slug: string;
  categoryId?: number | null;
  categorySlug: string;
  shortBadge?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  discountBadgeText?: string;
  gradientTheme?: string;
  description: string;
  fullDescription?: string;
  imageUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  rating?: string;
  studentCount?: string;
  duration?: string;
  targetStudents?: string;
  instructorInfo?: string;
  instructorIcon?: string;
  features: string;
  affiliateUrl: string;
  isPopular?: boolean;
  status?: string;
}) {
  const database = assertDb();

  try {
    const inserted = await database
      .insert(courses)
      .values({
        title: input.title,
        slug: input.slug,
        categoryId: input.categoryId ?? null,
        categorySlug: input.categorySlug,
        shortBadge: input.shortBadge || 'অফিশিয়াল ব্যাচ',
        headerTitle: input.headerTitle || '10MS',
        headerSubtitle: input.headerSubtitle || 'অনলাইন কোর্স',
        discountBadgeText: input.discountBadgeText || 'স্পেশাল ছাড়',
        gradientTheme: input.gradientTheme || 'red',
        description: input.description,
        fullDescription: input.fullDescription || input.description,
        imageUrl: input.imageUrl || '',
        originalPrice: Number(input.originalPrice),
        discountPrice: Number(input.discountPrice),
        discountPercent: Number(input.discountPercent),
        rating: input.rating || '৪.৯',
        studentCount: input.studentCount || '১০k+ শিক্ষার্থী',
        duration: input.duration || '৬ মাস',
        targetStudents: input.targetStudents || 'সকল শিক্ষার্থী',
        instructorInfo: input.instructorInfo || 'টেন মিনিট স্কুলের শীর্ষ মেন্টর প্যানেল',
        instructorIcon: input.instructorIcon || 'school',
        features: input.features,
        affiliateUrl: input.affiliateUrl,
        isPopular: input.isPopular ?? true,
        status: input.status || 'active',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed in createNewCourse:', error);
    throw new Error('Failed to create course. Ensure the course slug is unique.', { cause: error });
  }
}

export async function updateExistingCourse(
  id: number,
  input: Partial<{
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
    fullDescription: string;
    imageUrl: string;
    originalPrice: number;
    discountPrice: number;
    discountPercent: number;
    rating: string;
    studentCount: string;
    duration: string;
    targetStudents: string;
    instructorInfo: string;
    instructorIcon: string;
    features: string;
    affiliateUrl: string;
    isPopular: boolean;
    status: string;
  }>
) {
  const database = assertDb();

  try {
    const updated = await database
      .update(courses)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Database update failed in updateExistingCourse:', error);
    throw new Error('Failed to update course.', { cause: error });
  }
}

export async function deleteCourseById(id: number) {
  const database = assertDb();

  try {
    await database.delete(courses).where(eq(courses.id, id));
    return { deleted: true };
  } catch (error) {
    console.error('Database delete failed in deleteCourseById:', error);
    throw new Error('Failed to delete course.', { cause: error });
  }
}

export async function createNewCategory(input: {
  name: string;
  slug: string;
  subtitle?: string;
  badgeColor?: string;
  displayOrder?: number;
  status?: string;
}) {
  const database = assertDb();

  try {
    const inserted = await database
      .insert(categories)
      .values({
        name: input.name,
        slug: input.slug,
        subtitle: input.subtitle || 'একাডেমিক ও স্কিল প্রোগ্রাম',
        badgeColor: input.badgeColor || 'red',
        displayOrder: Number(input.displayOrder ?? 10),
        status: input.status || 'active',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed in createNewCategory:', error);
    throw new Error('Failed to create category. Ensure the category slug is unique.', { cause: error });
  }
}

export async function updateExistingCategory(
  id: number,
  input: Partial<{
    name: string;
    slug: string;
    subtitle: string;
    badgeColor: string;
    displayOrder: number;
    status: string;
  }>
) {
  const database = assertDb();

  try {
    const updated = await database
      .update(categories)
      .set(input)
      .where(eq(categories.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Database update failed in updateExistingCategory:', error);
    throw new Error('Failed to update category.', { cause: error });
  }
}

export async function deleteCategoryById(id: number) {
  const database = assertDb();

  try {
    await database.delete(categories).where(eq(categories.id, id));
    return { deleted: true };
  } catch (error) {
    console.error('Database delete failed in deleteCategoryById:', error);
    throw new Error('Failed to delete category.', { cause: error });
  }
}

export async function updatePortalSettings(
  input: Partial<{
    siteTitle: string;
    whatsappNumber: string;
    whatsappLink: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    countdownLabel: string;
    defaultAffiliateRef: string;
  }>
) {
  const database = assertDb();

  try {
    const existing = await database.select().from(siteSettings).limit(1);
    if (existing.length === 0) {
      const created = await database
        .insert(siteSettings)
        .values({
          siteTitle: input.siteTitle || '১০ মিনিট স্কুল কোর্স পোর্টাল',
          whatsappNumber: input.whatsappNumber || '01608-949565',
          whatsappLink: input.whatsappLink || 'https://wa.me/8801814946474',
          heroBadge: input.heroBadge || '১০ মিনিট স্কুল সব কোর্সে সর্বোচ্চ লাইভ প্রাথমিক ছাড়',
          heroTitle: input.heroTitle || 'টেন মিনিট স্কুল অফিশিয়াল কোর্স পোর্টাল',
          heroSubtitle: input.heroSubtitle || '',
          countdownLabel: input.countdownLabel || 'স্পেশাল ছাড়ে বাকি:',
          defaultAffiliateRef: input.defaultAffiliateRef || '10ms_affiliate',
        })
        .returning();
      return created[0];
    }

    const updated = await database
      .update(siteSettings)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, existing[0].id))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Database update failed in updatePortalSettings:', error);
    throw new Error('Failed to update site settings.', { cause: error });
  }
}
