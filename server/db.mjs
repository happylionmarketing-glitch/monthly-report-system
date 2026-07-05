import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const dataDir = path.join(process.cwd(), 'server', 'data');
const dataFile = path.join(dataDir, 'db.json');

const courseTypes = ['regular', 'junior_high', 'gept_basic', 'gept_intermediate', 'toeic'];
const attendanceCategories = ['sick', 'personal', 'annual', 'late'];
const teacherWorkCategories = [
  'substitute_for_other',
  'covered_by_other',
  'student_makeup',
  'activity_hosted',
  'training_attended',
];

const AUTH_SALT = 'monthly-report-system';
const CLOUD_STATE_TABLE = 'monthly_report_state';
const CLOUD_STATE_ID = 'default';

function createPasswordHash(password) {
  const salt = crypto.createHash('sha256').update(AUTH_SALT).digest('hex').slice(0, 32);
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }

  const [salt, hash] = storedHash.split(':');
  const nextHash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(nextHash, 'hex'));
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function createReviewHistoryEntry(partial = {}) {
  return {
    id: typeof partial.id === 'string' && partial.id ? partial.id : createId('rh'),
    status: partial.status === 'reviewed' || partial.status === 'needs_revision' ? partial.status : 'reviewed',
    reviewerId: typeof partial.reviewerId === 'string' ? partial.reviewerId : '',
    reviewerName: typeof partial.reviewerName === 'string' ? partial.reviewerName : '',
    reviewerNote: typeof partial.reviewerNote === 'string' ? partial.reviewerNote : '',
    reviewedAt: typeof partial.reviewedAt === 'string' ? partial.reviewedAt : new Date().toISOString(),
  };
}

