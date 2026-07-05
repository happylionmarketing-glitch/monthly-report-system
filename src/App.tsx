import { useEffect, useRef, useState, useTransition } from 'react';
import type { FormEvent, ReactNode } from 'react';
import clsx from 'clsx';
import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import {
  clearAuthToken,
  fetchBootstrap,
  fetchCurrentReport,
  fetchMe,
  fetchReportDetail,
  fetchReports,
  login,
  saveReport,
  setAuthToken,
} from './api';
import {
  attendanceCategories,
  attendanceCategoryLabels,
  buildAdminPerformanceBreakdown,
  buildTeacherPerformanceBreakdown,
  copyDefaultClassAssignments,
  courseTypeLabels,
  courseTypeOptions,
  createEmptyAttendanceRecord,
  createEmptyClassAssignment,
  createEmptyTeacherWorkRecord,
  formatYearsOfService,
  roleLabels,
  statusLabels,
  summarizeAttendance,
  summarizeTeacherWork,
  syncReportScores,
  teacherWorkCategories,
  teacherWorkCategoryLabels,
} from './reportUtils';
import type {
  AdminReport,
  AppView,
  AttendanceRecord,
  BootstrapData,
  MonthlyReport,
  ReportFilters,
  ReportStatus,
  ReviewHistoryEntry,
  StudentMovementDigest,
  StudentMovementReminderItem,
  StudentMovementType,
  TeacherReport,
  TeacherWorkRecord,
  User,
} from './types';

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '尚未送出';
  }

  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatMovementWindow(windowStart: string, windowEnd: string) {
  return `${formatDateLabel(windowStart)} - ${formatDateLabel(windowEnd)}`;
}

