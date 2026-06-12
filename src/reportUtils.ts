import type {
  AdminPerformanceMetrics,
  AdminReport,
  AttendanceCategory,
  AttendanceRecord,
  AttendanceSummary,
  ClassAssignment,
  CourseType,
  MonthlyReport,
  ReportScores,
  ReportStatus,
  Role,
  TeacherReport,
  TeacherWorkCategory,
  TeacherWorkRecord,
  User,
} from './types';

export const roleLabels: Record<Role, string> = {
  teacher: '英語老師',
  admin: '行政老師',
  manager: '主任 / 主管',
};

export const statusLabels: Record<ReportStatus, string> = {
  draft: '草稿',
  submitted: '已送出',
  reviewed: '已審核',
  needs_revision: '退回修正',
};

export const courseTypeLabels: Record<CourseType, string> = {
  regular: '常態班',
  junior_high: '國中英文班',
  gept_basic: '初級英檢班',
  gept_intermediate: '中級英檢 / 多益班',
  toeic: '多益班',
};

export const attendanceCategoryLabels: Record<AttendanceCategory, string> = {
  sick: '病假',
  personal: '事假',
  annual: '特休',
  late: '遲到',
};

export const teacherWorkCategoryLabels: Record<TeacherWorkCategory, string> = {
  substitute_for_other: '幫他人代課',
  covered_by_other: '被他人代課',
  student_makeup: '幫學生補課',
  activity_hosted: '活動舉辦',
  training_attended: '培訓參與',
};

export const courseTypeOptions: CourseType[] = [
  'regular',
  'junior_high',
  'gept_basic',
  'gept_intermediate',
  'toeic',
];

export const attendanceCategories: AttendanceCategory[] = ['sick', 'personal', 'annual', 'late'];
export const teacherWorkCategories: TeacherWorkCategory[] = [
  'substitute_for_other',
  'covered_by_other',
  'student_makeup',
  'activity_hosted',
  'training_attended',
];

export interface TeacherPerformanceBreakdown {
  teachingAbility: number;
  classLoadScore: number;
  conversionBonus: number;
  avoidablePenalty: number;
  totalStudentCount: number;
  normalizedTotal: number;
}

export interface AdminPerformanceBreakdown {
  inquiryScore: number;
  callScore: number;
  conversionScore: number;
  posterScore: number;
  checklistScore: number;
  familiarityScore: number;
  rawTotal: number;
  normalizedTotal: number;
}

export interface TeacherWorkSummaryItem {
  count: number;
  hours: number;
}

export type TeacherWorkSummary = Record<TeacherWorkCategory, TeacherWorkSummaryItem>;

function round1(value: number) {
  return Number(value.toFixed(1));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function averageScores(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!numericValues.length) {
    return 0;
  }

  return round1(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length);
}

function guessCourseType(level: string) {
  const normalized = level.trim().toUpperCase();
  if (normalized.startsWith('GEPT') || normalized.includes('初級')) {
    return 'gept_basic' satisfies CourseType;
  }
  if (normalized.includes('中級') || normalized.includes('TOEIC')) {
    return 'gept_intermediate' satisfies CourseType;
  }
  if (normalized.startsWith('J')) {
    return 'junior_high' satisfies CourseType;
  }
  return 'regular' satisfies CourseType;
}

function scoreClassAssignment(assignment: ClassAssignment) {
  const level = assignment.level.trim().toUpperCase();

  if (assignment.courseType === 'gept_basic' || assignment.courseType === 'gept_intermediate' || assignment.courseType === 'toeic') {
    return 1;
  }

  if (level.startsWith('H1') || level.startsWith('H2')) {
    return 0.5;
  }

  return 1;
}

function createAttendanceSummaryItem() {
  return {
    count: 0,
    days: 0,
    hours: 0,
  };
}

