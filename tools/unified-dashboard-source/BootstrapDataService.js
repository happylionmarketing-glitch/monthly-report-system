function getDashboardBootstrapData_(requestedState) {
  var mockData = getMockDashboardData_();
  var config = getDashboardConfig_();
  var liveData = config.mode === 'live'
    ? getEmptyDashboardData_(mockData)
    : deepClone_(mockData);
  var source = {
    mode: config.mode,
    label: config.mode === 'live' ? 'Live Sheets' : 'Mock Bootstrap',
    warnings: [],
    configuredSheets: [],
    sourceUrls: config.sourceUrls || {}
  };

  if (config.mode === 'mock') {
    return {
      data: liveData,
      source: source
    };
  }

  try {
    var spreadsheets = openConfiguredSpreadsheets_(config, source);
    var masterData = readMasterData_(spreadsheets.master, config.tabMap.master, source);
    var monthlyData = readMonthlyData_(spreadsheets.monthly, config.tabMap.monthly, source, config, requestedState, masterData.periods);
    var payrollData = readPayrollData_(
      spreadsheets.payroll,
      config.tabMap.payroll,
      source,
      config,
      requestedState,
      masterData.periods
    );
    var operationsData = readOperationsData_(spreadsheets.operations, spreadsheets.operationsByBranch, config.tabMap.operations, source);

    overlayModule_(liveData.shared, masterData);
    overlayModule_(liveData.monthly, monthlyData);
    overlayModule_(liveData.payroll, payrollData);
    overlayModule_(liveData.operations, operationsData);
    hydrateSharedReferenceData_(liveData, mockData);

    liveData.home.todos = buildHomeTodos_(liveData);
    liveData.home.quickActions = mockData.home.quickActions;

    source.label = buildDashboardSourceLabel_(config.mode, source.configuredSheets);
  } catch (error) {
    if (config.mode === 'live') {
      source.warnings.push('真實資料讀取失敗，目前改顯示空白正式版：' + error.message);
      liveData.home.todos = [];
      liveData.home.quickActions = mockData.home.quickActions;
      source.label = 'Live Read Failed';
    } else {
      source.warnings.push('真實資料讀取失敗，已退回預覽資料：' + error.message);
      liveData = deepClone_(mockData);
      source.label = '預覽資料載入失敗';
    }
  }

  return {
    data: liveData,
    source: source
  };
}

function openConfiguredSpreadsheets_(config, source) {
  var result = {
    master: null,
    monthly: null,
    payroll: null,
    operations: null,
    operationsByBranch: {}
  };

  ['master', 'monthly', 'operations'].forEach(function (key) {
    var id = config.spreadsheetIds[key];
    if (!id) return;
    try {
      result[key] = SpreadsheetApp.openById(id);
      source.configuredSheets.push(key);
    } catch (error) {
      source.warnings.push(key + ' sheet open failed: ' + error.message);
    }
  });

  if ((config.apiMode && String(config.apiMode.payroll || '').toLowerCase()) !== 'api') {
    var payrollId = config.spreadsheetIds.payroll;
    if (payrollId) {
      try {
        result.payroll = SpreadsheetApp.openById(payrollId);
        source.configuredSheets.push('payroll');
      } catch (error) {
        source.warnings.push('payroll sheet open failed: ' + error.message);
      }
    }
  }

  Object.keys(config.operationsBranchSheets || {}).forEach(function (branchName) {
    var id = config.operationsBranchSheets[branchName];
    if (!id) return;
    try {
      result.operationsByBranch[branchName] = SpreadsheetApp.openById(id);
      source.configuredSheets.push('operations:' + branchName);
    } catch (error) {
      source.warnings.push('operations sheet open failed for ' + branchName + ': ' + error.message);
    }
  });

  return result;
}

function getEmptyDashboardData_(mockData) {
  return {
    shared: {
      branches: [],
      periods: []
    },
    home: {
      todos: [],
      quickActions: (mockData && mockData.home && mockData.home.quickActions) || []
    },
    monthly: {
      summary_all: buildEmptyMonthlySummary_(),
      branch_progress: [],
      report_queue: [],
      field_audit: []
    },
    payroll: {
      summary_all: buildEmptyPayrollSummary_(),
      branch_progress: [],
      payroll_records: [],
      anomalies: [],
      lock_checklist: []
    },
    operations: {
      summary_all: buildEmptyOperationsSummary_(),
      branch_compare: [],
      funnel: [],
      risks: [],
      class_health: [],
      actions: []
    }
  };
}

function buildEmptyMonthlySummary_() {
  return {
    period_id: '',
    expected_reports: 0,
    draft_reports: 0,
    submitted_reports: 0,
    reviewed_reports: 0,
    needs_revision_reports: 0,
    pending_total: 0
  };
}

function buildEmptyPayrollSummary_() {
  return {
    period_id: '',
    teacher_count: 0,
    confirmed_teachers: 0,
    teacher_pending: 0,
    manager_pending: 0,
    anomaly_count: 0
  };
}

function buildEmptyOperationsSummary_() {
  return {
    period_id: '',
    active_students: 0,
    new_students: 0,
    risk_count: 0,
    class_count: 0,
    net_change: 0,
    inquiry_count: 0,
    test_count: 0,
    trial_t1: 0,
    trial_t2: 0,
    trial_total: 0,
    transfer_count: 0,
    lost_count: 0,
    call_out: 0,
    effective_calls: 0
  };
}

function buildDashboardSourceLabel_(mode, configuredSheets) {
  var hasMonthlyApi = (configuredSheets || []).indexOf('monthly:api') >= 0;
  var hasPayrollApi = (configuredSheets || []).indexOf('payroll:api') >= 0;

  if (mode === 'live') {
    if (hasMonthlyApi && hasPayrollApi) return '正式版資料庫 + 月報 API + 薪資 API';
    if (hasMonthlyApi) return '正式版資料庫 + 月報 API';
    if (hasPayrollApi) return '正式版資料庫 + 薪資 API';
    return configuredSheets.length ? '正式版資料庫' : '正式版資料庫';
  }
  if (hasMonthlyApi && hasPayrollApi) return '預覽 + 月報 API + 薪資 API';
  if (hasMonthlyApi) return '預覽 + 月報 API';
  if (hasPayrollApi) return '預覽 + 薪資 API';
  return configuredSheets.length ? '預覽資料 + Sheet 補位' : '預覽資料';
}

function readMasterData_(spreadsheet, tabMap, source) {
  if (!spreadsheet) {
    source.warnings.push('找不到 Master spreadsheet，正式版暫時顯示空白分校與期間資料。');
    return {};
  }

  var branchesSheet = findSheetByAliases_(spreadsheet, tabMap.branches);
  var periodsSheet = findSheetByAliases_(spreadsheet, tabMap.periods);
  var branches = branchesSheet ? mapBranches_(sheetToObjects_(branchesSheet)) : [];
  var periods = periodsSheet ? mapPeriods_(sheetToObjects_(periodsSheet)) : [];

  return {
    branches: branches.length ? branches : undefined,
    periods: periods.length ? periods : undefined
  };
}

function readMonthlyData_(spreadsheet, tabMap, source, config, requestedState, availablePeriods) {
  var apiPayload = tryReadMonthlyApiData_(config, source, requestedState);
  if (apiPayload) {
    return apiPayload;
  }

  if (!spreadsheet) {
    source.warnings.push('找不到 Monthly spreadsheet，正式版暫時顯示空白。');
    return buildEmptyMonthlyPayload_(requestedState);
  }

  var usersSheet = findSheetByAliases_(spreadsheet, tabMap.users);
  var reportsSheet = findSheetByAliases_(spreadsheet, tabMap.reports);
  var branchProgressSheet = findSheetByAliases_(spreadsheet, tabMap.branchProgress);
  var fieldAuditSheet = findSheetByAliases_(spreadsheet, tabMap.fieldAudit);

  var userDirectory = usersSheet ? buildMonthlyUserDirectory_(sheetToObjects_(usersSheet)) : [];
  var userLookup = buildMonthlyUserLookup_(userDirectory);
  var reportQueue = reportsSheet ? mapMonthlyReports_(sheetToObjects_(reportsSheet), userLookup) : [];
  var submissionRoster = buildMonthlySubmissionRoster_(userDirectory, reportQueue, availablePeriods, requestedState);
  var branchProgress = branchProgressSheet ? mapMonthlyBranchProgress_(sheetToObjects_(branchProgressSheet)) : aggregateMonthlyBranchProgressFromRoster_(submissionRoster);
  if (!branchProgress.length) {
    branchProgress = aggregateMonthlyBranchProgressFromRoster_(submissionRoster);
  }
  var summaryAll = summarizeMonthlyRoster_(submissionRoster);
  var fieldAudit = fieldAuditSheet ? mapSimpleCards_(sheetToObjects_(fieldAudit), 'audit_id') : [];

  return {
    summary_all: hasKeys_(summaryAll) ? summaryAll : undefined,
    branch_progress: branchProgress.length ? branchProgress : undefined,
    report_queue: reportQueue.length ? reportQueue : undefined,
    submission_roster: submissionRoster.length ? submissionRoster : undefined,
    user_directory: userDirectory.length ? userDirectory : undefined,
    field_audit: fieldAudit.length ? fieldAudit : undefined
  };
}

function tryReadMonthlyApiData_(config, source, requestedState) {
  var monthlyMode = getMonthlyApiMode_(config);
  var monthlyUrl = config && config.sourceUrls ? String(config.sourceUrls.monthly || '') : '';
  var monthlyToken = config && config.apiTokens ? String(config.apiTokens.monthly || '') : '';

  if (monthlyMode !== 'api' && monthlyMode !== 'hybrid_api_sheet' && monthlyMode !== 'live_api') {
    return null;
  }
  if (!monthlyUrl) {
    if (monthlyMode === 'api' || monthlyMode === 'live_api') {
      source.warnings.push('Monthly API 未設定 URL，正式版暫時顯示空白。');
    }
    return null;
  }

  try {
    var periodCandidates = buildMonthlyApiCandidatePeriods_(requestedState);
    var selectedPeriodId = '';
    var summaryResponse = null;
    var recordsResponse = null;

    for (var i = 0; i < periodCandidates.length; i += 1) {
      var candidatePeriodId = periodCandidates[i];
      var candidateSummary = fetchMonthlyApiJson_(monthlyUrl, {
        api: 'dashboardMonthlySummary',
        period: candidatePeriodId
      }, monthlyToken, {
        cacheSec: config && config.apiCacheSec ? config.apiCacheSec.monthly : 0
      });
      var candidateRecords = fetchMonthlyApiJson_(monthlyUrl, {
        api: 'dashboardMonthlyReports',
        period: candidatePeriodId,
        page: 1,
        pageSize: 1000
      }, monthlyToken, {
        cacheSec: config && config.apiCacheSec ? config.apiCacheSec.monthly : 0
      });

      if (hasMonthlyApiPayloadData_(candidateSummary, candidateRecords)) {
        selectedPeriodId = candidatePeriodId;
        summaryResponse = candidateSummary;
        recordsResponse = candidateRecords;
        break;
      }

      if (!summaryResponse) summaryResponse = candidateSummary;
      if (!recordsResponse) recordsResponse = candidateRecords;
    }

    var periodId = selectedPeriodId || resolveDefaultApiPeriodId_(monthlyMode);
    var staffMapResponse = fetchMonthlyApiJson_(monthlyUrl, {
      api: 'dashboardMonthlyStaffMap'
    }, monthlyToken, {
      cacheSec: config && config.apiCacheSec ? config.apiCacheSec.monthly : 0
    });

    source.configuredSheets.push('monthly:api');

    var staffRows = staffMapResponse && staffMapResponse.records ? staffMapResponse.records.map(normalizeObjectKeys_) : [];
    var userDirectory = buildMonthlyUserDirectory_(staffRows);
    var reportRows = mapMonthlyApiReports_(recordsResponse, staffMapResponse);
    var branchProgress = mapMonthlyApiBranchProgress_(summaryResponse);
    if (!branchProgress.length) {
      branchProgress = aggregateMonthlyBranchProgress_(reportRows);
    }
    var summaryAll = mapMonthlyApiSummary_(summaryResponse, branchProgress, reportRows, periodId);

    return {
      summary_all: summaryAll,
      branch_progress: branchProgress.length ? branchProgress : undefined,
      report_queue: reportRows.length ? reportRows : undefined,
      user_directory: userDirectory.length ? userDirectory : undefined,
      field_audit: mapMonthlyApiFieldAudit_(summaryResponse, recordsResponse, staffMapResponse)
    };
  } catch (error) {
    if (monthlyMode === 'api' || monthlyMode === 'live_api') {
      source.warnings.push('Monthly API 讀取失敗，已改用 Sheet 真實資料：' + error.message);
    }
    return null;
  }
}

function getMonthlyApiMode_(config) {
  return config && config.apiMode ? String(config.apiMode.monthly || '').toLowerCase() : '';
}

function buildMonthlyApiCandidatePeriods_(requestedState) {
  var periods = [];
  var requestedPeriod = requestedState && requestedState.period ? normalizePeriodId_(requestedState.period) : '';
  var basePeriodId = getDashboardCurrentPeriodId_();

  if (requestedPeriod) {
    periods.push(requestedPeriod);
  }

  for (var i = 0; i < 4; i += 1) {
    var candidatePeriod = shiftPeriodId_(basePeriodId, -i);
    if (periods.indexOf(candidatePeriod) === -1) {
      periods.push(candidatePeriod);
    }
  }

  return periods;
}

function hasMonthlyApiPayloadData_(summaryPayload, recordsPayload) {
  var summary = summaryPayload && summaryPayload.summary_all ? summaryPayload.summary_all : {};
  var records = recordsPayload && recordsPayload.records ? recordsPayload.records : [];

  return !!(summaryPayload && (summaryPayload.summary_all || summaryPayload.branch_progress))
    || records.length > 0
    || toNumber_(summary.expected_reports) > 0
    || toNumber_(summary.reviewed_reports) > 0;
}

