import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { z } from 'zod';
import {
  buildReportDocxBuffer,
  buildReportPdfBuffer,
} from './reportExport.mjs';
import { buildStudentMovementDigest } from './studentMovement.mjs';
import {
  createBlankReport,
  decorateReport,
  getDataFilePath,
  loadDatabase,
  saveDatabase,
  scoreReport,
  sanitizeUserForClient,
  verifyUserPassword,
} from './db.mjs';

const app = express();
const port = Number(process.env.PORT ?? 4173);
const authSecret = process.env.AUTH_SECRET ?? 'monthly-report-system-auth-secret';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const roles = ['teacher', 'admin', 'manager'];
const statuses = ['draft', 'submitted', 'reviewed', 'needs_revision'];

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function signToken(payload) {
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', authSecret).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token ?? '').split('.');
  if (!body || !signature) {
    return null;
  }

  const expected = crypto.createHmac('sha256', authSecret).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (expected !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

async function readAuthUser(req) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return null;
  }

  const db = await loadDatabase();
  const user = db.users.find((item) => item.id === payload.userId) ?? null;
  return user ? sanitizeUserForClient(user) : null;
}

async function requireAuth(req, res) {
  const user = await readAuthUser(req);
  if (!user) {
    res.status(401).json({ message: '需要重新登入' });
    return null;
  }

  return user;
}

const classAssignmentSchema = z.object({
  id: z.string().min(1),
  className: z.string(),
  level: z.string(),
  courseType: z.enum(['regular', 'junior_high', 'gept_basic', 'gept_intermediate', 'toeic']),
  studentCount: z.number().nonnegative(),
});

const attendanceRecordSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['sick', 'personal', 'annual', 'late']),
  date: z.string(),
  days: z.number().nonnegative(),
  hours: z.number().nonnegative(),
  note: z.string(),
});

const teacherWorkRecordSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'substitute_for_other',
    'covered_by_other',
    'student_makeup',
    'activity_hosted',
    'training_attended',
  ]),
  date: z.string(),
  className: z.string(),
  level: z.string(),
  hours: z.number().nonnegative(),
  note: z.string(),
});

const reviewHistoryEntrySchema = z.object({
  id: z.string().min(1),
  status: z.enum(['reviewed', 'needs_revision']),
  reviewerId: z.string().min(1),
  reviewerName: z.string().min(1),
  reviewerNote: z.string(),
  reviewedAt: z.string(),
});

const teacherReportSchema = z.object({
  id: z.string().optional().default(''),
  userId: z.string().min(1),
  role: z.literal('teacher'),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  branch: z.string(),
  status: z.enum(['draft', 'submitted', 'reviewed', 'needs_revision']),
  reviewerNote: z.string().optional().default(''),
  reviewHistory: z.array(reviewHistoryEntrySchema).optional().default([]),
  data: z.object({
    classAssignments: z.array(classAssignmentSchema),
    attendanceRecords: z.array(attendanceRecordSchema),
    teachingRecords: z.array(teacherWorkRecordSchema),
    performanceMetrics: z.object({
      trialStudents: z.number().nonnegative(),
      convertedStudents: z.number().nonnegative(),
      gradeTestStudents: z.number().nonnegative(),
      homeworkErrorRate: z.number().nonnegative(),
      phoneSupportSuccessRate: z.number().nonnegative(),
      inquiryStudentCount: z.number().nonnegative(),
      unavoidableLosses: z.number().nonnegative(),
      unavoidableLossNotes: z.string(),
      avoidableLosses: z.number().nonnegative(),
      avoidableLossNotes: z.string(),
    }),
    complaints: z.string(),
    complaintHandling: z.string(),
    reflection: z.object({
      wins: z.string(),
      fixes: z.string(),
      upwardFeedback: z.string(),
      teamPraise: z.string(),
      nextMonthGoal: z.string(),
      selfEvaluation: z.number().min(0).max(10),
      selfEvaluationReason: z.string(),
    }),
  }),
});

