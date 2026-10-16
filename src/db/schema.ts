import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  subtitle: text('subtitle'),
  badgeColor: text('badge_color').default('red').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id').references(() => categories.id),
  categorySlug: text('category_slug').notNull(),
  shortBadge: text('short_badge').default('অফিশিয়াল ব্যাচ').notNull(),
  headerTitle: text('header_title').default('10MS').notNull(),
  headerSubtitle: text('header_subtitle').default('অনলাইন কোর্স').notNull(),
  discountBadgeText: text('discount_badge_text').default('স্পেশাল ছাড়').notNull(),
  gradientTheme: text('gradient_theme').default('red').notNull(),
  description: text('description').notNull(),
  fullDescription: text('full_description'),
  imageUrl: text('image_url'),
  originalPrice: integer('original_price').notNull(),
  discountPrice: integer('discount_price').notNull(),
  discountPercent: integer('discount_percent').notNull(),
  rating: text('rating').default('৪.৯').notNull(),
  studentCount: text('student_count').default('১০k+ শিক্ষার্থী').notNull(),
  duration: text('duration').default('৬ মাস').notNull(),
  targetStudents: text('target_students').default('সকল শিক্ষার্থী'),
  instructorInfo: text('instructor_info').default('টেন মিনিট স্কুলের শীর্ষ মেন্টর প্যানেল').notNull(),
  instructorIcon: text('instructor_icon').default('school').notNull(),
  features: text('features').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
  isPopular: boolean('is_popular').default(true).notNull(),
  status: text('status').default('active').notNull(),
  clickCount: integer('click_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const clicks = pgTable('clicks', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  courseSlug: text('course_slug').notNull(),
  courseTitle: text('course_title').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  siteTitle: text('site_title').default('১০ মিনিট স্কুল কোর্স — ৩D ক্লাস সিলেক্টর ও মডার্ন কোর্স পোর্টাল').notNull(),
  whatsappNumber: text('whatsapp_number').default('01608-949565').notNull(),
  whatsappLink: text('whatsapp_link').default('https://wa.me/8801814946474').notNull(),
  heroBadge: text('hero_badge').default('১০ মিনিট স্কুল সব কোর্সে সর্বোচ্চ লাইভ প্রাথমিক ছাড়').notNull(),
  heroTitle: text('hero_title').default('টেন মিনিট স্কুল অফিশিয়াল কোর্স পোর্টাল').notNull(),
  heroSubtitle: text('hero_subtitle').default('সরাসরি সর্বোচ্চ প্রাথমিক ছাড়ে যেকোনো একাডেমিক ও ক্যারিয়ার স্কিল প্রোগ্রামে ভর্তি হোন। কোনো প্রোমো কোডের ঝামেলা ছাড়াই ১০০% ডিসকাউন্টেড লাইভ এক্সেস।').notNull(),
  countdownLabel: text('countdown_label').default('HSC ২৮ আর্লি বার্ড স্পেশাল উপহার সহ ছাড়ে বাকি:').notNull(),
  defaultAffiliateRef: text('default_affiliate_ref').default('10ms_affiliate').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  course: one(courses, {
    fields: [clicks.courseId],
    references: [courses.id],
  }),
}));