function fetchMonthlyApiJson_(baseUrl, params, token, options) {
  options = options || {};
  var query = [];
  Object.keys(params || {}).forEach(function(key) {
    if (params[key] === undefined || params[key] === null || params[key] === '') return;
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
  });
  if (token) {
    query.push('token=' + encodeURIComponent(token));
  }
  var separator = String(baseUrl || '').indexOf('?') >= 0 ? '&' : '?';
  var requestUrl = baseUrl + separator + query.join('&');
  var cacheKey = buildApiCacheKey_('monthly', requestUrl);
  var cacheSec = toNumber_(options.cacheSec || 0);
  var cached = readApiCache_(cacheKey);
  if (cached) {
    return cached;
  }
  var requestOptions = {
    method: 'get',
    headers: {
      Accept: 'application/json'
    },
    muteHttpExceptions: true,
    followRedirects: false
  };
  if (token) {
    requestOptions.headers['X-Dashboard-Token'] = token;
  }
  var response = UrlFetchApp.fetch(requestUrl, requestOptions);
  var statusCode = response.getResponseCode();

  if (statusCode >= 300 && statusCode < 400) {
    var headers = response.getAllHeaders ? response.getAllHeaders() : {};
    var location = headers.Location || headers.location || '';
    if (location) {
      response = UrlFetchApp.fetch(String(location), {
        method: 'get',
        muteHttpExceptions: true,
        followRedirects: true
      });
      statusCode = response.getResponseCode();
    }
  }

  var responseText = response.getContentText() || '';
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Monthly API HTTP ' + statusCode + '：' + responseText.slice(0, 120));
  }

  try {
    var payload = JSON.parse(responseText);
    if (cacheSec > 0) {
      writeApiCache_(cacheKey, payload, cacheSec);
    }
    return payload;
  } catch (error) {
    throw new Error('Monthly API 回傳不是 JSON。');
  }
}

function mapMonthlyApiSummary_(summaryPayload, branchProgress, reportRows, fallbackPeriodId) {
  var raw = summaryPayload && summaryPayload.summary_all ? normalizeObjectKeys_(summaryPayload.summary_all) : {};
  var summary = {
    period_id: normalizePeriodId_(coalesceField_(raw, ['period_id', 'period']) || fallbackPeriodId),
    expected_reports: toNumber_(coalesceField_(raw, ['expected_reports'])),
    draft_reports: toNumber_(coalesceField_(raw, ['draft_reports'])),
    submitted_reports: toNumber_(coalesceField_(raw, ['submitted_reports'])),
    reviewed_reports: toNumber_(coalesceField_(raw, ['reviewed_reports'])),
    needs_revision_reports: toNumber_(coalesceField_(raw, ['needs_revision_reports'])),
    pending_total: toNumber_(coalesceField_(raw, ['pending_total']))
  };

  if (!summary.period_id) {
    summary.period_id = fallbackPeriodId || (branchProgress && branchProgress[0] ? branchProgress[0].period_id : '');
  }
  if (!summary.expected_reports && !summary.reviewed_reports && !summary.pending_total && !(summaryPayload && summaryPayload.summary_all)) {
    return summarizeMonthly_(branchProgress, reportRows);
  }
  return summary;
}

function mapMonthlyApiBranchProgress_(summaryPayload) {
  var rows = summaryPayload && summaryPayload.branch_progress ? summaryPayload.branch_progress : [];
  return mapMonthlyBranchProgress_(rows.map(normalizeObjectKeys_));
}

function mapMonthlyApiReports_(recordsPayload, staffMapPayload) {
  var staffRows = staffMapPayload && staffMapPayload.records ? staffMapPayload.records.map(normalizeObjectKeys_) : [];
  var userLookup = buildMonthlyUserLookup_(staffRows);
  var rows = recordsPayload && recordsPayload.records ? recordsPayload.records.map(normalizeObjectKeys_) : [];
  return mapMonthlyReports_(rows, userLookup);
}

function mapMonthlyApiFieldAudit_(summaryPayload, recordsPayload, staffMapPayload) {
  var fieldAudit = [];
  var summaryAudit = summaryPayload && summaryPayload.field_audit ? summaryPayload.field_audit : [];
  if (Array.isArray(summaryAudit) && summaryAudit.length) {
    fieldAudit = mapSimpleCards_(summaryAudit.map(normalizeObjectKeys_), 'audit_id');
  }
  if (!fieldAudit.length && staffMapPayload && staffMapPayload.records) {
    var staffRows = staffMapPayload.records.map(normalizeObjectKeys_);
    var missingBranchRows = staffRows.filter(function (row) {
      return !coalesceField_(row, ['branch_name', 'branch']);
    });
    if (missingBranchRows.length) {
      fieldAudit.push({
        audit_id: 'MR-API-AUDIT-BRANCH',
        label: '待補分校對照',
        title: '待補分校對照',
        meta: '月報 Staff Map 仍有 ' + missingBranchRows.length + ' 筆未帶 branch_name。'
      });
    }
  }
  return fieldAudit;
}

function normalizeObjectKeys_(row) {
  var result = {};
  Object.keys(row || {}).forEach(function (key) {
    result[normalizeHeaderKey_(key)] = row[key];
  });
  return result;
}

function buildEmptyMonthlyPayload_(requestedState) {
  var periodId = requestedState && requestedState.period ? normalizePeriodId_(requestedState.period) : '';
  var safePeriodId = periodId || resolveDefaultApiPeriodId_('api');

  return {
    summary_all: {
      period_id: safePeriodId,
      expected_reports: 0,
      draft_reports: 0,
      submitted_reports: 0,
      reviewed_reports: 0,
      needs_revision_reports: 0,
      pending_total: 0
    },
    branch_progress: [],
    report_queue: [],
    field_audit: []
  };
}

function buildEmptyPayrollPayload_(requestedState) {
  var periodId = requestedState && requestedState.period ? normalizePeriodId_(requestedState.period) : '';
  var safePeriodId = periodId || resolveDefaultApiPeriodId_('api');

  return {
    summary_all: {
      period_id: safePeriodId,
      teacher_count: 0,
      confirmed_teachers: 0,
      teacher_pending: 0,
      manager_pending: 0,
      anomaly_count: 0
    },
    branch_progress: [],
    payroll_records: [],
    anomalies: [],
    lock_checklist: []
  };
}

function validateStage2Bootstrap_(config, spreadsheets, requestedState, liveData) {
  var actualConfig = config || getDashboardConfig_();
  var monthlyValidation = compareMonthlyApiVsSheet_(actualConfig, spreadsheets && spreadsheets.monthly, actualConfig.tabMap && actualConfig.tabMap.monthly, requestedState);
  var payrollValidation = comparePayrollApiVsSheet_(actualConfig, spreadsheets && spreadsheets.payroll, actualConfig.tabMap && actualConfig.tabMap.payroll, requestedState);
  var issues = []
    .concat((monthlyValidation && monthlyValidation.issues) || [])
    .concat((payrollValidation && payrollValidation.issues) || []);

  return {
    ok: issues.length === 0,
    monthly: monthlyValidation,
    payroll: payrollValidation,
    issues: issues,
    live_snapshot: {
      monthly: liveData && liveData.monthly ? {
        summary_all: liveData.monthly.summary_all,
        report_queue_count: (liveData.monthly.report_queue || []).length
      } : null,
      payroll: liveData && liveData.payroll ? {
        summary_all: liveData.payroll.summary_all,
        payroll_records_count: (liveData.payroll.payroll_records || []).length
      } : null
    }
  };
}

function compareMonthlyApiVsSheet_(configOrPeriod, spreadsheet, tabMap, requestedState) {
  var config = configOrPeriod && configOrPeriod.apiMode ? configOrPeriod : getDashboardConfig_();
  var compareState = requestedState || {};

  if (typeof configOrPeriod === 'string' || typeof configOrPeriod === 'number') {
    compareState = { period: normalizePeriodId_(configOrPeriod) };
  }

  var actualSpreadsheet = spreadsheet || null;
  var actualTabMap = tabMap || (config.tabMap && config.tabMap.monthly) || getDefaultTabMap_().monthly;
  if (!actualSpreadsheet && config && config.spreadsheetIds && config.spreadsheetIds.monthly) {
    try {
      actualSpreadsheet = SpreadsheetApp.openById(config.spreadsheetIds.monthly);
    } catch (error) {
      actualSpreadsheet = null;
    }
  }
  var apiSource = {
    warnings: [],
    configuredSheets: [],
    sourceUrls: config.sourceUrls || {}
  };
  var sheetSource = {
    warnings: [],
    configuredSheets: [],
    sourceUrls: config.sourceUrls || {}
  };
  var sheetConfig = deepClone_(config);
  sheetConfig.apiMode = sheetConfig.apiMode || {};
  sheetConfig.apiMode.monthly = 'sheet';

  var apiData = tryReadMonthlyApiData_(config, apiSource, compareState);
  var sheetData = actualSpreadsheet ? readMonthlyData_(actualSpreadsheet, actualTabMap, sheetSource, sheetConfig, compareState) : buildEmptyMonthlyPayload_(compareState);
  var result = {
    checked: !!actualSpreadsheet,
    ok: true,
    period_id: normalizePeriodId_(compareState.period || (apiData && apiData.summary_all && apiData.summary_all.period_id) || (sheetData && sheetData.summary_all && sheetData.summary_all.period_id) || ''),
    api: {
      summary_all: apiData && apiData.summary_all ? apiData.summary_all : null,
      report_queue_count: apiData && apiData.report_queue ? apiData.report_queue.length : 0,
      branch_count: apiData && apiData.branch_progress ? apiData.branch_progress.length : 0
    },
    sheet: {
      summary_all: sheetData && sheetData.summary_all ? sheetData.summary_all : null,
      report_queue_count: sheetData && sheetData.report_queue ? sheetData.report_queue.length : 0,
      branch_count: sheetData && sheetData.branch_progress ? sheetData.branch_progress.length : 0
    },
    issues: [],
    warnings: [].concat(apiSource.warnings || [], sheetSource.warnings || [])
  };

  if (!actualSpreadsheet) {
    result.ok = false;
    result.issues.push({
      code: 'MISSING_MONTHLY_SHEET',
      message: 'Monthly spreadsheet 未設定，無法比對。'
    });
    return result;
  }

  if (!apiData) {
    result.ok = false;
    result.issues.push({
      code: 'MONTHLY_API_UNAVAILABLE',
      message: apiSource.warnings[0] || 'Monthly API 無法讀取。'
    });
    return result;
  }

  appendComparisonIssue_(result, 'expected_reports', toNumber_(result.api.summary_all && result.api.summary_all.expected_reports), toNumber_(result.sheet.summary_all && result.sheet.summary_all.expected_reports));
  appendComparisonIssue_(result, 'reviewed_reports', toNumber_(result.api.summary_all && result.api.summary_all.reviewed_reports), toNumber_(result.sheet.summary_all && result.sheet.summary_all.reviewed_reports));
  appendComparisonIssue_(result, 'pending_total', toNumber_(result.api.summary_all && result.api.summary_all.pending_total), toNumber_(result.sheet.summary_all && result.sheet.summary_all.pending_total));
  appendComparisonIssue_(result, 'report_queue_count', result.api.report_queue_count, result.sheet.report_queue_count);
  appendComparisonIssue_(result, 'branch_count', result.api.branch_count, result.sheet.branch_count);

  result.ok = result.issues.length === 0;
  return result;
}

function comparePayrollApiVsSheet_(configOrPeriod, spreadsheet, tabMap, requestedState) {
  var config = configOrPeriod && configOrPeriod.apiMode ? configOrPeriod : getDashboardConfig_();
  var compareState = requestedState || {};

  if (typeof configOrPeriod === 'string' || typeof configOrPeriod === 'number') {
    compareState = { period: normalizePeriodId_(configOrPeriod) };
  }

  var actualSpreadsheet = spreadsheet || null;
  var actualTabMap = tabMap || (config.tabMap && config.tabMap.payroll) || getDefaultTabMap_().payroll;
  if (!actualSpreadsheet && config && config.spreadsheetIds && config.spreadsheetIds.payroll) {
    try {
      actualSpreadsheet = SpreadsheetApp.openById(config.spreadsheetIds.payroll);
    } catch (error) {
      actualSpreadsheet = null;
    }
  }
  var apiSource = {
    warnings: [],
    configuredSheets: [],
    sourceUrls: config.sourceUrls || {}
  };
  var sheetSource = {
    warnings: [],
    configuredSheets: [],
    sourceUrls: config.sourceUrls || {}
  };
  var sheetConfig = deepClone_(config);
  sheetConfig.apiMode = sheetConfig.apiMode || {};
  sheetConfig.apiMode.payroll = 'sheet';

  var apiData = tryReadPayrollApiData_(config, apiSource, compareState);
  var sheetData = actualSpreadsheet ? readPayrollData_(actualSpreadsheet, actualTabMap, sheetSource, sheetConfig, compareState) : {};
  var result = {
    checked: !!actualSpreadsheet,
    ok: true,
    period_id: normalizePeriodId_(compareState.period || (apiData && apiData.summary_all && apiData.summary_all.period_id) || (sheetData && sheetData.summary_all && sheetData.summary_all.period_id) || ''),
    api: {
      summary_all: apiData && apiData.summary_all ? apiData.summary_all : null,
      payroll_records_count: apiData && apiData.payroll_records ? apiData.payroll_records.length : 0,
      branch_count: apiData && apiData.branch_progress ? apiData.branch_progress.length : 0,
      anomalies_count: apiData && apiData.anomalies ? apiData.anomalies.length : 0
    },
    sheet: {
      summary_all: sheetData && sheetData.summary_all ? sheetData.summary_all : null,
      payroll_records_count: sheetData && sheetData.payroll_records ? sheetData.payroll_records.length : 0,
      branch_count: sheetData && sheetData.branch_progress ? sheetData.branch_progress.length : 0,
      anomalies_count: sheetData && sheetData.anomalies ? sheetData.anomalies.length : 0
    },
    issues: [],
    warnings: [].concat(apiSource.warnings || [], sheetSource.warnings || [])
  };

  if (!actualSpreadsheet) {
    result.ok = false;
    result.issues.push({
      code: 'MISSING_PAYROLL_SHEET',
      message: 'Payroll spreadsheet 未設定，無法比對。'
    });
    return result;
  }

  if (!apiData) {
    result.ok = false;
    result.issues.push({
      code: 'PAYROLL_API_UNAVAILABLE',
      message: apiSource.warnings[0] || 'Payroll API 無法讀取。'
    });
    return result;
  }

  appendComparisonIssue_(result, 'teacher_count', toNumber_(result.api.summary_all && result.api.summary_all.teacher_count), toNumber_(result.sheet.summary_all && result.sheet.summary_all.teacher_count));
  appendComparisonIssue_(result, 'confirmed_teachers', toNumber_(result.api.summary_all && result.api.summary_all.confirmed_teachers), toNumber_(result.sheet.summary_all && result.sheet.summary_all.confirmed_teachers));
  appendComparisonIssue_(result, 'teacher_pending', toNumber_(result.api.summary_all && result.api.summary_all.teacher_pending), toNumber_(result.sheet.summary_all && result.sheet.summary_all.teacher_pending));
  appendComparisonIssue_(result, 'anomaly_count', toNumber_(result.api.summary_all && result.api.summary_all.anomaly_count), toNumber_(result.sheet.summary_all && result.sheet.summary_all.anomaly_count));
  appendComparisonIssue_(result, 'payroll_records_count', result.api.payroll_records_count, result.sheet.payroll_records_count);
  appendComparisonIssue_(result, 'branch_count', result.api.branch_count, result.sheet.branch_count);
  appendComparisonIssue_(result, 'anomalies_count', result.api.anomalies_count, result.sheet.anomalies_count);

  result.ok = result.issues.length === 0;
  return result;
}

