const APP = {
  spreadsheetName: '月報填報系統資料庫',
  dbPropertyKey: 'MONTHLY_REPORT_DB_ID',
  exportFolderKey: 'MONTHLY_REPORT_EXPORT_FOLDER_ID',
  referenceSpreadsheetKey: 'DASHBOARD_REFERENCE_SPREADSHEET_ID',
  dashboardApiTokenKey: 'MONTHLY_REPORT_DASHBOARD_API_TOKEN',
  sessionPrefix: 'monthly-report-session:',
  sessionTtlSeconds: 6 * 60 * 60,
};

const DEFAULT_REFERENCE_SPREADSHEET_ID = '';
const DEFAULT_DASHBOARD_MONTHLY_API_TOKEN = '40d21e804c11438eaed60bacf4e99eae';

const META = {
  systemName: '月報填報系統',
  branchName: '樂獅英語新竹二重分校',
  schoolTitle: '樂獅英語新竹二重分校',
};

const USER_HEADERS = [
  'id',
  'account',
  'passwordHash',
  'name',
  'role',
  'branch',
  'startDate',
  'title',
  'staffCode',
  'duty',
  'mustChangePassword',
  'defaultClassAssignmentsJson',
  'teachingHourlyRate',
  'adminHourlyRate',
  'contractEndDate',
  'email',
  'notifyByEmail',
  'lineTargetId',
  'notifyByLine',
  'isNotificationReceiver',
];

const NOTIFICATION_LOG_HEADERS = [
  'id',
  'reportId',
  'month',
  'senderUserId',
  'senderName',
  'receiverUserId',
  'receiverName',
  'channel',
  'target',
  'status',
  'subject',
  'message',
  'errorMessage',
  'createdAt',
];

const USER_SEED = [
  {
    id: 'u-manager-jack',
    account: 'jack',
    password: 'ChangeMe123!',
    name: 'Tr.Jack',
    role: 'manager',
    branch: META.branchName,
    startDate: '2021-09-01',
    title: '主管',
  },
  {
    id: 'u-teacher-claire',
    account: 'claire',
    password: 'ChangeMe123!',
    name: 'Claire',
    role: 'teacher',
    branch: META.branchName,
    startDate: '2024-08-01',
    title: '英文老師',
    defaultClassAssignments: [
      { id: 'class-1-claire', className: 'L8A', level: 'L8A', courseType: 'regular', studentCount: 0 },
      { id: 'class-2-claire', className: 'H2B', level: 'H2B', courseType: 'regular', studentCount: 0 },
    ],
  },
  {
    id: 'u-teacher-ruby',
    account: 'ruby',
    password: 'ChangeMe123!',
    name: 'Ruby',
    role: 'teacher',
    branch: META.branchName,
    startDate: '2023-11-15',
    title: '英文老師',
    defaultClassAssignments: [
      { id: 'class-1-ruby', className: 'L10C', level: 'L10C', courseType: 'regular', studentCount: 0 },
      { id: 'class-2-ruby', className: 'AE18', level: 'AE18', courseType: 'regular', studentCount: 0 },
    ],
  },
  {
    id: 'u-admin-crystal',
    account: 'crystal',
    password: 'ChangeMe123!',
    name: 'Crystal',
    role: 'admin',
    branch: META.branchName,
    startDate: '2024-03-10',
    title: '行政老師',
  },
  {
    id: 'u-admin-sally',
    account: 'sally',
    password: 'ChangeMe123!',
    name: 'Sally',
    role: 'admin',
    branch: META.branchName,
    startDate: '2022-06-01',
    title: '行政老師',
  },
];

const STAFF_IMPORT_ROWS = [
  { branch: '樂獅英語-新竹二重分校', name: '林凡云 (Valora)', staffCode: 'P568-T109', duty: '工讀助教' },
  { branch: '樂獅英語-新竹二重分校', name: 'Zephaniah', staffCode: 'P568-T106', duty: '老師' },
  { branch: '樂獅英語-新竹二重分校', name: '黃煒婷 (Ivy)', staffCode: 'P568-T105', duty: '工讀助教' },
  { branch: '樂獅英語-新竹二重分校', name: '徐子玉 (Habaw)', staffCode: 'P568-T104', duty: '工讀助教' },
  { branch: '樂獅英語-新竹二重分校', name: '鍾瑋庭 (Annie)', staffCode: 'P568-T99', duty: '老師' },
  { branch: '樂獅英語-竹北安興分校', name: '葉明珍 (Albee)', staffCode: 'P568-T91', duty: '老師' },
  { branch: '樂獅英語-新竹二重分校', name: '彭婕玟 (Nia)', staffCode: 'P568-T89', duty: '行政' },
  { branch: '樂獅英語-新竹二重分校\n樂獅英語-竹北安興分校', name: 'Anna', staffCode: 'P568-T84', duty: '外師' },
  { branch: '樂獅英語-新竹二重分校', name: '林雅心 (Alison)', staffCode: 'P568-T79', duty: '組長' },
  { branch: '樂獅英語-新竹二重分校', name: '莊之嫺 (Ginny)', staffCode: 'P568-T73', duty: '老師' },
  { branch: '樂獅英語-竹北安興分校', name: '詹示稜 (Ella)', staffCode: 'P568-T66', duty: '老師' },
  { branch: '樂獅英語-新竹二重分校', name: 'Nicole', staffCode: 'P568-T63', duty: '老師' },
  { branch: '樂獅英語-新竹二重分校\n樂獅英語-竹北安興分校', name: '鄭千湄 (Crystal)', staffCode: 'P568-T58', duty: '老師' },
  { branch: '樂獅英語-新竹二重分校', name: 'Claire', staffCode: 'P568-T29', duty: '外師' },
  { branch: '樂獅英語-新竹二重分校', name: '蘇庭萱 (Sylvia)', staffCode: 'P568-T24', duty: '兼任老師' },
  { branch: '樂獅英語-新竹二重分校', name: '蘇瑜敏 (Rachel)', staffCode: 'P568-T9', duty: '兼任老師' },
  { branch: '樂獅英語-新竹二重分校', name: '林采蓉 (Ruby)', staffCode: 'P568-T7', duty: '組長' },
  { branch: '樂獅英語-新竹二重分校\n樂獅英語-竹北安興分校', name: '林裕富 (JACK)', staffCode: 'P568-T1', duty: '老闆' },
];