const adminReportSchema = z.object({
  id: z.string().optional().default(''),
  userId: z.string().min(1),
  role: z.literal('admin'),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  branch: z.string(),
  status: z.enum(['draft', 'submitted', 'reviewed', 'needs_revision']),
  reviewerNote: z.string().optional().default(''),
  reviewHistory: z.array(reviewHistoryEntrySchema).optional().default([]),
  data: z.object({
    attendanceRecords: z.array(attendanceRecordSchema),
    performanceMetrics: z.object({
      newEnrollments: z.number().nonnegative(),
      inquiryCount: z.number().nonnegative(),
      callCount: z.number().nonnegative(),
      conversionRate: z.number().nonnegative(),
      posterCompleted: z.boolean(),
      campusFamiliarityRate: z.number().nonnegative(),
      formChecklist: z.object({
        overdueNotice: z.boolean(),
        weeklyHeadcount: z.boolean(),
        monthEndHeadcount: z.boolean(),
        tuitionBag: z.boolean(),
      }),
    }),
    reflection: z.object({
      wins: z.string(),
      fixes: z.string(),
      upwardFeedback: z.string(),
      teamPraise: z.string(),
      nextMonthGoal: z.string(),
      selfEvaluation: z.number().min(0).max(10),
      selfEvaluationReason: z.string(),
      execution: z.number().min(0).max(10),
      executionReason: z.string(),
    }),
  }),
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (!validValues.length) {
    return 0;
  }

  return Number((validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1));
}

function buildDashboard(month, reports, users) {
  const activeUsers = users.filter((user) => user.role !== 'manager');
  const monthReports = reports.filter((report) => report.month === month);
  const submittedCount = monthReports.filter((report) => report.status !== 'draft').length;
  const reviewedCount = monthReports.filter((report) => report.status === 'reviewed').length;
  const pendingReports = monthReports.filter((report) => report.status === 'draft' || report.status === 'needs_revision');
  const averageScore = average(monthReports.map((report) => report.scores.overall));

  const roleCards = ['teacher', 'admin'].map((role) => {
    const roleUsers = activeUsers.filter((user) => user.role === role);
    const roleReports = monthReports.filter((report) => report.role === role);
    return {
      role,
      label: role === 'teacher' ? '英語老師' : '行政老師',
      totalUsers: roleUsers.length,
      submittedCount: roleReports.filter((report) => report.status !== 'draft').length,
      averageScore: average(roleReports.map((report) => report.scores.overall)),
    };
  });

  const followUps = monthReports
    .filter((report) => report.status === 'draft' || report.status === 'needs_revision' || report.status === 'submitted')
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: users.find((user) => user.id === report.userId)?.name ?? '',
      role: report.role,
      status: report.status,
      score: report.scores.overall,
      reason: report.status === 'draft'
        ? '尚未送出正式月報，請盡快完成'
        : report.status === 'submitted'
          ? '等待主管審核'
          : report.status === 'needs_revision'
            ? '主管已退回修正，請補上缺漏後重新送出'
            : '本月整體分數偏低，建議優先追蹤',
    }))
    .sort((left, right) => {
      const statusOrder = { draft: 0, needs_revision: 1, submitted: 2, reviewed: 3 };
      return statusOrder[left.status] - statusOrder[right.status] || left.score - right.score;
    })
    .slice(0, 6);

  const unsentList = monthReports
    .filter((report) => report.status === 'draft' || report.status === 'needs_revision')
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: users.find((user) => user.id === report.userId)?.name ?? '',
      role: report.role,
      status: report.status,
      score: report.scores.overall,
      reason: report.status === 'draft'
        ? '尚未送出月報，提醒補齊後送審'
        : '主管已退回修正，請完成修正後重新送出',
    }))
    .sort((left, right) => {
      const statusOrder = { draft: 0, needs_revision: 1, submitted: 2, reviewed: 3 };
      return statusOrder[left.status] - statusOrder[right.status] || left.score - right.score;
    });

  const leaderboard = monthReports
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: users.find((user) => user.id === report.userId)?.name ?? '',
      role: report.role,
      status: report.status,
      score: report.scores.overall,
    }))
    .sort((left, right) => right.score - left.score);

  return {
    month,
    metrics: {
      totalUsers: activeUsers.length,
      reportCount: monthReports.length,
      submittedCount,
      pendingCount: pendingReports.length,
      reviewedCount,
      averageScore,
      completionRate: activeUsers.length ? Math.round((submittedCount / activeUsers.length) * 100) : 0,
    },
    roleCards,
    unsentList,
    followUps,
    leaderboard,
  };
}