function appendComparisonIssue_(result, metricName, apiValue, sheetValue) {
  if (Number(apiValue) === Number(sheetValue)) return;
  result.issues.push({
    code: 'MISMATCH_' + String(metricName || '').toUpperCase(),
    metric: metricName,
    api: apiValue,
    sheet: sheetValue,
    message: metricName + ' 不一致：API=' + apiValue + '，Sheet=' + sheetValue
  });
}

function readPayrollData_(spreadsheet, tabMap, source, config, requestedState, availablePeriods) {
  var payrollMode = config && config.apiMode ? String(config.apiMode.payroll || '').toLowerCase() : '';
  var apiPayload = tryReadPayrollApiData_(config, source, requestedState, availablePeriods);
  if (apiPayload) {
    return apiPayload;
  }

  if (payrollMode === 'api' || payrollMode === 'live_api') {
    return buildEmptyPayrollPayload_(requestedState);
  }

  if (!spreadsheet) {
    source.warnings.push('找不到 Payroll spreadsheet，正式版暫時顯示空白。');
    return buildEmptyPayrollPayload_(requestedState);
  }

  var employeesSheet = findSheetByAliases_(spreadsheet, tabMap.employees);
  var recordsSheet = findSheetByAliases_(spreadsheet, tabMap.records);
  var branchProgressSheet = findSheetByAliases_(spreadsheet, tabMap.branchProgress);
  var anomaliesSheet = findSheetByAliases_(spreadsheet, tabMap.anomalies);
  var lockChecklistSheet = findSheetByAliases_(spreadsheet, tabMap.lockChecklist);
  var policiesSheet = findSheetByAliases_(spreadsheet, ['salary_policies', 'SalaryPolicies', '閮?閬?', '?芾?閬?']);
  var teacherAccountsSheet = findSheetByAliases_(spreadsheet, ['teacher_accounts', 'TeacherAccounts', '撣唾?撖Ⅳ蝞∠?', '?∪極撣唾?']);

  var employeeRows = employeesSheet ? sheetToObjects_(employeesSheet) : [];
  var employeeLookup = buildPayrollEmployeeLookup_(employeeRows);
  var policyRows = policiesSheet ? sheetToObjects_(policiesSheet) : [];
  var policyList = mapPayrollPolicies_(policyRows);
  var profileLookup = buildPayrollProfileLookup_(policyList);
  var records = recordsSheet ? mapPayrollRecords_(sheetToObjects_(recordsSheet), employeeLookup, profileLookup) : [];
  if (!records.length && employeeRows.length) {
    records = derivePayrollRecordsFromEmployees_(employeeRows, employeeLookup, profileLookup, policyList);
  }

  var branchProgress = branchProgressSheet
    ? mapPayrollBranchProgress_(sheetToObjects_(branchProgressSheet))
    : aggregatePayrollBranchProgress_(records);
  var summaryAll = summarizePayroll_(branchProgress, records);
  var anomalies = anomaliesSheet ? mapPayrollAnomalies_(sheetToObjects_(anomaliesSheet)) : derivePayrollAnomalies_(records);
  var lockChecklist = lockChecklistSheet
    ? mapSimpleCards_(sheetToObjects_(lockChecklistSheet), 'check_id')
    : derivePayrollLockChecklist_(records, employeeRows, teacherAccountsSheet ? sheetToObjects_(teacherAccountsSheet) : []);

  return {
    summary_all: hasKeys_(summaryAll) ? summaryAll : undefined,
    branch_progress: branchProgress.length ? branchProgress : undefined,
    payroll_records: records.length ? records : undefined,
    anomalies: anomalies.length ? anomalies : undefined,
    lock_checklist: lockChecklist.length ? lockChecklist : undefined
  };
}

function tryReadPayrollApiData_(config, source, requestedState, availablePeriods) {
  var payrollMode = config && config.apiMode ? String(config.apiMode.payroll || '').toLowerCase() : '';
  var payrollUrl = config && config.sourceUrls ? String(config.sourceUrls.payroll || '') : '';
  var payrollToken = config && config.apiTokens ? String(config.apiTokens.payroll || '') : '';

  if (payrollMode !== 'api' && payrollMode !== 'hybrid_api_sheet' && payrollMode !== 'live_api') {
    return null;
  }
  if (!payrollUrl || !payrollToken) {
    source.warnings.push(
      payrollMode === 'api' || payrollMode === 'live_api'
        ? 'Payroll API 未完成設定，正式版暫時顯示空白：請補齊 URL / token。'
        : 'Payroll API 未完成設定，改用 Sheet 資料。'
    );
    return null;
  }

  try {
    var periodCandidates = buildPayrollApiCandidatePeriods_(requestedState);
    var selectedPeriodId = '';
    var summaryResponse = null;
    var recordsResponse = null;

    for (var i = 0; i < periodCandidates.length; i += 1) {
      var candidatePeriodId = periodCandidates[i];
      var candidateSummary = fetchPayrollApiJson_(payrollUrl, {
        api: 'dashboardPayrollSummary',
        period: candidatePeriodId
      }, payrollToken, {
        cacheSec: config && config.apiCacheSec ? config.apiCacheSec.payroll : 0
      });
      var candidateRecords = fetchPayrollApiJson_(payrollUrl, {
        api: 'dashboardPayrollRecords',
        period: candidatePeriodId,
        page: 1,
        pageSize: 500
      }, payrollToken, {
        cacheSec: config && config.apiCacheSec ? config.apiCacheSec.payroll : 0
      });

      if (hasPayrollApiPayloadData_(candidateSummary, candidateRecords)) {
        selectedPeriodId = candidatePeriodId;
        summaryResponse = candidateSummary;
        recordsResponse = candidateRecords;
        break;
      }

      if (!summaryResponse) summaryResponse = candidateSummary;
      if (!recordsResponse) recordsResponse = candidateRecords;
    }

    var periodId = selectedPeriodId || resolveDefaultApiPeriodId_(payrollMode);
    var employeesResponse = fetchPayrollApiJson_(payrollUrl, {
      api: 'dashboardPayrollEmployees'
    }, payrollToken, {
      cacheSec: config && config.apiCacheSec ? config.apiCacheSec.payroll : 0
    });
    var anomaliesResponse = fetchPayrollApiJson_(payrollUrl, {
      api: 'dashboardPayrollAnomalies',
      period: periodId
    }, payrollToken, {
      cacheSec: config && config.apiCacheSec ? config.apiCacheSec.payroll : 0
    });
    var historyPeriodIds = buildPayrollHistoryPeriodIds_(availablePeriods, periodId, periodCandidates);
    var historyRecordsPayloads = historyPeriodIds.length
      ? fetchPayrollApiJsonBatch_(payrollUrl, historyPeriodIds.map(function (historyPeriodId) {
          return {
            api: 'dashboardPayrollRecords',
            period: historyPeriodId,
            page: 1,
            pageSize: 1000
          };
        }), payrollToken, {
          cacheSec: config && config.apiCacheSec ? config.apiCacheSec.payroll : 0
        })
      : [];

    source.configuredSheets.push('payroll:api');

    return {
      summary_all: mapPayrollApiSummary_(summaryResponse),
      branch_progress: mapPayrollApiBranchProgress_(summaryResponse),
      payroll_records: mapPayrollApiRecordsBatch_(historyRecordsPayloads.length ? historyRecordsPayloads : [recordsResponse], employeesResponse),
      anomalies: mapPayrollApiAnomalies_(anomaliesResponse),
      lock_checklist: mapPayrollApiLockChecklist_(anomaliesResponse)
    };
  } catch (error) {
    source.warnings.push(
      payrollMode === 'api' || payrollMode === 'live_api'
        ? 'Payroll API 讀取失敗，暫時顯示空白正式版：' + error.message
        : 'Payroll API 讀取失敗，改用 Sheet 資料：' + error.message
    );
    return null;
  }
}

function resolveDefaultApiPeriodId_(fallbackMode) {
  var currentPeriod = getDashboardCurrentPeriodId_();
  return currentPeriod || (fallbackMode === 'api' ? '2026-07' : '');
}

function buildPayrollApiCandidatePeriods_(requestedState) {
  var periods = [];
  var requestedPeriod = requestedState && requestedState.period ? normalizePeriodId_(requestedState.period) : '';
  var basePeriodId = getDashboardCurrentPeriodId_();

  if (requestedPeriod) {
    periods.push(requestedPeriod);
  }

  for (var i = 0; i < 4; i += 1) {
    var candidatePeriod = shiftPeriodId_(basePeriodId, -i);
    if (periods.indexOf(candidatePeriod) === -1) {
      periods.push(candidatePeriod);
    }
  }

  return periods;
}

function buildPayrollHistoryPeriodIds_(availablePeriods, selectedPeriodId, fallbackPeriods) {
  var periods = normalizePayrollPeriodIds_(availablePeriods);
  if (!periods.length) {
    periods = normalizePayrollPeriodIds_(fallbackPeriods);
  }
  var selected = normalizePeriodId_(selectedPeriodId);
  if (selected && periods.indexOf(selected) === -1) {
    periods.push(selected);
  }
  return normalizePayrollPeriodIds_(periods);
}

function normalizePayrollPeriodIds_(periods) {
  var lookup = {};
  return (periods || [])
    .reduce(function (result, item) {
      var periodId = '';
      if (typeof item === 'string' || typeof item === 'number') {
        periodId = normalizePeriodId_(item);
      } else if (item && typeof item === 'object') {
        periodId = normalizePeriodId_(item.period_id || item.period || item.label || '');
      }
      if (!periodId || lookup[periodId]) {
        return result;
      }
      lookup[periodId] = true;
      result.push(periodId);
      return result;
    }, [])
    .sort(function (left, right) {
      if (left === right) return 0;
      return left < right ? 1 : -1;
    });
}

function hasPayrollApiPayloadData_(summaryPayload, recordsPayload) {
  var summary = summaryPayload && summaryPayload.summary_all ? summaryPayload.summary_all : {};
  var branchProgress = summaryPayload && summaryPayload.branch_progress ? summaryPayload.branch_progress : [];
  var records = recordsPayload && recordsPayload.records ? recordsPayload.records : [];

  return records.length > 0
    || toNumber_(summary.confirmed_teachers) > 0
    || toNumber_(summary.manager_pending) > 0;
}

function fetchPayrollApiJson_(baseUrl, params, token, options) {
  options = options || {};
  var requestUrl = buildPayrollApiRequestUrl_(baseUrl, params, token);
  var cacheKey = buildApiCacheKey_('payroll', requestUrl);
  var cacheSec = toNumber_(options.cacheSec || 0);
  var cached = readApiCache_(cacheKey);
  if (cached) {
    return cached;
  }
  var payload = parsePayrollApiJsonResponse_(UrlFetchApp.fetch(requestUrl, buildPayrollApiRequestOptions_(token)));
  if (cacheSec > 0) {
    writeApiCache_(cacheKey, payload, cacheSec);
  }
  return payload;
}

function fetchPayrollApiJsonBatch_(baseUrl, requestParamsList, token, options) {
  options = options || {};
  var cacheSec = toNumber_(options.cacheSec || 0);
  var results = new Array((requestParamsList || []).length);
  var pendingRequests = [];

  (requestParamsList || []).forEach(function (params, index) {
    var requestUrl = buildPayrollApiRequestUrl_(baseUrl, params, token);
    var cacheKey = buildApiCacheKey_('payroll', requestUrl);
    var cached = readApiCache_(cacheKey);
    if (cached) {
      results[index] = cached;
      return;
    }
    pendingRequests.push({
      index: index,
      cacheKey: cacheKey,
      request: {
        url: requestUrl,
        method: 'get',
        headers: {
          Accept: 'application/json',
          'X-Dashboard-Token': token
        },
        muteHttpExceptions: true,
        followRedirects: true
      }
    });
  });

  if (pendingRequests.length) {
    var responses = UrlFetchApp.fetchAll(pendingRequests.map(function (entry) {
      return entry.request;
    }));
    responses.forEach(function (response, index) {
      var entry = pendingRequests[index];
      var payload = parsePayrollApiJsonResponse_(response);
      if (cacheSec > 0) {
        writeApiCache_(entry.cacheKey, payload, cacheSec);
      }
      results[entry.index] = payload;
    });
  }

  return results;
}

function buildPayrollApiRequestUrl_(baseUrl, params, token) {
  var query = [];
  Object.keys(params || {}).forEach(function (key) {
    if (params[key] === undefined || params[key] === null || params[key] === '') return;
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
  });
  query.push('token=' + encodeURIComponent(token));
  var separator = String(baseUrl || '').indexOf('?') >= 0 ? '&' : '?';
  return baseUrl + separator + query.join('&');
}

function buildPayrollApiRequestOptions_(token) {
  var headers = {
    Accept: 'application/json'
  };
  if (token) {
    headers['X-Dashboard-Token'] = token;
  }
  return {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true,
    followRedirects: true
  };
}

function parsePayrollApiJsonResponse_(response) {
  var statusCode = response.getResponseCode();
  var body = response.getContentText() || '';
  var payload = {};

  try {
    payload = JSON.parse(body);
  } catch (error) {
    throw new Error('Payroll API 回傳不是 JSON。');
  }

  if (statusCode >= 400 || !payload.ok) {
    throw new Error((payload && payload.message) || ('HTTP ' + statusCode));
  }
  return payload;
}

function buildApiCacheKey_(prefix, requestUrl) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    String(requestUrl || '')
  );
  return prefix + ':' + Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function readApiCache_(cacheKey) {
  if (!cacheKey) return null;
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch (error) {
    return null;
  }
}

function writeApiCache_(cacheKey, payload, cacheSec) {
  if (!cacheKey || !cacheSec) return;
  var cache = CacheService.getScriptCache();
  try {
    cache.put(cacheKey, JSON.stringify(payload), Math.max(30, Math.min(21600, toNumber_(cacheSec))));
  } catch (error) {
    // Cache is optional. Ignore write failures.
  }
}

function mapPayrollApiSummary_(payload) {
  var summary = payload && payload.summary_all ? payload.summary_all : {};
  return {
    period_id: normalizePeriodIdForSource_(summary.period_id || '', 'payroll'),
    teacher_count: toNumber_(summary.teacher_count),
    confirmed_teachers: toNumber_(summary.confirmed_teachers),
    teacher_pending: toNumber_(summary.teacher_pending),
    manager_pending: toNumber_(summary.manager_pending),
    anomaly_count: toNumber_(summary.anomaly_count)
  };
}