const seedData = {
  metadata: {
    branchName: '樂獅英語新竹二重分校',
    systemName: '月報填報系統',
  },
  users: [
    {
      id: 'u-manager-jack',
      account: 'jack',
      passwordHash: createPasswordHash('jack1234'),
      name: 'Tr.Jack',
      role: 'manager',
      branch: '新竹二重分校',
      startDate: '2021-09-01',
      title: '主任',
    },
    {
      id: 'u-teacher-claire',
      account: 'claire',
      passwordHash: createPasswordHash('claire1234'),
      name: 'Claire',
      role: 'teacher',
      branch: '新竹二重分校',
      startDate: '2024-08-01',
      title: '英語老師',
      defaultClassAssignments: [
        { id: 'class-claire-1', className: 'L8A', level: 'L8', courseType: 'regular', studentCount: 15 },
        { id: 'class-claire-2', className: 'GEPT初級', level: 'GEPT 初級', courseType: 'gept_basic', studentCount: 10 },
      ],
    },
    {
      id: 'u-teacher-ruby',
      account: 'ruby',
      passwordHash: createPasswordHash('ruby1234'),
      name: 'Ruby',
      role: 'teacher',
      branch: '新竹二重分校',
      startDate: '2023-11-15',
      title: '英語老師',
      defaultClassAssignments: [
        { id: 'class-ruby-1', className: 'L10C', level: 'L10', courseType: 'regular', studentCount: 14 },
        { id: 'class-ruby-2', className: 'AE18', level: 'AE18', courseType: 'regular', studentCount: 11 },
      ],
    },
    {
      id: 'u-admin-crystal',
      account: 'crystal',
      passwordHash: createPasswordHash('crystal1234'),
      name: 'Crystal',
      role: 'admin',
      branch: '新竹二重分校',
      startDate: '2024-03-10',
      title: '行政老師',
    },
    {
      id: 'u-admin-sally',
      account: 'sally',
      passwordHash: createPasswordHash('sally1234'),
      name: 'Sally',
      role: 'admin',
      branch: '新竹二重分校',
      startDate: '2022-06-01',
      title: '行政老師',
    },
  ],
  reports: [
    {
      id: 'r-2026-05-u-teacher-claire',
      userId: 'u-teacher-claire',
      role: 'teacher',
      month: '2026-05',
      branch: '新竹二重分校',
      status: 'reviewed',
      updatedAt: '2026-05-31T18:20:00.000Z',
      submittedAt: '2026-05-31T18:00:00.000Z',
      reviewerNote: '帶班穩定，請下月補強招生轉換率。',
      reviewHistory: [
        {
          id: 'rh-202605-claire-1',
          status: 'reviewed',
          reviewerId: 'u-manager-jack',
          reviewerName: 'Tr.Jack',
          reviewerNote: '帶班穩定，請下月補強招生轉換率。',
          reviewedAt: '2026-05-31T18:20:00.000Z',
        },
      ],
      scores: {
        performance: 0,
        selfEvaluation: 0,
        execution: null,
        overall: 0,
      },
      data: {
        classAssignments: [
          { id: 'tc-202605-claire-1', className: 'L8A', level: 'L8', courseType: 'regular', studentCount: 15 },
          { id: 'tc-202605-claire-2', className: 'GEPT初級', level: 'GEPT 初級', courseType: 'gept_basic', studentCount: 10 },
        ],
        attendanceRecords: [
          { id: 'ta-202605-claire-1', category: 'personal', date: '2026-05-20', days: 1, hours: 0, note: '家庭事務' },
        ],
        teachingRecords: [
          { id: 'tw-202605-claire-1', category: 'student_makeup', date: '2026-05-09', className: 'L8A', level: 'L8', hours: 2, note: '學生補課' },
          { id: 'tw-202605-claire-2', category: 'activity_hosted', date: '2026-05-11', className: '', level: '', hours: 3, note: '母親節活動' },
          { id: 'tw-202605-claire-3', category: 'training_attended', date: '2026-05-24', className: '', level: '', hours: 2, note: '教師培訓' },
        ],
        performanceMetrics: {
          trialStudents: 5,
          convertedStudents: 3,
          gradeTestStudents: 4,
          homeworkErrorRate: 2,
          phoneSupportSuccessRate: 87,
          inquiryStudentCount: 3,
          unavoidableLosses: 1,
          unavoidableLossNotes: '搬家 1 人',
          avoidableLosses: 0,
          avoidableLossNotes: '',
        },
        complaints: '',
        complaintHandling: '',
        reflection: {
          wins: '班級秩序與家長溝通都有穩定提升。',
          fixes: '試讀後追蹤話術還可以更精準。',
          upwardFeedback: '希望有更完整的英檢班轉換話術。',
          teamPraise: '感謝 Crystal 協助家長櫃詢轉單。',
          nextMonthGoal: '試讀轉換至少 4 位，訓練時數維持 4 小時以上。',
          selfEvaluation: 8.8,
          selfEvaluationReason: '整體教學節奏穩定，但招生追蹤還能更積極。',
        },
      },
    },
    {
      id: 'r-2026-05-u-admin-crystal',
      userId: 'u-admin-crystal',
      role: 'admin',
      month: '2026-05',
      branch: '新竹二重分校',
      status: 'submitted',
      updatedAt: '2026-05-30T17:40:00.000Z',
      submittedAt: '2026-05-30T17:40:00.000Z',
      reviewerNote: '',
      reviewHistory: [],
      scores: {
        performance: 0,
        selfEvaluation: 0,
        execution: 0,
        overall: 0,
      },
      data: {
        attendanceRecords: [
          { id: 'aa-202605-crystal-1', category: 'late', date: '2026-05-06', days: 0, hours: 0.2, note: '早會遲到' },
        ],
        performanceMetrics: {
          newEnrollments: 6,
          inquiryCount: 7,
          callCount: 18,
          conversionRate: 71,
          posterCompleted: true,
          campusFamiliarityRate: 85,
          formChecklist: {
            overdueNotice: true,
            weeklyHeadcount: true,
            monthEndHeadcount: true,
            tuitionBag: true,
          },
        },
        reflection: {
          wins: '月底統計與學費袋製作都在時程內完成。',
          fixes: 'Call 班回覆紀錄格式需要再一致。',
          upwardFeedback: '希望後續可整合櫃詢追蹤清單。',
          teamPraise: '感謝 Sally 支援週六櫃台值班。',
          nextMonthGoal: '櫃詢成功率提升到 75%，Call 班至少 20 通。',
          selfEvaluation: 8.4,
          selfEvaluationReason: '櫃台與表單工作都有完成，但話術細節還能再優化。',
          execution: 8.6,
          executionReason: '交件與例行事項大多準時完成。',
        },
      },
    },
    {
      id: 'r-2026-06-u-teacher-ruby',
      userId: 'u-teacher-ruby',
      role: 'teacher',
      month: '2026-06',
      branch: '新竹二重分校',
      status: 'draft',
      updatedAt: '2026-06-10T11:30:00.000Z',
      submittedAt: null,
      reviewerNote: '',
      reviewHistory: [],
      scores: {
        performance: 0,
        selfEvaluation: 0,
        execution: null,
        overall: 0,
      },
      data: {
        classAssignments: [
          { id: 'tc-202606-ruby-1', className: 'L10C', level: 'L10', courseType: 'regular', studentCount: 14 },
          { id: 'tc-202606-ruby-2', className: 'AE18', level: 'AE18', courseType: 'regular', studentCount: 11 },
        ],
        attendanceRecords: [],
        teachingRecords: [
          { id: 'tw-202606-ruby-1', category: 'student_makeup', date: '2026-06-08', className: 'L10C', level: 'L10', hours: 1, note: '學生補課' },
          { id: 'tw-202606-ruby-2', category: 'substitute_for_other', date: '2026-06-05', className: 'AE18', level: 'AE18', hours: 1.5, note: '協助代課' },
        ],
        performanceMetrics: {
          trialStudents: 2,
          convertedStudents: 1,
          gradeTestStudents: 2,
          homeworkErrorRate: 3,
          phoneSupportSuccessRate: 78,
          inquiryStudentCount: 1,
          unavoidableLosses: 0,
          unavoidableLossNotes: '',
          avoidableLosses: 1,
          avoidableLossNotes: '追蹤不夠即時',
        },
        complaints: '',
        complaintHandling: '',
        reflection: {
          wins: '班級默寫表現比上月穩定。',
          fixes: '個別學生補課安排需要更提早追蹤。',
          upwardFeedback: '',
          teamPraise: '感謝 Claire 支援代課。',
          nextMonthGoal: '降低可抗流失，補課記錄完整率 100%。',
          selfEvaluation: 8,
          selfEvaluationReason: '教學穩定，但行政追蹤還有細節要補。',
        },
      },
    },
  ],
};