function formatMovementUpdatedAt(value: string) {
  return new Date(value).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function movementTypeTone(type: StudentMovementType) {
  if (type === 'loss') {
    return 'loss';
  }
  if (type === 'trial') {
    return 'trial';
  }
  if (type === 'transfer_in' || type === 'transfer_out') {
    return 'transfer';
  }
  return 'insert';
}

function groupMovementItemsByDate(items: StudentMovementReminderItem[]) {
  const groups = new Map<string, StudentMovementReminderItem[]>();

  items.forEach((item) => {
    const key = item.eventDate ?? item.eventDateLabel;
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([date, entries]) => ({
    date,
    entries,
  }));
}

function scoreLabel(value: number | null) {
  if (value === null) {
    return '不列入';
  }

  return value.toFixed(1);
}

function downloadReport(reportId: string, format: 'pdf' | 'docx') {
  const url = `/api/reports/${reportId}/export?format=${format}`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = '';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [month, setMonth] = useState(currentMonthValue());
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeView, setActiveView] = useState<AppView>('fill');
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [reportList, setReportList] = useState<MonthlyReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedReportDetail, setSelectedReportDetail] = useState<MonthlyReport | null>(null);
  const reviewNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    month: currentMonthValue(),
    role: '',
    status: '',
    search: '',
  });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const users = bootstrap?.users ?? [];
  const currentUser = authUser as User;
  const managerUser = users.find((user) => user.role === 'manager') ?? null;

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((user) => {
        if (!active) {
          return;
        }

        setAuthUser(user);
        setLoginAccount(user.account);
        setActiveView(user.role === 'manager' ? 'dashboard' : 'fill');
      })
      .catch(() => {
        clearAuthToken();
        if (active) {
          setAuthUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    let active = true;
    fetchBootstrap(month)
      .then((data) => {
        if (!active) {
          return;
        }

        setBootstrap(data);
        setFilters((previous) => ({ ...previous, month }));
        setReportList(data.recentReports);
        setSelectedReportId((previous) =>
          previous && data.recentReports.some((report) => report.id === previous)
            ? previous
            : data.recentReports[0]?.id ?? '',
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authUser, month]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'manager') {
      return;
    }

    let active = true;
    fetchCurrentReport(currentUser.id, month).then((report) => {
      if (active) {
        setCurrentReport(syncReportScores(report));
      }
    });

    return () => {
      active = false;
    };
  }, [currentUser, month]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    fetchReports(filters).then((reports) => {
      setReportList(reports);
      if (!reports.some((report) => report.id === selectedReportId)) {
        setSelectedReportId(reports[0]?.id ?? '');
      }
    });
  }, [authUser, filters, selectedReportId]);

  useEffect(() => {
    if (!selectedReportId) {
      return;
    }

    fetchReportDetail(selectedReportId).then((report) => {
      setSelectedReportDetail(report);
    });
  }, [selectedReportId]);

  function updateTeacherReport(updater: (report: TeacherReport) => TeacherReport) {
    setCurrentReport((previous) => {
      if (!previous || previous.role !== 'teacher') {
        return previous;
      }

      return syncReportScores(updater(previous));
    });
  }

  function updateAdminReport(updater: (report: AdminReport) => AdminReport) {
    setCurrentReport((previous) => {
      if (!previous || previous.role !== 'admin') {
        return previous;
      }

      return syncReportScores(updater(previous));
    });
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    login(loginAccount.trim(), loginPassword)
      .then((session) => {
        setAuthToken(session.token);
        setAuthUser(session.user);
        setLoginAccount(session.user.account);
        setLoginPassword('');
        setActiveView(session.user.role === 'manager' ? 'dashboard' : 'fill');
        setLoading(true);
      })
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? '帳號或密碼錯誤，請再確認一次。' : '登入失敗，請稍後再試。');
      });
  }

  function handleLogout() {
    clearAuthToken();
    setAuthUser(null);
    setBootstrap(null);
    setCurrentReport(null);
    setReportList([]);
    setSelectedReportDetail(null);
    setSelectedReportId('');
    setFeedback('');
    setAuthError('');
    setLoading(false);
    setAuthLoading(false);
    setActiveView('fill');
  }

  function handleSave(status: ReportStatus) {
    if (!currentReport || !currentUser || currentUser.role === 'manager') {
      return;
    }

    setFeedback('');
    startSaving(() => {
      const reportToSave = syncReportScores({
        ...currentReport,
        branch: currentUser.branch,
        month,
        status,
      });

      saveReport(reportToSave)
        .then((savedReport) => {
          setCurrentReport(savedReport);
          if (status === 'draft') {
            setFeedback('草稿已儲存。');
          } else {
            setFeedback(currentReport.status === 'needs_revision' ? '已重新送出修正版月報。' : '月報已送出。');
          }
          return Promise.all([fetchBootstrap(month), fetchReports(filters)]);
        })
        .then(([data, reports]) => {
          setBootstrap(data);
          setReportList(reports);
          setSelectedReportId((previous) => previous || reports[0]?.id || '');
        });
    });
  }

  function handleReviewSave(status: 'reviewed' | 'needs_revision') {
    if (!selectedReportDetail || currentUser?.role !== 'manager') {
      return;
    }

    const reviewerNote = reviewNoteRef.current?.value ?? selectedReportDetail.reviewerNote;
    const reviewHistory = [
      ...(selectedReportDetail.reviewHistory ?? []),
      {
        id: `rh-${Date.now()}`,
        status,
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        reviewerNote,
        reviewedAt: new Date().toISOString(),
      },
    ];
    setFeedback('');
    startSaving(() => {
      const reportToSave = syncReportScores({
        ...selectedReportDetail,
        status,
        reviewerNote,
        reviewHistory,
      });

      saveReport(reportToSave)
        .then((savedReport) => {
          setSelectedReportDetail(savedReport);
          setFeedback(status === 'reviewed' ? '月報已審核通過。' : '月報已退回修正。');
          return Promise.all([fetchBootstrap(month), fetchReports(filters), fetchReportDetail(savedReport.id)]);
        })
        .then(([data, reports, report]) => {
          setBootstrap(data);
          setReportList(reports);
          setSelectedReportDetail(report);
          setSelectedReportId(report.id);
        });
    });
  }

  const dashboard = bootstrap?.dashboard;
  const studentMovementDigest = bootstrap?.studentMovementDigest;
  const selectedSummary = currentReport?.scores ?? {
    performance: 0,
    selfEvaluation: 0,
    execution: null,
    overall: 0,
  };
  const needsRevision = currentReport?.status === 'needs_revision';
  const submitButtonLabel = needsRevision ? '重新送出' : '正式送出';
  const fillReminders = currentReport?.role === 'teacher'
    ? [
      '帶班班級請逐班填「班名、級數、人數」，系統會自動計算帶班人數與教學能力分數。',
      '病假、事假、特休、遲到請逐筆填日期；系統會自動統計次數、天數與時數。',
      '代課、被代課、補課、活動與培訓也請逐筆填日期，方便後台查詢與追蹤。',
      '可抗與不可抗流失請分開寫清楚原因，主管才看得出後續支援需求。',
    ]
    : [
      '櫃詢、Call 班、海報與表單繳交請依實際結果填寫，系統會依行政月報規則換算績效。',
      '病假、事假、特休、遲到請逐筆填日期，後台會自動統計本月出勤摘要。',
      '若是本月有新增進班人數，建議在說明欄補上重點來源，方便後續招生檢討。',
      '自評分數與執行力分數請搭配原因說明，主管比較容易快速理解你的工作狀態。',
    ];

  if (authLoading) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-card">
          <ShieldCheck size={28} />
          <div>
            <strong>登入驗證中</strong>
            <p>正在確認你的帳號權限。</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="app-shell login-shell">
        <div className="login-card">
          <p className="eyebrow">Lion Learning</p>
          <h1>月報填報系統登入</h1>
          <p>請使用老師或主管帳號登入。</p>
          <form className="login-form" onSubmit={handleLogin}>
            <label className="field">
              <span>帳號</span>
              <input
                className="field-input"
                value={loginAccount}
                onChange={(event) => setLoginAccount(event.target.value)}
                autoComplete="username"
                placeholder="jack / claire / ruby / crystal / sally"
              />
            </label>
            <label className="field">
              <span>密碼</span>
              <input
                className="field-input"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="請輸入密碼"
              />
            </label>
            {authError ? <div className="success-banner">{authError}</div> : null}
            <button className="primary-button" type="submit">登入</button>
          </form>
          <p className="login-hint">老師與主管登入後，系統會依權限顯示不同功能。</p>
        </div>
      </div>
    );
  }

  if (loading || !bootstrap) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-card">
          <ShieldCheck size={28} />
          <div>
            <strong>資料載入中</strong>
            <p>正在準備你的月報與 Dashboard。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Lion Learning</p>
          <h1>{bootstrap.metadata.systemName}</h1>
          <p>{bootstrap.metadata.branchName}</p>
        </div>

        <div className="sidebar-section">
          <label className="field-label" htmlFor="month">填報月份</label>
          <input
            id="month"
            className="field-input"
            type="month"
            value={month}
            onChange={(event) => {
              setLoading(true);
              setMonth(event.target.value);
            }}
          />
        </div>

        <div className="sidebar-section">
          <span className="field-label">目前登入</span>
          <div className="login-summary">
            <strong>{currentUser.name}</strong>
            <span>{roleLabels[currentUser.role]}</span>
          </div>
          <button className="ghost-button small" type="button" onClick={handleLogout}>登出</button>
        </div>

        <nav className="view-nav">
          {currentUser.role !== 'manager' ? (
            <button
              className={clsx('view-button', activeView === 'fill' && 'active')}
              onClick={() => setActiveView('fill')}
              type="button"
            >
              <ClipboardList size={18} />
              月報填寫
            </button>
          ) : null}
          <button
            className={clsx('view-button', activeView === 'dashboard' && 'active')}
            onClick={() => setActiveView('dashboard')}
            type="button"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          {currentUser.role === 'manager' ? (
            <button
              className={clsx('view-button', activeView === 'manage' && 'active')}
              onClick={() => setActiveView('manage')}
              type="button"
            >
              <Users size={18} />
              後台查詢
            </button>
          ) : null}
        </nav>

        <div className="sidebar-note">
          <h2>目前版本</h2>
          <p>這版已先把英語老師與行政老師共用月報、逐筆出勤、逐筆教學紀錄與 Dashboard 一起串起來。</p>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">MVP Quick Build</p>
            <h2>英語老師 + 行政老師共用月報系統</h2>
            <p className="topbar-subtitle">
              目前使用者：{currentUser.name}・{roleLabels[currentUser.role]}
              {managerUser ? `｜主管帳號：${managerUser.name}` : ''}
            </p>
          </div>
          <div className="status-pair">
            {currentUser.role !== 'manager' && currentReport ? (
              <StatusBadge status={currentReport.status} />
            ) : studentMovementDigest ? (
              <StatusBadge status="submitted" label={`異動 ${studentMovementDigest.summary.totalUpcoming} 筆`} />
            ) : null}
            <StatusBadge status="reviewed" label={`完成率 ${dashboard?.metrics.completionRate ?? 0}%`} />
          </div>
        </header>

        {feedback ? <div className="success-banner">{feedback}</div> : null}

        {activeView === 'fill' && currentReport ? (
          <section className="content-grid">
            <div className="panel panel-wide">
              <PanelHeader
                icon={<BookOpenText size={18} />}
                title="本月填報"
                description="欄位與說明已對齊英語老師／行政老師月報新格式，系統會自動整理加總與計分。"
              />

              <div className="identity-strip">
                <InfoBlock label="姓名" value={currentUser.name} />
                <InfoBlock label="角色" value={roleLabels[currentUser.role]} />
                <InfoBlock label="到職日" value={currentUser.startDate} />
                <InfoBlock label="年資" value={formatYearsOfService(currentUser.startDate)} />
              </div>

              {needsRevision ? (
                <div className="revision-banner">
                  <strong>目前狀態：退回修正</strong>
                  <p>{currentReport.reviewerNote || '主管尚未填寫退回原因，請先與主管確認後再修正。'}</p>
                  <span>修正完成後，請直接按「重新送出」。</span>
                </div>
              ) : null}

              <div className="score-overview-grid">
                <ReadOnlyScoreCard title="績效評比分數" description="依月報格式規則自動換算。" value={scoreLabel(selectedSummary.performance)} />
                <ReadOnlyScoreCard title="自評分數" description="由填表者自評欄位帶入。" value={scoreLabel(selectedSummary.selfEvaluation)} />
                <ReadOnlyScoreCard
                  title="執行力分數"
                  description={currentReport.role === 'teacher' ? '教師版月報不另外列入執行力分數。' : '行政月報依執行力自評帶入。'}
                  value={scoreLabel(selectedSummary.execution)}
                />
                <ReadOnlyScoreCard title="本月總分" description="系統會自動依可列入項目平均。" value={scoreLabel(selectedSummary.overall)} emphasized />
              </div>

              {currentReport.role === 'teacher' ? (
                <TeacherForm report={currentReport} onChange={updateTeacherReport} defaultClasses={copyDefaultClassAssignments(currentUser)} />
              ) : (
                <AdminForm report={currentReport} onChange={updateAdminReport} />
              )}

              <div className="review-box">
                <div>
                  <strong>主管備註</strong>
                  <p>{currentReport.reviewerNote || '目前尚未有主管備註。'}</p>
                </div>
                <div>
                  <strong>最後更新</strong>
                  <p>{formatDateTime(currentReport.updatedAt)}</p>
                </div>
              </div>

              <ReviewHistoryPanel history={currentReport.reviewHistory ?? []} />

              <div className="action-row">
                <button className="ghost-button" onClick={() => handleSave('draft')} type="button" disabled={isSaving}>
                  <Save size={18} />
                  儲存草稿
                </button>
                <button className="primary-button" onClick={() => handleSave('submitted')} type="button" disabled={isSaving}>
                  <Send size={18} />
                  {submitButtonLabel}
                </button>
                <button className="ghost-button" type="button" onClick={() => downloadReport(currentReport.id, 'pdf')} disabled={!currentReport.id}>
                  匯出 PDF
                </button>
                <button className="ghost-button" type="button" onClick={() => downloadReport(currentReport.id, 'docx')} disabled={!currentReport.id}>
                  匯出 Word
                </button>
              </div>
            </div>

            <div className="panel panel-side">
              <PanelHeader
                icon={<GraduationCap size={18} />}
                title="填寫提醒"
                description="依月報新格式整理成主管最常查看的重點。"
              />
              <ul className="check-list">
                {fillReminders.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {activeView === 'dashboard' && dashboard ? (
          <section className="dashboard-layout">
            <div className="metric-grid">
              <MetricCard title="本月填報率" value={`${dashboard.metrics.completionRate}%`} icon={<CheckCircle2 size={20} />} tone="warm" />
              <MetricCard title="已送出份數" value={`${dashboard.metrics.submittedCount}`} icon={<ClipboardList size={20} />} tone="green" />
              <MetricCard title="待追蹤人數" value={`${dashboard.metrics.pendingCount}`} icon={<Users size={20} />} tone="blue" />
              <MetricCard title="平均總分" value={`${dashboard.metrics.averageScore}`} icon={<BarChart3 size={20} />} tone="ink" />
            </div>

            {studentMovementDigest ? (
              <StudentMovementPanel digest={studentMovementDigest} />
            ) : null}

            <div className="panel">
              <PanelHeader
                icon={<Users size={18} />}
                title="本月未送出名單"
                description="直接列出尚未送出與退回修正的人員，方便主管催填。"
              />
              <div className="follow-up-list compact">
                {dashboard.unsentList.length ? dashboard.unsentList.map((item) => (
                  <button
                    className="follow-up-card"
                    key={item.id}
                    onClick={() => {
                      setSelectedReportId(item.id);
                      setActiveView('manage');
                    }}
                    type="button"
                  >
                    <div className="follow-up-top">
                      <strong>{item.name}</strong>
                      <StatusBadge status={item.status} />
                    </div>
                    <p>{item.reason}</p>
                    <span>本月總分 {item.score}</span>
                  </button>
                )) : <p className="empty-state">本月目前沒有未送出的月報。</p>}
              </div>
            </div>

            <div className="content-grid">
              <div className="panel panel-wide">
                <PanelHeader
                  icon={<LayoutDashboard size={18} />}
                  title="角色填報概況"
                  description="查看英語老師與行政老師兩種角色的完成率與平均分數。"
                />
                <div className="role-stat-grid">
                  {dashboard.roleCards.map((card) => {
                    const percent = card.totalUsers ? Math.round((card.submittedCount / card.totalUsers) * 100) : 0;
                    return (
                      <div className="role-card" key={card.role}>
                        <div className="role-card-header">
                          <strong>{card.label}</strong>
                          <span>{card.submittedCount}/{card.totalUsers}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <p>平均分數 {card.averageScore}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="leaderboard">
                  <div className="leaderboard-header">
                    <strong>本月分數排行</strong>
                    <span>依整體分數排序</span>
                  </div>
                  {dashboard.leaderboard.map((item, index) => (
                    <button
                      className="leaderboard-row"
                      key={item.id}
                      onClick={() => {
                        setSelectedReportId(item.id);
                        setActiveView('manage');
                      }}
                      type="button"
                    >
                      <span className="rank-pill">#{index + 1}</span>
                      <span>{item.name}</span>
                      <span>{roleLabels[item.role]}</span>
                      <strong>{item.score}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel panel-side">
                <PanelHeader
                  icon={<Filter size={18} />}
                  title="待追蹤清單"
                  description="優先找出尚未送出、待審核或分數偏低的人員。"
                />
                <div className="follow-up-list">
                  {dashboard.followUps.length ? dashboard.followUps.map((item) => (
                    <button
                      className="follow-up-card"
                      key={item.id}
                      onClick={() => {
                        setSelectedReportId(item.id);
                        setActiveView('manage');
                      }}
                      type="button"
                    >
                      <div className="follow-up-top">
                        <strong>{item.name}</strong>
                        <StatusBadge status={item.status} />
                      </div>
                      <p>{item.reason}</p>
                      <span>本月總分 {item.score}</span>
                    </button>
                  )) : <p className="empty-state">本月目前沒有需要優先追蹤的人員。</p>}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeView === 'manage' ? (
          <section className="content-grid">
            <div className="panel panel-wide">
              <PanelHeader
                icon={<Search size={18} />}
                title="後台查詢"
                description="可依月份、角色、狀態與關鍵字查看所有月報。"
              />

              <div className="filter-grid">
                <input
                  className="field-input"
                  type="month"
                  value={filters.month}
                  onChange={(event) => setFilters((previous) => ({ ...previous, month: event.target.value }))}
                />
                <select
                  className="field-input"
                  value={filters.role}
                  onChange={(event) => setFilters((previous) => ({ ...previous, role: event.target.value as ReportFilters['role'] }))}
                >
                  <option value="">全部角色</option>
                  <option value="teacher">英語老師</option>
                  <option value="admin">行政老師</option>
                </select>
                <select
                  className="field-input"
                  value={filters.status}
                  onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value as ReportFilters['status'] }))}
                >
                  <option value="">全部狀態</option>
                  {bootstrap.statuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
                <input
                  className="field-input"
                  placeholder="搜尋姓名或狀態"
                  value={filters.search}
                  onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))}
                />
              </div>

              <div className="report-table">
                <div className="report-table-head">
                  <span>姓名</span>
                  <span>角色</span>
                  <span>狀態</span>
                  <span>總分</span>
                  <span>更新時間</span>
                </div>
                {reportList.map((report) => (
                  <button
                    className={clsx('report-row', selectedReportId === report.id && 'selected')}
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    type="button"
                  >
                    <span>{report.userName}</span>
                    <span>{roleLabels[report.role]}</span>
                    <span><StatusBadge status={report.status} /></span>
                    <strong>{report.scores.overall}</strong>
                    <span>{formatDateTime(report.updatedAt)}</span>
                  </button>
                ))}
                {!reportList.length ? <p className="empty-state">目前沒有符合條件的月報。</p> : null}
              </div>
            </div>

            <div className="panel panel-side">
              <PanelHeader
                icon={<ShieldCheck size={18} />}
                title="月報摘要"
                description="選一筆資料後，可快速看主管會關心的重點。"
              />
              {selectedReportId && selectedReportDetail ? (
                <>
                  <ReportDetailCard report={selectedReportDetail} />
                  {currentUser.role === 'manager' ? (
                    <div className="review-action-panel">
                      <div className="review-action-header">
                        <strong>主管審核</strong>
                        <StatusBadge status={selectedReportDetail.status} />
                      </div>
                      <label className="field">
                        <span>審核評語 / 退回修正原因</span>
                        <textarea
                          key={selectedReportDetail.id}
                          ref={reviewNoteRef}
                          className="field-textarea"
                          rows={5}
                          defaultValue={selectedReportDetail.reviewerNote}
                          placeholder="請輸入主管評語，或寫下退回修正的原因。"
                        />
                      </label>
                      <div className="review-action-row">
                        <button
                          className="ghost-button small"
                          type="button"
                          onClick={() => handleReviewSave('needs_revision')}
                          disabled={isSaving}
                        >
                          退回修正
                        </button>
                        <button
                          className="primary-button small"
                          type="button"
                          onClick={() => handleReviewSave('reviewed')}
                          disabled={isSaving}
                        >
                          審核通過
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="empty-state">請先從左側列表選擇一筆月報。</p>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function TeacherForm({
  report,
  onChange,
  defaultClasses,
}: {
  report: TeacherReport;
  onChange: (updater: (report: TeacherReport) => TeacherReport) => void;
  defaultClasses: TeacherReport['data']['classAssignments'];
}) {
  const { data } = report;
  const attendanceSummary = summarizeAttendance(data.attendanceRecords);
  const workSummary = summarizeTeacherWork(data.teachingRecords);
  const performanceBreakdown = buildTeacherPerformanceBreakdown(report);

  function updateAttendanceRecord(id: string, field: keyof AttendanceRecord, value: string | number) {
    onChange((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        attendanceRecords: previous.data.attendanceRecords.map((record) =>
          record.id === id ? { ...record, [field]: value } : record,
        ),
      },
    }));
  }

  function updateTeachingRecord(id: string, field: keyof TeacherWorkRecord, value: string | number) {
    onChange((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        teachingRecords: previous.data.teachingRecords.map((record) =>
          record.id === id ? { ...record, [field]: value } : record,
        ),
      },
    }));
  }

  return (
    <>
      <SectionTitle title="帶班班級與人數" description="依照教師月報格式，請逐班填寫班名、級數、班型與人數。" />
      <div className="sheet-card">
        <div className="sheet-table class-table">
          <div className="sheet-head">
            <span>班名</span>
            <span>級數</span>
            <span>班型</span>
            <span>人數</span>
            <span>操作</span>
          </div>
          {data.classAssignments.map((assignment) => (
            <div className="sheet-row" key={assignment.id}>
              <input
                className="field-input"
                value={assignment.className}
                onChange={(event) => onChange((previous) => ({
                  ...previous,
                  data: {
                    ...previous.data,
                    classAssignments: previous.data.classAssignments.map((item) =>
                      item.id === assignment.id ? { ...item, className: event.target.value } : item,
                    ),
                  },
                }))}
              />
              <input
                className="field-input"
                value={assignment.level}
                onChange={(event) => onChange((previous) => ({
                  ...previous,
                  data: {
                    ...previous.data,
                    classAssignments: previous.data.classAssignments.map((item) =>
                      item.id === assignment.id ? { ...item, level: event.target.value } : item,
                    ),
                  },
                }))}
              />
              <select
                className="field-input"
                value={assignment.courseType}
                onChange={(event) => onChange((previous) => ({
                  ...previous,
                  data: {
                    ...previous.data,
                    classAssignments: previous.data.classAssignments.map((item) =>
                      item.id === assignment.id ? { ...item, courseType: event.target.value as typeof item.courseType } : item,
                    ),
                  },
                }))}
              >
                {courseTypeOptions.map((option) => (
                  <option key={option} value={option}>{courseTypeLabels[option]}</option>
                ))}
              </select>
              <input
                className="field-input"
                type="number"
                min={0}
                value={assignment.studentCount}
                onChange={(event) => onChange((previous) => ({
                  ...previous,
                  data: {
                    ...previous.data,
                    classAssignments: previous.data.classAssignments.map((item) =>
                      item.id === assignment.id ? { ...item, studentCount: Number(event.target.value) } : item,
                    ),
                  },
                }))}
              />
              <button
                className="icon-button"
                type="button"
                onClick={() => onChange((previous) => ({
                  ...previous,
                  data: {
                    ...previous.data,
                    classAssignments: previous.data.classAssignments.filter((item) => item.id !== assignment.id),
                  },
                }))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="inline-actions">
          <button
            className="ghost-button small"
            type="button"
            onClick={() => onChange((previous) => ({
              ...previous,
              data: {
                ...previous.data,
                classAssignments: [...previous.data.classAssignments, createEmptyClassAssignment()],
              },
            }))}
          >
            <Plus size={16} />
            新增班級
          </button>
          {defaultClasses.length ? (
            <button
              className="ghost-button small"
              type="button"
              onClick={() => onChange((previous) => ({
                ...previous,
                data: {
                  ...previous.data,
                  classAssignments: defaultClasses.map((item) => createEmptyClassAssignment(item)),
                },
              }))}
            >
              還原預設帶班
            </button>
          ) : null}
        </div>
        <div className="summary-chip-grid">
          <SummaryChip title="帶班總人數" value={`${performanceBreakdown.totalStudentCount} 人`} />
          <SummaryChip title="教學能力分" value={`${performanceBreakdown.teachingAbility} / 5`} />
          <SummaryChip title="帶班人數分" value={`${performanceBreakdown.classLoadScore} / 5`} />
        </div>
        <p className="section-note">計分參考：H1-H2 每班 0.5 分，其餘常態班 / 英檢班 / 多益班每班 1 分；帶班總人數依紙本月報門檻自動換算。</p>
      </div>

      <SectionTitle title="出勤紀錄" description="病假、事假、特休、遲到請逐筆填寫日期，系統會自動加總次數、天數與時數。" />
      <AttendanceSection
        records={data.attendanceRecords}
        onAdd={() => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            attendanceRecords: [...previous.data.attendanceRecords, createEmptyAttendanceRecord()],
          },
        }))}
        onRemove={(id) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            attendanceRecords: previous.data.attendanceRecords.filter((record) => record.id !== id),
          },
        }))}
        onChange={updateAttendanceRecord}
        summary={attendanceSummary}
      />

      <SectionTitle title="教學與支援紀錄" description="代課、被代課、補課、活動舉辦、培訓參與請逐筆填寫日期與時數。" />
      <TeacherWorkSection
        records={data.teachingRecords}
        onAdd={() => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            teachingRecords: [...previous.data.teachingRecords, createEmptyTeacherWorkRecord()],
          },
        }))}
        onRemove={(id) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            teachingRecords: previous.data.teachingRecords.filter((record) => record.id !== id),
          },
        }))}
        onChange={updateTeachingRecord}
        summary={workSummary}
      />

      <SectionTitle title="績效數據" description="依教師月報新格式整理本月招生、流失、級測與教學行政相關欄位。" />
      <div className="field-grid three-up">
        <NumberField
          label="本月試讀人數"
          value={data.performanceMetrics.trialStudents}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, trialStudents: value },
            },
          }))}
        />
        <NumberField
          label="試讀後進班人數"
          value={data.performanceMetrics.convertedStudents}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, convertedStudents: value },
            },
          }))}
        />
        <NumberField
          label="本月級測人數"
          value={data.performanceMetrics.gradeTestStudents}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, gradeTestStudents: value },
            },
          }))}
        />
        <NumberField
          label="作業錯誤率 (%)"
          value={data.performanceMetrics.homeworkErrorRate}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, homeworkErrorRate: value },
            },
          }))}
        />
        <NumberField
          label="電輔成功率平均 (%)"
          value={data.performanceMetrics.phoneSupportSuccessRate}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, phoneSupportSuccessRate: value },
            },
          }))}
        />
        <NumberField
          label="本月櫃詢人數"
          value={data.performanceMetrics.inquiryStudentCount}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, inquiryStudentCount: value },
            },
          }))}
        />
        <NumberField
          label="不可抗流失人數"
          value={data.performanceMetrics.unavoidableLosses}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, unavoidableLosses: value },
            },
          }))}
        />
        <NumberField
          label="可抗流失人數"
          value={data.performanceMetrics.avoidableLosses}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, avoidableLosses: value },
            },
          }))}
        />
        <NumberField
          label="自評分數 (0-10)"
          value={data.reflection.selfEvaluation}
          max={10}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              reflection: { ...previous.data.reflection, selfEvaluation: value },
            },
          }))}
        />
      </div>
      <TextAreaField
        label="不可抗流失名單與原因"
        value={data.performanceMetrics.unavoidableLossNotes}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            performanceMetrics: { ...previous.data.performanceMetrics, unavoidableLossNotes: value },
          },
        }))}
      />
      <TextAreaField
        label="可抗流失名單與原因"
        value={data.performanceMetrics.avoidableLossNotes}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            performanceMetrics: { ...previous.data.performanceMetrics, avoidableLossNotes: value },
          },
        }))}
      />
      <TextAreaField
        label="客訴或特殊狀況"
        value={data.complaints}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            complaints: value,
          },
        }))}
      />
      <TextAreaField
        label="客訴處理與追蹤方式"
        value={data.complaintHandling}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            complaintHandling: value,
          },
        }))}
      />
      <div className="hint-block">
        <strong>績效評比分數試算</strong>
        <div className="summary-chip-grid">
          <SummaryChip title="試讀 / 進班加分" value={`${performanceBreakdown.conversionBonus}`} />
          <SummaryChip title="可抗流失扣分" value={`-${performanceBreakdown.avoidablePenalty}`} />
          <SummaryChip title="系統績效分數" value={`${report.scores.performance} / 10`} emphasized />
        </div>
        <p>計分方式參考紙本月報：進班每人 1 分、試讀未進班每人 0.2 分、可抗流失每人扣 1 分，不可抗流失不扣分。</p>
      </div>

      <SectionTitle title="自評與回饋" description="保留教師月報中的自評、修正、向上反應與下月目標。" />
      <TextAreaField
        label="本月覺得自己做對的事"
        value={data.reflection.wins}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, wins: value },
          },
        }))}
      />
      <TextAreaField
        label="本月需要修正的事"
        value={data.reflection.fixes}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, fixes: value },
          },
        }))}
      />
      <TextAreaField
        label="想向上反應的事 / 個人工作狀態"
        value={data.reflection.upwardFeedback}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, upwardFeedback: value },
          },
        }))}
      />
      <TextAreaField
        label="自評原因"
        value={data.reflection.selfEvaluationReason}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, selfEvaluationReason: value },
          },
        }))}
      />
      <TextAreaField
        label="本月想要特別讚許的團隊夥伴以及原因"
        value={data.reflection.teamPraise}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, teamPraise: value },
          },
        }))}
      />
      <TextAreaField
        label="下月目標"
        value={data.reflection.nextMonthGoal}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, nextMonthGoal: value },
          },
        }))}
      />
    </>
  );
}