function mapPayrollApiBranchProgress_(payload) {
  return (payload && payload.branch_progress ? payload.branch_progress : [])
    .map(function(item) {
      return {
        branch_name: normalizeBranchName_(item.branch_name),
        period_id: normalizePeriodIdForSource_(item.period_id || '', 'payroll'),
        teacher_count: toNumber_(item.teacher_count),
        confirmed_teachers: toNumber_(item.confirmed_teachers),
        teacher_pending: toNumber_(item.teacher_pending),
        manager_pending: toNumber_(item.manager_pending),
        anomaly_count: toNumber_(item.anomaly_count)
      };
    })
    .filter(function(item) {
      return item.branch_name && item.period_id;
    });
}

function mapPayrollApiRecords_(recordsPayload, employeesPayload) {
  var employeeLookup = {};
  (employeesPayload && employeesPayload.records ? employeesPayload.records : []).forEach(function(employee) {
    employeeLookup[String(employee.employee_id || '')] = employee;
  });

  return (recordsPayload && recordsPayload.records ? recordsPayload.records : [])
    .map(function(item, index) {
      var employee = employeeLookup[String(item.employee_id || '')] || {};
      var employeeName = item.employee_name || employee.employee_name || '';
      if (!item.period_id || !employeeName) return null;
      return {
        payroll_id: item.record_id || ('PR-API-' + normalizePeriodIdForSource_(item.period_id || '', 'payroll') + '-' + index),
        employee_id: item.employee_id || '',
        period_id: normalizePeriodIdForSource_(item.period_id || item.confirmed_at || '', 'payroll'),
        net_transfer: toNumber_(item.net_transfer),
        confirmed_at: normalizeDateTimeForDisplay_(item.confirmed_at || '', 'payroll'),
        branch_name: normalizeBranchName_(item.branch_name || employee.branch_name || ''),
        employee_name: employeeName,
        payroll_grade: item.payroll_grade || employee.payroll_grade || '',
        class_count: toNumber_(item.class_count),
        student_total: toNumber_(item.student_total),
        overtime_hours: toNumber_(item.overtime_hours),
        sick_leave_hours: toNumber_(item.sick_leave_hours),
        other_income_note: item.other_income_note || '',
        confirm_status: normalizePayrollStatus_(item.confirm_status),
        is_placeholder: false,
        searchable: buildSearchable_([
          employeeName,
          item.branch_name || employee.branch_name,
          item.payroll_grade || employee.payroll_grade,
          item.other_income_note
        ])
      };
    })
    .filter(Boolean);
}

function mapPayrollApiRecordsBatch_(recordsPayloads, employeesPayload) {
  var records = [];
  (recordsPayloads || []).forEach(function (payload) {
    records = records.concat(mapPayrollApiRecords_(payload, employeesPayload));
  });
  return dedupePayrollApiRecords_(records);
}

function dedupePayrollApiRecords_(records) {
  var lookup = {};
  return (records || []).filter(function (item) {
    var key = [
      item.period_id || '',
      item.payroll_id || '',
      item.employee_id || '',
      item.employee_name || ''
    ].join('::');
    if (lookup[key]) {
      return false;
    }
    lookup[key] = true;
    return true;
  });
}

function mapPayrollApiAnomalies_(payload) {
  return (payload && payload.records ? payload.records : [])
    .map(function(item, index) {
      var employeeName = item.employee_name || '';
      if (!employeeName) return null;
      return {
        anomaly_id: item.anomaly_id || ('PAY-API-ERR-' + index),
        period_id: normalizePeriodIdForSource_(item.period_id || '', 'payroll'),
        branch_name: normalizeBranchName_(item.branch_name || ''),
        employee_name: employeeName,
        title: item.title || '?芾??啣虜',
        meta: item.meta || '',
        searchable: buildSearchable_([employeeName, item.title, item.meta])
      };
    })
    .filter(Boolean);
}

function mapPayrollApiLockChecklist_(payload) {
  return (payload && payload.lock_checklist ? payload.lock_checklist : [])
    .map(function(item, index) {
      var label = item.title || item.label || '';
      if (!label) return null;
      return {
        check_id: item.check_id || ('PAY-API-CHECK-' + index),
        label: label,
        title: label,
        meta: item.meta || ''
      };
    })
    .filter(Boolean);
}

function readOperationsData_(spreadsheet, operationsByBranch, tabMap, source) {
  var singleConfigured = !!spreadsheet;
  var branchEntries = Object.keys(operationsByBranch || {});

  if (!singleConfigured && !branchEntries.length) {
    source.warnings.push('找不到 Operations spreadsheet，正式版暫時顯示空白營運資料。');
    return {};
  }

  var payloads = [];
  if (spreadsheet) {
    payloads.push(readSingleOperationsData_(spreadsheet, tabMap));
  }
  branchEntries.forEach(function (branchName) {
    payloads.push(readSingleOperationsData_(operationsByBranch[branchName], tabMap, branchName));
  });

  var branchCompare = [];
  var funnel = [];
  var risks = [];
  var classHealth = [];
  var actions = [];

  payloads.forEach(function (payload) {
    branchCompare = branchCompare.concat(payload.branch_compare || []);
    funnel = funnel.concat(payload.funnel || []);
    risks = risks.concat(payload.risks || []);
    classHealth = classHealth.concat(payload.class_health || []);
    actions = actions.concat(payload.actions || []);
  });

  branchCompare = dedupeOperationsItems_(branchCompare, function (item) {
    return [normalizeBranchName_(item.branch_name), item.period_id || ''].join('::');
  }, pickRicherOperationItem_);
  var latestPeriodId = resolveLatestOperationsPeriodId_(branchCompare);
  branchCompare = filterOperationsItemsByPeriod_(branchCompare, latestPeriodId);

  funnel = filterOperationsItemsByPeriod_(dedupeOperationsItems_(funnel, function (item) {
    return [normalizeBranchName_(item.branch_name), item.period_id || '', normalizeHeaderKey_(item.stage)].join('::');
  }, pickRicherOperationItem_), latestPeriodId);

  risks = sortOperationsRisks_(filterOperationsItemsByPeriod_(dedupeOperationsItems_(risks, function (item) {
    return [
      normalizeBranchName_(item.branch_name),
      item.period_id || '',
      normalizeHeaderKey_(item.class_name),
      normalizeHeaderKey_(item.title)
    ].join('::');
  }, pickRicherOperationItem_), latestPeriodId));

  classHealth = sortOperationsClassHealth_(filterOperationsItemsByPeriod_(dedupeOperationsItems_(classHealth, function (item) {
    return [
      normalizeBranchName_(item.branch_name),
      item.period_id || '',
      normalizeHeaderKey_(item.class_name)
    ].join('::');
  }, mergeOperationClassHealthItem_), latestPeriodId));

  actions = sortOperationsActions_(filterOperationsItemsByPeriod_(dedupeOperationsItems_(actions, function (item) {
    return [
      normalizeBranchName_(item.branch_name),
      item.period_id || '',
      normalizeHeaderKey_(item.title)
    ].join('::');
  }, pickRicherOperationItem_), latestPeriodId));

  var summaryAll = summarizeOperations_(branchCompare);
  var latestClassHealth = classHealth;
  var latestRisks = risks;

  if (summaryAll && latestClassHealth.length) {
    summaryAll.class_count = latestClassHealth.length;
  }
  if (summaryAll && latestRisks.length) {
    summaryAll.risk_count = latestRisks.length;
  }

  return {
    summary_all: hasKeys_(summaryAll) ? summaryAll : undefined,
    branch_compare: branchCompare.length ? branchCompare : undefined,
    funnel: funnel.length ? funnel : undefined,
    risks: risks.length ? risks : undefined,
    class_health: classHealth.length ? classHealth : undefined,
    actions: actions.length ? actions : undefined
  };
}

function resolveLatestOperationsPeriodId_(rows) {
  var latestPeriodId = '';
  (rows || []).forEach(function (item) {
    var periodId = item && item.period_id ? String(item.period_id) : '';
    if (periodId && (!latestPeriodId || periodId > latestPeriodId)) latestPeriodId = periodId;
  });
  return latestPeriodId;
}

function filterOperationsItemsByPeriod_(items, periodId) {
  if (!periodId) return items || [];
  return (items || []).filter(function (item) {
    return !item.period_id || item.period_id === periodId;
  });
}

function dedupeOperationsItems_(items, buildKey, mergeItem) {
  var lookup = {};
  var order = [];

  (items || []).forEach(function (item) {
    if (!item) return;
    var key = buildKey(item);
    if (!key) return;
    if (!lookup[key]) {
      lookup[key] = item;
      order.push(key);
      return;
    }
    lookup[key] = mergeItem ? mergeItem(lookup[key], item) : lookup[key];
  });

  return order.map(function (key) { return lookup[key]; });
}

function pickRicherOperationItem_(currentItem, nextItem) {
  return countFilledFields_(nextItem) > countFilledFields_(currentItem) ? nextItem : currentItem;
}

function mergeOperationClassHealthItem_(currentItem, nextItem) {
  var winner = pickRicherOperationItem_(currentItem, nextItem);
  var loser = winner === currentItem ? nextItem : currentItem;
  return {
    class_id: winner.class_id || loser.class_id,
    period_id: winner.period_id || loser.period_id,
    branch_name: winner.branch_name || loser.branch_name,
    class_name: winner.class_name || loser.class_name,
    teacher_name: winner.teacher_name || loser.teacher_name,
    new_students: Math.max(toNumber_(currentItem.new_students), toNumber_(nextItem.new_students)),
    health_score: Math.max(toNumber_(currentItem.health_score), toNumber_(nextItem.health_score)),
    searchable: buildSearchable_([
      winner.class_name || loser.class_name,
      winner.teacher_name || loser.teacher_name,
      Math.max(toNumber_(currentItem.health_score), toNumber_(nextItem.health_score))
    ])
  };
}

function countFilledFields_(item) {
  return Object.keys(item || {}).reduce(function (count, key) {
    return item[key] !== '' && item[key] !== null && item[key] !== undefined ? count + 1 : count;
  }, 0);
}

function sortOperationsRisks_(rows) {
  return (rows || []).slice().sort(function (left, right) {
    var leftKey = [left.branch_name || '', left.class_name || '', left.title || ''].join('::');
    var rightKey = [right.branch_name || '', right.class_name || '', right.title || ''].join('::');
    return leftKey.localeCompare(rightKey, 'zh-Hant');
  });
}

function sortOperationsClassHealth_(rows) {
  return (rows || []).slice().sort(function (left, right) {
    var branchCompare = String(left.branch_name || '').localeCompare(String(right.branch_name || ''), 'zh-Hant');
    if (branchCompare !== 0) return branchCompare;
    var scoreCompare = toNumber_(left.health_score) - toNumber_(right.health_score);
    if (scoreCompare !== 0) return scoreCompare;
    return String(left.class_name || '').localeCompare(String(right.class_name || ''), 'zh-Hant');
  });
}

function sortOperationsActions_(rows) {
  return (rows || []).slice().sort(function (left, right) {
    var leftKey = [left.branch_name || '', left.title || ''].join('::');
    var rightKey = [right.branch_name || '', right.title || ''].join('::');
    return leftKey.localeCompare(rightKey, 'zh-Hant');
  });
}

function readSingleOperationsData_(spreadsheet, tabMap, overrideBranchName) {
  var defaultBranchName = overrideBranchName || inferBranchNameFromSpreadsheet_(spreadsheet);
  var branchCompareSheet = findSheetByAliases_(spreadsheet, tabMap.branchCompare);
  var funnelSheet = findSheetByAliases_(spreadsheet, tabMap.funnel);
  var risksSheet = findSheetByAliases_(spreadsheet, tabMap.risks);
  var classHealthSheet = findSheetByAliases_(spreadsheet, tabMap.classHealth);
  var actionsSheet = findSheetByAliases_(spreadsheet, tabMap.actions);
  var weeklyRows = funnelSheet ? sheetToObjects_(funnelSheet) : [];
  var branchCompareRows = branchCompareSheet ? sheetToObjects_(branchCompareSheet) : [];

  var branchCompare = mapOperationsBranchCompare_(weeklyRows.length ? weeklyRows : branchCompareRows, defaultBranchName);
  var funnel = funnelSheet ? mapOperationsFunnel_(weeklyRows, defaultBranchName) : [];
  var risks = risksSheet ? mapOperationsRisks_(sheetToObjects_(risksSheet), defaultBranchName) : [];
  var classHealth = classHealthSheet ? mapOperationsClassHealth_(sheetToObjects_(classHealthSheet), defaultBranchName) : [];
  var actions = actionsSheet ? mapOperationsActions_(sheetToObjects_(actionsSheet), defaultBranchName) : deriveOperationsActions_(risks);
  var summaryAll = summarizeOperations_(branchCompare);
  var latestPeriodId = summaryAll && summaryAll.period_id ? summaryAll.period_id : '';
  var latestClassHealth = latestPeriodId
    ? classHealth.filter(function (item) { return !item.period_id || item.period_id === latestPeriodId; })
    : classHealth;
  var latestRisks = latestPeriodId
    ? risks.filter(function (item) { return !item.period_id || item.period_id === latestPeriodId; })
    : risks;

  if (summaryAll && latestClassHealth.length) {
    summaryAll.class_count = latestClassHealth.length;
  }
  if (summaryAll && latestRisks.length) {
    summaryAll.risk_count = latestRisks.length;
  }

  return {
    branch_compare: branchCompare.length ? branchCompare : undefined,
    funnel: funnel.length ? funnel : undefined,
    risks: risks.length ? risks : undefined,
    class_health: classHealth.length ? classHealth : undefined,
    actions: actions.length ? actions : undefined
  };
}

function buildHomeTodos_(liveData) {
  var todos = [];
  var monthlyPending = (liveData.monthly.report_queue || []).filter(function (item) {
    return item.status === 'draft' || item.status === 'needs_revision';
  });
  if (monthlyPending.length) {
    todos.push({
      todo_id: 'LIVE-TODO-MONTHLY',
      period_id: monthlyPending[0].period_id,
      branch_name: monthlyPending[0].branch_name || '全部分校',
      module: 'monthly',
      title: '優先處理月報草稿與退回件',
      meta: '依 monthlyReports.status / review_note，目前共有 ' + monthlyPending.length + ' 筆待追件。',
      searchable: '月報 draft needs_revision review_note'
    });
  }

  var payrollAnomalies = liveData.payroll.anomalies || [];
  if (payrollAnomalies.length) {
    todos.push({
      todo_id: 'LIVE-TODO-PAYROLL',
      period_id: payrollAnomalies[0].period_id,
      branch_name: payrollAnomalies[0].branch_name || '全部分校',
      module: 'payroll',
      title: '優先處理薪資異常與待主管案件',
      meta: '依 confirm_status / other_income_note，目前共有 ' + payrollAnomalies.length + ' 筆異常。',
      searchable: '薪資 manager_review anomaly other_income_note'
    });
  }

  var operationRisks = liveData.operations.risks || [];
  if (operationRisks.length) {
    todos.push({
      todo_id: 'LIVE-TODO-OPS',
      period_id: operationRisks[0].period_id,
      branch_name: operationRisks[0].branch_name || '全部分校',
      module: 'operations',
      title: '追蹤營運風險班級與續班狀態',
      meta: '依 studentStatus.current_status / renewal_stage，目前共有 ' + operationRisks.length + ' 筆提醒。',
      searchable: '營運 risk renewal_stage studentStatus'
    });
  }

  return todos;
}