function round1(value) {
  return Number(value.toFixed(1));
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function averageScores(values) {
  const numericValues = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (!numericValues.length) {
    return 0;
  }

  return round1(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length);
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function guessCourseType(level = '') {
  const normalized = String(level).trim().toUpperCase();
  if (normalized.startsWith('GEPT') || normalized.includes('初級')) {
    return 'gept_basic';
  }
  if (normalized.includes('中級') || normalized.includes('TOEIC')) {
    return 'gept_intermediate';
  }
  if (normalized.startsWith('J')) {
    return 'junior_high';
  }
  return 'regular';
}

function normalizeClassAssignment(item = {}, index = 0) {
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(`class-${index + 1}`),
    className: typeof item.className === 'string' ? item.className : typeof item === 'string' ? item : '',
    level: typeof item.level === 'string' ? item.level : typeof item === 'string' ? item : '',
    courseType: courseTypes.includes(item.courseType) ? item.courseType : guessCourseType(item.level ?? item.className ?? item),
    studentCount: Number.isFinite(item.studentCount) ? Number(item.studentCount) : 0,
  };
}

function normalizeAttendanceRecord(item = {}, index = 0) {
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(`attendance-${index + 1}`),
    category: attendanceCategories.includes(item.category) ? item.category : 'sick',
    date: typeof item.date === 'string' ? item.date : '',
    days: Number.isFinite(item.days) ? Number(item.days) : 0,
    hours: Number.isFinite(item.hours) ? Number(item.hours) : 0,
    note: typeof item.note === 'string' ? item.note : '',
  };
}

function normalizeTeacherWorkRecord(item = {}, index = 0) {
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(`work-${index + 1}`),
    category: teacherWorkCategories.includes(item.category) ? item.category : 'student_makeup',
    date: typeof item.date === 'string' ? item.date : '',
    className: typeof item.className === 'string' ? item.className : '',
    level: typeof item.level === 'string' ? item.level : '',
    hours: Number.isFinite(item.hours) ? Number(item.hours) : 0,
    note: typeof item.note === 'string' ? item.note : '',
  };
}

function normalizeReviewHistory(items = [], fallback = null) {
  const history = Array.isArray(items) ? items.map((item, index) => createReviewHistoryEntry({
    id: typeof item.id === 'string' ? item.id : createId(`rh-${index + 1}`),
    status: item.status,
    reviewerId: item.reviewerId,
    reviewerName: item.reviewerName,
    reviewerNote: item.reviewerNote,
    reviewedAt: item.reviewedAt,
  })) : [];

  if (!history.length && fallback) {
    history.push(createReviewHistoryEntry(fallback));
  }

  return history.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt));
}

function buildAttendanceRecordsFromLegacy(legacyAttendance = {}) {
  const records = [];

  if (Number(legacyAttendance.sickDays) > 0) {
    records.push({
      id: createId('attendance-sick'),
      category: 'sick',
      date: '',
      days: Number(legacyAttendance.sickDays),
      hours: 0,
      note: '舊資料匯入',
    });
  }

  if (Number(legacyAttendance.personalDays) > 0) {
    records.push({
      id: createId('attendance-personal'),
      category: 'personal',
      date: '',
      days: Number(legacyAttendance.personalDays),
      hours: 0,
      note: '舊資料匯入',
    });
  }

  if (Number(legacyAttendance.annualLeaveDays) > 0) {
    records.push({
      id: createId('attendance-annual'),
      category: 'annual',
      date: '',
      days: Number(legacyAttendance.annualLeaveDays),
      hours: 0,
      note: '舊資料匯入',
    });
  }

  const lateCount = Math.max(Number(legacyAttendance.lateCount) || 0, 0);
  for (let index = 0; index < lateCount; index += 1) {
    records.push({
      id: createId(`attendance-late-${index + 1}`),
      category: 'late',
      date: '',
      days: 0,
      hours: 0,
      note: '舊資料匯入',
    });
  }

  return records;
}