function AdminForm({
  report,
  onChange,
}: {
  report: AdminReport;
  onChange: (updater: (report: AdminReport) => AdminReport) => void;
}) {
  const { data } = report;
  const attendanceSummary = summarizeAttendance(data.attendanceRecords);
  const performanceBreakdown = buildAdminPerformanceBreakdown(report);
  const checklistDone = [
    data.performanceMetrics.formChecklist.overdueNotice,
    data.performanceMetrics.formChecklist.weeklyHeadcount,
    data.performanceMetrics.formChecklist.monthEndHeadcount,
    data.performanceMetrics.formChecklist.tuitionBag,
  ].filter(Boolean).length;

  function updateAttendanceRecord(id: string, field: keyof AttendanceRecord, value: string | number) {
    onChange((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        attendanceRecords: previous.data.attendanceRecords.map((record) =>
          record.id === id ? { ...record, [field]: value } : record,
        ),
      },
    }));
  }

  return (
    <>
      <SectionTitle title="出勤紀錄" description="病假、事假、特休、遲到請逐筆填寫日期，系統會自動加總次數、天數與時數。" />
      <AttendanceSection
        records={data.attendanceRecords}
        onAdd={() => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            attendanceRecords: [...previous.data.attendanceRecords, createEmptyAttendanceRecord()],
          },
        }))}
        onRemove={(id) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            attendanceRecords: previous.data.attendanceRecords.filter((record) => record.id !== id),
          },
        }))}
        onChange={updateAttendanceRecord}
        summary={attendanceSummary}
      />

      <SectionTitle title="行政績效數據" description="依行政月報新格式整理櫃詢、Call 班、交件、海報與分校掌握度。" />
      <div className="field-grid three-up">
        <NumberField
          label="本月進班人數"
          value={data.performanceMetrics.newEnrollments}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, newEnrollments: value },
            },
          }))}
        />
        <NumberField
          label="櫃詢次數"
          value={data.performanceMetrics.inquiryCount}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, inquiryCount: value },
            },
          }))}
        />
        <NumberField
          label="Call 班通數"
          value={data.performanceMetrics.callCount}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, callCount: value },
            },
          }))}
        />
        <NumberField
          label="櫃詢成功率 (%)"
          value={data.performanceMetrics.conversionRate}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, conversionRate: value },
            },
          }))}
        />
        <NumberField
          label="分校掌握度 (%)"
          value={data.performanceMetrics.campusFamiliarityRate}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, campusFamiliarityRate: value },
            },
          }))}
        />
        <NumberField
          label="自評分數 (0-10)"
          value={data.reflection.selfEvaluation}
          max={10}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              reflection: { ...previous.data.reflection, selfEvaluation: value },
            },
          }))}
        />
        <NumberField
          label="執行力分數 (0-10)"
          value={data.reflection.execution}
          max={10}
          step={0.1}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              reflection: { ...previous.data.reflection, execution: value },
            },
          }))}
        />
      </div>

      <div className="toggle-cluster">
        <ToggleField
          label="一張開班海報"
          checked={data.performanceMetrics.posterCompleted}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: { ...previous.data.performanceMetrics, posterCompleted: value },
            },
          }))}
        />
        <ToggleField
          label="催繳單通知"
          checked={data.performanceMetrics.formChecklist.overdueNotice}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: {
                ...previous.data.performanceMetrics,
                formChecklist: { ...previous.data.performanceMetrics.formChecklist, overdueNotice: value },
              },
            },
          }))}
        />
        <ToggleField
          label="週人數統計"
          checked={data.performanceMetrics.formChecklist.weeklyHeadcount}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: {
                ...previous.data.performanceMetrics,
                formChecklist: { ...previous.data.performanceMetrics.formChecklist, weeklyHeadcount: value },
              },
            },
          }))}
        />
        <ToggleField
          label="月底人數統計"
          checked={data.performanceMetrics.formChecklist.monthEndHeadcount}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: {
                ...previous.data.performanceMetrics,
                formChecklist: { ...previous.data.performanceMetrics.formChecklist, monthEndHeadcount: value },
              },
            },
          }))}
        />
        <ToggleField
          label="學費袋製作"
          checked={data.performanceMetrics.formChecklist.tuitionBag}
          onChange={(value) => onChange((previous) => ({
            ...previous,
            data: {
              ...previous.data,
              performanceMetrics: {
                ...previous.data.performanceMetrics,
                formChecklist: { ...previous.data.performanceMetrics.formChecklist, tuitionBag: value },
              },
            },
          }))}
        />
      </div>

      <div className="hint-block">
        <strong>績效評比分數試算</strong>
        <div className="summary-chip-grid">
          <SummaryChip title="櫃詢分數" value={`${performanceBreakdown.inquiryScore}`} />
          <SummaryChip title="Call 班分數" value={`${performanceBreakdown.callScore}`} />
          <SummaryChip title="成功率分數" value={`${performanceBreakdown.conversionScore}`} />
          <SummaryChip title="海報分數" value={`${performanceBreakdown.posterScore}`} />
          <SummaryChip title="表格繳交分數" value={`${checklistDone} / 4`} />
          <SummaryChip title="分校掌握分數" value={`${performanceBreakdown.familiarityScore}`} />
          <SummaryChip title="系統績效分數" value={`${report.scores.performance} / 10`} emphasized />
        </div>
        <p>行政月報的績效總分會依櫃詢、Call 班、成功率、海報、表格繳交與分校掌握度做換算，並正規化成 10 分制。</p>
      </div>

      <SectionTitle title="自評與回饋" description="保留行政月報中的自評、執行力、向上反應與下月目標。" />
      <TextAreaField
        label="本月覺得自己做對的事"
        value={data.reflection.wins}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, wins: value },
          },
        }))}
      />
      <TextAreaField
        label="本月需要修正的事"
        value={data.reflection.fixes}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, fixes: value },
          },
        }))}
      />
      <TextAreaField
        label="想向上反應的事 / 個人工作狀態"
        value={data.reflection.upwardFeedback}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, upwardFeedback: value },
          },
        }))}
      />
      <TextAreaField
        label="自評原因"
        value={data.reflection.selfEvaluationReason}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, selfEvaluationReason: value },
          },
        }))}
      />
      <TextAreaField
        label="執行力補充說明"
        value={data.reflection.executionReason}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, executionReason: value },
          },
        }))}
      />
      <TextAreaField
        label="本月想要特別讚許的團隊夥伴以及原因"
        value={data.reflection.teamPraise}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, teamPraise: value },
          },
        }))}
      />
      <TextAreaField
        label="下月目標"
        value={data.reflection.nextMonthGoal}
        onChange={(value) => onChange((previous) => ({
          ...previous,
          data: {
            ...previous.data,
            reflection: { ...previous.data.reflection, nextMonthGoal: value },
          },
        }))}
      />
    </>
  );
}

