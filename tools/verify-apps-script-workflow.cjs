const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : ['2026-07-15T04:00:00.000Z']));
  }

  static now() {
    return new FixedDate().getTime();
  }
}

function taipeiParts(date) {
  const shifted = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  return {
    year: shifted.getUTCFullYear(),
    month: String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    day: String(shifted.getUTCDate()).padStart(2, '0'),
  };
}

let uuidCounter = 0;
const lineMessages = [];
const sandbox = {
  console,
  Date: FixedDate,
  Utilities: {
    getUuid: () => `test-uuid-${++uuidCounter}`,
    formatDate: (date, timezone, format) => {
      assert.equal(timezone, 'Asia/Taipei');
      const parts = taipeiParts(date);
      if (format === 'yyyy-MM') return `${parts.year}-${parts.month}`;
      if (format === 'dd') return parts.day;
      throw new Error(`Unsupported date format in test: ${format}`);
    },
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) => {
        if (key === 'LINE_CHANNEL_ACCESS_TOKEN') return 'test-line-token';
        if (key === 'MONTHLY_REPORT_WEB_APP_URL') return 'https://example.test/monthly-report';
        return '';
      },
    }),
  },
  UrlFetchApp: {},
  SpreadsheetApp: {},
  DriveApp: {},
  DocumentApp: {},
  HtmlService: {},
  ContentService: {},
  CacheService: {},
  Session: {},
  MailApp: {},
  MimeType: {},
  Blob: global.Blob,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  Error,
  Set,
  Map,
};

vm.createContext(sandbox);
const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
vm.runInContext(source, sandbox, { filename: 'Code.gs' });
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Index.html'), 'utf8');
[
  'teacherSection',
  'adminSection',
  'partTimeSection',
  'assistantSection',
  'saveDraftBtn',
  'editReportBtn',
  'submitBtn',
  'partTimeDraftBtn',
  'partTimeEditBtn',
  'partTimeSaveBtn',
  'fillReviewHistoryCard',
].forEach((id) => {
  assert.match(indexSource, new RegExp(`id=["']${id}["']`), `缺少必要頁面或按鈕：${id}`);
});
assert.match(indexSource, /\$\('editReportBtn'\)\.onclick/, '一般填報頁修改按鈕尚未綁定');
assert.match(indexSource, /\$\('partTimeEditBtn'\)\.onclick/, '兼任老師修改按鈕尚未綁定');
assert.match(indexSource, /renderFillReviewHistory\(\)/, '填報頁尚未顯示主管歷次審核意見');

const teacher = {
  id: 'u-teacher-test',
  account: 'teacher-test',
  name: 'Test Teacher',
  role: 'teacher',
  branch: '樂獅英語新竹二重分校',
  lineTargetId: 'U-test-teacher',
  notifyByLine: true,
};
const manager = {
  id: 'u-manager-test',
  account: 'manager-test',
  name: 'Test Manager',
  role: 'manager',
  branch: teacher.branch,
};
const firstReview = {
  id: 'review-1',
  status: 'needs_revision',
  reviewerId: manager.id,
  reviewerName: manager.name,
  reviewerNote: '第一次審核：請補充說明。',
  reviewedAt: '2026-07-09T04:00:00.000Z',
};
const state = {
  users: [teacher, manager],
  reports: [{
    id: 'r-2026-06-test',
    userId: teacher.id,
    role: teacher.role,
    month: '2026-06',
    branch: teacher.branch,
    status: 'needs_revision',
    updatedAt: firstReview.reviewedAt,
    submittedAt: '2026-07-08T04:00:00.000Z',
    reviewerNote: firstReview.reviewerNote,
    reviewHistory: [firstReview],
    submissionHistory: [{ action: 'submitted', month: '2026-06' }],
    data: {},
    scores: {},
  }],
  notificationLogs: [],
};

let activeSessionUser = teacher;
let managerNotificationCount = 0;
sandbox.requireSession_ = () => ({ user: activeSessionUser });
sandbox.loadState_ = () => state;
sandbox.saveState_ = () => state;
sandbox.normalizeReport_ = (report) => report;
sandbox.decorateReport_ = (report) => report;
sandbox.jsonResult_ = (value) => value;
sandbox.notifyManagersForSubmittedReport_ = () => {
  managerNotificationCount += 1;
  return { ok: true, message: '主管通知測試完成' };
};
sandbox.sendLinePushMessage_ = (token, target, message) => {
  lineMessages.push({ token, target, message });
};

const resubmitted = sandbox.saveReport('teacher-token', {
  ...state.reports[0],
  status: 'submitted',
  data: {},
});

assert.equal(resubmitted.month, '2026-06', '退回後跨過 10 日重新送出，必須保留原月份');
assert.equal(state.reports.length, 1, '重新送出應更新原月報，不得建立重複月報');
assert.equal(resubmitted.submissionHistory.at(-1).action, 'resubmitted_after_revision');
assert.equal(resubmitted.submissionHistory.at(-1).month, '2026-06');
assert.equal(managerNotificationCount, 1, '重新送出必須再次通知主管');

activeSessionUser = manager;
assert.throws(
  () => sandbox.reviewReport('manager-token', resubmitted.id, 'needs_revision', ''),
  /退回修正時請填寫主管審核意見/,
  '退回修正必須填寫審核意見',
);
const secondReview = sandbox.reviewReport('manager-token', resubmitted.id, 'reviewed', '第二次審核：內容已補齊，通過。');
assert.equal(secondReview.reviewHistory.length, 2);
assert.equal(secondReview.reviewHistory[0].reviewerNote, firstReview.reviewerNote, '第二次審核不得覆蓋第一次意見');
assert.equal(secondReview.reviewHistory[1].reviewerNote, '第二次審核：內容已補齊，通過。');

const thirdReview = sandbox.reviewReport('manager-token', resubmitted.id, 'needs_revision', '第三次審核：請再補附件。');
assert.equal(thirdReview.reviewHistory.length, 3);
assert.equal(thirdReview.reviewHistory[0].reviewerNote, firstReview.reviewerNote);
assert.equal(thirdReview.reviewHistory[1].reviewerNote, '第二次審核：內容已補齊，通過。');
assert.equal(thirdReview.reviewHistory[2].reviewerNote, '第三次審核：請再補附件。');
assert.equal(lineMessages.length, 2, '第二次與第三次審核都必須產生 LINE 通知');
assert.equal(lineMessages[0].target, teacher.lineTargetId);
assert.match(lineMessages[0].message, /審核通過/);
assert.match(lineMessages[1].message, /退回修正/);
assert.equal(state.notificationLogs.length, 2, '每次審核結果都必須寫入通知紀錄');

console.log('Apps Script workflow verification passed.');
console.log(JSON.stringify({
  preservedMonth: resubmitted.month,
  submissionHistoryCount: resubmitted.submissionHistory.length,
  reviewHistoryCount: thirdReview.reviewHistory.length,
  lineNotificationCount: lineMessages.length,
  notificationLogCount: state.notificationLogs.length,
  rolePageAndButtonCoverage: 'passed',
}, null, 2));