function validatePayload(body) {
  if (body?.role === 'teacher') {
    return teacherReportSchema.safeParse(body);
  }

  if (body?.role === 'admin') {
    return adminReportSchema.safeParse(body);
  }

  return {
    success: false,
    error: {
      issues: [{ message: '角色資料不正確。' }],
    },
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dataFile: getDataFilePath(),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const account = typeof req.body?.account === 'string' ? req.body.account.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const db = await loadDatabase();
  const user = db.users.find((item) => item.account.toLowerCase() === account);

  if (!user || !verifyUserPassword(user, password)) {
    return res.status(401).json({ message: '帳號或密碼錯誤' });
  }

  const token = signToken({ userId: user.id, role: user.role, account: user.account, issuedAt: Date.now() });
  return res.json({ token, user: sanitizeUserForClient(user) });
});

app.get('/api/auth/me', async (req, res) => {
  const user = await readAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: '請先登入' });
  }

  return res.json(user);
});

app.get('/api/bootstrap', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  const db = await loadDatabase();

  res.json({
    metadata: db.metadata,
    activeMonth: month,
    users: db.users.map((user) => sanitizeUserForClient(user)),
    roles,
    statuses,
    dashboard: buildDashboard(month, db.reports, db.users),
    studentMovementDigest: buildStudentMovementDigest(),
    recentReports: db.reports
      .filter((report) => report.month === month)
      .map((report) => decorateReport(report, db.users))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  });
});

app.get('/api/reports', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const db = await loadDatabase();
  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  const role = typeof req.query.role === 'string' ? req.query.role : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  const reports = db.reports
    .filter((report) => report.month === month)
    .filter((report) => (currentUser.role === 'manager' ? true : report.userId === currentUser.id))
    .filter((report) => (role ? report.role === role : true))
    .filter((report) => (status ? report.status === status : true))
    .map((report) => decorateReport(report, db.users))
    .filter((report) => {
      if (!search) {
        return true;
      }

      return [report.userName, report.role, report.status].some((value) => String(value).toLowerCase().includes(search));
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  res.json(reports);
});

app.get('/api/reports/current', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const db = await loadDatabase();
  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : '';
  const userId = currentUser.role === 'manager' ? requestedUserId : currentUser.id;
  const user = db.users.find((item) => item.id === userId);

  if (!user || user.role === 'manager') {
    return res.status(404).json({ message: '該使用者沒有月報資料' });
  }

  const existing = db.reports.find((report) => report.userId === userId && report.month === month);
  if (existing) {
    return res.json(decorateReport(existing, db.users));
  }

  return res.json(decorateReport(createBlankReport(user, month), db.users));
});

app.get('/api/reports/:id', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const db = await loadDatabase();
  const report = db.reports.find((item) => item.id === req.params.id);

  if (!report) {
    return res.status(404).json({ message: '找不到月報' });
  }

  if (currentUser.role !== 'manager' && report.userId !== currentUser.id) {
    return res.status(403).json({ message: '沒有權限查看這份月報' });
  }

  return res.json(decorateReport(report, db.users));
});

app.get('/api/reports/:id/export', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const db = await loadDatabase();
  const report = db.reports.find((item) => item.id === req.params.id);
  if (!report) {
    return res.status(404).json({ message: '找不到月報' });
  }

  if (currentUser.role !== 'manager' && report.userId !== currentUser.id) {
    return res.status(403).json({ message: '沒有權限匯出這份月報' });
  }

  const formatted = decorateReport(report, db.users);
  const format = typeof req.query.format === 'string' ? req.query.format : 'pdf';
  const baseName = safeFilenamePart(`monthly-report-${formatted.month}-${formatted.userId}-${format}`);

  if (format === 'docx') {
    const buffer = await buildReportDocxBuffer(formatted);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.docx"`);
    return res.send(buffer);
  }

  const buffer = await buildReportPdfBuffer(formatted);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
  return res.send(buffer);
});

