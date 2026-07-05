export type Role = 'teacher' | 'admin' | 'manager';
export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
export type AppView = 'fill' | 'dashboard' | 'manage';

export type CourseType =
  | 'regular'
  | 'junior_high'
  | 'gept_basic'
  | 'gept_intermediate'
  | 'toeic';

export type AttendanceCategory = 'sick' | 'personal' | 'annual' | 'late';

export type TeacherWorkCategory =
  | 'substitute_for_other'
  | 'covered_by_other'
  | 'student_makeup'
  | 'activity_hosted'
  | 'training_attended';

export interface ClassAssignment {
  id: string;
  className: string;
  level: string;
  courseType: CourseType;
  studentCount: number;
}

export interface AttendanceRecord {
  id: string;
  category: AttendanceCategory;
  date: string;
  days: number;
  hours: number;
  note: string;
}

export interface TeacherWorkRecord {
  id: string;
  category: TeacherWorkCategory;
  date: string;
  className: string;
  level: string;
  hours: number;
  note: string;
}

export interface User {
  id: string;
  account: string;
  name: string;
  role: Role;
  branch: string;
  startDate: string;
  title: string;
  defaultClassAssignments?: ClassAssignment[];
}

export interface TeacherPerformanceMetrics {
  trialStudents: number;
  convertedStudents: number;
  gradeTestStudents: number;
  homeworkErrorRate: number;
  phoneSupportSuccessRate: number;
  inquiryStudentCount: number;
  unavoidableLosses: number;
  unavoidableLossNotes: string;
  avoidableLosses: number;
  avoidableLossNotes: string;
}

export interface AdminPerformanceMetrics {
  newEnrollments: number;
  inquiryCount: number;
  callCount: number;
  conversionRate: number;
  posterCompleted: boolean;
  campusFamiliarityRate: number;
  formChecklist: {
    overdueNotice: boolean;
    weeklyHeadcount: boolean;
    monthEndHeadcount: boolean;
    tuitionBag: boolean;
  };
}

export interface ReflectionBase {
  wins: string;
  fixes: string;
  upwardFeedback: string;
  teamPraise: string;
  nextMonthGoal: string;
}

export interface ReviewHistoryEntry {
  id: string;
  status: Extract<ReportStatus, 'reviewed' | 'needs_revision'>;
  reviewerId: string;
  reviewerName: string;
  reviewerNote: string;
  reviewedAt: string;
}

export interface TeacherReflection extends ReflectionBase {
  selfEvaluation: number;
  selfEvaluationReason: string;
}

export interface AdminReflection extends ReflectionBase {
  selfEvaluation: number;
  selfEvaluationReason: string;
  execution: number;
  executionReason: string;
}

export interface TeacherReportData {
  classAssignments: ClassAssignment[];
  attendanceRecords: AttendanceRecord[];
  teachingRecords: TeacherWorkRecord[];
  performanceMetrics: TeacherPerformanceMetrics;
  complaints: string;
  complaintHandling: string;
  reflection: TeacherReflection;
}

export interface AdminReportData {
  attendanceRecords: AttendanceRecord[];
  performanceMetrics: AdminPerformanceMetrics;
  reflection: AdminReflection;
}

export interface ReportScores {
  performance: number;
  selfEvaluation: number;
  execution: number | null;
  overall: number;
}

export interface MonthlyReportBase {
  id: string;
  userId: string;
  userName?: string;
  title?: string;
  startDate?: string;
  role: Exclude<Role, 'manager'>;
  month: string;
  branch: string;
  status: ReportStatus;
  updatedAt: string;
  submittedAt: string | null;
  reviewerNote: string;
  reviewHistory: ReviewHistoryEntry[];
  scores: ReportScores;
}

export interface TeacherReport extends MonthlyReportBase {
  role: 'teacher';
  data: TeacherReportData;
}

export interface AdminReport extends MonthlyReportBase {
  role: 'admin';
  data: AdminReportData;
}

export type MonthlyReport = TeacherReport | AdminReport;

export interface DashboardMetricSet {
  totalUsers: number;
  reportCount: number;
  submittedCount: number;
  pendingCount: number;
  reviewedCount: number;
  averageScore: number;
  completionRate: number;
}

export interface DashboardRoleCard {
  role: Exclude<Role, 'manager'>;
  label: string;
  totalUsers: number;
  submittedCount: number;
  averageScore: number;
}

export interface FollowUpItem {
  id: string;
  userId: string;
  name: string;
  role: Exclude<Role, 'manager'>;
  status: ReportStatus;
  score: number;
  reason: string;
}

export interface LeaderboardItem {
  id: string;
  userId: string;
  name: string;
  role: Exclude<Role, 'manager'>;
  status: ReportStatus;
  score: number;
}

export interface DashboardData {
  month: string;
  metrics: DashboardMetricSet;
  roleCards: DashboardRoleCard[];
  unsentList: FollowUpItem[];
  followUps: FollowUpItem[];
  leaderboard: LeaderboardItem[];
}

export type StudentMovementType = 'insert' | 'transfer_in' | 'transfer_out' | 'loss' | 'trial';
export type StudentMovementStatus = 'confirmed' | 'pending';

export interface StudentMovementReminderItem {
  id: string;
  studentName: string;
  movementType: StudentMovementType;
  movementLabel: string;
  rawActionLabel: string;
  status: StudentMovementStatus;
  statusLabel: string;
  eventDate: string | null;
  eventDateLabel: string;
  daysUntil: number | null;
  className: string;
  sourceRow: number;
  sourceNote: string;
  sourceWeekStart: string;
  sourceWeekEnd: string;
  sourceUpdatedAt: string;
}

export interface StudentMovementDigestSource {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  sheetName: string;
  snapshotRecordId: string;
  snapshotWeekStart: string;
  snapshotWeekEnd: string;
  sourceUpdatedAt: string;
  capturedAt: string;
  notes: string;
  rowCount: number;
}

export interface StudentMovementDigestSummary {
  totalUpcoming: number;
  totalPendingWithoutDate: number;
  insertCount: number;
  transferInCount: number;
  transferOutCount: number;
  lossCount: number;
  trialCount: number;
}

export interface StudentMovementDigest {
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  source: StudentMovementDigestSource;
  summary: StudentMovementDigestSummary;
  upcoming: StudentMovementReminderItem[];
  undatedPending: StudentMovementReminderItem[];
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface BootstrapData {
  metadata: {
    branchName: string;
    systemName: string;
  };
  activeMonth: string;
  users: User[];
  roles: Role[];
  statuses: ReportStatus[];
  dashboard: DashboardData;
  studentMovementDigest: StudentMovementDigest;
  recentReports: MonthlyReport[];
}

export interface ReportFilters {
  month: string;
  role: '' | Exclude<Role, 'manager'>;
  status: '' | ReportStatus;
  search: string;
}

export interface AttendanceSummaryItem {
  count: number;
  days: number;
  hours: number;
}

export interface AttendanceSummary {
  sick: AttendanceSummaryItem;
  personal: AttendanceSummaryItem;
  annual: AttendanceSummaryItem;
  late: AttendanceSummaryItem;
}