function buildTeacherWorkRecordsFromLegacy(legacyAttendance = {}, legacyTeaching = {}) {
  const records = [];

  if (Number(legacyAttendance.makeUpHours) > 0) {
    records.push({
      id: createId('work-makeup'),
      category: 'student_makeup',
      date: '',
      className: '',
      level: '',
      hours: Number(legacyAttendance.makeUpHours),
      note: '舊資料匯入',
    });
  }

  const substituteClasses = Math.max(Number(legacyTeaching.substituteClasses) || 0, 0);
  for (let index = 0; index < substituteClasses; index += 1) {
    records.push({
      id: createId(`work-substitute-${index + 1}`),
      category: 'substitute_for_other',
      date: '',
      className: '',
      level: '',
      hours: 0,
      note: '舊資料匯入',
    });
  }

  if (Number(legacyTeaching.trainingHours) > 0) {
    records.push({
      id: createId('work-training'),
      category: 'training_attended',
      date: '',
      className: '',
      level: '',
      hours: Number(legacyTeaching.trainingHours),
      note: '舊資料匯入',
    });
  }

  if (typeof legacyTeaching.activitiesHosted === 'string' && legacyTeaching.activitiesHosted.trim()) {
    records.push({
      id: createId('work-activity'),
      category: 'activity_hosted',
      date: '',
      className: '',
      level: '',
      hours: 0,
      note: legacyTeaching.activitiesHosted,
    });
  }

  return records;
}

function emptyTeacherData(user) {
  return {
    classAssignments: (user.defaultClassAssignments ?? []).map((item, index) => normalizeClassAssignment(item, index)),
    attendanceRecords: [],
    teachingRecords: [],
    performanceMetrics: {
      trialStudents: 0,
      convertedStudents: 0,
      gradeTestStudents: 0,
      homeworkErrorRate: 0,
      phoneSupportSuccessRate: 0,
      inquiryStudentCount: 0,
      unavoidableLosses: 0,
      unavoidableLossNotes: '',
      avoidableLosses: 0,
      avoidableLossNotes: '',
    },
    complaints: '',
    complaintHandling: '',
    reflection: {
      wins: '',
      fixes: '',
      upwardFeedback: '',
      teamPraise: '',
      nextMonthGoal: '',
      selfEvaluation: 0,
      selfEvaluationReason: '',
    },
  };
}

function emptyAdminData() {
  return {
    attendanceRecords: [],
    performanceMetrics: {
      newEnrollments: 0,
      inquiryCount: 0,
      callCount: 0,
      conversionRate: 0,
      posterCompleted: false,
      campusFamiliarityRate: 0,
      formChecklist: {
        overdueNotice: false,
        weeklyHeadcount: false,
        monthEndHeadcount: false,
        tuitionBag: false,
      },
    },
    reflection: {
      wins: '',
      fixes: '',
      upwardFeedback: '',
      teamPraise: '',
      nextMonthGoal: '',
      selfEvaluation: 0,
      selfEvaluationReason: '',
      execution: 0,
      executionReason: '',
    },
  };
}

function scoreClassAssignment(assignment) {
  const level = String(assignment.level ?? '').trim().toUpperCase();

  if (assignment.courseType === 'gept_basic' || assignment.courseType === 'gept_intermediate' || assignment.courseType === 'toeic') {
    return 1;
  }

  if (level.startsWith('H1') || level.startsWith('H2')) {
    return 0.5;
  }

  return 1;
}

function calculateTeacherScores(report) {
  const classAssignments = report.data.classAssignments ?? [];
  const metrics = report.data.performanceMetrics;
  const totalStudentCount = classAssignments.reduce((sum, item) => sum + Number(item.studentCount || 0), 0);
  const teachingAbility = clamp(
    round1(classAssignments.reduce((sum, item) => sum + scoreClassAssignment(item), 0)),
    0,
    5,
  );

  let classLoadScore = 0;
  if (totalStudentCount >= 61) {
    classLoadScore = 5;
  } else if (totalStudentCount >= 51) {
    classLoadScore = 4;
  } else if (totalStudentCount >= 41) {
    classLoadScore = 3;
  } else if (totalStudentCount >= 21) {
    classLoadScore = 2;
  } else if (totalStudentCount >= 10) {
    classLoadScore = 1;
  }

  const trialStudents = Number(metrics.trialStudents) || 0;
  const convertedStudents = Number(metrics.convertedStudents) || 0;
  const nonConvertedTrials = Math.max(trialStudents - convertedStudents, 0);
  const conversionBonus = round1(convertedStudents + nonConvertedTrials * 0.2);
  const avoidablePenalty = Number(metrics.avoidableLosses) || 0;
  const performance = clamp(round1(teachingAbility + classLoadScore + conversionBonus - avoidablePenalty), 0, 10);
  const selfEvaluation = clamp(Number(report.data.reflection.selfEvaluation) || 0, 0, 10);

  return {
    performance,
    selfEvaluation,
    execution: null,
    overall: averageScores([performance, selfEvaluation]),
  };
}