function overlayModule_(target, patch) {
  Object.keys(patch || {}).forEach(function (key) {
    if (patch[key] !== undefined) {
      target[key] = patch[key];
    }
  });
}

function mapBranches_(rows) {
  return rows
    .map(function (row) {
      var branchName = normalizeBranchName_(coalesceField_(row, ['branch_name', 'branch', '??迂', '?']));
      if (!branchName) return null;
      return {
        branch_id: coalesceField_(row, ['branch_id', 'id']) || normalizeId_(branchName),
        branch_code: coalesceField_(row, ['branch_code', 'code']) || normalizeCode_(branchName),
        branch_name: branchName
      };
    })
    .filter(Boolean)
    .map(function (item) {
      item.branch_name = normalizeBranchName_(item.branch_name);
      return item;
    });
}

function mapPeriods_(rows) {
  return rows
    .map(function (row) {
      var periodId = normalizePeriodIdForSource_(
        coalesceField_(row, ['period_id', 'period']) ||
        buildPeriodId_(coalesceField_(row, ['year']), coalesceField_(row, ['month'])),
        'master'
      );
      if (!periodId) return null;
      return {
        period_id: periodId,
        year: Number(periodId.split('-')[0]),
        month: Number(periodId.split('-')[1]),
        label: periodId
      };
    })
    .filter(Boolean);
}
function mapMonthlyReports_(rows, userLookup) {
  return rows
    .map(function (row, index) {
      var submittedAt = normalizeDateTimeForDisplay_(
        coalesceField_(row, ['submitted_at', 'submittedAt', 'submittedTime']),
        'monthly'
      );
      var reviewedAt = normalizeDateTimeForDisplay_(
        coalesceField_(row, ['reviewed_at', 'reviewedAt']),
        'monthly'
      );
      var updatedAt = normalizeDateTimeForDisplay_(
        coalesceField_(row, ['updated_at', 'updatedAt', 'lastUpdatedAt']),
        'monthly'
      );
      var periodId = normalizePeriodIdForSource_(
        coalesceField_(row, ['period_id', 'period', 'month']) ||
        submittedAt ||
        reviewedAt ||
        updatedAt,
        'monthly'
      );
      var userId = coalesceField_(row, ['user_id', 'userId', 'userid', 'employee_id', 'employeeId']);
      var userRecord = userLookup[userId] || {};
      var employeeName = coalesceField_(row, ['employee_name', 'teacher_name', 'employeeName', 'name']) || userRecord.employee_name;
      if (!periodId || !employeeName) return null;
      var branchNames = normalizeMonthlyBranchNames_(row, userRecord);
      var status = normalizeMonthlyStatus_(coalesceField_(row, ['status', 'report_status']));
      var reviewHistory = parseMonthlyReviewHistory_(coalesceField_(row, ['reviewHistoryJson', 'review_history_json', 'reviewHistory']));
      var dataSummary = summarizeMonthlyReportData_(coalesceField_(row, ['dataJson', 'data_json', 'form_data_json']));
      var scoreSummary = summarizeMonthlyScores_(coalesceField_(row, ['scoresJson', 'scores_json', 'score_json']));
      var reviewNote = coalesceField_(row, ['review_note', 'reviewerNote']) || reviewHistory.latest_note || '';
      var detailText = buildSearchable_([
        employeeName,
        coalesceField_(row, ['class_name', 'class']),
        status,
        reviewNote,
        reviewHistory.text,
        dataSummary.text,
        scoreSummary.text
      ]);

      return {
        report_id: coalesceField_(row, ['report_id', 'id']) || ('MR-LIVE-' + index),
        user_id: userId || '',
        period_id: periodId,
        branch_name: branchNames[0] || 'All Branches',
        branch_names: branchNames,
        employee_name: employeeName,
        role_type: coalesceField_(row, ['role_type', 'role']) || userRecord.role_type || '',
        class_name: coalesceField_(row, ['class_name', 'class']) || extractMonthlyClassName_(row),
        status: status,
        submitted_at: submittedAt,
        reviewed_at: reviewedAt,
        updated_at: updatedAt,
        review_note: reviewNote,
        review_history: reviewHistory.items,
        review_history_text: reviewHistory.text,
        data_summary: dataSummary.text,
        data_summary_searchable: dataSummary.searchable,
        score_summary: scoreSummary.text,
        score_breakdown: scoreSummary.breakdown,
        next_step: nextStepFromMonthlyStatus_(status),
        searchable: buildSearchable_([
          detailText,
          userRecord.branch_name,
          userRecord.role_type
        ])
      };
    })
    .filter(Boolean)
    .map(function (item) {
      item.branch_name = normalizeBranchName_(item.branch_name);
      item.branch_names = normalizeMonthlyBranchNameList_(item.branch_names || item.branch_name);
      return item;
    });
}

function normalizeMonthlyBranchNames_(row, userRecord) {
  return normalizeMonthlyBranchNameList_(
    coalesceField_(row, ['branch_names', 'branchNames']) ||
    coalesceField_(row, ['branch_name', 'branch']) ||
    (userRecord && (userRecord.branch_names || userRecord.branch_name)) ||
    ''
  );
}

function normalizeMonthlyBranchNameList_(value) {
  var raw = Array.isArray(value) ? value : String(value || '').split(/[,\n、/|]+/);
  var result = [];
  raw.forEach(function (name) {
    var normalized = normalizeBranchName_(name);
    if (normalized && result.indexOf(normalized) === -1) {
      result.push(normalized);
    }
  });
  return result;
}
function buildMonthlyUserDirectory_(rows) {
  return rows
    .map(function (row) {
      var userId = coalesceField_(row, ['id', 'user_id', 'userId', 'employee_id', 'employeeId']);
      if (!userId) return null;

      var employeeName = coalesceField_(row, ['employee_name', 'teacher_name', 'name', '姓名']);
      var branchName = normalizeBranchName_(coalesceField_(row, ['branch_name', 'branch', '分校']));
      var roleType = coalesceField_(row, ['role_type', 'role', 'title', '職稱', '身分']);
      var title = coalesceField_(row, ['title', 'role_type', 'role']);
      var staffCode = coalesceField_(row, ['staffCode', 'staff_code', 'staffcode', '員編']);
      var account = coalesceField_(row, ['account', '帳號', 'login', 'username']);
      var duty = coalesceField_(row, ['duty', '職務']);

      return {
        user_id: String(userId),
        account: account,
        employee_name: employeeName,
        branch_name: branchName,
        role_type: roleType,
        title: title || roleType,
        staff_code: staffCode,
        duty: duty,
        must_change_password: String(coalesceField_(row, ['mustChangePassword', 'must_change_password'])).toLowerCase() === 'true',
        teaching_hourly_rate: toNumber_(coalesceField_(row, ['teachingHourlyRate', 'teaching_hourly_rate'])),
        admin_hourly_rate: toNumber_(coalesceField_(row, ['adminHourlyRate', 'admin_hourly_rate'])),
        default_class_assignments_json: coalesceField_(row, ['defaultClassAssignmentsJson', 'default_class_assignments_json']),
        searchable: buildSearchable_([employeeName, branchName, roleType, title, staffCode, account, duty])
      };
    })
    .filter(function (item) {
      return item && item.user_id;
    });
}
function buildMonthlyUserLookup_(rows) {
  var directory = Array.isArray(rows) && rows.length && rows[0] && rows[0].user_id ? rows : buildMonthlyUserDirectory_(rows);
  return directory.reduce(function (lookup, item) {
    lookup[item.user_id] = {
      employee_name: item.employee_name,
      branch_name: item.branch_name,
      role_type: item.role_type,
      title: item.title,
      staff_code: item.staff_code,
      account: item.account,
      duty: item.duty
    };
    return lookup;
  }, {});
}
function buildMonthlySubmissionRoster_(userDirectory, reportRows, availablePeriods, requestedState) {
  var periods = collectMonthlyPeriods_(availablePeriods, reportRows, requestedState);
  var reportIndex = buildMonthlyReportIndex_(reportRows);
  var roster = [];

  periods.forEach(function (periodId) {
    (userDirectory || []).forEach(function (user) {
      roster.push(buildMonthlyRosterEntry_(user, periodId, reportIndex, userDirectory));
    });
  });

  return roster;
}
function buildMonthlyRosterEntry_(user, periodId, reportIndex, userDirectory) {
  var report = lookupMonthlyReport_(reportIndex, user, periodId);
  var hasReport = !!report;
  var status = hasReport ? report.status : 'missing';
  var reviewHistoryText = hasReport ? (report.review_history_text || '') : '';
  var dataSummary = hasReport ? (report.data_summary || '') : '';
  var scoreSummary = hasReport ? (report.score_summary || '') : '';
  var detailText = buildSearchable_([
    user.employee_name,
    user.branch_name,
    user.role_type,
    user.title,
    status,
    report ? report.review_note : '',
    reviewHistoryText,
    dataSummary,
    scoreSummary
  ]);

  return {
    report_id: hasReport ? report.report_id : '',
    user_id: user.user_id,
    period_id: normalizePeriodId_(periodId),
    branch_name: normalizeBranchName_(user.branch_name || (report && report.branch_name) || ''),
    employee_name: user.employee_name || (report && report.employee_name) || '',
    role_type: user.role_type || (report && report.role_type) || '',
    title: user.title || user.role_type || '',
    staff_code: user.staff_code || '',
    account: user.account || '',
    status: status,
    submitted_at: hasReport ? report.submitted_at : '',
    reviewed_at: hasReport ? report.reviewed_at : '',
    updated_at: hasReport ? report.updated_at : '',
    review_note: hasReport ? (report.review_note || '') : '',
    review_history: hasReport ? (report.review_history || []) : [],
    review_history_text: reviewHistoryText,
    data_summary: dataSummary,
    score_summary: scoreSummary,
    next_step: hasReport ? report.next_step : '補完後送出',
    has_report: hasReport,
    is_missing: !hasReport,
    searchable: detailText
  };
}
function buildMonthlyReportIndex_(reportRows) {
  return (reportRows || []).reduce(function (index, report) {
    var periodId = normalizePeriodId_(report.period_id || report.period || '');
    var userId = String(report.user_id || report.userId || '');
    var employeeName = String(report.employee_name || '');
    var keys = [];
    if (userId) keys.push(userId + '::' + periodId);
    if (employeeName) keys.push(employeeName + '::' + periodId);
    if (report.report_id) keys.push(String(report.report_id));

    keys.forEach(function (key) {
      if (!key || index[key]) return;
      index[key] = report;
    });
    return index;
  }, {});
}
function lookupMonthlyReport_(reportIndex, user, periodId) {
  var normalizedPeriodId = normalizePeriodId_(periodId);
  var lookupKeys = [
    String(user.user_id || '') + '::' + normalizedPeriodId,
    String(user.employee_name || '') + '::' + normalizedPeriodId,
    String(user.staff_code || '') + '::' + normalizedPeriodId
  ];

  for (var i = 0; i < lookupKeys.length; i += 1) {
    if (reportIndex[lookupKeys[i]]) return reportIndex[lookupKeys[i]];
  }
  return null;
}
function collectMonthlyPeriods_(availablePeriods, reportRows, requestedState) {
  var periods = [];

  (availablePeriods || []).forEach(function (item) {
    var periodId = normalizePeriodId_(item && item.period_id ? item.period_id : item);
    if (periodId && periods.indexOf(periodId) < 0) periods.push(periodId);
  });

  (reportRows || []).forEach(function (report) {
    var periodId = normalizePeriodId_(report.period_id || report.period || '');
    if (periodId && periods.indexOf(periodId) < 0) periods.push(periodId);
  });

  var requestedPeriod = requestedState && requestedState.period ? normalizePeriodId_(requestedState.period) : '';
  if (requestedPeriod && periods.indexOf(requestedPeriod) < 0) {
    periods.unshift(requestedPeriod);
  }

  return periods;
}
function aggregateMonthlyBranchProgressFromRoster_(roster) {
  var groups = {};

  (roster || []).forEach(function (item) {
    var branchName = normalizeBranchName_(item.branch_name || '未設定分校');
    var periodId = normalizePeriodId_(item.period_id);
    if (!branchName || !periodId) return;
    var key = periodId + '::' + branchName;
    if (!groups[key]) {
      groups[key] = {
        branch_name: branchName,
        period_id: periodId,
        expected_reports: 0,
        draft_reports: 0,
        submitted_reports: 0,
        reviewed_reports: 0,
        needs_revision_reports: 0,
        pending_total: 0
      };
    }

    groups[key].expected_reports += 1;
    if (item.status === 'draft' || item.status === 'missing') groups[key].draft_reports += 1;
    if (item.status === 'submitted') groups[key].submitted_reports += 1;
    if (item.status === 'reviewed') groups[key].reviewed_reports += 1;
    if (item.status === 'needs_revision') groups[key].needs_revision_reports += 1;
    if (item.status === 'missing' || item.status === 'draft' || item.status === 'needs_revision') groups[key].pending_total += 1;
  });

  return Object.keys(groups).map(function (key) {
    return groups[key];
  });
}
function summarizeMonthlyRoster_(roster) {
  return (roster || []).reduce(function (summary, item) {
    summary.period_id = summary.period_id || item.period_id || '';
    summary.expected_reports += 1;
    if (item.status === 'missing' || item.status === 'draft') summary.draft_reports += 1;
    if (item.status === 'submitted') summary.submitted_reports += 1;
    if (item.status === 'reviewed') summary.reviewed_reports += 1;
    if (item.status === 'needs_revision') summary.needs_revision_reports += 1;
    if (item.status === 'missing' || item.status === 'draft' || item.status === 'needs_revision') summary.pending_total += 1;
    return summary;
  }, {
    period_id: '',
    expected_reports: 0,
    draft_reports: 0,
    submitted_reports: 0,
    reviewed_reports: 0,
    needs_revision_reports: 0,
    pending_total: 0
  });
}
function parseMonthlyJsonSafely_(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch (error) {
    return {};
  }
}
function formatMonthlySummaryValue_(value, depth) {
  var currentDepth = depth || 0;
  if (value === null || value === undefined || value === '') return '';
  if (currentDepth > 2) return Array.isArray(value) ? '多筆資料' : '[物件]';

  if (Array.isArray(value)) {
    if (!value.length) return '0 筆';
    return value.slice(0, 3).map(function (item) {
      return formatMonthlySummaryValue_(item, currentDepth + 1);
    }).filter(Boolean).join(' / ');
  }

  if (typeof value === 'object') {
    return Object.keys(value).slice(0, 5).map(function (key) {
      return key + ':' + formatMonthlySummaryValue_(value[key], currentDepth + 1);
    }).filter(Boolean).join('、');
  }

  return String(value).replace(/\[object Object\]/g, '[物件]');
}
function summarizeMonthlyReportData_(raw) {
  var parsed = parseMonthlyJsonSafely_(raw);
  var sections = [];
  var searchable = [];

  if (!parsed || (typeof parsed === 'object' && !Array.isArray(parsed) && !Object.keys(parsed).length)) {
    return { text: '', searchable: '', breakdown: [] };
  }

  if (Array.isArray(parsed)) {
    var preview = parsed.slice(0, 3).map(function (item) {
      return formatMonthlySummaryValue_(item);
    }).join(' / ');
    return {
      text: '陣列資料：' + parsed.length + ' 筆' + (preview ? '。' + preview : ''),
      searchable: preview,
      breakdown: [{ label: '陣列', value: parsed.length + ' 筆' }]
    };
  }

  Object.keys(parsed).slice(0, 8).forEach(function (key) {
    var value = parsed[key];
    var label = key;
    var textValue = '';

    if (value === null || value === undefined || value === '') return;
    textValue = formatMonthlySummaryValue_(value);

    sections.push(label + '：' + textValue);
    searchable.push(label + ' ' + textValue);
  });

  return {
    text: sections.join('\n'),
    searchable: searchable.join(' '),
    breakdown: sections.map(function (item) {
      var parts = item.split('：');
      return {
        label: parts[0],
        value: parts.slice(1).join('：')
      };
    })
  };
}
function summarizeMonthlyReviewHistory_(raw) {
  var parsed = parseMonthlyJsonSafely_(raw);
  var items = [];

  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && Array.isArray(parsed.history)) {
    items = parsed.history;
  } else if (parsed && Array.isArray(parsed.items)) {
    items = parsed.items;
  } else if (parsed && Array.isArray(parsed.records)) {
    items = parsed.records;
  } else if (parsed && Object.keys(parsed).length) {
    items = [parsed];
  } else if (raw) {
    items = [{ note: String(raw) }];
  }

  var normalized = items.map(function (item) {
    var row = typeof item === 'object' ? normalizeObjectKeys_(item) : { note: String(item) };
    return {
      reviewer: coalesceField_(row, ['reviewer', 'reviewer_name', 'reviewerName', 'name']),
      reviewed_at: normalizeDateTimeForDisplay_(coalesceField_(row, ['reviewed_at', 'reviewedAt', 'time', 'timestamp']), 'monthly'),
      note: coalesceField_(row, ['note', 'comment', 'message', 'review_note', 'reviewerNote']) || String(item || ''),
      status: coalesceField_(row, ['status', 'result'])
    };
  });

  var text = normalized.map(function (item) {
    return buildSearchable_([
      item.reviewed_at,
      item.reviewer,
      item.status,
      item.note
    ]);
  }).filter(Boolean).join('\n');

  return {
    items: normalized,
    text: text,
    latest_note: normalized.length ? (normalized[0].note || '') : '',
    searchable: text
  };
}