function doGet(e) {
  if (e && e.parameter && e.parameter.api) {
    return handleDashboardMonthlyApiRequest_(e);
  }

  if (e && e.parameter && e.parameter.action === 'checkReferenceSheets') {
    return ContentService.createTextOutput(JSON.stringify(checkReferenceSheets()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e && e.parameter && e.parameter.action === 'listUsers') {
    const users = parseJson_(listUsers(null), []);
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      users,
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (e && e.parameter && e.parameter.action === 'loginTest') {
    try {
      const result = parseJson_(login(e.parameter.account || '', e.parameter.password || ''), null);
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        user: result ? result.user : null,
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        message: error && error.message ? error.message : String(error),
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  ensureDatabase_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(META.systemName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function handleDashboardMonthlyApiRequest_(e) {
  ensureDatabase_();

  try {
    requireDashboardMonthlyApiToken_(e);

    const apiName = String(e.parameter.api || '').trim();
    if (apiName === 'dashboardMonthlySummary') {
      return jsonContentOutput_(buildDashboardMonthlySummaryApi_(e.parameter));
    }
    if (apiName === 'dashboardMonthlyReports') {
      return jsonContentOutput_(buildDashboardMonthlyReportsApi_(e.parameter));
    }
    if (apiName === 'dashboardMonthlyStaffMap') {
      return jsonContentOutput_(buildDashboardMonthlyStaffMapApi_(e.parameter));
    }

    return jsonContentOutput_({
      ok: false,
      api: apiName,
      error_code: 'INVALID_API',
      message: '不支援的 API 名稱',
    });
  } catch (error) {
    return jsonContentOutput_({
      ok: false,
      api: e && e.parameter ? String(e.parameter.api || '') : '',
      error_code: error && error.code ? error.code : 'SYSTEM_ERROR',
      message: error && error.message ? error.message : String(error),
    });
  }
}

function buildDashboardMonthlySummaryApi_(params) {
  const periodId = normalizeDashboardApiPeriod_(params.period);
  const requestedBranch = normalizeOfficialBranchName_(params.branch || '');
  const state = loadState_();
  const activeUsers = getDashboardMonthlyApiUsers_(state.users);
  const monthReports = (state.reports || []).filter((report) => normalizeMonthKey_(report.month) === periodId);
  const branchNames = collectDashboardMonthlyBranchNames_(activeUsers, monthReports, requestedBranch);
  const branchProgress = branchNames.map((branchName) => buildDashboardMonthlyBranchSummary_(periodId, branchName, activeUsers, monthReports));
  const summaryAll = summarizeDashboardMonthlyBranchProgress_(branchProgress);

  return {
    ok: true,
    api: 'dashboardMonthlySummary',
    period_id: periodId,
    generated_at: new Date().toISOString(),
    source_version: 'monthly-api-v1',
    summary_all: summaryAll,
    branch_progress: branchProgress,
  };
}

function buildDashboardMonthlyReportsApi_(params) {
  const periodId = normalizeDashboardApiPeriod_(params.period);
  const requestedBranch = normalizeOfficialBranchName_(params.branch || '');
  const updatedAfter = normalizeDashboardApiDateTime_(params.updatedAfter || '');
  const page = Math.max(1, parsePositiveInt_(params.page, 1));
  const pageSize = Math.min(1000, Math.max(1, parsePositiveInt_(params.pageSize, 200)));
  const state = loadState_();
  const decoratedReports = (state.reports || [])
    .filter((report) => normalizeMonthKey_(report.month) === periodId)
    .filter((report) => requestedBranch ? dashboardMonthlyRecordMatchesBranch_(report, state.users, requestedBranch) : true)
    .filter((report) => updatedAfter ? String(report.updatedAt || '') >= updatedAfter : true)
    .map((report) => buildDashboardMonthlyReportRecord_(report, state.users))
    .sort((left, right) => String(right.updated_at || '').localeCompare(String(left.updated_at || '')));

  const total = decoratedReports.length;
  const startIndex = (page - 1) * pageSize;
  const records = decoratedReports.slice(startIndex, startIndex + pageSize);

  return {
    ok: true,
    api: 'dashboardMonthlyReports',
    period_id: periodId,
    page: page,
    page_size: pageSize,
    record_count: total,
    generated_at: new Date().toISOString(),
    records: records,
  };
}

function buildDashboardMonthlyStaffMapApi_() {
  const state = loadState_();
  const records = getDashboardMonthlyApiUsers_(state.users)
    .map((user) => {
      const branchNames = normalizeOfficialBranchNames_(user.branch);
      const classNames = (user.defaultClassAssignments || [])
        .map((item) => String(item.className || '').trim())
        .filter(Boolean);
      return {
        employee_id: user.id,
        employee_name: user.name,
        branch_name: branchNames[0] || '',
        branch_names: branchNames,
        class_name: classNames[0] || '',
        class_names: classNames,
        is_active: true,
        staff_code: user.staffCode || '',
        title: user.title || '',
        duty: user.duty || '',
      };
    })
    .sort((left, right) => {
      return `${left.branch_name} ${left.employee_name}`.localeCompare(`${right.branch_name} ${right.employee_name}`, 'zh-Hant');
    });

  return {
    ok: true,
    api: 'dashboardMonthlyStaffMap',
    generated_at: new Date().toISOString(),
    records: records,
  };
}

function buildDashboardMonthlyBranchSummary_(periodId, branchName, users, reports) {
  const expectedUsers = (users || []).filter((user) => normalizeOfficialBranchNames_(user.branch).indexOf(branchName) >= 0);
  const branchReports = (reports || []).filter((report) => dashboardMonthlyRecordMatchesBranch_(report, users, branchName));
  const draftReports = branchReports.filter((report) => report.status === 'draft').length;
  const submittedReports = branchReports.filter((report) => report.status === 'submitted').length;
  const reviewedReports = branchReports.filter((report) => report.status === 'reviewed').length;
  const needsRevisionReports = branchReports.filter((report) => report.status === 'needs_revision').length;

  return {
    period_id: periodId,
    branch_name: branchName,
    expected_reports: expectedUsers.length,
    draft_reports: draftReports,
    submitted_reports: submittedReports,
    reviewed_reports: reviewedReports,
    needs_revision_reports: needsRevisionReports,
    pending_total: draftReports + needsRevisionReports,
  };
}

function summarizeDashboardMonthlyBranchProgress_(branchProgress) {
  return (branchProgress || []).reduce((summary, item) => {
    summary.period_id = summary.period_id || item.period_id || '';
    summary.expected_reports += Number(item.expected_reports || 0);
    summary.draft_reports += Number(item.draft_reports || 0);
    summary.submitted_reports += Number(item.submitted_reports || 0);
    summary.reviewed_reports += Number(item.reviewed_reports || 0);
    summary.needs_revision_reports += Number(item.needs_revision_reports || 0);
    summary.pending_total += Number(item.pending_total || 0);
    return summary;
  }, {
    period_id: '',
    expected_reports: 0,
    draft_reports: 0,
    submitted_reports: 0,
    reviewed_reports: 0,
    needs_revision_reports: 0,
    pending_total: 0,
  });
}

function buildDashboardMonthlyReportRecord_(report, users) {
  const decorated = decorateReport_(report, users);
  const reportUser = (users || []).find((user) => user.id === decorated.userId);
  const branchNames = normalizeOfficialBranchNames_(decorated.branch || (reportUser && reportUser.branch) || '');
  const classNames = extractDashboardMonthlyClassNames_(decorated);

  return {
    report_id: decorated.id || '',
    period_id: normalizeMonthKey_(decorated.month),
    branch_name: branchNames[0] || '',
    branch_names: branchNames,
    employee_id: decorated.userId || '',
    employee_name: decorated.userName || '',
    class_name: classNames[0] || '',
    class_names: classNames,
    status: normalizeDashboardMonthlyStatus_(decorated.status),
    review_note: String(decorated.reviewerNote || getLatestDashboardMonthlyReviewNote_(decorated.reviewHistory) || ''),
    submitted_at: decorated.submittedAt || '',
    reviewed_at: getLatestDashboardMonthlyReviewedAt_(decorated.reviewHistory),
    updated_at: decorated.updatedAt || '',
    overall_score: decorated.scores && decorated.scores.overall !== undefined ? Number(decorated.scores.overall || 0) : 0,
  };
}

function extractDashboardMonthlyClassNames_(report) {
  const assignments = Array.isArray(report && report.data && report.data.classAssignments)
    ? report.data.classAssignments
    : [];
  return assignments
    .map((item) => String(item.className || '').trim())
    .filter(Boolean);
}

function getLatestDashboardMonthlyReviewNote_(reviewHistory) {
  const item = (Array.isArray(reviewHistory) ? reviewHistory : [])
    .slice()
    .reverse()
    .filter((entry) => String(entry.reviewerNote || '').trim())[0];
  return item ? String(item.reviewerNote || '') : '';
}

function getLatestDashboardMonthlyReviewedAt_(reviewHistory) {
  const item = (Array.isArray(reviewHistory) ? reviewHistory : [])
    .slice()
    .reverse()
    .filter((entry) => String(entry.status || '') === 'reviewed')[0];
  return item ? String(item.reviewedAt || '') : '';
}

function collectDashboardMonthlyBranchNames_(users, reports, requestedBranch) {
  const lookup = {};
  const branchNames = [];

  (users || []).forEach((user) => {
    normalizeOfficialBranchNames_(user.branch).forEach((branchName) => {
      if (!branchName || lookup[branchName]) return;
      lookup[branchName] = true;
      branchNames.push(branchName);
    });
  });

  (reports || []).forEach((report) => {
    normalizeOfficialBranchNames_(report.branch).forEach((branchName) => {
      if (!branchName || lookup[branchName]) return;
      lookup[branchName] = true;
      branchNames.push(branchName);
    });
  });

  const sorted = branchNames.sort((left, right) => left.localeCompare(right, 'zh-Hant'));
  if (requestedBranch) {
    return sorted.filter((branchName) => branchName === requestedBranch);
  }
  return sorted;
}

function getDashboardMonthlyApiUsers_(users) {
  return (users || []).filter((user) => user && user.role !== 'manager');
}

function dashboardMonthlyRecordMatchesBranch_(report, users, branchName) {
  const reportBranchNames = normalizeOfficialBranchNames_(report && report.branch ? report.branch : '');
  if (reportBranchNames.indexOf(branchName) >= 0) {
    return true;
  }

  const reportUser = (users || []).find((user) => user.id === report.userId);
  if (!reportUser) {
    return false;
  }

  return normalizeOfficialBranchNames_(reportUser.branch).indexOf(branchName) >= 0;
}

function normalizeDashboardMonthlyStatus_(status) {
  const value = String(status || '').trim();
  if (['draft', 'submitted', 'reviewed', 'needs_revision'].indexOf(value) >= 0) {
    return value;
  }
  return 'draft';
}

function normalizeDashboardApiPeriod_(value) {
  const periodId = normalizeMonthKey_(value || '');
  if (!/^\d{4}-\d{2}$/.test(periodId)) {
    throw dashboardApiError_('INVALID_PERIOD', 'period 格式錯誤，需為 YYYY-MM');
  }
  return periodId;
}

function normalizeDashboardApiDateTime_(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return text;
}

function normalizeOfficialBranchNames_(raw) {
  const parts = String(raw || '')
    .split(/\r?\n|\/|,|，|\|/)
    .map((item) => normalizeOfficialBranchName_(item))
    .filter(Boolean);
  const lookup = {};
  return parts.filter((item) => {
    if (lookup[item]) return false;
    lookup[item] = true;
    return true;
  });
}

function normalizeOfficialBranchName_(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (text.indexOf('全部分校') >= 0 || String(text).toLowerCase() === 'all') return '';
  if (text.indexOf('二重') >= 0) return '二重分校';
  if (text.indexOf('安興') >= 0) return '安興分校';
  return text
    .replace(/^樂獅英語[-－]*/g, '')
    .replace(/^新竹/g, '')
    .replace(/^竹北/g, '')
    .trim();
}

function requireDashboardMonthlyApiToken_(e) {
  const configuredToken = getDashboardMonthlyApiToken_();
  if (!configuredToken) {
    throw dashboardApiError_('UNAUTHORIZED', '尚未設定月報 Dashboard API token');
  }

  const providedToken = String((e && e.parameter && e.parameter.token) || '').trim();
  if (!providedToken || providedToken !== configuredToken) {
    throw dashboardApiError_('UNAUTHORIZED', 'token 驗證失敗');
  }
}

function getDashboardMonthlyApiToken_() {
  return String(PropertiesService.getScriptProperties().getProperty(APP.dashboardApiTokenKey) || DEFAULT_DASHBOARD_MONTHLY_API_TOKEN || '').trim();
}

function rotateMonthlyDashboardApiToken() {
  const token = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(APP.dashboardApiTokenKey, token);
  return {
    ok: true,
    token: token,
    propertyKey: APP.dashboardApiTokenKey,
  };
}

function setMonthlyDashboardApiToken(token) {
  const value = String(token || '').trim();
  if (!value) {
    throw new Error('請提供 token');
  }
  PropertiesService.getScriptProperties().setProperty(APP.dashboardApiTokenKey, value);
  return {
    ok: true,
    token: value,
    propertyKey: APP.dashboardApiTokenKey,
  };
}

function getMonthlyDashboardApiConfig() {
  return {
    ok: true,
    propertyKey: APP.dashboardApiTokenKey,
    hasToken: Boolean(getDashboardMonthlyApiToken_()),
    webAppUrl: getWebAppUrl_(),
    apis: [
      'dashboardMonthlySummary',
      'dashboardMonthlyReports',
      'dashboardMonthlyStaffMap',
    ],
  };
}

function dashboardApiError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function jsonContentOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePositiveInt_(value, fallback) {
  const parsed = Number(value);
  if (!parsed || Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function login(account, password) {
  ensureDatabase_();
  const state = loadState_();
  const user = state.users.find((item) => item.account === String(account || '').trim().toLowerCase());
  if (!user || !verifyPassword_(password, user.passwordHash)) {
    throw new Error('帳號或密碼錯誤');
  }

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    `${APP.sessionPrefix}${token}`,
    JSON.stringify({ userId: user.id, createdAt: new Date().toISOString(), mustChangePassword: Boolean(user.mustChangePassword) }),
    APP.sessionTtlSeconds,
  );

  return jsonResult_({ token, user: sanitizeUser_(user) });
}

function me(token) {
  const session = requireSession_(token);
  return jsonResult_(sanitizeUser_(session.user));
}

function bootstrap(token, month) {
  const session = requireSession_(token);
  const state = loadState_();
  const activeMonth = normalizeMonthKey_(month || currentMonth_());
  const isManagerRole = session.user.role === 'manager';

  return jsonResult_({
    metadata: state.metadata,
    activeMonth,
    roles: ['teacher', 'tutor', 'assistant', 'admin', 'manager'],
    statuses: ['draft', 'submitted', 'reviewed', 'needs_revision'],
    users: isManagerRole ? state.users.map((user) => sanitizeUser_(user, state.reports)) : [sanitizeUser_(session.user, state.reports)],
    dashboard: isManagerRole
      ? buildDashboard_(activeMonth, state.reports, state.users)
      : buildPersonalDashboard_(activeMonth, state.reports, session.user),
    referenceDashboard: null,
    permissionMatrix: buildPermissionMatrix_(),
    notificationLogs: isManagerRole ? (state.notificationLogs || []).slice(-20).reverse() : [],
    recentReports: state.reports
      .filter((report) => isManagerRole ? normalizeMonthKey_(report.month) === activeMonth : report.userId === session.user.id)
      .map((report) => decorateReport_(report, state.users))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    currentUser: sanitizeUser_(session.user, state.reports),
  });
}

function getReferenceDashboard(token, month) {
  const session = requireSession_(token);
  const activeMonth = normalizeMonthKey_(month || currentMonth_());
  const referenceDashboard = loadReferenceDashboardCached_(activeMonth);
  return jsonResult_(session.user.role === 'manager'
    ? referenceDashboard
    : filterReferenceDashboardForUser_(referenceDashboard, session.user));
}

function listReports(token, filters) {
  const session = requireSession_(token);
  const state = loadState_();
  const month = normalizeMonthKey_(filters && filters.month ? filters.month : currentMonth_());
  const role = String(filters && filters.role ? filters.role : '');
  const status = String(filters && filters.status ? filters.status : '');
  const search = String(filters && filters.search ? filters.search : '').trim().toLowerCase();

  return jsonResult_(state.reports
    .filter((report) => normalizeMonthKey_(report.month) === month)
    .filter((report) => session.user.role === 'manager' || report.userId === session.user.id)
    .filter((report) => (role ? report.role === role : true))
    .filter((report) => (status ? report.status === status : true))
    .map((report) => decorateReport_(report, state.users))
    .filter((report) => {
      if (!search) return true;
      return [report.userName, report.role, report.status, report.branch].some((value) => String(value).toLowerCase().includes(search));
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
}

function getCurrentReport(token, userId, month) {
  const session = requireSession_(token);
  const state = loadState_();
  const activeMonth = normalizeMonthKey_(month || currentMonth_());
  const targetUserId = session.user.role === 'manager' ? String(userId || '') : session.user.id;
  const user = state.users.find((item) => item.id === targetUserId);

  if (!user || user.role === 'manager') {
    throw new Error('找不到可填報的使用者');
  }

  const existing = state.reports.find((report) => report.userId === targetUserId && normalizeMonthKey_(report.month) === activeMonth);
  const previousMonth = previousMonthKey_(activeMonth);
  const previousReport = state.reports.find((report) => report.userId === targetUserId && normalizeMonthKey_(report.month) === previousMonth);
  const report = existing || createBlankReport_(user, activeMonth, previousReport);
  if (existing && isPartTimeUser_(user) && existing.data && existing.data.partTimeContract) {
    return jsonResult_(decorateReport_(normalizeReport_({
      ...existing,
      data: normalizePartTimeReportData_(existing.data || {}, user),
    }, state.users), state.users));
  }
  return jsonResult_(decorateReport_(report, state.users));
}

function getReport(token, id) {
  const session = requireSession_(token);
  const state = loadState_();
  const report = state.reports.find((item) => item.id === id);

  if (!report) {
    throw new Error('找不到月報');
  }

  if (session.user.role !== 'manager' && report.userId !== session.user.id) {
    throw new Error('沒有權限查看這份月報');
  }

  const reportUser = state.users.find((user) => user.id === report.userId);
  if (reportUser && isPartTimeUser_(reportUser) && report.data && report.data.partTimeContract) {
    return jsonResult_(decorateReport_(normalizeReport_({
      ...report,
      data: normalizePartTimeReportData_(report.data || {}, reportUser),
    }, state.users), state.users));
  }

  return jsonResult_(decorateReport_(report, state.users));
}

function saveReport(token, payload) {
  const session = requireSession_(token);
  const state = loadState_();
  const userId = String(payload && payload.userId ? payload.userId : '');
  const targetUser = state.users.find((item) => item.id === userId);

  if (!targetUser) {
    throw new Error('找不到對應使用者');
  }

  if (session.user.role !== 'manager' && session.user.id !== userId) {
    throw new Error('你只能儲存自己的月報');
  }

  const now = new Date().toISOString();
  const isDraftSave = payload.status === 'draft';
  const month = isDraftSave
    ? normalizeMonthKey_(payload.month || currentMonth_())
    : inferReportMonthBySubmittedAt_(new Date(now));
  const existingIndex = state.reports.findIndex((item) => item.userId === userId && normalizeMonthKey_(item.month) === month);
  const existing = existingIndex >= 0 ? state.reports[existingIndex] : null;
  const submissionHistory = buildSubmissionHistory_(existing, payload, targetUser, session.user, now);
  const normalizedPayload = JSON.parse(JSON.stringify(payload || {}));
  if (targetUser.role === 'admin') {
    normalizedPayload.data = normalizedPayload.data || {};
    normalizedPayload.data.performanceMetrics = normalizedPayload.data.performanceMetrics || {};
    const metrics = normalizedPayload.data.performanceMetrics;
    metrics.entryStudentCount = Number(metrics.entryStudentCount ?? metrics.newEnrollments ?? 0);
    metrics.newEnrollments = metrics.entryStudentCount;
    metrics.entryStudentNotes = String(metrics.entryStudentNotes || '');
  }
  if (isPartTimeUser_(targetUser)) {
    normalizedPayload.data = normalizePartTimeReportData_(normalizedPayload.data || {}, targetUser);
  }
  if (isAssistantUser_(targetUser)) {
    normalizedPayload.data = normalizeAssistantReportData_(normalizedPayload.data || {});
  }
  const nextReport = normalizeReport_({
    ...normalizedPayload,
    id: String(payload.id || (existing ? existing.id : `r-${month}-${userId}`)),
    userId,
    month,
    branch: String(payload.branch || targetUser.branch || META.branchName),
    updatedAt: now,
    submittedAt: isDraftSave
      ? existing?.submittedAt || null
      : now,
    reviewHistory: Array.isArray(payload.reviewHistory) ? payload.reviewHistory : existing?.reviewHistory || [],
    submissionHistory,
    reviewerNote: String(payload.reviewerNote || existing?.reviewerNote || ''),
  }, state.users);
  const shouldNotifySubmission = shouldNotifyReportSubmission_(existing, nextReport);

  if (existingIndex >= 0) {
    state.reports[existingIndex] = nextReport;
  } else {
    state.reports.push(nextReport);
  }

  saveState_(state);
  let notificationSummary = null;
  if (shouldNotifySubmission) {
    notificationSummary = notifyManagersForSubmittedReport_(state, nextReport, targetUser, session.user);
    saveState_(state);
  }
  return jsonResult_({
    ...decorateReport_(nextReport, state.users),
    notificationSummary,
  });
}

function reviewReport(token, reportId, status, reviewerNote) {
  const session = requireSession_(token);
  if (session.user.role !== 'manager') {
    throw new Error('只有主管可以審核月報');
  }

  const state = loadState_();
  const index = state.reports.findIndex((item) => item.id === reportId);
  if (index < 0) {
    throw new Error('找不到月報');
  }

  const previous = state.reports[index];
  const now = new Date().toISOString();
  const reviewHistory = Array.isArray(previous.reviewHistory) ? previous.reviewHistory.slice() : [];
  reviewHistory.push({
    id: Utilities.getUuid(),
    status,
    reviewerId: session.user.id,
    reviewerName: session.user.name,
    reviewerNote: String(reviewerNote || ''),
    reviewedAt: now,
  });

  state.reports[index] = normalizeReport_({
    ...previous,
    status,
    reviewerNote: String(reviewerNote || ''),
    reviewHistory,
    updatedAt: now,
    submittedAt: previous.submittedAt || now,
  }, state.users);

  saveState_(state);
  return jsonResult_(decorateReport_(state.reports[index], state.users));
}

function exportReport(token, reportId, format) {
  const session = requireSession_(token);
  const state = loadState_();
  const report = state.reports.find((item) => item.id === reportId);

  if (!report) {
    throw new Error('找不到月報');
  }

  if (session.user.role !== 'manager' && report.userId !== session.user.id) {
    throw new Error('沒有權限匯出這份月報');
  }

  const decorated = decorateReport_(report, state.users);
  const exportFolder = getExportFolder_();
  const baseName = `月報-${decorated.month}-${decorated.userName}`;
  const doc = DocumentApp.create(`${baseName}-正式版`);
  const body = doc.getBody();

  body.clear();
  body.appendParagraph(META.schoolTitle).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`${META.systemName}｜${decorated.month}`);
  body.appendParagraph(`姓名：${decorated.userName}`);
  body.appendParagraph(`角色：${labelRole_(decorated.role, decorated)}`);
  body.appendParagraph(`狀態：${labelStatus_(decorated.status)}`);
  body.appendParagraph(`頁碼：請以 Google 文件列印時的頁面編號為準`);
  body.appendHorizontalRule();

  appendReportBody_(body, decorated);
  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const docxBlob = docFile.getAs(MimeType.MICROSOFT_WORD).setName(`${baseName}.docx`);
  const pdfBlob = docFile.getAs(MimeType.PDF).setName(`${baseName}.pdf`);
  const docxFile = exportFolder.createFile(docxBlob);
  const pdfFile = exportFolder.createFile(pdfBlob);

  return jsonResult_({
    docUrl: docxFile.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    folderUrl: exportFolder.getUrl(),
  });
}

function logout(token) {
  if (!token) return true;
  CacheService.getScriptCache().remove(`${APP.sessionPrefix}${token}`);
  return true;
}

function currentMonth_() {
  return Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM');
}

function inferReportMonthBySubmittedAt_(date) {
  const submittedAt = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const day = Number(Utilities.formatDate(submittedAt, 'Asia/Taipei', 'dd'));
  const submittedMonth = Utilities.formatDate(submittedAt, 'Asia/Taipei', 'yyyy-MM');
  if (day <= 10) {
    return previousMonthKey_(submittedMonth);
  }
  return submittedMonth;
}

function previousMonthKey_(month) {
  const [year, monthNumber] = normalizeMonthKey_(month || currentMonth_()).split('-').map(Number);
  if (!year || !monthNumber) {
    return currentMonth_();
  }
  return Utilities.formatDate(new Date(year, monthNumber - 2, 1), 'Asia/Taipei', 'yyyy-MM');
}

function normalizeMonthKey_(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Taipei', 'yyyy-MM');
  }
  const text = String(value || '').trim().replace(/^'/, '');
  const matched = text.match(/^(\d{4})[-/](\d{1,2})/);
  if (matched) {
    return `${matched[1]}-${String(Number(matched[2])).padStart(2, '0')}`;
  }
  return text.slice(0, 7);
}

function buildSubmissionHistory_(existing, payload, targetUser, actorUser, submittedAt) {
  const existingHistory = existing && Array.isArray(existing.submissionHistory)
    ? existing.submissionHistory.slice()
    : [];
  const payloadHistory = payload && Array.isArray(payload.submissionHistory)
    ? payload.submissionHistory
    : [];
  const history = existingHistory.length ? existingHistory : payloadHistory.slice();
  if (!payload || payload.status === 'draft') {
    return history;
  }

  const action = existing && existing.status === 'needs_revision'
    ? 'resubmitted_after_revision'
    : history.length
      ? 'resubmitted'
      : 'submitted';

  history.push({
    id: Utilities.getUuid(),
    action,
    userId: targetUser.id,
    userName: targetUser.name || targetUser.account || targetUser.id,
    actorId: actorUser.id,
    actorName: actorUser.name || actorUser.account || actorUser.id,
    submittedAt,
    previousStatus: existing ? existing.status : '',
    month: inferReportMonthBySubmittedAt_(new Date(submittedAt)),
  });

  return history;
}

function isPartTimeUser_(user) {
  if (user && user.role === 'assistant') return false;
  const text = `${user?.duty || ''} ${user?.title || ''}`.toLowerCase();
  return isTeacherRole_(user?.role) && (text.includes('兼任') || text.includes('part'));
}

function isPartTimeReport_(report) {
  return report && isTeacherRole_(report.role) && Boolean(report.data && report.data.partTimeContract);
}

function isAssistantUser_(user) {
  return user && user.role === 'assistant';
}

function isAssistantReport_(report) {
  return report && report.role === 'assistant' && Boolean(report.data && report.data.assistantTimesheet);
}

function isTeacherRole_(role) {
  return ['teacher', 'tutor', 'assistant'].indexOf(String(role || '')) >= 0;
}

function labelRole_(role, report) {
  if (isPartTimeReport_(report)) return '兼任老師';
  return {
    teacher: '英語老師',
    tutor: '課輔老師',
    assistant: '工讀助教',
    admin: '行政老師',
    manager: '主管',
  }[role] || role;
}

function buildPartTimeContractDefaults_(user) {
  const teachingHourlyRate = Number(user.teachingHourlyRate || 750);
  const adminHourlyRate = Number(user.adminHourlyRate || 350);
  return {
    teachingHourlyRate,
    adminHourlyRate,
    contractEndDate: user.contractEndDate || '2026-04-30',
    teachingHours: 0,
    adminHours: 0,
    rewardHourlyRate: teachingHourlyRate,
    hourlyDifference: Math.max(teachingHourlyRate - adminHourlyRate, 0),
    totalCompensation: 0,
    overpaidDifference: 0,
    contractorStatement: '本人確認以上所填寫之執行內容與時數均為屬實，且為本人自主安排完成之承攬成果。',
    contractorSignatureDate: '',
  };
}

function normalizePartTimeReportData_(data, user) {
  const output = JSON.parse(JSON.stringify(data || {}));
  const defaults = buildPartTimeContractDefaults_(user);
  const contract = {
    ...defaults,
    ...(output.partTimeContract || {}),
  };
  contract.teachingHourlyRate = Number(user.teachingHourlyRate || defaults.teachingHourlyRate);
  contract.adminHourlyRate = Number(user.adminHourlyRate || defaults.adminHourlyRate);
  contract.contractEndDate = user.contractEndDate || contract.contractEndDate || defaults.contractEndDate;
  contract.hourlyDifference = Math.max(contract.teachingHourlyRate - contract.adminHourlyRate, 0);
  output.partTimeRecords = Array.isArray(output.partTimeRecords) ? output.partTimeRecords : [];
  let teachingHours = 0;
  let adminHours = 0;
  output.partTimeRecords = output.partTimeRecords.map((record, index) => {
    const hours = Number(record.hours || 0);
    const category = record.category === 'admin' ? 'admin' : 'teaching';
    if (category === 'admin') {
      adminHours += hours;
    } else {
      teachingHours += hours;
    }
    return {
      id: record.id || `parttime-${index + 1}`,
      category,
      date: record.date || '',
      weekday: record.weekday || '',
      description: record.description || '',
      startTime: record.startTime || '',
      endTime: record.endTime || '',
      hours,
    };
  });
  contract.teachingHours = round1_(teachingHours);
  contract.adminHours = round1_(adminHours);
  contract.totalCompensation = round1_((contract.teachingHours + contract.adminHours) * contract.teachingHourlyRate);
  contract.overpaidDifference = round1_(contract.adminHours * contract.hourlyDifference);
  output.partTimeContract = contract;
  output.reflection = output.reflection || {
    wins: '',
    fixes: '',
    upwardFeedback: '',
    teamPraise: '',
    nextMonthGoal: '',
    selfEvaluation: 8,
    selfEvaluationReason: '',
  };
  return output;
}

function syncPartTimeReportsForUser_(state, user) {
  if (!state || !user || !isPartTimeUser_(user)) {
    return 0;
  }

  let updatedCount = 0;
  state.reports = (state.reports || []).map((report) => {
    if (report.userId !== user.id || !report.data || !report.data.partTimeContract) {
      return report;
    }
    updatedCount += 1;
    return normalizeReport_({
      ...report,
      data: normalizePartTimeReportData_(report.data || {}, user),
      updatedAt: new Date().toISOString(),
    }, state.users);
  });
  return updatedCount;
}

function normalizeAssistantReportData_(data) {
  const output = JSON.parse(JSON.stringify(data || {}));
  output.assistantTimesheet = output.assistantTimesheet || {};
  const records = Array.isArray(output.assistantTimesheet.records) ? output.assistantTimesheet.records : [];
  let totalHours = 0;
  output.assistantTimesheet.records = records.map((record, index) => {
    const hours = Number(record.hours || 0);
    totalHours += hours;
    return {
      id: record.id || `assistant-${index + 1}`,
      date: record.date || '',
      weekday: record.weekday || '',
      description: record.description || '',
      timeRange: record.timeRange || '',
      hours,
    };
  });
  output.assistantTimesheet.totalHours = round1_(totalHours);
  output.reflection = output.reflection || {
    wins: '',
    fixes: '',
    upwardFeedback: '',
    nextMonthGoal: '',
    selfEvaluation: 8,
    selfEvaluationReason: '',
  };
  return output;
}

function ensureDatabase_(options) {
  const config = options || {};
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(5000);
  if (!hasLock) {
    return;
  }

  let spreadsheetId = '';
  try {
    const props = PropertiesService.getScriptProperties();
    spreadsheetId = props.getProperty(APP.dbPropertyKey);
    if (!spreadsheetId) {
      const spreadsheet = SpreadsheetApp.create(APP.spreadsheetName);
      spreadsheetId = spreadsheet.getId();
      props.setProperty(APP.dbPropertyKey, spreadsheetId);
      setupDatabase_(spreadsheet);
      return;
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    setupMissingSheets_(spreadsheet);
    ensureUsersSeed_(spreadsheet);
  } finally {
    lock.releaseLock();
  }

  if (config.syncReference) {
    maybeSyncReferenceDashboardData_(spreadsheetId, Boolean(config.forceSyncReference));
  }
}

function maybeSyncReferenceDashboardData_(spreadsheetId, force) {
  const sourceSpreadsheetId = getReferenceSpreadsheetId_();
  if (!spreadsheetId || !sourceSpreadsheetId) {
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const lastSyncKey = 'DASHBOARD_REFERENCE_LAST_SYNC_AT';
  const lastSyncAt = Number(props.getProperty(lastSyncKey) || 0);
  const syncIntervalMs = 6 * 60 * 60 * 1000;
  if (!force && Date.now() - lastSyncAt < syncIntervalMs) {
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return;
  }

  try {
    const targetSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
    syncReferenceDashboardData_(targetSpreadsheet, sourceSpreadsheetId);
    props.setProperty(lastSyncKey, String(Date.now()));
  } finally {
    lock.releaseLock();
  }
}

function setReferenceDashboardSpreadsheet(sourceSpreadsheetId) {
  PropertiesService.getScriptProperties().setProperty(APP.referenceSpreadsheetKey, String(sourceSpreadsheetId || '').trim());
  ensureDatabase_({ syncReference: true, forceSyncReference: true });
  return {
    ok: true,
    sourceSpreadsheetId: String(sourceSpreadsheetId || '').trim(),
  };
}

function getReferenceSpreadsheetId_() {
  return PropertiesService.getScriptProperties().getProperty(APP.referenceSpreadsheetKey)
    || DEFAULT_REFERENCE_SPREADSHEET_ID;
}

function setupDatabase_(spreadsheet) {
  setupMissingSheets_(spreadsheet);
  const usersSheet = spreadsheet.getSheetByName('Users');
  const settingsSheet = spreadsheet.getSheetByName('Settings');
  const reportsSheet = spreadsheet.getSheetByName('Reports');
  const notificationLogsSheet = spreadsheet.getSheetByName('NotificationLogs') || spreadsheet.insertSheet('NotificationLogs');

  replaceTable_(usersSheet, USER_HEADERS, USER_SEED.map((user) => [
    user.id,
    user.account,
    hashPassword_(user.password),
    user.name,
    user.role,
    user.branch,
    user.startDate,
    user.title,
    user.staffCode || '',
    user.duty || user.title || '',
    defaultMustChangePassword_(user.account),
    JSON.stringify(user.defaultClassAssignments || []),
    user.teachingHourlyRate || '',
    user.adminHourlyRate || '',
    user.contractEndDate || '',
    user.email || '',
    user.notifyByEmail === false ? false : true,
    user.lineTargetId || '',
    user.notifyByLine === true ? true : false,
    user.isNotificationReceiver === false ? false : user.role === 'manager',
  ]));

  replaceTable_(settingsSheet, ['key', 'value'], [
    ['systemName', META.systemName],
    ['branchName', META.branchName],
    ['schoolTitle', META.schoolTitle],
  ]);

  replaceTable_(reportsSheet, [
    'id', 'userId', 'role', 'month', 'branch', 'status', 'updatedAt', 'submittedAt', 'reviewerNote', 'reviewHistoryJson', 'submissionHistoryJson', 'dataJson', 'scoresJson',
  ], []);
  replaceTable_(notificationLogsSheet, NOTIFICATION_LOG_HEADERS, []);
}

function setupMissingSheets_(spreadsheet) {
  const ensure = (name, headers) => {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(name);
    }
    if (headers && headers.length > 0) {
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      } else {
        ensureTableHeaders_(sheet, headers);
      }
    }
    return sheet;
  };

  ensure('Users', USER_HEADERS);
  ensure('Reports', ['id', 'userId', 'role', 'month', 'branch', 'status', 'updatedAt', 'submittedAt', 'reviewerNote', 'reviewHistoryJson', 'submissionHistoryJson', 'dataJson', 'scoresJson']);
  ensure('NotificationLogs', NOTIFICATION_LOG_HEADERS);
  ensure('Settings', ['key', 'value']);
  ensure('Reference_WeeklyRecords', []);
  ensure('Reference_WeeklyDrafts', []);
  ensure('Reference_WeeklyClasses', []);
  ensure('Reference_AdminMonthly', []);
  ensure('Reference_TeacherLoads', []);
  ensure('Reference_LeadReasonSummary', []);
  ensure('Reference_AuditLog', []);
}

function ensureUsersSeed_(spreadsheet) {
  const usersSheet = spreadsheet.getSheetByName('Users');
  if (!usersSheet || usersSheet.getLastRow() > 1) {
    return;
  }

  replaceTable_(usersSheet, USER_HEADERS, USER_SEED.map((user) => [
    user.id,
    user.account,
    hashPassword_(user.password),
    user.name,
    user.role,
    user.branch,
    user.startDate,
    user.title,
    user.staffCode || '',
    user.duty || user.title || '',
    defaultMustChangePassword_(user.account),
    JSON.stringify(user.defaultClassAssignments || []),
    user.teachingHourlyRate || '',
    user.adminHourlyRate || '',
    user.contractEndDate || '',
    user.email || '',
    user.notifyByEmail === false ? false : true,
    user.lineTargetId || '',
    user.notifyByLine === true ? true : false,
    user.isNotificationReceiver === false ? false : user.role === 'manager',
  ]));
}

function syncReferenceDashboardData_(targetSpreadsheet, sourceSpreadsheetId) {
  const source = SpreadsheetApp.openById(sourceSpreadsheetId);
  const mappings = [
    ['weekly_records', 'Reference_WeeklyRecords'],
    ['weekly_drafts', 'Reference_WeeklyDrafts'],
    ['weekly_classes', 'Reference_WeeklyClasses'],
    ['admin_monthly', 'Reference_AdminMonthly'],
    ['teacher_loads', 'Reference_TeacherLoads'],
    ['lead_reason_summary', 'Reference_LeadReasonSummary'],
    ['audit_log', 'Reference_AuditLog'],
  ];

  mappings.forEach(([sourceName, targetName]) => {
    const sourceSheet = source.getSheetByName(sourceName);
    const targetSheet = targetSpreadsheet.getSheetByName(targetName) || targetSpreadsheet.insertSheet(targetName);
    targetSheet.clearContents();
    if (!sourceSheet) {
      targetSheet.getRange(1, 1).setValue(`Missing source sheet: ${sourceName}`);
      return;
    }

    const lastRow = sourceSheet.getLastRow();
    const lastColumn = sourceSheet.getLastColumn();
    if (!lastRow || !lastColumn) {
      return;
    }

    const values = sourceSheet.getRange(1, 1, lastRow, lastColumn).getValues();
    targetSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  });
}

function loadState_() {
  const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(APP.dbPropertyKey));
  const usersSheet = spreadsheet.getSheetByName('Users');
  const settingsSheet = spreadsheet.getSheetByName('Settings');
  const reportsSheet = spreadsheet.getSheetByName('Reports');
  const notificationLogsSheet = spreadsheet.getSheetByName('NotificationLogs') || spreadsheet.insertSheet('NotificationLogs');

  const settingsRows = readTable_(settingsSheet);
  const metadata = {
    systemName: settingsRows.systemName || META.systemName,
    branchName: settingsRows.branchName || META.branchName,
    schoolTitle: settingsRows.schoolTitle || META.schoolTitle,
  };

  const users = readTable_(usersSheet).map((row) => ({
    id: row.id,
    account: row.account,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    branch: row.branch,
    startDate: row.startDate,
    title: row.title,
    staffCode: row.staffCode || '',
    duty: row.duty || row.title || '',
    teachingHourlyRate: Number(row.teachingHourlyRate || 0),
    adminHourlyRate: Number(row.adminHourlyRate || 0),
    contractEndDate: row.contractEndDate || '',
    email: String(row.email || '').trim(),
    notifyByEmail: row.notifyByEmail === undefined || row.notifyByEmail === null || row.notifyByEmail === ''
      ? true
      : String(row.notifyByEmail).toLowerCase() !== 'false',
    lineTargetId: String(row.lineTargetId || '').trim(),
    notifyByLine: row.notifyByLine === undefined || row.notifyByLine === null || row.notifyByLine === ''
      ? false
      : String(row.notifyByLine).toLowerCase() === 'true',
    isNotificationReceiver: row.isNotificationReceiver === undefined || row.isNotificationReceiver === null || row.isNotificationReceiver === ''
      ? row.role === 'manager'
      : String(row.isNotificationReceiver).toLowerCase() !== 'false',
    mustChangePassword: row.mustChangePassword === undefined || row.mustChangePassword === null || row.mustChangePassword === ''
      ? defaultMustChangePassword_(row.account)
      : String(row.mustChangePassword).toLowerCase() !== 'false',
    defaultClassAssignments: parseJson_(row.defaultClassAssignmentsJson, []),
  }));

  const reports = readTable_(reportsSheet).map((row) => normalizeReport_({
    id: row.id,
    userId: row.userId,
    role: row.role,
    month: normalizeMonthKey_(row.month),
    branch: row.branch,
    status: row.status,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt || null,
    reviewerNote: row.reviewerNote || '',
    reviewHistory: parseJson_(row.reviewHistoryJson, []),
    submissionHistory: parseJson_(row.submissionHistoryJson, []),
    data: parseJson_(row.dataJson, {}),
    scores: parseJson_(row.scoresJson, { performance: 0, selfEvaluation: 0, execution: null, overall: 0 }),
  }, users));

  const notificationLogs = readTable_(notificationLogsSheet).map((row) => ({
    id: row.id || Utilities.getUuid(),
    reportId: row.reportId || '',
    month: normalizeMonthKey_(row.month || currentMonth_()),
    senderUserId: row.senderUserId || '',
    senderName: row.senderName || '',
    receiverUserId: row.receiverUserId || '',
    receiverName: row.receiverName || '',
    channel: row.channel || 'email',
    target: row.target || '',
    status: row.status || '',
    subject: row.subject || '',
    message: row.message || '',
    errorMessage: row.errorMessage || '',
    createdAt: row.createdAt || '',
  }));

  return { metadata, users, reports, notificationLogs };
}

function loadReferenceDashboard_(month) {
  const sourceSpreadsheetId = getReferenceSpreadsheetId_();
  if (!sourceSpreadsheetId) {
    return null;
  }

  const spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetId);
  const weeklyRecords = readTable_(spreadsheet.getSheetByName('weekly_records'));
  const weeklyDrafts = readTable_(spreadsheet.getSheetByName('weekly_drafts'));
  const weeklyClasses = readTable_(spreadsheet.getSheetByName('weekly_classes'));
  const adminMonthly = readTable_(spreadsheet.getSheetByName('admin_monthly'));
  const teacherLoads = readTable_(spreadsheet.getSheetByName('teacher_loads'));
  const leadReasonSummary = readTable_(spreadsheet.getSheetByName('lead_reason_summary'));
  const auditLog = readTable_(spreadsheet.getSheetByName('audit_log'));

  const monthKey = String(month || '').slice(0, 7);
  const monthWeeklyRecords = weeklyRecords.filter((row) => {
    const startDate = String(row.startDate || '');
    const endDate = String(row.endDate || '');
    return (monthKey && (startDate.startsWith(monthKey) || endDate.startsWith(monthKey))) || !monthKey;
  });

  const weeklyRecordTotals = summarizeWeeklyRecords_(monthWeeklyRecords.length ? monthWeeklyRecords : weeklyRecords);
  const classSnapshots = groupWeeklyClasses_(weeklyClasses, monthWeeklyRecords.length ? monthWeeklyRecords : weeklyRecords);
  const displayWeeklyRecords = (monthWeeklyRecords.length ? monthWeeklyRecords : weeklyRecords.slice(-12))
    .slice()
    .sort((left, right) => String(right.startDate || right.endDate || '').localeCompare(String(left.startDate || left.endDate || '')));
  const teacherLoadRank = teacherLoads
    .map((row) => ({
      teacher: row.teacher || row.name || '',
      classCount: Number(row.classCount || 0),
      studentCount: Number(row.studentCount || 0),
      avgClassSize: Number(row.avgClassSize || 0),
      year: row.year || '',
      month: row.month || '',
    }))
    .sort((left, right) => right.studentCount - left.studentCount)
    .slice(0, 10);

  return {
    month: monthKey,
    weeklyRecords: displayWeeklyRecords,
    weeklyRecordTotals,
    weeklyDrafts: weeklyDrafts.slice(-10),
    weeklyClasses: classSnapshots,
    adminMonthly: adminMonthly
      .map((row) => ({
        period: row.period || '',
        year: row.year || '',
        month: row.month || '',
        studentTotal: Number(row.studentTotal || 0),
        inquiry: Number(row.inquiry || 0),
        levelTest: Number(row.levelTest || 0),
        trial: Number(row.trial || 0),
        newStudent: Number(row.newStudent || 0),
        transfer: Number(row.transfer || 0),
        lost: Number(row.lost || 0),
        deposit: Number(row.deposit || 0),
        note: row.note || '',
      }))
      .filter((row) => !monthKey || String(row.year || '').startsWith(monthKey.slice(0, 4)) || String(row.period || '').includes(monthKey.slice(2).replace('-', '/')))
      .sort((left, right) => {
        const leftKey = `${left.year || ''}-${String(left.month || '').padStart(2, '0')}-${left.period || ''}`;
        const rightKey = `${right.year || ''}-${String(right.month || '').padStart(2, '0')}-${right.period || ''}`;
        return String(rightKey).localeCompare(String(leftKey));
      })
      .slice(0, 12),
    teacherLoads: teacherLoadRank,
    leadReasonSummary: leadReasonSummary
      .map((row) => ({ reason: row.reason || '', count: Number(row.count || 0) }))
      .filter((row) => row.reason || row.count),
    auditLog: auditLog.slice(-12),
  };
}

function loadReferenceDashboardCached_(month) {
  const monthKey = normalizeMonthKey_(month || currentMonth_());
  const cache = CacheService.getScriptCache();
  const cacheKey = `reference-dashboard:${monthKey}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return parseJson_(cached, null);
  }

  const dashboard = loadReferenceDashboard_(monthKey);
  const serialized = JSON.stringify(dashboard || null);
  if (serialized.length < 90000) {
    cache.put(cacheKey, serialized, 10 * 60);
  }
  return dashboard;
}

function checkReferenceSheets() {
  const sourceSpreadsheetId = getReferenceSpreadsheetId_();
  if (!sourceSpreadsheetId) {
    return { ok: false, message: '未設定參考資料庫 ID。' };
  }

  const spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetId);
  const names = [
    'weekly_records',
    'weekly_drafts',
    'weekly_classes',
    'admin_monthly',
    'teacher_loads',
    'lead_reason_summary',
    'audit_log',
  ];

  return {
    ok: true,
    sourceSpreadsheetId,
    sheets: names.map((name) => {
      const sheet = spreadsheet.getSheetByName(name);
      const lastRow = sheet ? sheet.getLastRow() : 0;
      const lastColumn = sheet ? sheet.getLastColumn() : 0;
      return {
        name,
        exists: Boolean(sheet),
        rows: lastRow,
        cols: lastColumn,
        empty: !sheet || lastRow === 0 || lastColumn === 0,
      };
    }),
  };
}

function saveState_(state) {
  const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(APP.dbPropertyKey));
  const usersSheet = spreadsheet.getSheetByName('Users');
  const settingsSheet = spreadsheet.getSheetByName('Settings');
  const reportsSheet = spreadsheet.getSheetByName('Reports');
  const notificationLogsSheet = spreadsheet.getSheetByName('NotificationLogs') || spreadsheet.insertSheet('NotificationLogs');

  replaceTable_(usersSheet, USER_HEADERS, state.users.map((user) => [
    user.id,
    user.account,
    user.passwordHash,
    user.name,
    user.role,
    user.branch,
    user.startDate,
    user.title,
    user.staffCode || '',
    user.duty || user.title || '',
    Boolean(user.mustChangePassword),
    JSON.stringify(user.defaultClassAssignments || []),
    user.teachingHourlyRate || '',
    user.adminHourlyRate || '',
    user.contractEndDate || '',
    user.email || '',
    user.notifyByEmail === false ? false : true,
    user.lineTargetId || '',
    user.notifyByLine === true ? true : false,
    user.isNotificationReceiver === false ? false : user.role === 'manager',
  ]));

  replaceTable_(settingsSheet, ['key', 'value'], [
    ['systemName', state.metadata.systemName],
    ['branchName', state.metadata.branchName],
    ['schoolTitle', state.metadata.schoolTitle],
  ]);

  replaceTable_(reportsSheet, ['id', 'userId', 'role', 'month', 'branch', 'status', 'updatedAt', 'submittedAt', 'reviewerNote', 'reviewHistoryJson', 'submissionHistoryJson', 'dataJson', 'scoresJson'], state.reports.map((report) => [
    report.id,
    report.userId,
    report.role,
    normalizeMonthKey_(report.month),
    report.branch,
    report.status,
    report.updatedAt,
    report.submittedAt || '',
    report.reviewerNote || '',
    JSON.stringify(report.reviewHistory || []),
    JSON.stringify(report.submissionHistory || []),
    JSON.stringify(report.data || {}),
    JSON.stringify(report.scores || {}),
  ]));

  replaceTable_(notificationLogsSheet, NOTIFICATION_LOG_HEADERS, (state.notificationLogs || []).slice(-500).map((log) => [
    log.id,
    log.reportId,
    normalizeMonthKey_(log.month),
    log.senderUserId || '',
    log.senderName || '',
    log.receiverUserId || '',
    log.receiverName || '',
    log.channel || 'email',
    log.target || '',
    log.status || '',
    log.subject || '',
    log.message || '',
    log.errorMessage || '',
    log.createdAt || '',
  ]));
}

function shouldNotifyReportSubmission_(previousReport, nextReport) {
  return nextReport
    && nextReport.status === 'submitted'
    && (!previousReport || previousReport.status !== 'submitted');
}

function notifyManagersForSubmittedReport_(state, report, reportUser, actorUser) {
  const emailRecipients = getManagerEmailNotificationRecipients_(state, report);
  const lineRecipients = getManagerLineNotificationRecipients_(state, report);
  const subject = `[${META.schoolTitle}] ${reportUser.name} 已送出 ${report.month} 月報，請主管簽核`;
  const detailUrl = getWebAppUrl_();
  const roleName = labelRole_(report.role, report);
  const submittedAt = report.submittedAt || report.updatedAt || new Date().toISOString();
  const overallScore = report.scores && report.scores.overall !== undefined ? report.scores.overall : '';
  const selfScore = report.scores && report.scores.selfEvaluation !== undefined ? report.scores.selfEvaluation : '';
  const plainMessage = [
    `${reportUser.name} 已送出 ${report.month} 月報，請主管登入系統查看並簽核。`,
    '',
    `分校：${report.branch || reportUser.branch || META.branchName}`,
    `填表人：${reportUser.name}`,
    `身份：${roleName}`,
    `月份：${report.month}`,
    `送出時間：${submittedAt}`,
    `月報總分：${overallScore}`,
    `自評分數：${selfScore}`,
    detailUrl ? `月報系統：${detailUrl}` : '月報系統：請開啟目前月報系統網址',
  ].join('\n');
  const lineMessage = [
    `${META.schoolTitle}｜月報簽核通知`,
    `${reportUser.name} 已送出 ${report.month} 月報，請主管簽核。`,
    `身份：${roleName}`,
    `分校：${report.branch || reportUser.branch || META.branchName}`,
    `月報總分：${overallScore}`,
    `自評分數：${selfScore}`,
    detailUrl ? `月報系統：${detailUrl}` : '',
  ].filter(Boolean).join('\n');
  const htmlMessage = `
    <div style="font-family:'Noto Sans TC','Microsoft JhengHei',Arial,sans-serif;line-height:1.7;color:#1f2937;">
      <h2 style="margin:0 0 12px;">${escapeHtml_(META.schoolTitle)}｜月報簽核通知</h2>
      <p>${escapeHtml_(reportUser.name)} 已送出 ${escapeHtml_(report.month)} 月報，請主管登入系統查看並簽核。</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        ${emailRowHtml_('分校', report.branch || reportUser.branch || META.branchName)}
        ${emailRowHtml_('填表人', reportUser.name)}
        ${emailRowHtml_('身份', roleName)}
        ${emailRowHtml_('月份', report.month)}
        ${emailRowHtml_('送出時間', submittedAt)}
        ${emailRowHtml_('月報總分', overallScore)}
        ${emailRowHtml_('自評分數', selfScore)}
      </table>
      ${detailUrl ? `<p style="margin-top:18px;"><a href="${escapeHtml_(detailUrl)}" style="display:inline-block;background:#1d4ed8;color:white;text-decoration:none;padding:10px 16px;border-radius:10px;">開啟月報系統簽核</a></p>` : ''}
      <p style="color:#6b7280;font-size:13px;">此信由月報填報系統自動寄出。</p>
    </div>
  `;

  const summary = {
    ok: true,
    email: { sent: 0, failed: 0, skipped: 0 },
    line: { sent: 0, failed: 0, skipped: 0 },
    message: '',
  };

  if (!emailRecipients.length) {
    summary.email.skipped += 1;
    appendNotificationLog_(state, {
      report,
      senderUser: actorUser,
      receiverUser: null,
      channel: 'email',
      target: '',
      status: 'skipped',
      subject,
      message: '月報已送出，但尚未設定主管 Email，因此未寄出通知。',
      errorMessage: '',
    });
  }

  emailRecipients.forEach((recipient) => {
    try {
      MailApp.sendEmail(recipient.email, subject, plainMessage, {
        name: `${META.schoolTitle}月報系統`,
        htmlBody: htmlMessage,
      });
      summary.email.sent += 1;
      appendNotificationLog_(state, {
        report,
        senderUser: actorUser,
        receiverUser: recipient.user,
        channel: 'email',
        target: recipient.email,
        status: 'sent',
        subject,
        message: plainMessage,
        errorMessage: '',
      });
    } catch (error) {
      summary.email.failed += 1;
      summary.ok = false;
      appendNotificationLog_(state, {
        report,
        senderUser: actorUser,
        receiverUser: recipient.user,
        channel: 'email',
        target: recipient.email,
        status: 'failed',
        subject,
        message: plainMessage,
        errorMessage: error && error.message ? error.message : String(error),
      });
    }
  });

  const lineToken = getLineChannelAccessToken_();
  if (!lineRecipients.length) {
    summary.line.skipped += 1;
    appendNotificationLog_(state, {
      report,
      senderUser: actorUser,
      receiverUser: null,
      channel: 'line',
      target: '',
      status: 'skipped',
      subject,
      message: '月報已送出，但尚未設定主管 LINE Target ID，因此未寄出 LINE 通知。',
      errorMessage: '',
    });
  } else if (!lineToken) {
    summary.line.skipped += lineRecipients.length;
    summary.ok = false;
    lineRecipients.forEach((recipient) => appendNotificationLog_(state, {
      report,
      senderUser: actorUser,
      receiverUser: recipient.user,
      channel: 'line',
      target: recipient.lineTargetId,
      status: 'skipped',
      subject,
      message: lineMessage,
      errorMessage: '尚未設定 LINE_CHANNEL_ACCESS_TOKEN',
    }));
  } else {
    lineRecipients.forEach((recipient) => {
      try {
        sendLinePushMessage_(lineToken, recipient.lineTargetId, lineMessage);
        summary.line.sent += 1;
        appendNotificationLog_(state, {
          report,
          senderUser: actorUser,
          receiverUser: recipient.user,
          channel: 'line',
          target: recipient.lineTargetId,
          status: 'sent',
          subject,
          message: lineMessage,
          errorMessage: '',
        });
      } catch (error) {
        summary.line.failed += 1;
        summary.ok = false;
        appendNotificationLog_(state, {
          report,
          senderUser: actorUser,
          receiverUser: recipient.user,
          channel: 'line',
          target: recipient.lineTargetId,
          status: 'failed',
          subject,
          message: lineMessage,
          errorMessage: error && error.message ? error.message : String(error),
        });
      }
    });
  }

  summary.message = [
    `Email：成功 ${summary.email.sent} 筆，失敗 ${summary.email.failed} 筆，未寄出 ${summary.email.skipped} 筆。`,
    `LINE：成功 ${summary.line.sent} 筆，失敗 ${summary.line.failed} 筆，未寄出 ${summary.line.skipped} 筆。`,
  ].join(' ');
  return summary;
}

function getManagerEmailNotificationRecipients_(state, report) {
  const recipients = [];
  const seen = {};
  const addRecipient = (email, user) => {
    const normalizedEmail = String(email || '').trim();
    if (!isValidEmail_(normalizedEmail)) return;
    const key = normalizedEmail.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    recipients.push({ email: normalizedEmail, user: user || null });
  };

  (state.users || [])
    .filter((user) => user.role === 'manager')
    .filter((user) => user.notifyByEmail !== false)
    .filter((user) => user.isNotificationReceiver !== false)
    .filter((user) => notificationBranchMatches_(user.branch, report.branch))
    .forEach((user) => addRecipient(user.email, user));

  const fallbackEmails = PropertiesService
    .getScriptProperties()
    .getProperty('MONTHLY_REPORT_MANAGER_EMAILS');
  String(fallbackEmails || '')
    .split(/[,\n;\s]+/)
    .map((email) => email.trim())
    .filter(Boolean)
    .forEach((email) => addRecipient(email, null));

  return recipients;
}

function getManagerLineNotificationRecipients_(state, report) {
  const recipients = [];
  const seen = {};
  const addRecipient = (lineTargetId, user) => {
    const normalizedTarget = String(lineTargetId || '').trim();
    if (!normalizedTarget) return;
    if (seen[normalizedTarget]) return;
    seen[normalizedTarget] = true;
    recipients.push({ lineTargetId: normalizedTarget, user: user || null });
  };

  (state.users || [])
    .filter((user) => user.role === 'manager')
    .filter((user) => user.notifyByLine === true)
    .filter((user) => user.isNotificationReceiver !== false)
    .filter((user) => notificationBranchMatches_(user.branch, report.branch))
    .forEach((user) => addRecipient(user.lineTargetId, user));

  const fallbackTargets = PropertiesService
    .getScriptProperties()
    .getProperty('MONTHLY_REPORT_LINE_TARGET_IDS');
  splitNotificationTargets_(fallbackTargets)
    .forEach((lineTargetId) => addRecipient(lineTargetId, null));

  return recipients;
}

function getLineChannelAccessToken_() {
  return String(PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '').trim();
}

function sendLinePushMessage_(channelAccessToken, targetId, text) {
  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
    },
    payload: JSON.stringify({
      to: targetId,
      messages: [
        {
          type: 'text',
          text: String(text || '').slice(0, 4900),
        },
      ],
    }),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`LINE 通知失敗 HTTP ${code}：${response.getContentText()}`);
  }
}

function splitNotificationTargets_(value) {
  return String(value || '')
    .split(/[,\n;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function notificationBranchMatches_(managerBranch, reportBranch) {
  const managerValue = normalizeBranchForNotification_(managerBranch);
  const reportValue = normalizeBranchForNotification_(reportBranch);
  if (!managerValue || !reportValue) {
    return true;
  }
  return managerValue.indexOf(reportValue) >= 0 || reportValue.indexOf(managerValue) >= 0;
}

function normalizeBranchForNotification_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\u6a02\u7345\u82f1\u8a9e/g, '')
    .replace(/[()\s\-_/\\\uFF0F\u3001,\uFF0C|\uFF5C]+/g, '')
    .trim();
}

function appendNotificationLog_(state, data) {
  const now = new Date().toISOString();
  const receiverUser = data.receiverUser || {};
  const senderUser = data.senderUser || {};
  state.notificationLogs = Array.isArray(state.notificationLogs) ? state.notificationLogs : [];
  state.notificationLogs.push({
    id: Utilities.getUuid(),
    reportId: data.report?.id || '',
    month: normalizeMonthKey_(data.report?.month || currentMonth_()),
    senderUserId: senderUser.id || '',
    senderName: senderUser.name || '',
    receiverUserId: receiverUser.id || '',
    receiverName: receiverUser.name || (data.target ? '主管' : ''),
    channel: data.channel || 'email',
    target: data.target || '',
    status: data.status || '',
    subject: data.subject || '',
    message: data.message || '',
    errorMessage: data.errorMessage || '',
    createdAt: now,
  });
}

function getWebAppUrl_() {
  const propsUrl = PropertiesService.getScriptProperties().getProperty('MONTHLY_REPORT_WEB_APP_URL');
  if (propsUrl) {
    return propsUrl;
  }
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (error) {
    return '';
  }
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function emailRowHtml_(label, value) {
  return `
    <tr>
      <th style="text-align:left;background:#f3f4f6;border:1px solid #e5e7eb;padding:8px 10px;width:140px;">${escapeHtml_(label)}</th>
      <td style="border:1px solid #e5e7eb;padding:8px 10px;">${escapeHtml_(value ?? '')}</td>
    </tr>
  `;
}

function readTable_(sheet) {
  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return sheet.getLastColumn() ? [] : [];
  }

  const headers = values.shift();
  return values
    .filter((row) => row.some((value) => value !== ''))
    .map((row) => headers.reduce((acc, header, index) => {
      acc[String(header)] = row[index];
      return acc;
    }, {}));
}

function replaceTable_(sheet, headers, rows) {
  sheet.clearContents();
  if (!headers || !headers.length) {
    return;
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows && rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function ensureTableHeaders_(sheet, requiredHeaders) {
  const lastColumn = sheet.getLastColumn();
  const currentHeaders = lastColumn
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map((header) => String(header || ''))
    : [];
  const missingHeaders = requiredHeaders.filter((header) => currentHeaders.indexOf(header) < 0);
  if (!missingHeaders.length) {
    return;
  }
  sheet.getRange(1, currentHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
}

function requireSession_(token) {
  const raw = CacheService.getScriptCache().get(`${APP.sessionPrefix}${String(token || '')}`);
  if (!raw) {
    throw new Error('請先登入');
  }

  const session = parseJson_(raw, null);
  if (!session || !session.userId) {
    throw new Error('請先登入');
  }

  const state = loadState_();
  const user = state.users.find((item) => item.id === session.userId);
  if (!user) {
    throw new Error('請先登入');
  }

  return { user, session };
}

function sanitizeUser_(user, reports) {
  const latestPartTimeContract = getLatestPartTimeContractForUser_(reports || [], user.id);
  const output = {
    id: user.id,
    account: user.account,
    name: user.name,
    role: user.role,
    branch: user.branch,
    startDate: user.startDate,
    title: user.title,
    staffCode: user.staffCode || '',
    duty: user.duty || user.title || '',
    email: user.email || '',
    notifyByEmail: user.notifyByEmail === false ? false : true,
    lineTargetId: user.lineTargetId || '',
    notifyByLine: user.notifyByLine === true ? true : false,
    isNotificationReceiver: user.isNotificationReceiver === false ? false : user.role === 'manager',
    teachingHourlyRate: Number(user.teachingHourlyRate || latestPartTimeContract?.teachingHourlyRate || 0),
    adminHourlyRate: Number(user.adminHourlyRate || latestPartTimeContract?.adminHourlyRate || 0),
    contractEndDate: user.contractEndDate || latestPartTimeContract?.contractEndDate || '',
    latestPartTimeContract,
    isPartTimeTeacher: isPartTimeUser_(user),
    defaultClassAssignments: user.defaultClassAssignments || [],
    mustChangePassword: Boolean(user.mustChangePassword),
  };
  return output;
}

function getLatestPartTimeContractForUser_(reports, userId) {
  const latestReport = (Array.isArray(reports) ? reports : [])
    .filter((report) => report.userId === userId && report.data && report.data.partTimeContract)
    .sort((left, right) => {
      const rightKey = `${normalizeMonthKey_(right.month)} ${right.updatedAt || right.submittedAt || ''}`;
      const leftKey = `${normalizeMonthKey_(left.month)} ${left.updatedAt || left.submittedAt || ''}`;
      return String(rightKey).localeCompare(String(leftKey));
    })[0];

  if (!latestReport) {
    return null;
  }

  const contract = latestReport.data.partTimeContract || {};
  return {
    reportId: latestReport.id || '',
    month: normalizeMonthKey_(latestReport.month),
    teachingHourlyRate: Number(contract.teachingHourlyRate || 0),
    adminHourlyRate: Number(contract.adminHourlyRate || 0),
    contractEndDate: contract.contractEndDate || '',
  };
}

function jsonResult_(value) {
  return JSON.stringify(value);
}

function updatePassword(token, currentPassword, nextPassword) {
  const session = requireSession_(token);
  const state = loadState_();
  const userIndex = state.users.findIndex((item) => item.id === session.user.id);
  if (userIndex < 0) {
    throw new Error('請先登入');
  }

  const user = state.users[userIndex];
  if (!verifyPassword_(currentPassword, user.passwordHash)) {
    throw new Error('目前密碼輸入錯誤');
  }

  const trimmedNext = String(nextPassword || '').trim();
  if (trimmedNext.length < 6) {
    throw new Error('新密碼至少需要 6 碼');
  }

  state.users[userIndex] = {
    ...user,
    passwordHash: hashPassword_(trimmedNext),
    mustChangePassword: false,
  };
  saveState_(state);
  return jsonResult_({ ok: true, user: sanitizeUser_(state.users[userIndex]) });
}

function listUsers(token) {
  ensureDatabase_();
  if (token) {
    const session = requireSession_(token);
    if (session.user.role !== 'manager') {
      throw new Error('只有主管可以查看帳號清單');
    }
  }

  const state = loadState_();
  return jsonResult_(state.users.map((user) => sanitizeUser_(user, state.reports)));
}

function upsertUser(token, payload) {
  const session = requireSession_(token);
  if (session.user.role !== 'manager') {
    throw new Error('只有主管可以新增或修改使用者');
  }

  const state = loadState_();
  const data = payload || {};
  const userId = String(data.id || '').trim();
  const account = String(data.account || '').trim().toLowerCase();
  const name = String(data.name || '').trim();
  const role = String(data.role || '').trim();
  const password = String(data.password || '').trim();
  const existingIndex = userId ? state.users.findIndex((user) => user.id === userId) : -1;
  const previous = existingIndex >= 0 ? state.users[existingIndex] : null;

  if (!account) {
    throw new Error('請輸入帳號');
  }
  if (!name) {
    throw new Error('請輸入姓名');
  }
  if (['teacher', 'tutor', 'assistant', 'admin', 'manager'].indexOf(role) < 0) {
    throw new Error('請選擇有效角色');
  }
  if (!previous && password.length < 6) {
    throw new Error('新增使用者時，密碼至少需要 6 碼');
  }
  if (password && password.length < 6) {
    throw new Error('密碼至少需要 6 碼');
  }
  if (state.users.some((user) => user.id !== userId && String(user.account || '').trim().toLowerCase() === account)) {
    throw new Error('這個帳號已經存在');
  }
  const email = String(data.email || previous?.email || '').trim();
  if (email && !isValidEmail_(email)) {
    throw new Error('Email 格式不正確');
  }

  const nextUser = {
    ...(previous || {}),
    id: previous ? previous.id : `u-${role}-${account}`,
    account,
    passwordHash: password ? hashPassword_(password) : previous.passwordHash,
    name,
    role,
    branch: String(data.branch || previous?.branch || META.branchName).trim(),
    startDate: previous ? previous.startDate : '',
    title: String(data.title || data.duty || previous?.title || '').trim(),
    staffCode: String(data.staffCode || '').trim(),
    duty: String(data.duty || data.title || '').trim(),
    email,
    notifyByEmail: data.notifyByEmail === false ? false : true,
    lineTargetId: String(data.lineTargetId || previous?.lineTargetId || '').trim(),
    notifyByLine: data.notifyByLine === true ? true : false,
    isNotificationReceiver: data.isNotificationReceiver === false ? false : role === 'manager',
    teachingHourlyRate: Number(data.teachingHourlyRate || previous?.teachingHourlyRate || 0),
    adminHourlyRate: Number(data.adminHourlyRate || previous?.adminHourlyRate || 0),
    contractEndDate: String(data.contractEndDate || previous?.contractEndDate || '').trim(),
    mustChangePassword: data.mustChangePassword === false ? false : true,
    defaultClassAssignments: previous ? previous.defaultClassAssignments || [] : [],
  };

  if (existingIndex >= 0) {
    state.users[existingIndex] = nextUser;
  } else {
    state.users.push(nextUser);
  }

  syncPartTimeReportsForUser_(state, nextUser);

  saveState_(state);
  return jsonResult_(sanitizeUser_(nextUser));
}

function deleteUser(token, userId, deleteReports) {
  const session = requireSession_(token);
  if (session.user.role !== 'manager') {
    throw new Error('只有主管可以刪除使用者');
  }
  if (String(userId || '') === session.user.id) {
    throw new Error('不能刪除目前登入中的主管帳號');
  }

  return deleteUserById_(userId, deleteReports !== false);
}

function deleteUserById_(userId, deleteReports) {
  const state = loadState_();
  const targetId = String(userId || '').trim();
  const user = state.users.find((item) => item.id === targetId);
  if (!user) {
    throw new Error('找不到指定使用者');
  }

  const beforeReports = state.reports.length;
  state.users = state.users.filter((item) => item.id !== targetId);
  if (deleteReports) {
    state.reports = state.reports.filter((report) => report.userId !== targetId);
  }
  saveState_(state);
  return jsonResult_({
    ok: true,
    deletedUser: sanitizeUser_(user),
    deletedReports: deleteReports ? beforeReports - state.reports.length : 0,
  });
}

function deleteUserByAccount_(account, deleteReports) {
  const state = loadState_();
  const target = state.users.find((user) => String(user.account || '').trim().toLowerCase() === String(account || '').trim().toLowerCase());
  if (!target) {
    return jsonResult_({ ok: true, deletedUser: null, deletedReports: 0 });
  }
  return deleteUserById_(target.id, deleteReports);
}

function deleteReportsForMonth_(month) {
  const state = loadState_();
  const targetMonth = normalizeMonthKey_(month);
  const beforeReports = state.reports.length;
  state.reports = state.reports.filter((report) => normalizeMonthKey_(report.month) !== targetMonth);
  saveState_(state);
  return {
    ok: true,
    month: targetMonth,
    deletedReports: beforeReports - state.reports.length,
  };
}

function importStaffUsersFromRows(token, rows) {
  ensureDatabase_();
  const session = requireSession_(token);
  if (session.user.role !== 'manager') {
    throw new Error('只有主管可以匯入人員資料');
  }
  return importStaffUsersRows_(rows);
}

function importStaffUsersRows_(rows) {
  const state = loadState_();
  const staffRows = (Array.isArray(rows) ? rows : [])
    .map(normalizeStaffRow_)
    .filter((row) => row.name && row.staffCode);
  const stats = { created: 0, updated: 0, skipped: 0, users: [] };

  staffRows.forEach((staff) => {
    const accountBase = buildStaffAccount_(staff);
    if (!accountBase) {
      stats.skipped += 1;
      return;
    }

    const existingIndex = state.users.findIndex((user) => {
      const sameStaffCode = staff.staffCode && String(user.staffCode || '').trim().toLowerCase() === staff.staffCode.toLowerCase();
      const sameAccount = String(user.account || '').trim().toLowerCase() === accountBase;
      const sameName = staffNameMatches_(user.name, staff.name);
      return sameStaffCode || sameAccount || sameName;
    });
    const previous = existingIndex >= 0 ? state.users[existingIndex] : null;
    const account = previous ? previous.account : uniqueAccount_(state.users, accountBase);
    const role = previous && previous.role === 'manager' ? 'manager' : mapStaffRole_(staff.duty);
    const nextUser = {
      ...(previous || {}),
      id: previous ? previous.id : `u-${role}-${account}`,
      account,
      passwordHash: previous ? previous.passwordHash : hashPassword_(`${account}1234`),
      name: staff.name,
      role,
      branch: staff.branch || META.branchName,
      startDate: previous ? previous.startDate : '',
      title: staff.duty || previous?.title || '',
      staffCode: staff.staffCode,
      duty: staff.duty || previous?.duty || previous?.title || '',
      email: previous ? previous.email || '' : '',
      notifyByEmail: previous ? previous.notifyByEmail !== false : true,
      lineTargetId: previous ? previous.lineTargetId || '' : '',
      notifyByLine: previous ? previous.notifyByLine === true : false,
      isNotificationReceiver: previous ? previous.isNotificationReceiver !== false : role === 'manager',
      mustChangePassword: previous ? Boolean(previous.mustChangePassword) : true,
      defaultClassAssignments: previous ? previous.defaultClassAssignments || [] : [],
    };

    if (existingIndex >= 0) {
      state.users[existingIndex] = nextUser;
      stats.updated += 1;
    } else {
      state.users.push(nextUser);
      stats.created += 1;
    }
    stats.users.push(sanitizeUser_(nextUser));
  });

  saveState_(state);
  return jsonResult_(stats);
}

function importStaffUsersFromBundledRows() {
  const token = arguments[0];
  return importStaffUsersFromRows(token, STAFF_IMPORT_ROWS);
}

function resetUserPassword(token, identifier, nextPassword, forceMustChangePassword) {
  const session = requireSession_(token);
  if (session.user.role !== 'manager') {
    throw new Error('只有主管可以重設密碼');
  }

  const state = loadState_();
  const targetKey = String(identifier || '').trim().toLowerCase();
  const userIndex = state.users.findIndex((item) => item.id === targetKey || item.account === targetKey);
  if (userIndex < 0) {
    throw new Error('找不到指定帳號');
  }

  const trimmedNext = String(nextPassword || '').trim();
  if (trimmedNext.length < 6) {
    throw new Error('新密碼至少需要 6 碼');
  }

  state.users[userIndex] = {
    ...state.users[userIndex],
    passwordHash: hashPassword_(trimmedNext),
    mustChangePassword: forceMustChangePassword === false ? false : true,
  };
  saveState_(state);
  return jsonResult_(sanitizeUser_(state.users[userIndex]));
}

function normalizeStaffRow_(row) {
  const source = Array.isArray(row)
    ? {
      branch: row[1],
      name: row[2],
      staffCode: row[3],
      duty: row[4],
    }
    : row || {};
  return {
    branch: String(source.branch || source['所屬分校'] || '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(' / '),
    name: String(source.name || source['姓名'] || '').trim(),
    staffCode: String(source.staffCode || source['人員代碼'] || '').trim(),
    duty: String(source.duty || source['職務'] || '').trim(),
  };
}

function buildStaffAccount_(staff) {
  const name = String(staff.name || '').trim();
  const nicknameMatch = name.match(/\(([^)]+)\)/);
  const raw = nicknameMatch ? nicknameMatch[1] : name;
  const account = String(raw || staff.staffCode || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  if (account) {
    return account;
  }
  return String(staff.staffCode || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function uniqueAccount_(users, accountBase) {
  let account = accountBase;
  let suffix = 2;
  const exists = () => users.some((user) => String(user.account || '').toLowerCase() === account);
  while (exists()) {
    account = `${accountBase}${suffix}`;
    suffix += 1;
  }
  return account;
}

function staffNameMatches_(leftName, rightName) {
  const left = String(leftName || '').trim().toLowerCase();
  const right = String(rightName || '').trim().toLowerCase();
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  const leftNickname = (left.match(/\(([^)]+)\)/) || [])[1] || left;
  const rightNickname = (right.match(/\(([^)]+)\)/) || [])[1] || right;
  return leftNickname && rightNickname && leftNickname === rightNickname;
}

function mapStaffRole_(duty) {
  const value = String(duty || '');
  if (value.indexOf('老闆') >= 0 || value.indexOf('主管') >= 0 || value.indexOf('主任') >= 0) {
    return 'manager';
  }
  if (value.indexOf('行政') >= 0) {
    return 'admin';
  }
  if (value.indexOf('課輔') >= 0) {
    return 'tutor';
  }
  if (value.indexOf('工讀') >= 0 || value.indexOf('助教') >= 0) {
    return 'assistant';
  }
  return 'teacher';
}

function hashPassword_(password) {
  const salt = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, `${salt}:${password}`, Utilities.Charset.UTF_8);
  return `${salt}:${bytesToHex_(hash)}`;
}

function defaultMustChangePassword_(account) {
  return ['jack', 'claire', 'ruby', 'crystal', 'sally'].includes(String(account || '').trim().toLowerCase());
}

function verifyPassword_(password, storedHash) {
  if (!storedHash || String(storedHash).indexOf(':') < 0) {
    return false;
  }

  const [salt, hash] = String(storedHash).split(':');
  const next = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, `${salt}:${password}`, Utilities.Charset.UTF_8);
  return bytesToHex_(next) === hash;
}

function bytesToHex_(bytes) {
  return bytes.map((byte) => {
    const value = (byte + 256) % 256;
    return value.toString(16).padStart(2, '0');
  }).join('');
}

function parseJson_(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(String(value));
  } catch (error) {
    return fallback;
  }
}

function buildDashboard_(month, reports, users) {
  const activeMonth = normalizeMonthKey_(month || currentMonth_());
  const activeUsers = users.filter((user) => user.role !== 'manager');
  const monthReports = reports.filter((report) => normalizeMonthKey_(report.month) === activeMonth);
  const submittedCount = monthReports.filter((report) => report.status !== 'draft').length;
  const reviewedCount = monthReports.filter((report) => report.status === 'reviewed').length;
  const pendingReports = monthReports.filter((report) => report.status === 'draft' || report.status === 'needs_revision');
  const averageScore = average_(monthReports.map((report) => report.scores.overall));

  const roleLabels = {
    teacher: '英語老師',
    tutor: '課輔老師',
    assistant: '工讀助教',
    admin: '行政老師',
  };
  const roleCards = ['teacher', 'tutor', 'assistant', 'admin'].map((role) => {
    const roleUsers = activeUsers.filter((user) => user.role === role);
    const roleReports = monthReports.filter((report) => report.role === role);
    return {
      role,
      label: roleLabels[role] || role,
      totalUsers: roleUsers.length,
      submittedCount: roleReports.filter((report) => report.status !== 'draft').length,
      averageScore: average_(roleReports.map((report) => report.scores.overall)),
    };
  });

  const followUps = monthReports
    .filter((report) => report.status === 'draft' || report.status === 'needs_revision' || report.status === 'submitted')
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: getUserName_(users, report.userId),
      role: report.role,
      status: report.status,
      score: report.scores.overall,
      reason: report.status === 'draft'
        ? '尚未送出'
        : report.status === 'submitted'
          ? '等待主管審核'
          : '已退回修正',
    }))
    .sort((left, right) => {
      const order = { draft: 0, needs_revision: 1, submitted: 2, reviewed: 3 };
      return order[left.status] - order[right.status] || left.score - right.score;
    })
    .slice(0, 6);

  const unsentList = monthReports
    .filter((report) => report.status === 'draft' || report.status === 'needs_revision')
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: getUserName_(users, report.userId),
      role: report.role,
      status: report.status,
      score: report.scores.overall,
      reason: report.status === 'draft' ? '尚未送出' : '需要修正後再送出',
    }))
    .sort((left, right) => {
      const order = { draft: 0, needs_revision: 1, submitted: 2, reviewed: 3 };
      return order[left.status] - order[right.status] || left.score - right.score;
    });

  const leaderboard = monthReports
    .map((report) => ({
      id: report.id,
      userId: report.userId,
      name: getUserName_(users, report.userId),
      role: report.role,
      status: report.status,
      score: report.scores.overall,
    }))
    .sort((left, right) => right.score - left.score);

  return {
    month: activeMonth,
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

function buildPersonalDashboard_(month, reports, user) {
  const activeMonth = normalizeMonthKey_(month || currentMonth_());
  const personalReports = reports
    .filter((report) => report.userId === user.id)
    .map((report) => decorateReport_(report, [user]))
    .sort((left, right) => String(right.month || '').localeCompare(String(left.month || '')) || String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
  const currentMonthReport = personalReports.find((report) => normalizeMonthKey_(report.month) === activeMonth);

  return {
    month: activeMonth,
    metrics: {
      totalUsers: 1,
      reportCount: personalReports.length,
      submittedCount: personalReports.filter((report) => report.status !== 'draft').length,
      pendingCount: currentMonthReport && (currentMonthReport.status === 'draft' || currentMonthReport.status === 'needs_revision') ? 1 : 0,
      reviewedCount: personalReports.filter((report) => report.status === 'reviewed').length,
      averageScore: average_(personalReports.map((report) => report.scores.overall)),
      completionRate: currentMonthReport && currentMonthReport.status !== 'draft' ? 100 : 0,
    },
    roleCards: [],
    unsentList: currentMonthReport && (currentMonthReport.status === 'draft' || currentMonthReport.status === 'needs_revision')
      ? [{
        id: currentMonthReport.id,
        userId: currentMonthReport.userId,
        name: currentMonthReport.userName,
        role: currentMonthReport.role,
        status: currentMonthReport.status,
        score: currentMonthReport.scores.overall,
        reason: currentMonthReport.status === 'draft' ? '本月尚未送出月報。' : '月報已退回修正，請補正後再次送出。',
      }]
      : [],
    followUps: personalReports.slice(0, 6).map((report) => ({
      id: report.id,
      userId: report.userId,
      name: report.userName,
      role: report.role,
      status: report.status,
      score: report.scores.overall,
      reason: `${report.month}｜${labelStatus_(report.status)}`,
    })),
    leaderboard: personalReports,
    personalReports,
  };
}

function buildPermissionMatrix_() {
  return [
    {
      role: 'manager',
      label: '主管 / 主任',
      scope: '分校管理',
      permissions: ['查看全分校 Dashboard', '查看所有月報', '主管審核', '匯出 PDF / Word', '帳號清單', '重設密碼'],
    },
    {
      role: 'teacher',
      label: '英語老師',
      scope: '個人填報',
      permissions: ['填寫英語老師月報', '查看自己的歷次月報', '查看個人帶班參考資料'],
    },
    {
      role: 'tutor',
      label: '課輔老師',
      scope: '個人填報',
      permissions: ['填寫老師型月報', '查看自己的歷次月報', '查看個人參考資料'],
    },
    {
      role: 'assistant',
      label: '工讀助教',
      scope: '個人填報',
      permissions: ['填寫老師型月報', '查看自己的歷次月報', '查看個人參考資料'],
    },
    {
      role: 'admin',
      label: '行政老師',
      scope: '個人填報',
      permissions: ['填寫行政老師月報', '查看自己的歷次月報', '查看個人參考資料'],
    },
  ];
}

function filterReferenceDashboardForUser_(referenceDashboard, user) {
  if (!referenceDashboard) {
    return null;
  }

  const userName = String(user.name || '').trim();
  return {
    month: referenceDashboard.month,
    weeklyRecords: (referenceDashboard.weeklyRecords || []).slice(0, 2),
    weeklyRecordTotals: referenceDashboard.weeklyRecordTotals || {},
    weeklyDrafts: [],
    weeklyClasses: (referenceDashboard.weeklyClasses || []).slice(0, 2),
    adminMonthly: [],
    teacherLoads: (referenceDashboard.teacherLoads || []).filter((row) => String(row.teacher || '').trim() === userName),
  };
}

function summarizeWeeklyRecords_(rows) {
  const totals = {
    baseTotal: 0,
    netChange: 0,
    endingTotal: 0,
    lostCount: 0,
    inquiryCount: 0,
    testCount: 0,
    newCount: 0,
    transferCount: 0,
    depositCount: 0,
    trialT1: 0,
    trialT2: 0,
    callOut: 0,
    effectiveCalls: 0,
  };

  rows.forEach((row) => {
    totals.baseTotal += Number(row.baseTotal || 0);
    totals.netChange += Number(row.netChange || 0);
    totals.endingTotal += Number(row.endingTotal || 0);
    totals.lostCount += Number(row.lostCount || 0);
    totals.inquiryCount += Number(row.inquiryCount || 0);
    totals.testCount += Number(row.testCount || 0);
    totals.newCount += Number(row.newCount || 0);
    totals.transferCount += Number(row.transferCount || 0);
    totals.depositCount += Number(row.depositCount || 0);
    totals.trialT1 += Number(row.trialT1 || 0);
    totals.trialT2 += Number(row.trialT2 || 0);
    totals.callOut += Number(row.callOut || 0);
    totals.effectiveCalls += Number(row.effectiveCalls || 0);
  });

  return totals;
}

function groupWeeklyClasses_(weeklyClasses, weeklyRecords) {
  const recordMap = {};
  weeklyRecords.forEach((record) => {
    const key = record.id || `${record.startDate}-${record.endDate}`;
    recordMap[key] = {
      recordId: key,
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      classes: [],
    };
  });

  weeklyClasses.forEach((row) => {
    const key = row.recordId || '';
    if (!recordMap[key]) {
      return;
    }

    recordMap[key].classes.push({
      className: row.className || '',
      base: Number(row.base || 0),
      add: Number(row.add || 0),
      lost: Number(row.lost || 0),
      note: row.note || '',
    });
  });

  return Object.values(recordMap).map((item) => ({
    ...item,
    classCount: item.classes.length,
    totalBase: item.classes.reduce((sum, cls) => sum + Number(cls.base || 0), 0),
    totalAdd: item.classes.reduce((sum, cls) => sum + Number(cls.add || 0), 0),
    totalLost: item.classes.reduce((sum, cls) => sum + Number(cls.lost || 0), 0),
  })).sort((left, right) => String(right.startDate || '').localeCompare(String(left.startDate || '')));
}

function decorateReport_(report, users) {
  if (!report) return null;
  return {
    ...report,
    userName: getUserName_(users, report.userId),
    title: getUserTitle_(users, report.userId),
    startDate: getUserStartDate_(users, report.userId),
  };
}

function normalizeReport_(report, users) {
  const output = JSON.parse(JSON.stringify(report || {}));
  output.data = output.data || {};
  output.reviewHistory = Array.isArray(output.reviewHistory) ? output.reviewHistory : [];
  output.submissionHistory = Array.isArray(output.submissionHistory) ? output.submissionHistory : [];
  output.scores = calculateReportScores_(output, users);
  return output;
}

function calculateReportScores_(report, users) {
  if (isAssistantReport_(report)) {
    const selfEvaluation = clamp_(Number(report.data?.reflection?.selfEvaluation || 8), 0, 10);
    const records = Array.isArray(report.data?.assistantTimesheet?.records) ? report.data.assistantTimesheet.records : [];
    const totalHours = Number(report.data?.assistantTimesheet?.totalHours || 0);
    const performance = records.length && totalHours > 0 ? 8 : 6;
    return {
      performance,
      selfEvaluation,
      execution: null,
      overall: average_([performance, selfEvaluation]),
    };
  }

  if (isPartTimeReport_(report)) {
    const selfEvaluation = clamp_(Number(report.data?.reflection?.selfEvaluation || 8), 0, 10);
    const records = Array.isArray(report.data?.partTimeRecords) ? report.data.partTimeRecords : [];
    const performance = records.length ? 8 : 6;
    return {
      performance,
      selfEvaluation,
      execution: null,
      overall: average_([performance, selfEvaluation]),
    };
  }

  if (isTeacherRole_(report.role)) {
    const performance = buildTeacherPerformanceBreakdown_(report);
    const selfEvaluation = clamp_(Number(report.data?.reflection?.selfEvaluation || 0), 0, 10);
    return {
      performance: performance.normalizedTotal,
      selfEvaluation,
      execution: null,
      overall: average_([performance.normalizedTotal, selfEvaluation]),
    };
  }

  const performance = buildAdminPerformanceBreakdown_(report);
  const selfEvaluation = clamp_(Number(report.data?.reflection?.selfEvaluation || 0), 0, 10);
  const execution = clamp_(Number(report.data?.reflection?.execution || 0), 0, 10);
  return {
    performance: performance.normalizedTotal,
    selfEvaluation,
    execution,
    overall: average_([performance.normalizedTotal, selfEvaluation, execution]),
  };
}

function buildTeacherPerformanceBreakdown_(report) {
  const classAssignments = Array.isArray(report.data?.classAssignments) ? report.data.classAssignments : [];
  const metrics = report.data?.performanceMetrics || {};
  const totalStudentCount = classAssignments.reduce((sum, assignment) => sum + Number(assignment.studentCount || 0), 0);
  const teachingAbility = clamp_(round1_(classAssignments.reduce((sum, assignment) => sum + scoreClassAssignment_(assignment), 0)), 0, 5);
  let classLoadScore = 0;

  if (totalStudentCount >= 61) classLoadScore = 5;
  else if (totalStudentCount >= 51) classLoadScore = 4;
  else if (totalStudentCount >= 41) classLoadScore = 3;
  else if (totalStudentCount >= 21) classLoadScore = 2;
  else if (totalStudentCount >= 10) classLoadScore = 1;

  const convertedStudents = Number(metrics.convertedStudents || 0);
  const trialStudents = Number(metrics.trialStudents || 0);
  const nonConvertedTrials = Math.max(trialStudents - convertedStudents, 0);
  const conversionBonus = round1_(convertedStudents + nonConvertedTrials * 0.2);
  const avoidablePenalty = Number(metrics.avoidableLosses || 0);
  const normalizedTotal = clamp_(round1_(teachingAbility + classLoadScore + conversionBonus - avoidablePenalty), 0, 10);

  return { teachingAbility, classLoadScore, conversionBonus, avoidablePenalty, totalStudentCount, normalizedTotal };
}

function buildAdminPerformanceBreakdown_(report) {
  const metrics = report.data?.performanceMetrics || {};
  const inquiryScore = Number(metrics.inquiryCount || 0) >= 6 ? 2 : Number(metrics.inquiryCount || 0) >= 1 ? 1 : 0;
  const callScore = Number(metrics.callCount || 0) >= 5 ? 1 : 0;
  const conversionScore = Number(metrics.conversionRate || 0) >= 80 ? 2 : Number(metrics.conversionRate || 0) >= 70 ? 1 : 0;
  const posterScore = metrics.posterCompleted ? 1 : 0;
  const checklistScore = [
    metrics.formChecklist?.overdueNotice,
    metrics.formChecklist?.weeklyHeadcount,
    metrics.formChecklist?.monthEndHeadcount,
    metrics.formChecklist?.tuitionBag,
  ].filter(Boolean).length;
  const familiarityScore = Number(metrics.campusFamiliarityRate || 0) >= 80 ? 2 : Number(metrics.campusFamiliarityRate || 0) >= 60 ? 1 : 0;
  const rawTotal = inquiryScore + callScore + conversionScore + posterScore + checklistScore + familiarityScore;
  const normalizedTotal = clamp_(round1_((rawTotal / 12) * 10), 0, 10);
  return { inquiryScore, callScore, conversionScore, posterScore, checklistScore, familiarityScore, rawTotal, normalizedTotal };
}

function scoreClassAssignment_(assignment) {
  const level = String(assignment.level || '').trim().toUpperCase();
  const courseType = String(assignment.courseType || 'regular');
  if (courseType === 'gept_basic' || courseType === 'gept_intermediate' || courseType === 'toeic') return 1;
  if (level.indexOf('H1') === 0 || level.indexOf('H2') === 0) return 0.5;
  return 1;
}

function createReferenceAttendanceRecords_(previousReport) {
  const previousRows = previousReport && previousReport.data && Array.isArray(previousReport.data.attendanceRecords)
    ? previousReport.data.attendanceRecords
    : [];
  if (!previousRows.length) {
    return [{
      id: `att-${Utilities.getUuid()}`,
      category: 'sick',
      date: '',
      days: 0,
      hours: 0,
      note: '範例：本月無出勤異常可保留 0，或直接刪除此列。',
    }];
  }
  return previousRows.map((item) => {
    const previousDate = item.date ? `上一期日期：${item.date}` : '上一期紀錄參考';
    return {
      id: `att-${Utilities.getUuid()}`,
      category: item.category || 'sick',
      date: '',
      days: Number(item.days || 0),
      hours: Number(item.hours || 0),
      note: item.note ? `${item.note}（${previousDate}）` : previousDate,
    };
  });
}

function createReferenceTeachingRecords_(previousReport) {
  const previousRows = previousReport && previousReport.data && Array.isArray(previousReport.data.teachingRecords)
    ? previousReport.data.teachingRecords
    : [];
  if (!previousRows.length) {
    return [{
      id: `work-${Utilities.getUuid()}`,
      category: 'student_makeup',
      date: '',
      className: '',
      level: '',
      hours: 0,
      note: '範例：本月無教學紀錄可保留 0，或直接刪除此列。',
    }];
  }
  return previousRows.map((item) => {
    const previousDate = item.date ? `上一期日期：${item.date}` : '上一期紀錄參考';
    return {
      id: `work-${Utilities.getUuid()}`,
      category: item.category || 'student_makeup',
      date: '',
      className: item.className || '',
      level: item.level || '',
      hours: Number(item.hours || 0),
      note: item.note ? `${item.note}（${previousDate}）` : previousDate,
    };
  });
}

function createReferenceOvertimeRecords_(previousReport) {
  const previousRows = previousReport && previousReport.data && Array.isArray(previousReport.data.overtimeRecords)
    ? previousReport.data.overtimeRecords
    : [];
  if (!previousRows.length) {
    return [{
      id: `ot-${Utilities.getUuid()}`,
      category: 'weekday',
      date: '',
      hours: 0,
      note: '範例：本月無加班申請可保留 0，或直接刪除此列。',
    }];
  }
  return previousRows.map((item) => {
    const previousDate = item.date ? `上一期日期：${item.date}` : '上一期紀錄參考';
    return {
      id: `ot-${Utilities.getUuid()}`,
      category: item.category || 'weekday',
      date: '',
      hours: Number(item.hours || 0),
      note: item.note ? `${item.note}（${previousDate}）` : previousDate,
    };
  });
}

function createBlankReport_(user, month, previousReport) {
  const base = {
    id: `r-${month}-${user.id}`,
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
  };

  if (isAssistantUser_(user)) {
    return normalizeReport_({
      ...base,
      data: {
        assistantTimesheet: {
          records: Array.from({ length: 6 }).map((_, index) => ({
            id: `assistant-${index + 1}`,
            date: '',
            weekday: '',
            description: '',
            timeRange: '',
            hours: 0,
          })),
          totalHours: 0,
        },
        reflection: {
          wins: '',
          fixes: '',
          upwardFeedback: '',
          nextMonthGoal: '',
          selfEvaluation: 8,
          selfEvaluationReason: '',
        },
      },
    }, [user]);
  }

  if (isTeacherRole_(user.role)) {
    if (isPartTimeUser_(user)) {
      return normalizeReport_({
        ...base,
        data: {
          partTimeContract: buildPartTimeContractDefaults_(user),
          partTimeRecords: Array.from({ length: 6 }).map((_, index) => ({
            id: `parttime-${index + 1}`,
            category: 'teaching',
            date: '',
            weekday: '',
            description: '',
            startTime: '',
            endTime: '',
            hours: 0,
          })),
          reflection: {
            wins: '',
            fixes: '',
            upwardFeedback: '',
            teamPraise: '',
            nextMonthGoal: '',
            selfEvaluation: 8,
            selfEvaluationReason: '',
          },
        },
      }, [user]);
    }

    return normalizeReport_({
      ...base,
      data: {
        classAssignments: (user.defaultClassAssignments || []).map((item) => ({ ...item })),
        attendanceRecords: createReferenceAttendanceRecords_(previousReport),
        teachingRecords: createReferenceTeachingRecords_(previousReport),
        overtimeRecords: createReferenceOvertimeRecords_(previousReport),
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
      },
    }, [user]);
  }

  return normalizeReport_({
    ...base,
    role: 'admin',
    data: {
      attendanceRecords: createReferenceAttendanceRecords_(previousReport),
      overtimeRecords: createReferenceOvertimeRecords_(previousReport),
      performanceMetrics: {
        entryStudentCount: 0,
        entryStudentNotes: '',
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
    },
  }, [user]);
}

function appendReportBody_(body, report) {
  if (isAssistantReport_(report)) {
    const timesheet = report.data.assistantTimesheet || {};
    body.appendParagraph('工讀 / 助教月報時數表').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`- 本月總上班時數：${timesheet.totalHours || 0}`);
    (timesheet.records || []).forEach((item) => {
      body.appendParagraph(`- ${item.date || '未填日期'}｜${item.weekday || '-'}｜${item.description || ''}｜${item.timeRange || ''}｜${item.hours || 0} 小時`);
    });
    body.appendParagraph('自評與回饋').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`- 自評分數：${report.data.reflection?.selfEvaluation || 0}`);
    body.appendParagraph(`- 自評說明：${report.data.reflection?.selfEvaluationReason || ''}`);
    body.appendParagraph(`- 本月完成事項 / 成果摘要：${report.data.reflection?.wins || ''}`);
    body.appendParagraph(`- 本月需要協助或改善事項：${report.data.reflection?.fixes || ''}`);
    body.appendParagraph(`- 想向上反應的事 / 個人工作狀態：${report.data.reflection?.upwardFeedback || ''}`);
    body.appendParagraph(`- 下月目標：${report.data.reflection?.nextMonthGoal || ''}`);
    return;
  }

  if (isTeacherRole_(report.role) && !isAssistantReport_(report)) {
    body.appendParagraph('帶班資訊').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.classAssignments || []).forEach((item) => {
      body.appendParagraph(`- ${item.className}｜級數 ${item.level}｜人數 ${item.studentCount}`);
    });

    body.appendParagraph('出勤紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.attendanceRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelAttendance_(item.category)}｜${item.date || '未填日期'}｜${item.days} 天｜${item.hours} 小時｜${item.note || ''}`);
    });
    body.appendParagraph('加班申請紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.overtimeRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelOvertime_(item.category)}｜${item.date || '未填日期'}｜${item.hours || 0} 小時｜${item.note || ''}`);
    });

    body.appendParagraph('教學紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.teachingRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelTeacherWork_(item.category)}｜${item.date || '未填日期'}｜${item.className || '-'}｜${item.level || '-'}｜${item.hours} 小時｜${item.note || ''}`);
    });
  } else {
    body.appendParagraph('出勤紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.attendanceRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelAttendance_(item.category)}｜${item.date || '未填日期'}｜${item.days} 天｜${item.hours} 小時｜${item.note || ''}`);
    });
    body.appendParagraph('加班申請紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.overtimeRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelOvertime_(item.category)}｜${item.date || '未填日期'}｜${item.hours || 0} 小時｜${item.note || ''}`);
    });

    body.appendParagraph('行政績效').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const metrics = report.data.performanceMetrics || {};
    body.appendParagraph(`- 新進人數：${metrics.newEnrollments || 0}`);
    body.appendParagraph(`- 櫃詢次數：${metrics.inquiryCount || 0}`);
    body.appendParagraph(`- Call 班次數：${metrics.callCount || 0}`);
    body.appendParagraph(`- 轉換率：${metrics.conversionRate || 0}%`);
  }

  body.appendParagraph('主管審核紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (report.reviewHistory || []).slice().reverse().forEach((item) => {
    body.appendParagraph(`- ${item.reviewedAt}｜${item.reviewerName}｜${labelStatus_(item.status)}｜${item.reviewerNote || ''}`);
  });

  body.appendParagraph('簽核欄位').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('填表人：____________________');
  body.appendParagraph('主管：____________________');
  body.appendParagraph('日期：____________________');
}