function calculateAdminScores(report) {
  const metrics = report.data.performanceMetrics;
  const inquiryScore = metrics.inquiryCount >= 6 ? 2 : metrics.inquiryCount >= 1 ? 1 : 0;
  const callScore = metrics.callCount >= 5 ? 1 : 0;
  const conversionScore = metrics.conversionRate >= 80 ? 2 : metrics.conversionRate >= 70 ? 1 : 0;
  const posterScore = metrics.posterCompleted ? 1 : 0;
  const checklistScore = [
    metrics.formChecklist.overdueNotice,
    metrics.formChecklist.weeklyHeadcount,
    metrics.formChecklist.monthEndHeadcount,
    metrics.formChecklist.tuitionBag,
  ].filter(Boolean).length;
  const familiarityScore = metrics.campusFamiliarityRate >= 80 ? 2 : metrics.campusFamiliarityRate >= 70 ? 1 : 0;
  const performance = clamp(round1(((inquiryScore + callScore + conversionScore + posterScore + checklistScore + familiarityScore) / 12) * 10), 0, 10);
  const selfEvaluation = clamp(Number(report.data.reflection.selfEvaluation) || 0, 0, 10);
  const execution = clamp(Number(report.data.reflection.execution) || 0, 0, 10);

  return {
    performance,
    selfEvaluation,
    execution,
    overall: averageScores([performance, selfEvaluation, execution]),
  };
}

export function scoreReport(report) {
  return {
    ...report,
    scores: report.role === 'teacher' ? calculateTeacherScores(report) : calculateAdminScores(report),
  };
}

function normalizeTeacherData(rawData, user, rawScores = {}) {
  if (rawData?.classAssignments && rawData?.attendanceRecords && rawData?.teachingRecords) {
    return {
      classAssignments: rawData.classAssignments.map((item, index) => normalizeClassAssignment(item, index)),
      attendanceRecords: rawData.attendanceRecords.map((item, index) => normalizeAttendanceRecord(item, index)),
      teachingRecords: rawData.teachingRecords.map((item, index) => normalizeTeacherWorkRecord(item, index)),
      performanceMetrics: {
        trialStudents: Number(rawData.performanceMetrics?.trialStudents) || 0,
        convertedStudents: Number(rawData.performanceMetrics?.convertedStudents) || 0,
        gradeTestStudents: Number(rawData.performanceMetrics?.gradeTestStudents) || 0,
        homeworkErrorRate: Number(rawData.performanceMetrics?.homeworkErrorRate) || 0,
        phoneSupportSuccessRate: Number(rawData.performanceMetrics?.phoneSupportSuccessRate) || 0,
        inquiryStudentCount: Number(rawData.performanceMetrics?.inquiryStudentCount) || 0,
        unavoidableLosses: Number(rawData.performanceMetrics?.unavoidableLosses) || 0,
        unavoidableLossNotes: typeof rawData.performanceMetrics?.unavoidableLossNotes === 'string' ? rawData.performanceMetrics.unavoidableLossNotes : '',
        avoidableLosses: Number(rawData.performanceMetrics?.avoidableLosses) || 0,
        avoidableLossNotes: typeof rawData.performanceMetrics?.avoidableLossNotes === 'string' ? rawData.performanceMetrics.avoidableLossNotes : '',
      },
      complaints: typeof rawData.complaints === 'string' ? rawData.complaints : '',
      complaintHandling: typeof rawData.complaintHandling === 'string' ? rawData.complaintHandling : '',
      reflection: {
        wins: typeof rawData.reflection?.wins === 'string' ? rawData.reflection.wins : '',
        fixes: typeof rawData.reflection?.fixes === 'string' ? rawData.reflection.fixes : '',
        upwardFeedback: typeof rawData.reflection?.upwardFeedback === 'string' ? rawData.reflection.upwardFeedback : '',
        teamPraise: typeof rawData.reflection?.teamPraise === 'string' ? rawData.reflection.teamPraise : '',
        nextMonthGoal: typeof rawData.reflection?.nextMonthGoal === 'string' ? rawData.reflection.nextMonthGoal : '',
        selfEvaluation: Number(rawData.reflection?.selfEvaluation ?? rawScores.selfEvaluation ?? rawScores.selfReflection) || 0,
        selfEvaluationReason: typeof rawData.reflection?.selfEvaluationReason === 'string' ? rawData.reflection.selfEvaluationReason : '',
      },
    };
  }

  return {
    classAssignments: (user.defaultClassAssignments ?? []).map((item, index) => normalizeClassAssignment(item, index)),
    attendanceRecords: buildAttendanceRecordsFromLegacy(rawData?.attendance),
    teachingRecords: buildTeacherWorkRecordsFromLegacy(rawData?.attendance, rawData?.teaching),
    performanceMetrics: {
      trialStudents: Number(rawData?.students?.trialStudents) || 0,
      convertedStudents: Number(rawData?.students?.convertedStudents) || 0,
      gradeTestStudents: Number(rawData?.teaching?.passedTests) || 0,
      homeworkErrorRate: 0,
      phoneSupportSuccessRate: 0,
      inquiryStudentCount: 0,
      unavoidableLosses: Number(rawData?.students?.unavoidableLosses) || 0,
      unavoidableLossNotes: '',
      avoidableLosses: Number(rawData?.students?.avoidableLosses) || 0,
      avoidableLossNotes: '',
    },
    complaints: '',
    complaintHandling: '',
    reflection: {
      wins: typeof rawData?.reflection?.wins === 'string' ? rawData.reflection.wins : '',
      fixes: typeof rawData?.reflection?.fixes === 'string' ? rawData.reflection.fixes : '',
      upwardFeedback: typeof rawData?.reflection?.upwardFeedback === 'string' ? rawData.reflection.upwardFeedback : '',
      teamPraise: typeof rawData?.reflection?.teamPraise === 'string' ? rawData.reflection.teamPraise : '',
      nextMonthGoal: typeof rawData?.reflection?.nextMonthGoal === 'string' ? rawData.reflection.nextMonthGoal : '',
      selfEvaluation: Number(rawScores.selfEvaluation ?? rawScores.selfReflection) || 0,
      selfEvaluationReason: '',
    },
  };
}