function parseMonthlyReviewHistory_(raw) {
  return summarizeMonthlyReviewHistory_(raw);
}
function summarizeMonthlyScores_(raw) {
  var parsed = parseMonthlyJsonSafely_(raw);
  var breakdown = [];

  if (!parsed || (typeof parsed === 'object' && !Array.isArray(parsed) && !Object.keys(parsed).length)) {
    return { text: '', searchable: '', breakdown: [] };
  }

  if (Array.isArray(parsed)) {
    parsed.slice(0, 6).forEach(function (item, index) {
      breakdown.push({ label: '項目' + (index + 1), value: formatMonthlySummaryValue_(item) });
    });
  } else {
    Object.keys(parsed).slice(0, 8).forEach(function (key) {
      var value = parsed[key];
      if (value === null || value === undefined || value === '') return;
      breakdown.push({ label: key, value: formatMonthlySummaryValue_(value) });
    });
  }

  return {
    text: breakdown.map(function (item) {
      return item.label + '：' + item.value;
    }).join('\n'),
    searchable: breakdown.map(function (item) {
      return item.label + ' ' + item.value;
    }).join(' '),
    breakdown: breakdown
  };
}

function extractMonthlyClassName_(row) {
  var dataJson = coalesceField_(row, ['dataJson', 'data_json', 'form_data_json']);
  if (!dataJson) return '';

  try {
    var parsed = JSON.parse(dataJson);
    var classAssignments = parsed.classAssignments || [];
    if (classAssignments.length && classAssignments[0].className) {
      return classAssignments[0].className;
    }
  } catch (error) {
    return '';
  }

  return '';
}

function mapMonthlyBranchProgress_(rows) {
  return rows
    .map(function (row) {
      var branchName = coalesceField_(row, ['branch_name', 'branch', '分校']);
      var periodId = normalizePeriodId_(coalesceField_(row, ['period_id', 'period', '期間', '月份']));
      if (!branchName || !periodId) return null;
      return {
        branch_name: branchName,
        period_id: periodId,
        expected_reports: toNumber_(coalesceField_(row, ['expected_reports', '應填', '應填月報數'])),
        draft_reports: toNumber_(coalesceField_(row, ['draft_reports', '草稿'])),
        submitted_reports: toNumber_(coalesceField_(row, ['submitted_reports', '已送出', '送審數'])),
        reviewed_reports: toNumber_(coalesceField_(row, ['reviewed_reports', '已完成', '已審核'])),
        needs_revision_reports: toNumber_(coalesceField_(row, ['needs_revision_reports', '需修正'])),
        pending_total: toNumber_(coalesceField_(row, ['pending_total', '待追件', '待處理']))
      };
    })
    .filter(Boolean)
    .map(function (item) {
      item.branch_name = normalizeBranchName_(item.branch_name);
      return item;
    });
}

function aggregateMonthlyBranchProgress_(queue) {
  var groups = {};
  (queue || []).forEach(function (item) {
    var key = item.period_id + '::' + item.branch_name;
    if (!groups[key]) {
      groups[key] = {
        branch_name: item.branch_name,
        period_id: item.period_id,
        expected_reports: 0,
        draft_reports: 0,
        submitted_reports: 0,
        reviewed_reports: 0,
        needs_revision_reports: 0,
        pending_total: 0
      };
    }
    groups[key].expected_reports += 1;
    if (item.status === 'draft') groups[key].draft_reports += 1;
    if (item.status === 'submitted') groups[key].submitted_reports += 1;
    if (item.status === 'reviewed') groups[key].reviewed_reports += 1;
    if (item.status === 'needs_revision') groups[key].needs_revision_reports += 1;
    if (item.status === 'draft' || item.status === 'needs_revision') groups[key].pending_total += 1;
  });
  return Object.keys(groups).map(function (key) { return groups[key]; });
}

function summarizeMonthly_(branchProgress, queue) {
  var summary = {
    period_id: branchProgress && branchProgress[0] ? branchProgress[0].period_id : '',
    expected_reports: 0,
    draft_reports: 0,
    submitted_reports: 0,
    reviewed_reports: 0,
    needs_revision_reports: 0,
    pending_total: 0
  };
  (branchProgress || []).forEach(function (item) {
    summary.expected_reports += toNumber_(item.expected_reports);
    summary.draft_reports += toNumber_(item.draft_reports);
    summary.submitted_reports += toNumber_(item.submitted_reports);
    summary.reviewed_reports += toNumber_(item.reviewed_reports);
    summary.needs_revision_reports += toNumber_(item.needs_revision_reports);
    summary.pending_total += toNumber_(item.pending_total);
  });
  if (!summary.period_id && queue && queue[0]) summary.period_id = queue[0].period_id;
  return summary;
}

function mapPayrollRecords_(rows, employeeLookup, profileLookup) {
  return rows
    .map(function (row, index) {
      var employeeId = coalesceField_(row, ['employee_id', 'employeeId', 'employeeid']);
      var employeeRecord = employeeLookup[employeeId] || {};
      var recordJson = parseJsonSafely_(coalesceField_(row, ['recordJson', 'record_json']));
      var confirmedAt = normalizeDateTimeForDisplay_(
        coalesceField_(row, ['confirmed_at', 'confirmedAt', 'managerConfirmedAt', 'approvedAt']) ||
        recordJson.confirmedAt ||
        '',
        'payroll'
      );
      var periodId = normalizePeriodIdForSource_(
        coalesceField_(row, ['period_id', 'period', 'month']) || confirmedAt,
        'payroll'
      );
      var employeeName = coalesceField_(row, ['employee_name', 'employeeName', 'teacher_name', 'name']) || employeeRecord.employee_name;
      if (!periodId || !employeeName) return null;
      var confirmStatus = normalizePayrollStatus_(coalesceField_(row, ['confirm_status', 'status'])) || derivePayrollConfirmStatus_(row);
      var payProfileId = coalesceField_(row, ['payProfileId', 'pay_profile_id']) || recordJson.payProfileId || employeeRecord.pay_profile_id || '';
      var profile = profileLookup[payProfileId] || {};
      var netTransfer = toNumber_(coalesceField_(row, ['net_transfer', 'netTransfer', 'actualTransfer'])) ||
        toNumber_(recordJson.netTransfer) ||
        toNumber_(recordJson.actualTransfer);
      return {
        payroll_id: coalesceField_(row, ['payroll_id', 'id']) || ('PR-LIVE-' + index),
        employee_id: employeeId || '',
        period_id: periodId,
        net_transfer: netTransfer,
        confirmed_at: confirmedAt,
        branch_name: coalesceField_(row, ['branch_name', 'branch']) || employeeRecord.branch_name || 'All Branches',
        employee_name: employeeName,
        payroll_grade: coalesceField_(row, ['payroll_grade', 'salary_level']) || profile.label || employeeRecord.title || '',
        class_count: toNumber_(coalesceField_(row, ['class_count'])) || toNumber_(recordJson.classCount),
        student_total: toNumber_(coalesceField_(row, ['student_total'])) || toNumber_(recordJson.studentTotal),
        overtime_hours: toNumber_(coalesceField_(row, ['overtime_hours'])) || toNumber_(recordJson.overtimeHours),
        sick_leave_hours: toNumber_(coalesceField_(row, ['sick_leave_hours'])) || toNumber_(recordJson.sickLeaveHours),
        other_income_note: coalesceField_(row, ['other_income_note']) || recordJson.otherIncomeNote || '',
        confirm_status: confirmStatus,
        is_placeholder: false,
        searchable: buildSearchable_([
          employeeName,
          coalesceField_(row, ['branch_name', 'branch']) || employeeRecord.branch_name,
          coalesceField_(row, ['payroll_grade', 'salary_level']) || employeeRecord.title,
          coalesceField_(row, ['other_income_note']) || recordJson.otherIncomeNote
        ])
      };
    })
    .filter(Boolean)
    .map(function (item) {
      item.branch_name = normalizeBranchName_(item.branch_name);
      return item;
    });
}
function hydrateSharedReferenceData_(liveData, mockData) {
  var derivedPeriods = deriveSharedPeriods_(liveData);
  var derivedBranches = deriveSharedBranches_(liveData);

  if (liveData.shared.periods && liveData.shared.periods.length) {
    // Master periods take precedence when a curated dashboard scope is configured.
    liveData.shared.periods = liveData.shared.periods;
  } else if (derivedPeriods.length) {
    liveData.shared.periods = derivedPeriods;
  } else if (!liveData.shared.periods || !liveData.shared.periods.length) {
    liveData.shared.periods = mockData.shared.periods;
  }

  if (liveData.shared.branches && liveData.shared.branches.length) {
    // Master branches should remain authoritative for first-phase rollout.
    liveData.shared.branches = liveData.shared.branches;
  } else if (derivedBranches.length) {
    liveData.shared.branches = derivedBranches;
  } else if (!liveData.shared.branches || !liveData.shared.branches.length) {
    liveData.shared.branches = mockData.shared.branches;
  }
}

function deriveSharedPeriods_(liveData) {
  var lookup = {};
  var periods = [];

  collectUniqueByKey_(periods, lookup, liveData.monthly.report_queue || [], 'period_id');
  collectUniqueByKey_(periods, lookup, liveData.payroll.payroll_records || [], 'period_id');
  collectUniqueByKey_(periods, lookup, liveData.operations.branch_compare || [], 'period_id');

  return periods
    .filter(function (item) { return item.period_id; })
    .sort(function (a, b) { return a.period_id < b.period_id ? -1 : 1; })
    .map(function (item) {
      return {
        period_id: item.period_id,
        year: Number(item.period_id.split('-')[0]),
        month: Number(item.period_id.split('-')[1]),
        label: item.period_id
      };
    });
}

function deriveSharedBranches_(liveData) {
  var lookup = {
    '全部分校': true
  };
  var branches = [{
    branch_id: 'all',
    branch_code: 'ALL',
    branch_name: '全部分校'
  }];

  appendBranchReferences_(branches, lookup, liveData.monthly.report_queue || []);
  appendBranchReferences_(branches, lookup, liveData.payroll.payroll_records || []);
  appendBranchReferences_(branches, lookup, liveData.operations.branch_compare || []);

  return branches;
}

function collectUniqueByKey_(target, lookup, rows, key) {
  (rows || []).forEach(function (row) {
    var value = row && row[key] ? String(row[key]) : '';
    if (!value || lookup[value]) return;
    lookup[value] = true;
    target.push({ period_id: value });
  });
}

function appendBranchReferences_(target, lookup, rows) {
  (rows || []).forEach(function (row) {
    var branchName = normalizeBranchName_(row && row.branch_name ? String(row.branch_name) : '');
    if (!branchName || lookup[branchName]) return;
    lookup[branchName] = true;
    target.push({
      branch_id: normalizeId_(branchName),
      branch_code: normalizeCode_(branchName),
      branch_name: branchName
    });
  });
}

function buildPayrollEmployeeLookup_(rows) {
  return rows.reduce(function (lookup, row) {
    var id = coalesceField_(row, ['id', 'employee_id', 'employeeId']);
    if (!id) return lookup;
    var branchNames = extractBranchNames_(coalesceField_(row, ['branch_name', 'branch', 'department', '?']));
    lookup[id] = {
      employee_name: coalesceField_(row, ['employee_name', 'employeeName', 'teacher_name', 'name', '憪?']),
      branch_name: branchNames[0] || '全部分校',
      branch_names: branchNames,
      title: coalesceField_(row, ['title', 'role_type', '閫', '?瑞迂']),
      pay_profile_id: coalesceField_(row, ['payProfileId', 'pay_profile_id']),
      employment_status: coalesceField_(row, ['employmentStatus', 'employment_status', '在職狀態']) || 'active'
    };
    return lookup;
  }, {});
}