function getExportFolder_() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty(APP.exportFolderKey);
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }

  const folder = DriveApp.createFolder('月報匯出');
  props.setProperty(APP.exportFolderKey, folder.getId());
  return folder;
}

function average_(values) {
  const list = (values || []).filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!list.length) return 0;
  return round1_(list.reduce((sum, value) => sum + value, 0) / list.length);
}

function round1_(value) {
  return Number(Number(value).toFixed(1));
}

function clamp_(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function labelAttendance_(value) {
  return {
    sick: '病假',
    personal: '事假',
    annual: '特休',
    late: '遲到',
  }[value] || value;
}

function labelTeacherWork_(value) {
  return {
    substitute_for_other: '幫人代課',
    covered_by_other: '被人代課',
    student_makeup: '幫學生補課',
    activity_hosted: '活動舉辦',
    training_attended: '研習 / 培訓',
  }[value] || value;
}

function labelOvertime_(value) {
  return {
    weekday: '平常日加班',
    holiday: '休假日加班',
  }[value] || value;
}

function labelStatus_(value) {
  return {
    draft: '草稿',
    submitted: '已送出',
    reviewed: '已審核',
    needs_revision: '退回修正',
  }[value] || value;
}

function labelSubmissionAction_(value) {
  return {
    submitted: '首次送出',
    resubmitted: '重新送出',
    resubmitted_after_revision: '退回後重新送出',
  }[value] || value;
}

function getUserName_(users, userId) {
  const user = users.find((item) => item.id === userId);
  return user ? user.name : '';
}

function getUserTitle_(users, userId) {
  const user = users.find((item) => item.id === userId);
  return user ? (user.duty || user.title || '') : '';
}

function getUserStartDate_(users, userId) {
  const user = users.find((item) => item.id === userId);
  return user ? user.startDate : '';
}

function exportReport(token, reportId, format) {
  const session = requireSession_(token);
  const state = loadState_();
  const report = state.reports.find((item) => item.id === reportId);

  if (!report) {
    throw new Error('找不到月報。');
  }

  if (session.user.role !== 'manager' && report.userId !== session.user.id) {
    throw new Error('您沒有匯出此月報的權限。');
  }

  const decorated = decorateReport_(report, state.users);
  const roleName = labelRole_(decorated.role, decorated);
  const baseName = `${META.schoolTitle}-月報-${decorated.month}-${decorated.userName}`;
  if (String(format || '').toLowerCase() === 'pdf') {
    const html = buildReportPdfHtml_(decorated, roleName);
    const pdfBlob = Utilities
      .newBlob(html, 'text/html', `${baseName}.html`)
      .getAs(MimeType.PDF)
      .setName(`${baseName}.pdf`);
    return jsonResult_({
      docUrl: '',
      pdfUrl: '',
      folderUrl: '',
      fileName: `${baseName}.pdf`,
      mimeType: MimeType.PDF,
      pdfBase64: Utilities.base64Encode(pdfBlob.getBytes()),
    });
  }

  const exportFolder = getExportFolder_();
  const doc = DocumentApp.create(`${baseName}-正式版`);
  const body = doc.getBody();
  const footer = doc.getFooter() || doc.addFooter();

  body.clear();
  body.appendParagraph(META.schoolTitle).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`${META.systemName}｜${decorated.month}`).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(`月報類別：${roleName}`);
  body.appendParagraph(`填表人：${decorated.userName}`);
  body.appendParagraph(`狀態：${labelStatus_(decorated.status)}`);
  body.appendParagraph(`匯出時間：${Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm')}`);
  body.appendHorizontalRule();

  appendReportBody_(body, decorated);

  body.appendPageBreak();
  body.appendParagraph('簽核欄位').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['填表人', '主管審核', '簽核日期'],
    ['', '', ''],
  ]);

  footer.clear();
  footer.appendParagraph(`${META.schoolTitle}｜${decorated.month}｜第 1 頁 / 共 1 頁`)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  footer.appendParagraph('填表人：__________    主管審核：__________    簽核日期：__________')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const docxBlob = docFile.getAs(MimeType.MICROSOFT_WORD).setName(`${baseName}.docx`);
  const pdfBlob = docFile.getAs(MimeType.PDF).setName(`${baseName}.pdf`);
  const docxFile = exportFolder.createFile(docxBlob);
  const pdfFile = exportFolder.createFile(pdfBlob);

  return jsonResult_({
    docUrl: docxFile.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    folderUrl: exportFolder.getUrl(),
  });
}

