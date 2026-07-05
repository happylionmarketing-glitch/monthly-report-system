import fs from 'node:fs';
import path from 'node:path';

const sourceFile = path.join(process.cwd(), 'server', 'data', 'student-movement-source.json');

const actionTypeMap = {
  插班: 'insert',
  進班: 'insert',
  轉入: 'transfer_in',
  轉出: 'transfer_out',
  轉班: 'transfer_out',
  流失: 'loss',
  已流失: 'loss',
  試讀: 'trial',
};

const actionLabelMap = {
  insert: '插班 / 進班',
  transfer_in: '轉入',
  transfer_out: '轉出',
  loss: '流失',
  trial: '試讀',
};

const pendingStatusLabel = '待確認';
const confirmedStatusLabel = '已排定';

function readSource() {
  const raw = fs.readFileSync(sourceFile, 'utf-8');
  return JSON.parse(raw);
}

function getTaipeiTodayIso() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function resolveReferenceDate(snapshotSource) {
  const capturedDate = String(snapshotSource?.capturedAt ?? '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(capturedDate)) {
    return capturedDate;
  }

  return getTaipeiTodayIso();
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function diffDays(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function formatMonthDay(month, day) {
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function toIsoDate(month, day, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeNote(note) {
  return String(note ?? '')
    .replace(/[；;]+/g, '、')
    .replace(/[，,]+/g, '、')
    .replace(/\s+/g, '')
    .trim();
}

function splitNames(value) {
  return String(value ?? '')
    .split(/[、，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeIdPart(value) {
  return String(value)
    .replace(/[^A-Za-z0-9\u4e00-\u9fff_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isCarryForwardName(token) {
  return Boolean(token)
    && !/(\d{1,2}\/\d{1,2}|[一二三四五六七八九十]+月|待|已流失|流失|插班|進班|轉入|轉出|轉班|試讀|新班|訂金)/.test(token);
}

function buildEvent({
  row,
  studentName,
  action,
  isoDate = null,
  dateLabel,
  status,
  source,
  sourceWeekStart,
  sourceWeekEnd,
  today,
}) {
  const movementType = actionTypeMap[action];
  const trimmedName = studentName.trim();

  return {
    id: sanitizeIdPart(`${row.recordId}-${row.rowNumber}-${trimmedName}-${movementType}-${isoDate ?? dateLabel ?? 'undated'}`),
    studentName: trimmedName,
    movementType,
    movementLabel: actionLabelMap[movementType],
    rawActionLabel: action,
    status,
    statusLabel: status === 'pending' ? pendingStatusLabel : confirmedStatusLabel,
    eventDate: isoDate,
    eventDateLabel: isoDate ? formatMonthDay(...isoDate.slice(5).split('-').map(Number)) : dateLabel,
    daysUntil: isoDate ? diffDays(today, isoDate) : null,
    className: row.className,
    sourceRow: row.rowNumber,
    sourceNote: row.note,
    sourceWeekStart,
    sourceWeekEnd,
    sourceUpdatedAt: source.sourceUpdatedAt,
  };
}

function parseToken(token, row, source, sourceWeekStart, sourceWeekEnd, today, currentYear, carryForwardNames) {
  const datedMatch = token.match(/^(?<names>.+?)(?<month>\d{1,2})\/(?<day>\d{1,2})(?<pending>待)?(?<action>已流失|流失|插班|進班|轉入|轉出|轉班|試讀)$/);
  if (datedMatch?.groups) {
    const names = [...carryForwardNames, ...splitNames(datedMatch.groups.names)];
    const month = Number(datedMatch.groups.month);
    const day = Number(datedMatch.groups.day);
    const isoDate = toIsoDate(month, day, currentYear);
    const status = datedMatch.groups.pending ? 'pending' : 'confirmed';
    return {
      events: names.map((studentName) => buildEvent({
        row,
        studentName,
        action: datedMatch.groups.action,
        isoDate,
        dateLabel: formatMonthDay(month, day),
        status,
        source,
        sourceWeekStart,
        sourceWeekEnd,
        today,
      })),
      nextCarryForwardNames: [],
    };
  }

  const monthOnlyMatch = token.match(/^(?<names>.+?)(?<monthText>\d{1,2}|[一二三四五六七八九十]+)月(?<pending>待)?(?<action>已流失|流失|插班|進班|轉入|轉出|轉班|試讀)$/);
  if (monthOnlyMatch?.groups) {
    const names = [...carryForwardNames, ...splitNames(monthOnlyMatch.groups.names)];
    const status = monthOnlyMatch.groups.pending ? 'pending' : 'confirmed';
    return {
      events: names.map((studentName) => buildEvent({
        row,
        studentName,
        action: monthOnlyMatch.groups.action,
        dateLabel: `${monthOnlyMatch.groups.monthText}月`,
        status,
        source,
        sourceWeekStart,
        sourceWeekEnd,
        today,
      })),
      nextCarryForwardNames: [],
    };
  }

  const undatedMatch = token.match(/^(?<names>.+?)(?<pending>待)?(?<action>已流失|流失|插班|進班|轉入|轉出|轉班|試讀)$/);
  if (undatedMatch?.groups) {
    const names = [...carryForwardNames, ...splitNames(undatedMatch.groups.names)];
    const status = undatedMatch.groups.pending ? 'pending' : 'confirmed';
    return {
      events: names.map((studentName) => buildEvent({
        row,
        studentName,
        action: undatedMatch.groups.action,
        dateLabel: status === 'pending' ? '待排日期' : '未註明日期',
        status,
        source,
        sourceWeekStart,
        sourceWeekEnd,
        today,
      })),
      nextCarryForwardNames: [],
    };
  }

  return {
    events: [],
    nextCarryForwardNames: isCarryForwardName(token) ? [...carryForwardNames, token] : [],
  };
}

function extractEventsFromRow(row, source, today, currentYear, sourceWeekStart, sourceWeekEnd) {
  const normalized = normalizeNote(row.note);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split('、').map((item) => item.trim()).filter(Boolean);
  const events = [];
  let carryForwardNames = [];

  for (const token of tokens) {
    const { events: parsedEvents, nextCarryForwardNames } = parseToken(
      token,
      row,
      source,
      sourceWeekStart,
      sourceWeekEnd,
      today,
      currentYear,
      carryForwardNames,
    );

    if (parsedEvents.length) {
      events.push(...parsedEvents);
      carryForwardNames = nextCarryForwardNames;
      continue;
    }

    carryForwardNames = nextCarryForwardNames;
  }

  return events;
}

function buildSummary(upcoming, undatedPending) {
  const counts = {
    insert: 0,
    transfer_in: 0,
    transfer_out: 0,
    loss: 0,
    trial: 0,
  };

  for (const item of upcoming) {
    counts[item.movementType] += 1;
  }

  return {
    totalUpcoming: upcoming.length,
    totalPendingWithoutDate: undatedPending.length,
    insertCount: counts.insert,
    transferInCount: counts.transfer_in,
    transferOutCount: counts.transfer_out,
    lossCount: counts.loss,
    trialCount: counts.trial,
  };
}

export function buildStudentMovementDigest() {
  const snapshot = readSource();
  const today = resolveReferenceDate(snapshot.source);
  const windowEnd = addDays(today, 13);
  const currentYear = Number(today.slice(0, 4));
  const sourceWeekStart = snapshot.source.snapshotWeekStart;
  const sourceWeekEnd = snapshot.source.snapshotWeekEnd;

  const parsedEvents = (snapshot.rows ?? []).flatMap((row) =>
    extractEventsFromRow(row, snapshot.source, today, currentYear, sourceWeekStart, sourceWeekEnd),
  );

  const upcoming = parsedEvents
    .filter((item) => item.eventDate && item.eventDate >= today && item.eventDate <= windowEnd)
    .sort((left, right) => {
      const leftDate = left.eventDate ?? '';
      const rightDate = right.eventDate ?? '';
      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate);
      }
      if (left.status !== right.status) {
        return left.status === 'pending' ? -1 : 1;
      }
      return left.className.localeCompare(right.className) || left.studentName.localeCompare(right.studentName);
    });

  const undatedPending = parsedEvents
    .filter((item) => !item.eventDate && item.status === 'pending')
    .sort((left, right) => left.className.localeCompare(right.className) || left.studentName.localeCompare(right.studentName));

  return {
    windowStart: today,
    windowEnd,
    generatedAt: new Date().toISOString(),
    source: {
      spreadsheetId: snapshot.source.spreadsheetId,
      spreadsheetTitle: snapshot.source.spreadsheetTitle,
      spreadsheetUrl: snapshot.source.spreadsheetUrl,
      sheetName: snapshot.source.sheetName,
      snapshotRecordId: snapshot.source.snapshotRecordId,
      snapshotWeekStart: snapshot.source.snapshotWeekStart,
      snapshotWeekEnd: snapshot.source.snapshotWeekEnd,
      sourceUpdatedAt: snapshot.source.sourceUpdatedAt,
      capturedAt: snapshot.source.capturedAt,
      notes: snapshot.source.notes,
      rowCount: Array.isArray(snapshot.rows) ? snapshot.rows.length : 0,
    },
    summary: buildSummary(upcoming, undatedPending),
    upcoming,
    undatedPending,
  };
}