function mapPayrollPolicies_(rows) {
  return (rows || [])
    .map(function (row, index) {
      var effectiveMonth = normalizePeriodId_(coalesceField_(row, ['effectiveMonth', 'effective_month', '?遢', '???遢']));
      var policyJson = parseJsonSafely_(coalesceField_(row, ['policyJson', 'policy_json']));
      var label = coalesceField_(row, ['label', '?迂']) || policyJson.label || '';
      var profiles = Array.isArray(policyJson.profiles) ? policyJson.profiles : [];
      return {
        policy_id: coalesceField_(row, ['id']) || ('POLICY-' + index),
        effective_month: effectiveMonth || normalizePeriodId_(policyJson.effectiveMonth),
        label: label,
        profiles: profiles
      };
    })
    .filter(function (item) {
      return item.effective_month || item.profiles.length;
    })
    .sort(function (a, b) {
      return String(a.effective_month) < String(b.effective_month) ? -1 : 1;
    });
}

function buildPayrollProfileLookup_(policies) {
  var lookup = {};
  (policies || []).forEach(function (policy) {
    (policy.profiles || []).forEach(function (profile) {
      if (!profile || !profile.id) return;
      lookup[String(profile.id)] = {
        id: String(profile.id),
        label: profile.label || '',
        group: profile.group || ''
      };
    });
  });
  return lookup;
}

function derivePayrollRecordsFromEmployees_(rows, employeeLookup, profileLookup, policies) {
  var targetPeriodId = resolvePayrollTargetPeriodId_(policies);
  return (rows || [])
    .map(function (row) {
      var employeeId = coalesceField_(row, ['id', 'employee_id', 'employeeId']);
      var employee = employeeLookup[employeeId] || {};
      if (!employeeId || employee.employment_status === 'inactive') return null;
      var payProfileId = coalesceField_(row, ['payProfileId', 'pay_profile_id']) || employee.pay_profile_id || '';
      var profile = profileLookup[payProfileId] || {};
      return {
        payroll_id: 'PR-SEED-' + employeeId + '-' + targetPeriodId,
        employee_id: employeeId,
        period_id: targetPeriodId,
        branch_name: employee.branch_name || '全部分校',
        employee_name: employee.employee_name || '',
        net_transfer: 0,
        confirmed_at: '',
        payroll_grade: profile.label || employee.title || '',
        class_count: 0,
        student_total: 0,
        overtime_hours: 0,
        sick_leave_hours: 0,
        other_income_note: '',
        confirm_status: 'teacher_pending',
        is_placeholder: true,
        searchable: buildSearchable_([employee.employee_name, employee.branch_name, profile.label, employee.title])
      };
    })
    .filter(Boolean);
}

function resolvePayrollTargetPeriodId_(policies) {
  var todayPeriod = getDashboardCurrentPeriodId_();
  var latestPolicyMonth = '';
  (policies || []).forEach(function (policy) {
    if (policy && policy.effective_month && (!latestPolicyMonth || policy.effective_month > latestPolicyMonth)) {
      latestPolicyMonth = policy.effective_month;
    }
  });
  return todayPeriod || latestPolicyMonth || '2026-07';
}

function derivePayrollConfirmStatus_(row) {
  if (coalesceField_(row, ['confirmedAt', 'confirmed_at', '蝣箄???'])) return 'confirmed';
  return 'teacher_pending';
}