function normalizeAdminData(rawData, rawScores = {}) {
  if (rawData?.attendanceRecords && rawData?.performanceMetrics) {
    return {
      attendanceRecords: rawData.attendanceRecords.map((item, index) => normalizeAttendanceRecord(item, index)),
      performanceMetrics: {
        newEnrollments: Number(rawData.performanceMetrics?.newEnrollments) || 0,
        inquiryCount: Number(rawData.performanceMetrics?.inquiryCount) || 0,
        callCount: Number(rawData.performanceMetrics?.callCount) || 0,
        conversionRate: Number(rawData.performanceMetrics?.conversionRate) || 0,
        posterCompleted: Boolean(rawData.performanceMetrics?.posterCompleted),
        campusFamiliarityRate: Number(rawData.performanceMetrics?.campusFamiliarityRate) || 0,
        formChecklist: {
          overdueNotice: Boolean(rawData.performanceMetrics?.formChecklist?.overdueNotice),
          weeklyHeadcount: Boolean(rawData.performanceMetrics?.formChecklist?.weeklyHeadcount),
          monthEndHeadcount: Boolean(rawData.performanceMetrics?.formChecklist?.monthEndHeadcount),
          tuitionBag: Boolean(rawData.performanceMetrics?.formChecklist?.tuitionBag),
        },
      },
      reflection: {
        wins: typeof rawData.reflection?.wins === 'string' ? rawData.reflection.wins : '',
        fixes: typeof rawData.reflection?.fixes === 'string' ? rawData.reflection.fixes : '',
        upwardFeedback: typeof rawData.reflection?.upwardFeedback === 'string' ? rawData.reflection.upwardFeedback : '',
        teamPraise: typeof rawData.reflection?.teamPraise === 'string' ? rawData.reflection.teamPraise : '',
        nextMonthGoal: typeof rawData.reflection?.nextMonthGoal === 'string' ? rawData.reflection.nextMonthGoal : '',
        selfEvaluation: Number(rawData.reflection?.selfEvaluation ?? rawScores.selfEvaluation ?? rawScores.selfReflection) || 0,
        selfEvaluationReason: typeof rawData.reflection?.selfEvaluationReason === 'string' ? rawData.reflection.selfEvaluationReason : '',
        execution: Number(rawData.reflection?.execution ?? rawScores.execution) || 0,
        executionReason: typeof rawData.reflection?.executionReason === 'string' ? rawData.reflection.executionReason : '',
      },
    };
  }

  return {
    attendanceRecords: buildAttendanceRecordsFromLegacy(rawData?.attendance),
    performanceMetrics: {
      newEnrollments: 0,
      inquiryCount: Number(rawData?.operations?.inquiryCount) || 0,
      callCount: Number(rawData?.operations?.callCount) || 0,
      conversionRate: Number(rawData?.operations?.conversionRate) || 0,
      posterCompleted: Boolean(rawData?.operations?.posterCompleted),
      campusFamiliarityRate: Number(rawData?.operations?.campusFamiliarityScore) || 0,
      formChecklist: {
        overdueNotice: false,
        weeklyHeadcount: Boolean(rawData?.operations?.weeklyStatsSubmitted),
        monthEndHeadcount: Boolean(rawData?.operations?.monthEndStatsSubmitted),
        tuitionBag: Boolean(rawData?.operations?.tuitionBagCompleted),
      },
    },
    reflection: {
      wins: typeof rawData?.reflection?.wins === 'string' ? rawData.reflection.wins : '',
      fixes: typeof rawData?.reflection?.fixes === 'string' ? rawData.reflection.fixes : '',
      upwardFeedback: typeof rawData?.reflection?.upwardFeedback === 'string' ? rawData.reflection.upwardFeedback : '',
      teamPraise: typeof rawData?.reflection?.teamPraise === 'string' ? rawData.reflection.teamPraise : '',
      nextMonthGoal: typeof rawData?.reflection?.nextMonthGoal === 'string' ? rawData.reflection.nextMonthGoal : '',
      selfEvaluation: Number(rawScores.selfEvaluation ?? rawScores.selfReflection) || 0,
      selfEvaluationReason: '',
      execution: Number(rawScores.execution) || 0,
      executionReason: '',
    },
  };
}