function AttendanceSection({
  records,
  onAdd,
  onRemove,
  onChange,
  summary,
}: {
  records: AttendanceRecord[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof AttendanceRecord, value: string | number) => void;
  summary: ReturnType<typeof summarizeAttendance>;
}) {
  return (
    <div className="sheet-card">
      <div className="sheet-table attendance-table">
        <div className="sheet-head">
          <span>類別</span>
          <span>日期</span>
          <span>天數</span>
          <span>時數</span>
          <span>說明</span>
          <span>操作</span>
        </div>
        {records.map((record) => (
          <div className="sheet-row" key={record.id}>
            <select className="field-input" value={record.category} onChange={(event) => onChange(record.id, 'category', event.target.value)}>
              {attendanceCategories.map((option) => (
                <option key={option} value={option}>{attendanceCategoryLabels[option]}</option>
              ))}
            </select>
            <input className="field-input" type="date" value={record.date} onChange={(event) => onChange(record.id, 'date', event.target.value)} />
            <input className="field-input" type="number" min={0} step={0.5} value={record.days} onChange={(event) => onChange(record.id, 'days', Number(event.target.value))} />
            <input className="field-input" type="number" min={0} step={0.5} value={record.hours} onChange={(event) => onChange(record.id, 'hours', Number(event.target.value))} />
            <input className="field-input" value={record.note} onChange={(event) => onChange(record.id, 'note', event.target.value)} />
            <button className="icon-button" type="button" onClick={() => onRemove(record.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="inline-actions">
        <button className="ghost-button small" type="button" onClick={onAdd}>
          <Plus size={16} />
          新增出勤紀錄
        </button>
      </div>
      <div className="summary-chip-grid">
        {attendanceCategories.map((category) => (
          <SummaryChip
            key={category}
            title={attendanceCategoryLabels[category]}
            value={`${summary[category].count} 次｜${summary[category].days} 天｜${summary[category].hours} 小時`}
          />
        ))}
      </div>
    </div>
  );
}

function TeacherWorkSection({
  records,
  onAdd,
  onRemove,
  onChange,
  summary,
}: {
  records: TeacherWorkRecord[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof TeacherWorkRecord, value: string | number) => void;
  summary: ReturnType<typeof summarizeTeacherWork>;
}) {
  return (
    <div className="sheet-card">
      <div className="sheet-table work-table">
        <div className="sheet-head">
          <span>類別</span>
          <span>日期</span>
          <span>班名</span>
          <span>級數</span>
          <span>時數</span>
          <span>說明</span>
          <span>操作</span>
        </div>
        {records.map((record) => (
          <div className="sheet-row" key={record.id}>
            <select className="field-input" value={record.category} onChange={(event) => onChange(record.id, 'category', event.target.value)}>
              {teacherWorkCategories.map((option) => (
                <option key={option} value={option}>{teacherWorkCategoryLabels[option]}</option>
              ))}
            </select>
            <input className="field-input" type="date" value={record.date} onChange={(event) => onChange(record.id, 'date', event.target.value)} />
            <input className="field-input" value={record.className} onChange={(event) => onChange(record.id, 'className', event.target.value)} />
            <input className="field-input" value={record.level} onChange={(event) => onChange(record.id, 'level', event.target.value)} />
            <input className="field-input" type="number" min={0} step={0.5} value={record.hours} onChange={(event) => onChange(record.id, 'hours', Number(event.target.value))} />
            <input className="field-input" value={record.note} onChange={(event) => onChange(record.id, 'note', event.target.value)} />
            <button className="icon-button" type="button" onClick={() => onRemove(record.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="inline-actions">
        <button className="ghost-button small" type="button" onClick={onAdd}>
          <Plus size={16} />
          新增教學紀錄
        </button>
      </div>
      <div className="summary-chip-grid">
        {teacherWorkCategories.map((category) => (
          <SummaryChip
            key={category}
            title={teacherWorkCategoryLabels[category]}
            value={`${summary[category].count} 次｜${summary[category].hours} 小時`}
          />
        ))}
      </div>
    </div>
  );
}

function ReportDetailCard({ report }: { report: MonthlyReport }) {
  const teacherSummary = report.role === 'teacher' ? summarizeAttendance(report.data.attendanceRecords) : null;
  const adminSummary = report.role === 'admin' ? summarizeAttendance(report.data.attendanceRecords) : null;

  return (
    <div className="detail-card">
      <div className="detail-top">
        <strong>{report.userName}</strong>
        <StatusBadge status={report.status} />
      </div>
      <p>{roleLabels[report.role]}｜{report.branch}</p>
      <div className="detail-score">總分 {report.scores.overall}</div>
      <InfoBlock label="送出時間" value={formatDateTime(report.submittedAt)} compact />
      {report.role === 'teacher' ? (
        <>
          <InfoBlock label="帶班班數" value={`${report.data.classAssignments.length} 班`} compact />
          <InfoBlock label="帶班總人數" value={`${report.data.classAssignments.reduce((sum, item) => sum + item.studentCount, 0)} 人`} compact />
          <InfoBlock label="出勤摘要" value={`病假 ${teacherSummary?.sick.count ?? 0} 次｜事假 ${teacherSummary?.personal.count ?? 0} 次｜特休 ${teacherSummary?.annual.count ?? 0} 次｜遲到 ${teacherSummary?.late.count ?? 0} 次`} compact />
        </>
      ) : (
        <>
          <InfoBlock label="本月進班人數" value={`${report.data.performanceMetrics.newEnrollments} 人`} compact />
          <InfoBlock label="櫃詢 / Call 班" value={`${report.data.performanceMetrics.inquiryCount} 次 / ${report.data.performanceMetrics.callCount} 通`} compact />
          <InfoBlock label="出勤摘要" value={`病假 ${adminSummary?.sick.count ?? 0} 次｜事假 ${adminSummary?.personal.count ?? 0} 次｜特休 ${adminSummary?.annual.count ?? 0} 次｜遲到 ${adminSummary?.late.count ?? 0} 次`} compact />
        </>
      )}
      <InfoBlock label="主管備註" value={report.reviewerNote || '尚未填寫'} compact />
      <InfoBlock label="本月做對的事" value={report.data.reflection.wins || '尚未填寫'} compact />
      <InfoBlock label="需要修正的事" value={report.data.reflection.fixes || '尚未填寫'} compact />
      <InfoBlock label="下月目標" value={report.data.reflection.nextMonthGoal || '尚未填寫'} compact />
      <ReviewHistoryPanel history={report.reviewHistory ?? []} compact />
      <div className="detail-action-row">
        <button className="ghost-button small" type="button" onClick={() => downloadReport(report.id, 'pdf')}>
          匯出 PDF
        </button>
        <button className="ghost-button small" type="button" onClick={() => downloadReport(report.id, 'docx')}>
          匯出 Word
        </button>
      </div>
    </div>
  );
}

function ReviewHistoryPanel({
  history,
  compact = false,
}: {
  history: ReviewHistoryEntry[];
  compact?: boolean;
}) {
  return (
    <div className={clsx('history-panel', compact && 'compact')}>
      <strong>主管審核紀錄</strong>
      {history.length ? (
        <ul>
          {[...history].sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt)).map((item) => (
            <li key={item.id}>
              <div className="history-top">
                <span>{item.reviewedAt}</span>
                <StatusBadge status={item.status} />
              </div>
              <p>{item.reviewerName}：{item.reviewerNote || '未填寫評語'}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">目前尚未有主管審核紀錄。</p>
      )}
    </div>
  );
}

function PanelHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        <span className="panel-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="section-title">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

function StudentMovementPanel({ digest }: { digest: StudentMovementDigest }) {
  const groupedUpcoming = groupMovementItemsByDate(digest.upcoming);

  return (
    <div className="panel movement-panel">
      <PanelHeader
        icon={<LayoutDashboard size={18} />}
        title="未來兩週學生異動提醒"
        description="直接整理二重分校 Dashboard 資料庫裡未來 14 天需要盯的插班、轉入、轉出、流失與試讀。"
      />

      <div className="movement-summary-grid">
        <div className="movement-summary-card emphasized">
          <span>提醒期間</span>
          <strong>{formatMovementWindow(digest.windowStart, digest.windowEnd)}</strong>
          <p>來源更新：{formatMovementUpdatedAt(digest.source.sourceUpdatedAt)}</p>
        </div>
        <div className="movement-summary-card">
          <span>兩週內事件</span>
          <strong>{digest.summary.totalUpcoming}</strong>
          <p>待排日期 {digest.summary.totalPendingWithoutDate} 筆</p>
        </div>
        <div className="movement-summary-card">
          <span>插班 / 轉入</span>
          <strong>{digest.summary.insertCount + digest.summary.transferInCount}</strong>
          <p>插班 {digest.summary.insertCount}｜轉入 {digest.summary.transferInCount}</p>
        </div>
        <div className="movement-summary-card">
          <span>轉出 / 流失</span>
          <strong>{digest.summary.transferOutCount + digest.summary.lossCount}</strong>
          <p>轉出 {digest.summary.transferOutCount}｜流失 {digest.summary.lossCount}</p>
        </div>
      </div>

      <div className="content-grid movement-grid">
        <div className="movement-column">
          <div className="movement-column-header">
            <strong>已排進未來 14 天的提醒</strong>
            <span>{digest.summary.totalUpcoming ? `${digest.summary.totalUpcoming} 筆` : '目前沒有新事件'}</span>
          </div>
          {groupedUpcoming.length ? (
            <div className="movement-day-list">
              {groupedUpcoming.map((group) => (
                <div className="movement-day-card" key={group.date}>
                  <div className="movement-day-header">
                    <strong>{group.entries[0]?.eventDate ? formatDateLabel(group.entries[0].eventDate) : group.date}</strong>
                    <span>{group.entries.length} 筆</span>
                  </div>
                  <div className="movement-item-list">
                    {group.entries.map((item) => (
                      <MovementItemCard item={item} key={item.id} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">目前資料裡還沒有落在這 14 天內的學生異動。</p>
          )}
        </div>

        <div className="movement-column">
          <div className="movement-column-header">
            <strong>待排日期 / 待確認</strong>
            <span>{digest.summary.totalPendingWithoutDate} 筆</span>
          </div>
          {digest.undatedPending.length ? (
            <div className="movement-item-list">
              {digest.undatedPending.map((item) => (
                <MovementItemCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="empty-state">目前沒有待排日期的學生異動。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MovementItemCard({ item }: { item: StudentMovementReminderItem }) {
  return (
    <div className="movement-item-card">
      <div className="movement-item-top">
        <div>
          <strong>{item.studentName}</strong>
          <p>{item.className} 班｜{item.eventDateLabel}</p>
        </div>
        <span className={clsx('movement-type-badge', `type-${movementTypeTone(item.movementType)}`)}>
          {item.rawActionLabel}
        </span>
      </div>
      <div className="movement-meta-row">
        <span className={clsx('status-badge', item.status === 'pending' ? 'status-needs_revision' : 'status-reviewed')}>
          {item.statusLabel}
        </span>
        <span>{item.daysUntil === null ? '待排日期' : `還有 ${item.daysUntil} 天`}</span>
        <span>資料列 {item.sourceRow}</span>
      </div>
      <p>{item.sourceNote}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: 'warm' | 'green' | 'blue' | 'ink';
}) {
  return (
    <div className={clsx('metric-card', `tone-${tone}`)}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
      <span>{icon}</span>
    </div>
  );
}

function StatusBadge({ status, label }: { status: ReportStatus; label?: string }) {
  return <span className={clsx('status-badge', `status-${status}`)}>{label ?? statusLabels[status]}</span>;
}

function InfoBlock({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={clsx('info-block', compact && 'compact')}>
      <span>{label}</span>
      <strong>{value || '未填寫'}</strong>
    </div>
  );
}

function ReadOnlyScoreCard({
  title,
  description,
  value,
  emphasized = false,
}: {
  title: string;
  description: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={clsx('score-read-card', emphasized && 'emphasized')}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </div>
  );
}

function SummaryChip({
  title,
  value,
  emphasized = false,
}: {
  title: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={clsx('summary-chip', emphasized && 'emphasized')}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea className="field-textarea" rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-card">
      <div>
        <strong>{label}</strong>
        <p>{checked ? '已完成' : '尚未完成'}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default App;

