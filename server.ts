import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './src/middleware/auth.ts';
import {
  createNewCategory,
  createNewCourse,
  deleteCategoryById,
  deleteCourseById,
  getAdminOverviewData,
  getPublicPortalData,
  recordCourseClick,
  updateExistingCategory,
  updateExistingCourse,
  updatePortalSettings,
} from './src/db/repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

const handleMissingDb = (res: any, fallback: any, error: unknown) => {
  if (error instanceof Error && error.message.includes('Database is not configured')) {
    res.json(fallback);
    return true;
  }

  return false;
};

app.use(express.json());

app.get('/api/public/data', async (_req, res) => {
  try {
    const data = await getPublicPortalData();
    res.json(data);
  } catch (error) {
    console.error('Public data endpoint failed:', error);
    if (handleMissingDb(res, { categories: [], courses: [], settings: null }, error)) return;
    res.status(500).json({ error: 'Failed to load public portal data.' });
  }
});

app.post('/api/public/click/:slug', async (req, res) => {
  try {
    const result = await recordCourseClick(
      req.params.slug,
      req.body?.referrer,
      req.get('user-agent') || undefined
    );
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Course click endpoint failed:', error);
    if (handleMissingDb(res, { success: true }, error)) return;
    res.status(500).json({ error: 'Failed to record click.' });
  }
});

app.get('/api/admin/overview', requireAuth, async (_req, res) => {
  try {
    const data = await getAdminOverviewData();
    res.json(data);
  } catch (error) {
    console.error('Admin overview endpoint failed:', error);
    if (
      handleMissingDb(
        res,
        {
          stats: { totalCourses: 0, activeCourses: 0, inactiveCourses: 0, totalClicks: 0, totalCategories: 0 },
          categories: [],
          courses: [],
          recentClicks: [],
          settings: null,
        },
        error
      )
    )
      return;
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

app.get('/api/admin/categories', requireAuth, async (_req, res) => {
  try {
    const data = await getAdminOverviewData();
    res.json(data.categories || []);
  } catch (error) {
    console.error('Admin categories endpoint failed:', error);
    if (handleMissingDb(res, [], error)) return;
    res.status(500).json({ error: 'Failed to load categories.' });
  }
});

app.post('/api/admin/categories', requireAuth, async (req, res) => {
  try {
    const data = await createNewCategory(req.body || {});
    res.status(201).json(data);
  } catch (error) {
    console.error('Create category endpoint failed:', error);
    if (handleMissingDb(res, {}, error)) return;
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const data = await updateExistingCategory(Number(req.params.id), req.body || {});
    res.json(data);
  } catch (error) {
    console.error('Update category endpoint failed:', error);
    if (handleMissingDb(res, null, error)) return;
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const result = await deleteCategoryById(Number(req.params.id));
    res.json(result);
  } catch (error) {
    console.error('Delete category endpoint failed:', error);
    if (handleMissingDb(res, { deleted: true }, error)) return;
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

app.get('/api/admin/courses', requireAuth, async (_req, res) => {
  try {
    const data = await getAdminOverviewData();
    res.json(data.courses || []);
  } catch (error) {
    console.error('Admin courses endpoint failed:', error);
    if (handleMissingDb(res, [], error)) return;
    res.status(500).json({ error: 'Failed to load courses.' });
  }
});

app.post('/api/admin/courses', requireAuth, async (req, res) => {
  try {
    const data = await createNewCourse(req.body || {});
    res.status(201).json(data);
  } catch (error) {
    console.error('Create course endpoint failed:', error);
    if (handleMissingDb(res, {}, error)) return;
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

app.put('/api/admin/courses/:id', requireAuth, async (req, res) => {
  try {
    const data = await updateExistingCourse(Number(req.params.id), req.body || {});
    res.json(data);
  } catch (error) {
    console.error('Update course endpoint failed:', error);
    if (handleMissingDb(res, null, error)) return;
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

app.patch('/api/admin/courses/:id/status', requireAuth, async (req, res) => {
  try {
    const data = await updateExistingCourse(Number(req.params.id), {
      status: String(req.body?.status || 'active'),
    });
    res.json(data);
  } catch (error) {
    console.error('Update course status endpoint failed:', error);
    if (handleMissingDb(res, null, error)) return;
    res.status(500).json({ error: 'Failed to update course status.' });
  }
});

app.delete('/api/admin/courses/:id', requireAuth, async (req, res) => {
  try {
    const result = await deleteCourseById(Number(req.params.id));
    res.json(result);
  } catch (error) {
    console.error('Delete course endpoint failed:', error);
    if (handleMissingDb(res, { deleted: true }, error)) return;
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

app.get('/api/admin/settings', requireAuth, async (_req, res) => {
  try {
    const data = await getAdminOverviewData();
    res.json(data.settings || null);
  } catch (error) {
    console.error('Admin settings endpoint failed:', error);
    if (handleMissingDb(res, null, error)) return;
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

app.post('/api/admin/settings', requireAuth, async (req, res) => {
  try {
    const data = await updatePortalSettings(req.body || {});
    res.json(data);
  } catch (error) {
    console.error('Admin settings save endpoint failed:', error);
    if (handleMissingDb(res, null, error)) return;
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (error) {
      next(error);
    }
  });
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});