function normalizeUser(user = {}) {
  const fallbackAccount = (() => {
    if (user.role === 'manager') {
      return 'jack';
    }
    if (typeof user.account === 'string' && user.account) {
      return user.account;
    }
    if (typeof user.id === 'string') {
      const parts = user.id.split('-');
      return parts[parts.length - 1] || String(user.name ?? 'user').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }
    return String(user.name ?? 'user').toLowerCase().replace(/[^a-z0-9]+/g, '');
  })();
  const normalized = {
    id: typeof user.id === 'string' ? user.id : createId('user'),
    account: fallbackAccount,
    passwordHash: user.role === 'manager'
      ? createPasswordHash(`${fallbackAccount}1234`)
      : typeof user.passwordHash === 'string' && user.passwordHash
        ? user.passwordHash
        : createPasswordHash(`${fallbackAccount}1234`),
    name: typeof user.name === 'string' ? user.name : '',
    role: user.role === 'teacher' || user.role === 'admin' || user.role === 'manager' ? user.role : 'teacher',
    branch: typeof user.branch === 'string' ? user.branch : '',
    startDate: typeof user.startDate === 'string' ? user.startDate : '',
    title: typeof user.title === 'string' ? user.title : '',
  };

  if (normalized.role === 'teacher') {
    const sourceAssignments = Array.isArray(user.defaultClassAssignments)
      ? user.defaultClassAssignments
      : Array.isArray(user.classes)
        ? user.classes
        : [];

    return {
      ...normalized,
      defaultClassAssignments: sourceAssignments.map((item, index) => normalizeClassAssignment(item, index)),
    };
  }

  return normalized;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function createBlankReport(user, month) {
  const baseReport = {
    id: '',
    userId: user.id,
    role: user.role,
    month,
    branch: user.branch,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    submittedAt: null,
    reviewerNote: '',
    reviewHistory: [],
    submissionHistory: [],
    scores: {
      performance: 0,
      selfEvaluation: 0,
      execution: user.role === 'teacher' ? null : 0,
      overall: 0,
    },
    data: user.role === 'teacher' ? emptyTeacherData(user) : emptyAdminData(),
  };

  return scoreReport(baseReport);
}

function normalizeReport(report = {}, users) {
  const user = users.find((item) => item.id === report.userId);
  const role = report.role === 'admin' || report.role === 'teacher' ? report.role : user?.role ?? 'teacher';
  const normalizedReviewerNote = typeof report.reviewerNote === 'string' ? report.reviewerNote : '';
  const fallbackReview = normalizedReviewerNote
    ? {
      status: report.status === 'needs_revision' ? 'needs_revision' : 'reviewed',
      reviewerId: 'u-manager-jack',
      reviewerName: 'Tr.Jack',
      reviewerNote: normalizedReviewerNote,
      reviewedAt: typeof report.submittedAt === 'string' ? report.submittedAt : typeof report.updatedAt === 'string' ? report.updatedAt : new Date().toISOString(),
    }
    : null;
  const baseReport = {
    id: typeof report.id === 'string' && report.id ? report.id : `r-${report.month ?? currentMonth()}-${report.userId ?? createId('report')}`,
    userId: typeof report.userId === 'string' ? report.userId : '',
    role,
    month: typeof report.month === 'string' && /^\d{4}-\d{2}$/.test(report.month) ? report.month : currentMonth(),
    branch: typeof report.branch === 'string' ? report.branch : user?.branch ?? '',
    status: ['draft', 'submitted', 'reviewed', 'needs_revision'].includes(report.status) ? report.status : 'draft',
    updatedAt: typeof report.updatedAt === 'string' ? report.updatedAt : new Date().toISOString(),
    submittedAt: typeof report.submittedAt === 'string' ? report.submittedAt : null,
    reviewerNote: normalizedReviewerNote,
    reviewHistory: normalizeReviewHistory(report.reviewHistory, fallbackReview),
    submissionHistory: Array.isArray(report.submissionHistory) ? report.submissionHistory : [],
    scores: {
      performance: 0,
      selfEvaluation: 0,
      execution: role === 'teacher' ? null : 0,
      overall: 0,
    },
    data: role === 'teacher'
      ? normalizeTeacherData(report.data, user ?? normalizeUser({ role: 'teacher' }), report.scores)
      : normalizeAdminData(report.data, report.scores),
  };

  return scoreReport(baseReport);
}

function normalizeDatabase(rawData) {
  const users = Array.isArray(rawData?.users) ? rawData.users.map((user) => normalizeUser(user)) : seedData.users.map((user) => normalizeUser(user));
  const reports = Array.isArray(rawData?.reports) ? rawData.reports.map((report) => normalizeReport(report, users)) : seedData.reports.map((report) => normalizeReport(report, users));

  return {
    metadata: {
      branchName: typeof rawData?.metadata?.branchName === 'string' ? rawData.metadata.branchName : seedData.metadata.branchName,
      systemName: typeof rawData?.metadata?.systemName === 'string' ? rawData.metadata.systemName : seedData.metadata.systemName,
    },
    users,
    reports,
  };
}

let cloudPool = null;

function useCloudDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getCloudPool() {
  if (!cloudPool) {
    cloudPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'disable'
        ? false
        : process.env.DATABASE_URL?.includes('localhost')
          ? false
          : { rejectUnauthorized: false },
      max: 5,
    });
  }

  return cloudPool;
}