function parseJsonSafely_(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function mapPayrollBranchProgress_(rows) {
  return rows
    .map(function (row) {
      var branchName = coalesceField_(row, ['branch_name', 'branch', '分校']);
      var periodId = normalizePeriodId_(coalesceField_(row, ['period_id', 'period', '薪資月份', '月份']));
      if (!branchName || !periodId) return null;
      return {
        branch_name: branchName,
        period_id: periodId,
        teacher_count: toNumber_(coalesceField_(row, ['teacher_count', '老師數', '本期老師數'])),
        confirmed_teachers: toNumber_(coalesceField_(row, ['confirmed_teachers', '已確認'])),
        teacher_pending: toNumber_(coalesceField_(row, ['teacher_pending', '待老師確認', '待確認'])),
        manager_pending: toNumber_(coalesceField_(row, ['manager_pending', '待主管處理', '主管審核中'])),
        anomaly_count: toNumber_(coalesceField_(row, ['anomaly_count', '異常數', '異常件數']))
      };
    })
    .filter(Boolean);
}

function aggregatePayrollBranchProgress_(records) {
  var groups = {};
  (records || []).forEach(function (item) {
    var key = item.period_id + '::' + item.branch_name;
    if (!groups[key]) {
      groups[key] = {
        branch_name: item.branch_name,
        period_id: item.period_id,
        teacher_count: 0,
        confirmed_teachers: 0,
        teacher_pending: 0,
        manager_pending: 0,
        anomaly_count: 0
      };
    }
    groups[key].teacher_count += 1;
    if (item.confirm_status === 'confirmed') groups[key].confirmed_teachers += 1;
    if (item.confirm_status === 'teacher_pending') groups[key].teacher_pending += 1;
    if (item.confirm_status === 'manager_review') groups[key].manager_pending += 1;
    if (item.confirm_status === 'needs_fix' || item.overtime_hours > 0 || item.other_income_note) groups[key].anomaly_count += 1;
  });
  return Object.keys(groups).map(function (key) { return groups[key]; });
}

function summarizePayroll_(branchProgress, records) {
  var latestPeriodId = '';
  (branchProgress || []).forEach(function (item) {
    if (item && item.period_id && (!latestPeriodId || item.period_id > latestPeriodId)) {
      latestPeriodId = item.period_id;
    }
  });
  var focusRows = latestPeriodId
    ? (branchProgress || []).filter(function (item) { return item.period_id === latestPeriodId; })
    : (branchProgress || []);
  var summary = {
    period_id: latestPeriodId || (branchProgress && branchProgress[0] ? branchProgress[0].period_id : ''),
    teacher_count: 0,
    confirmed_teachers: 0,
    teacher_pending: 0,
    manager_pending: 0,
    anomaly_count: 0
  };
  focusRows.forEach(function (item) {
    summary.teacher_count += toNumber_(item.teacher_count);
    summary.confirmed_teachers += toNumber_(item.confirmed_teachers);
    summary.teacher_pending += toNumber_(item.teacher_pending);
    summary.manager_pending += toNumber_(item.manager_pending);
    summary.anomaly_count += toNumber_(item.anomaly_count);
  });
  if (!summary.period_id && records && records[0]) summary.period_id = records[0].period_id;
  return summary;
}

function mapPayrollAnomalies_(rows) {
  return rows
    .map(function (row, index) {
      var employeeName = coalesceField_(row, ['employee_name', 'teacher_name', 'name', '老師姓名', '姓名']);
      if (!employeeName) return null;
      return {
        anomaly_id: coalesceField_(row, ['anomaly_id', 'id']) || ('PAY-ERR-LIVE-' + index),
        period_id: normalizePeriodId_(coalesceField_(row, ['period_id', 'period', '期別'])),
        branch_name: coalesceField_(row, ['branch_name', 'branch', '分校']) || '全部分校',
        employee_name: employeeName,
        title: coalesceField_(row, ['title', '異常標題', '異常項目']) || '薪資異常',
        meta: coalesceField_(row, ['meta', 'note', '備註']) || '',
        searchable: buildSearchable_([
          employeeName,
          coalesceField_(row, ['title', '異常標題', '異常項目']),
          coalesceField_(row, ['meta', 'note', '備註'])
        ])
      };
    })
    .filter(Boolean);
}

function derivePayrollAnomalies_(records) {
  return (records || [])
    .filter(function (item) {
      if (item.is_placeholder) return false;
      return item.confirm_status !== 'confirmed' || item.other_income_note || item.overtime_hours > 0;
    })
    .slice(0, 8)
    .map(function (item, index) {
      return {
        anomaly_id: 'PAY-DERIVED-' + index,
        period_id: item.period_id,
        branch_name: item.branch_name,
        employee_name: item.employee_name,
        title: item.confirm_status === 'teacher_pending'
          ? '老師尚未確認'
          : item.confirm_status === 'manager_review'
            ? '待主管處理'
            : item.confirm_status === 'needs_fix'
              ? '需要補件'
              : '薪資異常',
        meta: item.other_income_note || ('加班時數 ' + item.overtime_hours + ' 小時，請再確認。'),
        searchable: item.searchable
      };
    });
}

function derivePayrollLockChecklist_(records, employeeRows, teacherAccountRows) {
  var activeEmployees = (employeeRows || []).filter(function (row) {
    var status = coalesceField_(row, ['employmentStatus', 'employment_status', '在職狀態']) || 'active';
    return status !== 'inactive';
  });
  var pendingCount = (records || []).filter(function (item) {
    return item.confirm_status !== 'confirmed';
  }).length;
  var accountResetCount = (teacherAccountRows || []).filter(function (row) {
    var raw = coalesceField_(row, ['需重設密碼', 'needResetPassword', 'mustResetPassword']);
    return String(raw).toLowerCase() === 'true';
  }).length;

  return [
    {
      check_id: 'PAY-CHECK-EMPLOYEES',
      label: '在職老師清單',
      title: '在職老師清單',
      meta: '目前共有 ' + activeEmployees.length + ' 位在職老師，請確認都已出現在薪資流程中。'
    },
    {
      check_id: 'PAY-CHECK-PENDING',
      label: '本期待確認薪資',
      title: '本期待確認薪資',
      meta: '本期仍有 ' + pendingCount + ' 筆薪資單尚未完成確認。'
    },
    {
      check_id: 'PAY-CHECK-ACCOUNTS',
      label: '帳號與密碼檢查',
      title: '帳號與密碼檢查',
      meta: '共有 ' + accountResetCount + ' 位老師被標記為需重設密碼。'
    }
  ];
}

function mapOperationsBranchCompare_(rows, defaultBranchName) {
  var mapped = rows
    .map(function (row) {
      var periodId = resolveOperationsPeriodId_(row);
      var startDate = coalesceField_(row, ['startDate', 'start_date']);
      var branchName = coalesceField_(row, ['branch_name', 'branch', '分校']) || defaultBranchName || '全部分校';
      var activeStudents = toNumber_(coalesceField_(row, ['active_students', 'endingTotal', 'studentTotal', '在班學生', '學生總數']));
      var newCount = toNumber_(coalesceField_(row, ['newCount', 'new_students', 'newStudent', '新生']));
      var transferCount = toNumber_(coalesceField_(row, ['transferCount', 'transfer', '轉介紹']));
      var newStudents = newCount + transferCount;
      var riskCount = toNumber_(coalesceField_(row, ['risk_count', '風險數', '風險班級']));
      var classCount = toNumber_(coalesceField_(row, ['class_count', '班級數', '班數']));
      var netChange = toNumber_(coalesceField_(row, ['netChange', 'net_change']));
      var inquiryCount = toNumber_(coalesceField_(row, ['inquiryCount', 'inquiry', '詢問數']));
      var testCount = toNumber_(coalesceField_(row, ['testCount', 'levelTest', '測試數']));
      var trialT1 = toNumber_(coalesceField_(row, ['trialT1']));
      var trialT2 = toNumber_(coalesceField_(row, ['trialT2']));
      var trialTotal = trialT1 + trialT2;
      var lostCount = toNumber_(coalesceField_(row, ['lostCount', 'lost']));
      var callOut = toNumber_(coalesceField_(row, ['callOut']));
      var effectiveCalls = toNumber_(coalesceField_(row, ['effectiveCalls']));
      if (!periodId && !branchName) return null;
      if (!activeStudents && !newStudents && !riskCount && !classCount && !inquiryCount && !trialTotal) return null;
      return {
        branch_name: branchName,
        period_id: periodId || '',
        start_date: normalizeDateTimeForComparison_(startDate, 'operations') || (startDate || ''),
        active_students: activeStudents,
        new_students: newStudents,
        risk_count: riskCount,
        class_count: classCount,
        net_change: netChange,
        inquiry_count: inquiryCount,
        test_count: testCount,
        trial_t1: trialT1,
        trial_t2: trialT2,
        trial_total: trialTotal,
        transfer_count: transferCount,
        lost_count: lostCount,
        call_out: callOut,
        effective_calls: effectiveCalls
      };
    })
    .filter(Boolean);

  return pickLatestOperationsRows_(mapped);
}

function summarizeOperations_(branchCompare) {
  var summary = {
    period_id: branchCompare && branchCompare[0] ? branchCompare[0].period_id : '',
    active_students: 0,
    new_students: 0,
    risk_count: 0,
    class_count: 0,
    net_change: 0,
    inquiry_count: 0,
    test_count: 0,
    trial_t1: 0,
    trial_t2: 0,
    trial_total: 0,
    transfer_count: 0,
    lost_count: 0,
    call_out: 0,
    effective_calls: 0
  };
  (branchCompare || []).forEach(function (item) {
    summary.active_students += toNumber_(item.active_students);
    summary.new_students += toNumber_(item.new_students);
    summary.risk_count += toNumber_(item.risk_count);
    summary.class_count += toNumber_(item.class_count);
    summary.net_change += toNumber_(item.net_change);
    summary.inquiry_count += toNumber_(item.inquiry_count);
    summary.test_count += toNumber_(item.test_count);
    summary.trial_t1 += toNumber_(item.trial_t1);
    summary.trial_t2 += toNumber_(item.trial_t2);
    summary.trial_total += toNumber_(item.trial_total);
    summary.transfer_count += toNumber_(item.transfer_count);
    summary.lost_count += toNumber_(item.lost_count);
    summary.call_out += toNumber_(item.call_out);
    summary.effective_calls += toNumber_(item.effective_calls);
  });
  return summary;
}

function mapOperationsFunnel_(rows, defaultBranchName) {
  var directRows = rows
    .map(function (row) {
      var stage = coalesceField_(row, ['stage', '階段', 'funnel_stage']);
      if (!stage) return null;
      return {
        stage: stage,
        count: toNumber_(coalesceField_(row, ['count', '數量', '人數'])),
        branch_name: defaultBranchName || '全部分校',
        period_id: resolveOperationsPeriodId_(row),
        searchable: buildSearchable_([stage])
      };
    })
    .filter(Boolean);

  if (directRows.length) return directRows;

  var latestRow = pickLatestOperationsRows_(rows.map(function (row) {
    return {
      row: row,
      period_id: resolveOperationsPeriodId_(row),
      start_date: normalizeDateTimeForComparison_(coalesceField_(row, ['startDate', 'start_date']), 'operations')
    };
  }))[0];

  if (!latestRow) return [];

  var sourceRow = latestRow.row || latestRow;
  var stages = [
    { stage: '詢問', count: toNumber_(coalesceField_(sourceRow, ['inquiry', 'inquiryCount'])) },
    { stage: '測驗', count: toNumber_(coalesceField_(sourceRow, ['levelTest', 'testCount'])) },
    { stage: '試聽 T1', count: toNumber_(coalesceField_(sourceRow, ['trialT1'])) },
    { stage: '試聽 T2', count: toNumber_(coalesceField_(sourceRow, ['trialT2'])) },
    { stage: '新生', count: toNumber_(coalesceField_(sourceRow, ['newStudent', 'newCount'])) },
    { stage: '轉介', count: toNumber_(coalesceField_(sourceRow, ['transfer', 'transferCount'])) }
  ];

  return stages
    .filter(function (item) { return item.count > 0; })
    .map(function (item) {
      return {
        stage: item.stage,
        count: item.count,
        branch_name: defaultBranchName || '全部分校',
        period_id: resolveOperationsPeriodId_(sourceRow),
        searchable: buildSearchable_([item.stage])
      };
    });
}

function mapOperationsRisks_(rows, defaultBranchName) {
  var directRows = rows
    .map(function (row, index) {
      var className = coalesceField_(row, ['class_name', 'class', '班級', '班級名稱']);
      if (!className) return null;
      var teacherName = coalesceField_(row, ['teacher_name', 'teacher', '老師', '任課老師']) || '';
      var title = coalesceField_(row, ['title', 'risk_title', '風險標題']) || '待追蹤風險';
      var currentStudentsRaw = coalesceField_(row, ['current_students', 'active_students', 'student_count', 'current_size', '目前人數', '在班人數', '學生數', '人數']);
      var currentStudents = currentStudentsRaw === '' ? '' : toNumber_(currentStudentsRaw);
      return {
        risk_id: coalesceField_(row, ['risk_id', 'id']) || ('OPS-RISK-LIVE-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: coalesceField_(row, ['branch_name', 'branch', '分校']) || defaultBranchName || '全部分校',
        class_name: className,
        teacher_name: teacherName,
        current_students: currentStudents,
        title: title,
        meta: coalesceField_(row, ['meta', 'note', '備註']) || '',
        searchable: buildSearchable_([className, teacherName, title, coalesceField_(row, ['meta', 'note', '備註'])])
      };
    })
    .filter(Boolean);

  if (directRows.length) return directRows;

  return rows
    .map(function (row, index) {
      var lostCount = toNumber_(coalesceField_(row, ['lostCount', 'lost']));
      var riskNote = coalesceField_(row, ['riskNote', 'note', '備註']) || '';
      if (!lostCount && !riskNote) return null;
      return {
        risk_id: coalesceField_(row, ['id']) || ('OPS-RISK-WEEK-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: defaultBranchName || '全部分校',
        class_name: '未指定班級',
        teacher_name: '',
        current_students: toNumber_(coalesceField_(row, ['base'])) + toNumber_(coalesceField_(row, ['add'])) - toNumber_(coalesceField_(row, ['lost'])),
        title: lostCount > 0 ? ('流失風險 ' + lostCount + ' 位') : '營運提醒',
        meta: riskNote || coalesceField_(row, ['peopleNote', 'note', '備註']) || '',
        searchable: buildSearchable_([riskNote, coalesceField_(row, ['peopleNote', 'note', '備註'])])
      };
    })
    .filter(Boolean)
    .slice(-6)
    .reverse();
}

function mapOperationsClassHealth_(rows, defaultBranchName) {
  var directRows = rows
    .map(function (row, index) {
      var className = coalesceField_(row, ['class_name', 'class', '班級', '班級名稱']);
      if (!className) return null;
      var teacherName = coalesceField_(row, ['teacher_name', 'teacher', '老師', '任課老師']) || '';
      var healthScore = toNumber_(coalesceField_(row, ['health_score', 'health', '健康度']));
      var currentStudentsRaw = coalesceField_(row, ['current_students', 'active_students', 'student_count', 'current_size', '目前人數', '在班人數', '學生數', '人數']);
      var currentStudents = currentStudentsRaw === '' ? '' : toNumber_(currentStudentsRaw);
      return {
        class_id: coalesceField_(row, ['class_id', 'id']) || ('CLS-LIVE-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: coalesceField_(row, ['branch_name', 'branch', '分校']) || defaultBranchName || '全部分校',
        class_name: className,
        teacher_name: teacherName,
        current_students: currentStudents,
        new_students: toNumber_(coalesceField_(row, ['new_students', 'newStudent', '新增學生', '新生'])),
        health_score: healthScore,
        searchable: buildSearchable_([className, teacherName, healthScore])
      };
    })
    .filter(function (item) { return item.health_score || item.new_students || item.class_name; });

  if (directRows.length) return directRows;

  var latestRecordId = getLatestWeeklyRecordId_(rows);
  return rows
    .filter(function (row) {
      return !latestRecordId || coalesceField_(row, ['recordId', 'record_id']) === latestRecordId;
    })
    .map(function (row, index) {
      var base = toNumber_(coalesceField_(row, ['base']));
      var add = toNumber_(coalesceField_(row, ['add']));
      var lost = toNumber_(coalesceField_(row, ['lost']));
      var currentSize = base + add - lost;
      var healthScore = Math.max(0, Math.min(100, 70 + (add * 8) - (lost * 15)));
      return {
        class_id: coalesceField_(row, ['class_id', 'id', 'recordId']) || ('CLS-WEEK-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: defaultBranchName || '全部分校',
        class_name: coalesceField_(row, ['class_name', 'class', 'className', '班級', '班級名稱']),
        teacher_name: '',
        current_students: currentSize,
        new_students: add,
        health_score: healthScore,
        searchable: buildSearchable_([coalesceField_(row, ['className', 'class_name', 'class']), currentSize, add, lost])
      };
    })
    .filter(function (item) { return item.class_name; });
}

function mapOperationsActions_(rows, defaultBranchName) {
  var directRows = rows
    .map(function (row, index) {
      var title = coalesceField_(row, ['title', 'action_title', '建議行動']) || '';
      if (!title) return null;
      return {
        action_id: coalesceField_(row, ['action_id', 'id']) || ('OPS-ACT-LIVE-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: coalesceField_(row, ['branch_name', 'branch', '分校']) || defaultBranchName || '全部分校',
        title: title,
        meta: coalesceField_(row, ['meta', 'note', '備註']) || '',
        searchable: buildSearchable_([title, coalesceField_(row, ['meta', 'note', '備註'])])
      };
    })
    .filter(Boolean);

  if (directRows.length) return directRows;

  return rows
    .filter(function (row) {
      return coalesceField_(row, ['peopleNote', 'riskNote', 'note', '備註']);
    })
    .slice(-3)
    .reverse()
    .map(function (row, index) {
      return {
        action_id: coalesceField_(row, ['id']) || ('OPS-ACT-WEEK-' + index),
        period_id: resolveOperationsPeriodId_(row),
        branch_name: defaultBranchName || '全部分校',
        title: '追蹤營運提醒',
        meta: coalesceField_(row, ['riskNote', 'peopleNote', 'note', '備註']) || '',
        searchable: buildSearchable_([
          coalesceField_(row, ['riskNote', 'peopleNote', 'note', '備註'])
        ])
      };
    });
}

function inferBranchNameFromSpreadsheet_(spreadsheet) {
  var title = spreadsheet && spreadsheet.getName ? spreadsheet.getName() : '';
  if (!title) return '全部分校';
  return normalizeBranchName_(title
    .replace(/\s*Dashboard.*$/i, '')
    .replace(/\s*資料庫.*$/i, '')
    .trim()) || '全部分校';
}

function resolveOperationsPeriodId_(row) {
  return normalizePeriodIdForSource_(coalesceField_(row, ['period_id', 'period', 'startDate', 'start_date']), 'operations') ||
    buildPeriodId_(coalesceField_(row, ['year']), coalesceField_(row, ['month']));
}

function pickLatestOperationsRows_(rows) {
  var latestStartDate = '';
  (rows || []).forEach(function (row) {
    var startDate = row && row.start_date ? row.start_date : '';
    if (startDate && (!latestStartDate || startDate > latestStartDate)) latestStartDate = startDate;
  });
  if (latestStartDate) {
    return (rows || []).filter(function (row) {
      return row.start_date === latestStartDate;
    });
  }

  var latestKey = '';
  (rows || []).forEach(function (row) {
    var key = row && row.period_id ? row.period_id : '';
    if (key && (!latestKey || key > latestKey)) latestKey = key;
  });
  if (!latestKey) return rows || [];
  return (rows || []).filter(function (row) {
    return row.period_id === latestKey;
  });
}

function getLatestWeeklyRecordId_(rows) {
  var latestId = '';
  var latestStartDate = '';
  (rows || []).forEach(function (row) {
    var startDate = coalesceField_(row, ['startDate', 'start_date']);
    var recordId = coalesceField_(row, ['recordId', 'record_id']);
    if (startDate && (!latestStartDate || startDate > latestStartDate)) {
      latestStartDate = startDate;
      latestId = recordId;
    }
  });
  return latestId;
}

function deriveOperationsActions_(risks) {
  return (risks || []).slice(0, 3).map(function (item, index) {
    return {
      action_id: 'OPS-DERIVED-' + index,
      period_id: item.period_id,
      branch_name: item.branch_name,
      title: '追蹤 ' + item.class_name + '｜' + item.title,
      meta: item.meta,
      searchable: item.searchable
    };
  });
}

function mapSimpleCards_(rows, idPrefix) {
  return rows
    .map(function (row, index) {
      var label = coalesceField_(row, ['label', 'title', '名稱', '標題']);
      if (!label) return null;
      return {
        [idPrefix]: coalesceField_(row, [idPrefix, 'id']) || (idPrefix.toUpperCase() + '-LIVE-' + index),
        label: label,
        title: label,
        meta: coalesceField_(row, ['meta', 'note', '備註']) || ''
      };
    })
    .filter(Boolean);
}

function findSheetByAliases_(spreadsheet, aliases) {
  var sheets = spreadsheet.getSheets();
  var normalizedAliases = (aliases || []).map(normalizeHeaderKey_);

  for (var i = 0; i < sheets.length; i += 1) {
    var sheetName = normalizeHeaderKey_(sheets[i].getName());
    if (normalizedAliases.indexOf(sheetName) >= 0) return sheets[i];
  }

  return null;
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  if (!values.length || values.length === 1) return [];

  var headers = values[0].map(normalizeHeaderKey_);
  var rows = [];

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = {};
    var rowValues = values[rowIndex];
    var hasValue = false;

    for (var colIndex = 0; colIndex < headers.length; colIndex += 1) {
      var header = headers[colIndex];
      if (!header) continue;
      var value = rowValues[colIndex];
      if (value !== '') hasValue = true;
      row[header] = value;
    }

    if (hasValue) rows.push(row);
  }

  return rows;
}

function coalesceField_(row, aliases) {
  for (var i = 0; i < aliases.length; i += 1) {
    var key = normalizeHeaderKey_(aliases[i]);
    if (row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }
  return '';
}

function normalizeHeaderKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_\-\/\\()[\]{}:;.,嚗?嚗?"`~!?嚗?]/g, '');
}

function extractBranchNames_(raw) {
  return String(raw || '')
    .split(/\r?\n|,|\//)
    .map(function (item) { return normalizeBranchName_(item); })
    .filter(Boolean);
}

function normalizeBranchName_(raw) {
  var text = String(raw || '').trim();
  if (!text) return '';

  var compact = text
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .toLowerCase();

  if (!compact) return '';
  if (compact === 'all' || compact.indexOf('全部分校') >= 0) return '全部分校';
  if (compact.indexOf('二重') >= 0 || compact.indexOf('erchong') >= 0) return '二重分校';
  if (compact.indexOf('安興') >= 0 || compact.indexOf('anxing') >= 0) return '安興分校';

  return text
    .replace(/^樂獅英語[-/]*/g, '')
    .replace(/^新竹[-/]*/g, '')
    .replace(/Dashboard.*$/i, '')
    .replace(/資料庫.*$/i, '')
    .trim();
}

function normalizePeriodId_(value) {
  if (!value) return '';
  var text = String(value).trim();
  var match = text.match(/(\d{4})[^\d]?(\d{1,2})/);
  if (!match) return '';
  return match[1] + '-' + ('0' + match[2]).slice(-2);
}

function buildPeriodId_(year, month) {
  if (!year || !month) return '';
  return String(year) + '-' + ('0' + month).slice(-2);
}

function normalizeId_(name) {
  return String(name).toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-');
}

function normalizeCode_(name) {
  var text = String(name || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
  if (!text) return 'NA';
  return text.slice(0, 4).toUpperCase();
}

function normalizeMonthlyStatus_(status) {
  var value = normalizeHeaderKey_(status);
  if (value === 'draft' || value.indexOf('草稿') >= 0) return 'draft';
  if (value === 'submitted' || value.indexOf('已送出') >= 0 || value.indexOf('送審') >= 0) return 'submitted';
  if (value === 'reviewed' || value.indexOf('已完成') >= 0 || value.indexOf('已審核') >= 0) return 'reviewed';
  if (value === 'needsrevision' || value.indexOf('需修正') >= 0 || value.indexOf('退回') >= 0) return 'needs_revision';
  return 'draft';
}

function normalizePayrollStatus_(status) {
  var value = normalizeHeaderKey_(status);
  if (value === 'confirmed' || value.indexOf('已確認') >= 0) return 'confirmed';
  if (value === 'teacherpending' || value.indexOf('待老師確認') >= 0 || value.indexOf('待確認') >= 0) return 'teacher_pending';
  if (value === 'managerreview' || value.indexOf('待主管處理') >= 0 || value.indexOf('主管審核') >= 0) return 'manager_review';
  if (value === 'needsfix' || value.indexOf('需補件') >= 0 || value.indexOf('異常') >= 0) return 'needs_fix';
  return 'teacher_pending';
}

function nextStepFromMonthlyStatus_(status) {
  if (status === 'draft') return '補完後送出';
  if (status === 'submitted') return '等待主管審核';
  if (status === 'reviewed') return '已完成';
  if (status === 'needs_revision') return '補件後重送';
  return '補完後送出';
}

function buildSearchable_(parts) {
  return parts
    .filter(function (item) { return item !== undefined && item !== null && item !== ''; })
    .join(' ');
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) return 0;
  var normalized = String(value).replace(/[^\d.\-]/g, '');
  var numberValue = Number(normalized);
  return isNaN(numberValue) ? 0 : numberValue;
}

function deepClone_(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasKeys_(value) {
  return value && Object.keys(value).length > 0;
}