function buildReportPdfHtml_(report, roleName) {
  const data = report.data || {};
  const metrics = data.performanceMetrics || {};
  const reflection = data.reflection || {};
  const attendanceRows = (data.attendanceRecords || []).map((item) => `
    <tr>
      <td>${escapeHtml_(labelAttendance_(item.category))}</td>
      <td>${escapeHtml_(item.date || '未填日期')}</td>
      <td>${Number(item.days || 0)}</td>
      <td>${Number(item.hours || 0)}</td>
      <td>${escapeHtml_(item.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="5">無出勤紀錄</td></tr>';
  const overtimeRows = (data.overtimeRecords || []).map((item) => `
    <tr>
      <td>${escapeHtml_(labelOvertime_(item.category))}</td>
      <td>${escapeHtml_(item.date || '未填日期')}</td>
      <td>${Number(item.hours || 0)}</td>
      <td>${escapeHtml_(item.note || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4">無加班申請紀錄</td></tr>';

  const partTimeContract = data.partTimeContract || {};
  const partTimeBody = isPartTimeReport_(report) ? `
    <h2>兼任老師教學專案執行成果</h2>
    <div class="grid">
      ${pdfMetricHtml_('承攬人姓名', report.userName)}
      ${pdfMetricHtml_('執行月份', report.month)}
      ${pdfMetricHtml_('授課時薪', partTimeContract.teachingHourlyRate || 0)}
      ${pdfMetricHtml_('非教學教務時薪', partTimeContract.adminHourlyRate || 0)}
      ${pdfMetricHtml_('本月總授課時數(A)', partTimeContract.teachingHours || 0)}
      ${pdfMetricHtml_('本月總非教學時數(B)', partTimeContract.adminHours || 0)}
      ${pdfMetricHtml_('本月應支領報酬', partTimeContract.totalCompensation || 0)}
      ${pdfMetricHtml_('未履行合約溢領價差', partTimeContract.overpaidDifference || 0)}
      ${pdfMetricHtml_('兼任合約到期日', partTimeContract.contractEndDate || '')}
    </div>
    <table>
      <tr><th>執行類別</th><th>日期</th><th>星期</th><th>執行內容描述</th><th>起訖時間</th><th>時數</th></tr>
      ${(data.partTimeRecords || []).map((item) => `
        <tr>
          <td>${escapeHtml_(item.category === 'admin' ? '教務執行' : '實際授課')}</td>
          <td>${escapeHtml_(item.date || '')}</td>
          <td>${escapeHtml_(item.weekday || '')}</td>
          <td>${escapeHtml_(item.description || '')}</td>
          <td>${escapeHtml_(`${item.startTime || ''} - ${item.endTime || ''}`)}</td>
          <td>${Number(item.hours || 0)}</td>
        </tr>
      `).join('') || '<tr><td colspan="6">無執行紀錄</td></tr>'}
    </table>
    ${pdfTextHtml_('承攬人聲明', partTimeContract.contractorStatement || '')}
  ` : '';

  const assistantTimesheet = data.assistantTimesheet || {};
  const assistantBody = isAssistantReport_(report) ? `
    <h2>工讀 / 助教月報時數表</h2>
    <div class="grid">
      ${pdfMetricHtml_('姓名', report.userName)}
      ${pdfMetricHtml_('月份', report.month)}
      ${pdfMetricHtml_('本月總上班時數', assistantTimesheet.totalHours || 0)}
      ${pdfMetricHtml_('自評分數', reflection.selfEvaluation || 0)}
    </div>
    <table>
      <tr><th>日期</th><th>星期</th><th>執行內容描述</th><th>起訖時間</th><th>上班時數</th></tr>
      ${(assistantTimesheet.records || []).map((item) => `
        <tr>
          <td>${escapeHtml_(item.date || '')}</td>
          <td>${escapeHtml_(item.weekday || '')}</td>
          <td>${escapeHtml_(item.description || '')}</td>
          <td>${escapeHtml_(item.timeRange || '')}</td>
          <td>${Number(item.hours || 0)}</td>
        </tr>
      `).join('') || '<tr><td colspan="5">目前沒有工讀 / 助教時數紀錄。</td></tr>'}
    </table>
    ${pdfTextHtml_('自評說明', reflection.selfEvaluationReason || '')}
    ${pdfTextHtml_('本月完成事項 / 成果摘要', reflection.wins || '')}
    ${pdfTextHtml_('本月需要協助或改善事項', reflection.fixes || '')}
    ${pdfTextHtml_('想向上反應的事 / 個人工作狀態', reflection.upwardFeedback || '')}
    ${pdfTextHtml_('下月目標', reflection.nextMonthGoal || '')}
  ` : '';

  const teacherBody = isTeacherRole_(report.role) && !isPartTimeReport_(report) && !isAssistantReport_(report) ? `
    <h2>帶班與人數</h2>
    <table>
      <tr><th>班級</th><th>級數</th><th>人數</th></tr>
      ${(data.classAssignments || []).map((item) => `
        <tr><td>${escapeHtml_(item.className || '')}</td><td>${escapeHtml_(item.level || '')}</td><td>${Number(item.studentCount || 0)}</td></tr>
      `).join('') || '<tr><td colspan="3">無帶班資料</td></tr>'}
    </table>
    <h2>教學紀錄</h2>
    <table>
      <tr><th>類別</th><th>日期</th><th>班級</th><th>級數</th><th>時數</th><th>備註</th></tr>
      ${(data.teachingRecords || []).map((item) => `
        <tr>
          <td>${escapeHtml_(labelTeacherWork_(item.category))}</td>
          <td>${escapeHtml_(item.date || '未填日期')}</td>
          <td>${escapeHtml_(item.className || '-')}</td>
          <td>${escapeHtml_(item.level || '-')}</td>
          <td>${Number(item.hours || 0)}</td>
          <td>${escapeHtml_(item.note || '')}</td>
        </tr>
      `).join('') || '<tr><td colspan="6">無教學紀錄</td></tr>'}
    </table>
    <h2>月報重點</h2>
    <div class="grid">
      ${pdfMetricHtml_('試讀人數', metrics.trialStudents)}
      ${pdfMetricHtml_('進班學生數', metrics.convertedStudents)}
      ${pdfMetricHtml_('級測學生數', metrics.gradeTestStudents)}
      ${pdfMetricHtml_('作業錯誤率', `${metrics.homeworkErrorRate || 0}%`)}
      ${pdfMetricHtml_('電話輔導成功率', `${metrics.phoneSupportSuccessRate || 0}%`)}
      ${pdfMetricHtml_('問班學生數', metrics.inquiryStudentCount)}
      ${pdfMetricHtml_('不可避免流失', metrics.unavoidableLosses)}
      ${pdfMetricHtml_('可避免流失', metrics.avoidableLosses)}
      ${pdfMetricHtml_('自評分數', reflection.selfEvaluation)}
    </div>
    ${pdfTextHtml_('本月做對的事情', reflection.wins)}
    ${pdfTextHtml_('本月待改善事項', reflection.fixes)}
    ${pdfTextHtml_('向上回饋', reflection.upwardFeedback)}
    ${pdfTextHtml_('本月最想表揚的人跟原因', reflection.teamPraise)}
    ${pdfTextHtml_('下月目標', reflection.nextMonthGoal)}
    ${pdfTextHtml_('客訴或異常事件', data.complaints)}
    ${pdfTextHtml_('客訴處理方式', data.complaintHandling)}
  ` : '';

  const adminChecklist = metrics.formChecklist || {};
  const adminBody = report.role === 'admin' ? `
    <h2>行政績效</h2>
    <div class="grid">
      ${pdfMetricHtml_('進班人數', metrics.entryStudentCount ?? metrics.newEnrollments)}
      ${pdfMetricHtml_('進班學生與班級', metrics.entryStudentNotes || '')}
      ${pdfMetricHtml_('櫃詢次數', metrics.inquiryCount)}
      ${pdfMetricHtml_('Call 班通數', metrics.callCount)}
      ${pdfMetricHtml_('櫃詢成功率', `${metrics.conversionRate || 0}%`)}
      ${pdfMetricHtml_('製作海報', metrics.posterCompleted ? '有' : '沒有')}
      ${pdfMetricHtml_('學費催繳通知', adminChecklist.overdueNotice ? '準時' : '未完成')}
      ${pdfMetricHtml_('週人數統計填報', adminChecklist.weeklyHeadcount ? '準時' : '未完成')}
      ${pdfMetricHtml_('月底人數統計填報', adminChecklist.monthEndHeadcount ? '準時' : '未完成')}
      ${pdfMetricHtml_('學費袋製作', adminChecklist.tuitionBag ? '準時' : '未完成')}
      ${pdfMetricHtml_('分校掌握度', `${metrics.campusFamiliarityRate || 0}%`)}
      ${pdfMetricHtml_('自評分數', reflection.selfEvaluation)}
      ${pdfMetricHtml_('執行力分數', reflection.execution)}
    </div>
    ${pdfTextHtml_('本月覺得自己做對的事', reflection.wins)}
    ${pdfTextHtml_('本月需要修正的事', reflection.fixes)}
    ${pdfTextHtml_('想向上反應的事 / 個人工作狀態', reflection.upwardFeedback)}
    ${pdfTextHtml_('執行力補充描述原因', reflection.executionReason)}
    ${pdfTextHtml_('本月想要特別讚許的團隊夥伴以及原因', reflection.teamPraise)}
    ${pdfTextHtml_('下月目標', reflection.nextMonthGoal)}
  ` : '';

  const submissionRows = (report.submissionHistory || []).slice().reverse().map((item) => `
    <tr>
      <td>${escapeHtml_(item.submittedAt || '')}</td>
      <td>${escapeHtml_(item.userName || report.userName || '')}</td>
      <td>${escapeHtml_(labelSubmissionAction_(item.action || 'submitted'))}</td>
      <td>${escapeHtml_(labelStatus_(item.previousStatus || ''))}</td>
    </tr>
  `).join('') || '<tr><td colspan="4">目前沒有重新送出紀錄。</td></tr>';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif; color:#1d2430; padding:28px; line-height:1.55; }
          h1 { margin:0 0 4px; font-size:24px; }
          h2 { margin:22px 0 8px; font-size:17px; border-bottom:1px solid #ddd; padding-bottom:4px; }
          .meta { margin:10px 0 16px; color:#555; }
          .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; }
          .metric, .text-block { border:1px solid #ddd; border-radius:8px; padding:8px 10px; }
          .metric strong, .text-block strong { display:block; color:#8a530b; margin-bottom:4px; }
          table { width:100%; border-collapse:collapse; margin-top:8px; }
          th, td { border:1px solid #ddd; padding:6px 8px; text-align:left; vertical-align:top; }
          th { background:#fff5df; }
          .sign { margin-top:28px; display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
          .sign div { border-top:1px solid #333; padding-top:8px; text-align:center; }
          .footer { margin-top:16px; text-align:center; color:#777; font-size:12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml_(META.schoolTitle)}</h1>
        <div class="meta">${escapeHtml_(META.systemName)}｜${escapeHtml_(report.month)}｜${escapeHtml_(roleName)}</div>
        <div class="meta">填表人：${escapeHtml_(report.userName)}｜狀態：${escapeHtml_(labelStatus_(report.status))}｜匯出時間：${escapeHtml_(Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm'))}</div>
        <h2>出勤紀錄</h2>
        <table>
          <tr><th>類別</th><th>日期</th><th>天數</th><th>時數</th><th>備註</th></tr>
          ${attendanceRows}
        </table>
        <h2>加班申請紀錄</h2>
        <table>
          <tr><th>類別</th><th>日期</th><th>時數</th><th>備註</th></tr>
          ${overtimeRows}
        </table>
        ${partTimeBody}
        ${assistantBody}
        ${teacherBody}
        ${adminBody}
        <h2>送出與退回後重新送出紀錄</h2>
        <table>
          <tr><th>時間</th><th>送出人</th><th>動作</th><th>送出前狀態</th></tr>
          ${submissionRows}
        </table>
        <h2>主管審核紀錄</h2>
        <table>
          <tr><th>時間</th><th>主管</th><th>狀態</th><th>意見</th></tr>
          ${(report.reviewHistory || []).slice().reverse().map((item) => `
            <tr><td>${escapeHtml_(item.reviewedAt || '')}</td><td>${escapeHtml_(item.reviewerName || '')}</td><td>${escapeHtml_(labelStatus_(item.status))}</td><td>${escapeHtml_(item.reviewerNote || '')}</td></tr>
          `).join('') || '<tr><td colspan="4">目前沒有審核紀錄</td></tr>'}
        </table>
        <div class="sign"><div>填表人</div><div>主管審核</div><div>簽核日期</div></div>
        <div class="footer">${escapeHtml_(META.schoolTitle)}｜${escapeHtml_(report.month)}｜第 1 頁 / 共 1 頁</div>
      </body>
    </html>
  `;
}

function pdfMetricHtml_(label, value) {
  return `<div class="metric"><strong>${escapeHtml_(label)}</strong>${escapeHtml_(value ?? '')}</div>`;
}

function pdfTextHtml_(label, value) {
  return `<div class="text-block"><strong>${escapeHtml_(label)}</strong>${escapeHtml_(value || '')}</div>`;
}

function escapeHtml_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendReportBody_(body, report) {
  if (isAssistantReport_(report)) {
    const timesheet = report.data.assistantTimesheet || {};
    body.appendParagraph('工讀 / 助教月報時數表').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`- 本月總上班時數：${timesheet.totalHours || 0}`);
    (timesheet.records || []).forEach((item) => {
      body.appendParagraph(`- ${item.date || '未填日期'}｜${item.weekday || '-'}｜${item.description || ''}｜${item.timeRange || ''}｜${item.hours || 0} 小時`);
    });
    body.appendParagraph('自評與回饋').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`- 自評分數：${report.data.reflection?.selfEvaluation || 0}`);
    body.appendParagraph(`- 自評說明：${report.data.reflection?.selfEvaluationReason || ''}`);
    body.appendParagraph(`- 本月完成事項 / 成果摘要：${report.data.reflection?.wins || ''}`);
    body.appendParagraph(`- 本月需要協助或改善事項：${report.data.reflection?.fixes || ''}`);
    body.appendParagraph(`- 想向上反應的事 / 個人工作狀態：${report.data.reflection?.upwardFeedback || ''}`);
    body.appendParagraph(`- 下月目標：${report.data.reflection?.nextMonthGoal || ''}`);
    return;
  }

  if (isTeacherRole_(report.role) && !isAssistantReport_(report)) {
    body.appendParagraph('帶班與人數').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.classAssignments || []).forEach((item) => {
      body.appendParagraph(`- ${item.className || '未命名班級'}｜${item.level || '-'}｜${item.studentCount || 0} 人`);
    });

    body.appendParagraph('出勤紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.attendanceRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelAttendance_(item.category)}｜${item.date || '未填日期'}｜${item.days || 0} 天｜${item.hours || 0} 小時｜${item.note || ''}`);
    });
    body.appendParagraph('加班申請紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.overtimeRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelOvertime_(item.category)}｜${item.date || '未填日期'}｜${item.hours || 0} 小時｜${item.note || ''}`);
    });

    body.appendParagraph('教學紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.teachingRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelTeacherWork_(item.category)}｜${item.date || '未填日期'}｜${item.className || '-'}｜${item.level || '-'}｜${item.hours || 0} 小時｜${item.note || ''}`);
    });

    body.appendParagraph('月報重點').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const metrics = report.data.performanceMetrics || {};
    body.appendParagraph(`- 體驗學生數：${metrics.trialStudents || 0}`);
    body.appendParagraph(`- 轉換學生數：${metrics.convertedStudents || 0}`);
    body.appendParagraph(`- 級測學生數：${metrics.gradeTestStudents || 0}`);
    body.appendParagraph(`- 作業錯誤率：${metrics.homeworkErrorRate || 0}%`);
    body.appendParagraph(`- 電話支援成功率：${metrics.phoneSupportSuccessRate || 0}%`);
    body.appendParagraph(`- 洽詢學生數：${metrics.inquiryStudentCount || 0}`);
    body.appendParagraph(`- 不可避免流失：${metrics.unavoidableLosses || 0}`);
    body.appendParagraph(`- 可避免流失：${metrics.avoidableLosses || 0}`);
    body.appendParagraph(`- 自評分數：${report.data.reflection?.selfEvaluation || 0}`);
    body.appendParagraph(`- 自評說明：${report.data.reflection?.selfEvaluationReason || ''}`);
    body.appendParagraph(`- 本月亮點：${report.data.reflection?.wins || ''}`);
    body.appendParagraph(`- 待改善事項：${report.data.reflection?.fixes || ''}`);
    body.appendParagraph(`- 向上回饋：${report.data.reflection?.upwardFeedback || ''}`);
    body.appendParagraph(`- 團隊表現肯定：${report.data.reflection?.teamPraise || ''}`);
    body.appendParagraph(`- 下月目標：${report.data.reflection?.nextMonthGoal || ''}`);
    body.appendParagraph(`- 客訴或異常事件：${report.data.complaints || ''}`);
    body.appendParagraph(`- 客訴處理方式：${report.data.complaintHandling || ''}`);
  } else {
    body.appendParagraph('出勤紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.attendanceRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelAttendance_(item.category)}｜${item.date || '未填日期'}｜${item.days || 0} 天｜${item.hours || 0} 小時｜${item.note || ''}`);
    });
    body.appendParagraph('加班申請紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (report.data.overtimeRecords || []).forEach((item) => {
      body.appendParagraph(`- ${labelOvertime_(item.category)}｜${item.date || '未填日期'}｜${item.hours || 0} 小時｜${item.note || ''}`);
    });

    body.appendParagraph('行政績效').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const metrics = report.data.performanceMetrics || {};
    body.appendParagraph(`- 新生報到：${metrics.newEnrollments || 0}`);
    body.appendParagraph(`- 洽詢數：${metrics.inquiryCount || 0}`);
    body.appendParagraph(`- 電話數：${metrics.callCount || 0}`);
    body.appendParagraph(`- 轉換率：${metrics.conversionRate || 0}%`);
    body.appendParagraph(`- 校區熟悉度：${metrics.campusFamiliarityRate || 0}%`);
    body.appendParagraph(`- 海報完成：${metrics.posterCompleted ? '是' : '否'}`);
    body.appendParagraph(`- 逾期通知：${metrics.formChecklist?.overdueNotice ? '是' : '否'}`);
    body.appendParagraph(`- 週人數盤點：${metrics.formChecklist?.weeklyHeadcount ? '是' : '否'}`);
    body.appendParagraph(`- 月底人數盤點：${metrics.formChecklist?.monthEndHeadcount ? '是' : '否'}`);
    body.appendParagraph(`- 學費袋：${metrics.formChecklist?.tuitionBag ? '是' : '否'}`);
    body.appendParagraph(`- 自評分數：${report.data.reflection?.selfEvaluation || 0}`);
    body.appendParagraph(`- 本月覺得自己做對的事：${report.data.reflection?.wins || ''}`);
    body.appendParagraph(`- 本月需要修正的事：${report.data.reflection?.fixes || ''}`);
    body.appendParagraph(`- 想向上反應的事 / 個人工作狀態：${report.data.reflection?.upwardFeedback || ''}`);
    body.appendParagraph(`- 執行分數：${report.data.reflection?.execution || 0}`);
    body.appendParagraph(`- 執行說明：${report.data.reflection?.executionReason || ''}`);
    body.appendParagraph(`- 團隊表現肯定：${report.data.reflection?.teamPraise || ''}`);
    body.appendParagraph(`- 下月目標：${report.data.reflection?.nextMonthGoal || ''}`);
  }

  body.appendParagraph('主管審核紀錄').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (report.reviewHistory || []).slice().reverse().forEach((item) => {
    body.appendParagraph(`- ${item.reviewedAt || ''}｜${item.reviewerName || ''}｜${labelStatus_(item.status)}｜${item.reviewerNote || ''}`);
  });

  body.appendParagraph('簽核欄位').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('填表人：____________________');
  body.appendParagraph('主管審核：____________________');
  body.appendParagraph('簽核日期：____________________');
}

function labelAttendance_(value) {
  return {
    sick: '病假',
    personal: '事假',
    annual: '特休',
    late: '遲到',
  }[value] || value;
}

function labelTeacherWork_(value) {
  return {
    substitute_for_other: '幫人代課',
    covered_by_other: '被人代課',
    student_makeup: '幫學生補課',
    activity_hosted: '活動舉辦',
    training_attended: '教學研習',
  }[value] || value;
}

function labelStatus_(value) {
  return {
    draft: '草稿',
    submitted: '已送出',
    reviewed: '已審核',
    needs_revision: '待修正',
  }[value] || value;
}
function checkReferenceSheets() {
  const scriptValue = PropertiesService.getScriptProperties().getProperty(APP.referenceSpreadsheetKey);
  const sourceSpreadsheetId = String(scriptValue || DEFAULT_REFERENCE_SPREADSHEET_ID || '').trim();
  const names = [
    'weekly_records',
    'weekly_drafts',
    'weekly_classes',
    'admin_monthly',
    'teacher_loads',
    'lead_reason_summary',
    'audit_log',
  ];

  if (!sourceSpreadsheetId) {
    return {
      ok: false,
      resolvedSourceSpreadsheetId: '',
      scriptValue: scriptValue || '',
      defaultSourceSpreadsheetId: DEFAULT_REFERENCE_SPREADSHEET_ID || '',
      message: '找不到參考資料庫 ID，請先在設定中寫入。',
      sheets: names.map((name) => ({
        name,
        exists: false,
        rows: 0,
        cols: 0,
        empty: true,
      })),
    };
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetId);
    return {
      ok: true,
      resolvedSourceSpreadsheetId: sourceSpreadsheetId,
      scriptValue: scriptValue || '',
      defaultSourceSpreadsheetId: DEFAULT_REFERENCE_SPREADSHEET_ID || '',
      sheets: names.map((name) => {
        const sheet = spreadsheet.getSheetByName(name);
        const lastRow = sheet ? sheet.getLastRow() : 0;
        const lastColumn = sheet ? sheet.getLastColumn() : 0;
        return {
          name,
          exists: Boolean(sheet),
          rows: lastRow,
          cols: lastColumn,
          empty: !sheet || lastRow === 0 || lastColumn === 0,
        };
      }),
    };
  } catch (error) {
    return {
      ok: false,
      resolvedSourceSpreadsheetId: sourceSpreadsheetId,
      scriptValue: scriptValue || '',
      defaultSourceSpreadsheetId: DEFAULT_REFERENCE_SPREADSHEET_ID || '',
      message: error && error.message ? error.message : String(error),
      sheets: names.map((name) => ({
        name,
        exists: false,
        rows: 0,
        cols: 0,
        empty: true,
      })),
    };
  }
}