async function ensureCloudDatabase() {
  const pool = getCloudPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${CLOUD_STATE_TABLE} (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const existing = await pool.query(`SELECT payload FROM ${CLOUD_STATE_TABLE} WHERE id = $1`, [CLOUD_STATE_ID]);
  if (!existing.rows.length) {
    const normalizedSeed = normalizeDatabase(seedData);
    await pool.query(
      `INSERT INTO ${CLOUD_STATE_TABLE} (id, payload) VALUES ($1, $2::jsonb)`,
      [CLOUD_STATE_ID, JSON.stringify(normalizedSeed)],
    );
  }
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    const normalizedSeed = normalizeDatabase(seedData);
    fs.writeFileSync(dataFile, JSON.stringify(normalizedSeed, null, 2), 'utf-8');
  }
}

export async function loadDatabase() {
  if (useCloudDatabase()) {
    await ensureCloudDatabase();
    const pool = getCloudPool();
    const result = await pool.query(`SELECT payload FROM ${CLOUD_STATE_TABLE} WHERE id = $1`, [CLOUD_STATE_ID]);
    return normalizeDatabase(result.rows[0]?.payload ?? seedData);
  }

  ensureDataFile();
  const raw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const normalized = normalizeDatabase(raw);

  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2), 'utf-8');
  }

  return normalized;
}

export async function saveDatabase(data) {
  if (useCloudDatabase()) {
    await ensureCloudDatabase();
    const pool = getCloudPool();
    const normalized = normalizeDatabase(data);
    await pool.query(
      `UPDATE ${CLOUD_STATE_TABLE} SET payload = $2::jsonb, updated_at = now() WHERE id = $1`,
      [CLOUD_STATE_ID, JSON.stringify(normalized)],
    );
    return normalized;
  }

  ensureDataFile();
  const normalized = normalizeDatabase(data);
  fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export function getDataFilePath() {
  if (useCloudDatabase()) {
    return 'postgresql://cloud-database';
  }

  ensureDataFile();
  return dataFile;
}

export function decorateReport(report, users) {
  const user = users.find((item) => item.id === report.userId);
  return {
    ...report,
    userName: user?.name ?? '',
    title: user?.title ?? '',
    startDate: user?.startDate ?? '',
  };
}

export function sanitizeUserForClient(user) {
  return sanitizeUser(user);
}

export function verifyUserPassword(user, password) {
  return verifyPassword(password, user?.passwordHash ?? '');
}