function createTeacherWorkSummaryItem() {
  return {
    count: 0,
    hours: 0,
  };
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyClassAssignment(partial?: Partial<ClassAssignment>): ClassAssignment {
  return {
    id: partial?.id ?? createId('class'),
    className: partial?.className ?? '',
    level: partial?.level ?? '',
    courseType: partial?.courseType ?? guessCourseType(partial?.level ?? ''),
    studentCount: partial?.studentCount ?? 0,
  };
}

export function createEmptyAttendanceRecord(partial?: Partial<AttendanceRecord>): AttendanceRecord {
  return {
    id: partial?.id ?? createId('attendance'),
    category: partial?.category ?? 'sick',
    date: partial?.date ?? '',
    days: partial?.days ?? 0,
    hours: partial?.hours ?? 0,
    note: partial?.note ?? '',
  };
}

export function createEmptyTeacherWorkRecord(partial?: Partial<TeacherWorkRecord>): TeacherWorkRecord {
  return {
    id: partial?.id ?? createId('work'),
    category: partial?.category ?? 'student_makeup',
    date: partial?.date ?? '',
    className: partial?.className ?? '',
    level: partial?.level ?? '',
    hours: partial?.hours ?? 0,
    note: partial?.note ?? '',
  };
}

export function copyDefaultClassAssignments(user: User | null) {
  return (user?.defaultClassAssignments ?? []).map((assignment) => createEmptyClassAssignment(assignment));
}

export function formatYearsOfService(startDate: string) {
  if (!startDate) {
    return '未提供';
  }

  const start = new Date(startDate);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months <= 0) {
    return '未滿 1 個月';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (!years) {
    return `${remainingMonths} 個月`;
  }

  if (!remainingMonths) {
    return `${years} 年`;
  }

  return `${years} 年 ${remainingMonths} 個月`;
}

export function summarizeAttendance(records: AttendanceRecord[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    sick: createAttendanceSummaryItem(),
    personal: createAttendanceSummaryItem(),
    annual: createAttendanceSummaryItem(),
    late: createAttendanceSummaryItem(),
  };

  records.forEach((record) => {
    const target = summary[record.category];
    target.count += 1;
    target.days = round1(target.days + record.days);
    target.hours = round1(target.hours + record.hours);
  });

  return summary;
}

export function summarizeTeacherWork(records: TeacherWorkRecord[]): TeacherWorkSummary {
  const summary: TeacherWorkSummary = {
    substitute_for_other: createTeacherWorkSummaryItem(),
    covered_by_other: createTeacherWorkSummaryItem(),
    student_makeup: createTeacherWorkSummaryItem(),
    activity_hosted: createTeacherWorkSummaryItem(),
    training_attended: createTeacherWorkSummaryItem(),
  };

  records.forEach((record) => {
    const target = summary[record.category];
    target.count += 1;
    target.hours = round1(target.hours + record.hours);
  });

  return summary;
}

export function buildTeacherPerformanceBreakdown(report: TeacherReport): TeacherPerformanceBreakdown {
  const { classAssignments, performanceMetrics } = report.data;
  const totalStudentCount = classAssignments.reduce((sum, assignment) => sum + assignment.studentCount, 0);
  const teachingAbility = clamp(round1(classAssignments.reduce((sum, assignment) => sum + scoreClassAssignment(assignment), 0)), 0, 5);

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

  const nonConvertedTrials = Math.max(performanceMetrics.trialStudents - performanceMetrics.convertedStudents, 0);
  const conversionBonus = round1(performanceMetrics.convertedStudents + nonConvertedTrials * 0.2);
  const avoidablePenalty = performanceMetrics.avoidableLosses;
  const normalizedTotal = clamp(round1(teachingAbility + classLoadScore + conversionBonus - avoidablePenalty), 0, 10);

  return {
    teachingAbility,
    classLoadScore,
    conversionBonus,
    avoidablePenalty,
    totalStudentCount,
    normalizedTotal,
  };
}

function buildChecklistScore(metrics: AdminPerformanceMetrics) {
  return [
    metrics.formChecklist.overdueNotice,
    metrics.formChecklist.weeklyHeadcount,
    metrics.formChecklist.monthEndHeadcount,
    metrics.formChecklist.tuitionBag,
  ].filter(Boolean).length;
}

export function buildAdminPerformanceBreakdown(report: AdminReport): AdminPerformanceBreakdown {
  const metrics = report.data.performanceMetrics;

  const inquiryScore = metrics.inquiryCount >= 6 ? 2 : metrics.inquiryCount >= 1 ? 1 : 0;
  const callScore = metrics.callCount >= 5 ? 1 : 0;
  const conversionScore = metrics.conversionRate >= 80 ? 2 : metrics.conversionRate >= 70 ? 1 : 0;
  const posterScore = metrics.posterCompleted ? 1 : 0;
  const checklistScore = buildChecklistScore(metrics);
  const familiarityScore = metrics.campusFamiliarityRate >= 80 ? 2 : metrics.campusFamiliarityRate >= 70 ? 1 : 0;
  const rawTotal = inquiryScore + callScore + conversionScore + posterScore + checklistScore + familiarityScore;
  const normalizedTotal = clamp(round1((rawTotal / 12) * 10), 0, 10);

  return {
    inquiryScore,
    callScore,
    conversionScore,
    posterScore,
    checklistScore,
    familiarityScore,
    rawTotal,
    normalizedTotal,
  };
}

export function calculateReportScores(report: MonthlyReport): ReportScores {
  if (report.role === 'teacher') {
    const performance = buildTeacherPerformanceBreakdown(report).normalizedTotal;
    const selfEvaluation = clamp(report.data.reflection.selfEvaluation, 0, 10);
    return {
      performance,
      selfEvaluation,
      execution: null,
      overall: averageScores([performance, selfEvaluation]),
    };
  }

  const performance = buildAdminPerformanceBreakdown(report).normalizedTotal;
  const selfEvaluation = clamp(report.data.reflection.selfEvaluation, 0, 10);
  const execution = clamp(report.data.reflection.execution, 0, 10);
  return {
    performance,
    selfEvaluation,
    execution,
    overall: averageScores([performance, selfEvaluation, execution]),
  };
}

export function syncReportScores<T extends MonthlyReport>(report: T): T {
  return {
    ...report,
    scores: calculateReportScores(report),
  };
}