app.post('/api/reports', async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) {
    return;
  }

  const parsed = validatePayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: '月報內容格式不正確',
      issues: parsed.error.issues,
    });
  }

  const db = await loadDatabase();
  const payload = parsed.data;
  const now = new Date().toISOString();

  if (currentUser.role !== 'manager' && payload.userId !== currentUser.id) {
    return res.status(403).json({ message: '沒有權限儲存這份月報' });
  }

  const existingIndex = db.reports.findIndex((report) => report.userId === payload.userId && report.month === payload.month);
  const nextReport = scoreReport({
    ...payload,
    id: payload.id || `r-${payload.month}-${payload.userId}`,
    updatedAt: now,
    submittedAt: payload.status === 'draft'
      ? existingIndex >= 0
        ? db.reports[existingIndex].submittedAt
        : null
      : existingIndex >= 0 && db.reports[existingIndex].submittedAt
        ? db.reports[existingIndex].submittedAt
        : now,
  });

  if (existingIndex >= 0) {
    db.reports[existingIndex] = nextReport;
  } else {
    db.reports.push(nextReport);
  }

  await saveDatabase(db);
  return res.json(decorateReport(nextReport, db.users));
});

app.get('/api/reports/current', (req, res) => {
  const db = loadDatabase();
  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
  const user = db.users.find((item) => item.id === userId);

  if (!user || user.role === 'manager') {
    return res.status(404).json({ message: '找不到可填報的使用者。' });
  }

  const existing = db.reports.find((report) => report.userId === userId && report.month === month);
  if (existing) {
    return res.json(decorateReport(existing, db.users));
  }

  return res.json(decorateReport(createBlankReport(user, month), db.users));
});

app.get('/api/reports/:id', (req, res) => {
  const db = loadDatabase();
  const report = db.reports.find((item) => item.id === req.params.id);

  if (!report) {
    return res.status(404).json({ message: '找不到這筆月報。' });
  }

  return res.json(decorateReport(report, db.users));
});

function safeFilenamePart(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-+|-+$/g, '');
}

app.get('/api/reports/:id/export', async (req, res) => {
  const db = loadDatabase();
  const report = db.reports.find((item) => item.id === req.params.id);
  if (!report) {
    return res.status(404).json({ message: '找不到這筆月報。' });
  }

  const formatted = decorateReport(report, db.users);
  const format = typeof req.query.format === 'string' ? req.query.format : 'pdf';
  const baseName = safeFilenamePart(`monthly-report-${formatted.month}-${formatted.userId}-${format}`);

  if (format === 'docx') {
    const buffer = await buildReportDocxBuffer(formatted);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.docx"`);
    return res.send(buffer);
  }

  const buffer = await buildReportPdfBuffer(formatted);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
  return res.send(buffer);
});

app.post('/api/reports', (req, res) => {
  const parsed = validatePayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: '月報資料格式不正確。',
      issues: parsed.error.issues,
    });
  }

  const db = loadDatabase();
  const payload = parsed.data;
  const now = new Date().toISOString();
  const existingIndex = db.reports.findIndex((report) => report.userId === payload.userId && report.month === payload.month);

  const nextReport = scoreReport({
    ...payload,
    id: payload.id || `r-${payload.month}-${payload.userId}`,
    updatedAt: now,
    submittedAt: payload.status === 'draft'
      ? existingIndex >= 0
        ? db.reports[existingIndex].submittedAt
        : null
      : existingIndex >= 0 && db.reports[existingIndex].submittedAt
        ? db.reports[existingIndex].submittedAt
        : now,
  });

  if (existingIndex >= 0) {
    db.reports[existingIndex] = nextReport;
  } else {
    db.reports.push(nextReport);
  }

  saveDatabase(db);
  return res.json(decorateReport(nextReport, db.users));
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Monthly report server running at http://localhost:${port}`);
});
