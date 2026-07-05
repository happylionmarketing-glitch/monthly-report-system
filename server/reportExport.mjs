import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageNumber,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

function reportTitle(report) {
  return `${report.branch || '樂獅英語'}｜${report.month} 月報`;
}

function roleLabel(role) {
  return role === 'teacher' ? '英語老師' : '行政老師';
}

function schoolHeader(report) {
  return report.branch || '樂獅英語補習班';
}

function monthLabel(report) {
  return `${report.month} 月`;
}

function makeHeaderParagraph(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: Boolean(options.bold), size: options.size ?? 20 })],
    alignment: options.align ?? AlignmentType.LEFT,
    spacing: { after: options.after ?? 120 },
  });
}

function makeCell(text, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? ''), bold, size: 18 })],
        spacing: { after: 0 },
      }),
    ],
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((header) => makeCell(header, true)) }),
      ...rows.map((row) => new TableRow({ children: row.map((value) => makeCell(value)) })),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'C7C7C7' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C7C7C7' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'C7C7C7' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'C7C7C7' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D9D9D9' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'D9D9D9' },
    },
  });
}

function attendanceSummary(records) {
  const summary = {
    sick: { count: 0, days: 0, hours: 0 },
    personal: { count: 0, days: 0, hours: 0 },
    annual: { count: 0, days: 0, hours: 0 },
    late: { count: 0, days: 0, hours: 0 },
  };

  records.forEach((record) => {
    const target = summary[record.category];
    target.count += 1;
    target.days += Number(record.days) || 0;
    target.hours += Number(record.hours) || 0;
  });

  return summary;
}

function reviewHistoryRows(history) {
  return history.map((item) => [
    item.reviewedAt || '',
    item.reviewerName || '',
    item.status === 'reviewed' ? '已核准' : '退回修正',
    item.reviewerNote || '',
  ]);
}

function submissionHistoryRows(history) {
  const actionLabels = {
    submitted: '首次送出',
    resubmitted: '重新送出',
    resubmitted_after_revision: '退回後重新送出',
  };
  return history.map((item) => [
    item.submittedAt || '',
    item.userName || '',
    actionLabels[item.action] || item.action || '送出',
    item.previousStatus || '新月報',
  ]);
}

function signatureTable() {
  return makeTable(
    ['填表人', '主管審核', '簽核日期'],
    [['', '', '']],
  );
}

function teacherSections(report) {
  const data = report.data;
  const classRows = data.classAssignments.map((item) => [
    item.className,
    item.level,
    item.courseType,
    String(item.studentCount),
  ]);

  const attendanceRows = data.attendanceRecords.map((item) => [
    item.category,
    item.date || '-',
    String(item.days),
    String(item.hours),
    item.note || '',
  ]);

  const workRows = data.teachingRecords.map((item) => [
    item.category,
    item.date || '-',
    item.className || '',
    item.level || '',
    String(item.hours),
    item.note || '',
  ]);

  return [
    { heading: '帶班與人數', rows: classRows, headers: ['班級', '級數', '課程別', '人數'] },
    { heading: '出勤紀錄', rows: attendanceRows, headers: ['類別', '日期', '天數', '時數', '備註'] },
    { heading: '教學紀錄', rows: workRows, headers: ['類別', '日期', '班級', '級數', '時數', '備註'] },
    {
      heading: '績效與反思',
      lines: [
        `試上人數：${data.performanceMetrics.trialStudents}`,
        `轉換人數：${data.performanceMetrics.convertedStudents}`,
        `檢測人數：${data.performanceMetrics.gradeTestStudents}`,
        `作業錯誤率：${data.performanceMetrics.homeworkErrorRate}%`,
        `電話追蹤成功率：${data.performanceMetrics.phoneSupportSuccessRate}%`,
        `諮詢人數：${data.performanceMetrics.inquiryStudentCount}`,
        `不可抗流失：${data.performanceMetrics.unavoidableLosses}`,
        `可抗流失：${data.performanceMetrics.avoidableLosses}`,
        `本月亮點：${data.reflection.wins || '-'}`,
        `本月需要修正：${data.reflection.fixes || '-'}`,
        `下月目標：${data.reflection.nextMonthGoal || '-'}`,
        `自評分數：${data.reflection.selfEvaluation}`,
      ],
    },
  ];
}

function adminSections(report) {
  const data = report.data;
  const attendanceRows = data.attendanceRecords.map((item) => [
    item.category,
    item.date || '-',
    String(item.days),
    String(item.hours),
    item.note || '',
  ]);

  return [
    { heading: '出勤紀錄', rows: attendanceRows, headers: ['類別', '日期', '天數', '時數', '備註'] },
    {
      heading: '行政績效',
      lines: [
        `新生數：${data.performanceMetrics.newEnrollments}`,
        `諮詢數：${data.performanceMetrics.inquiryCount}`,
        `電話數：${data.performanceMetrics.callCount}`,
        `轉換率：${data.performanceMetrics.conversionRate}%`,
        `校園熟悉度：${data.performanceMetrics.campusFamiliarityRate}%`,
        `海報完成：${data.performanceMetrics.posterCompleted ? '是' : '否'}`,
        `逾期通知：${data.performanceMetrics.formChecklist.overdueNotice ? '是' : '否'}`,
        `每週人數：${data.performanceMetrics.formChecklist.weeklyHeadcount ? '是' : '否'}`,
        `月底人數：${data.performanceMetrics.formChecklist.monthEndHeadcount ? '是' : '否'}`,
        `繳費袋：${data.performanceMetrics.formChecklist.tuitionBag ? '是' : '否'}`,
      ],
    },
    {
      heading: '反思',
      lines: [
        `本月亮點：${data.reflection.wins || '-'}`,
        `需要修正：${data.reflection.fixes || '-'}`,
        `向上回饋：${data.reflection.upwardFeedback || '-'}`,
        `團隊表揚：${data.reflection.teamPraise || '-'}`,
        `下月目標：${data.reflection.nextMonthGoal || '-'}`,
        `自評分數：${data.reflection.selfEvaluation}`,
        `執行力分數：${data.reflection.execution}`,
      ],
    },
  ];
}

function buildDocxBody(report) {
  const paragraphs = [];
  paragraphs.push(makeHeaderParagraph(schoolHeader(report), { bold: true, size: 28, align: AlignmentType.CENTER, after: 40 }));
  paragraphs.push(makeHeaderParagraph('月報正式版', { bold: true, size: 24, align: AlignmentType.CENTER, after: 20 }));
  paragraphs.push(makeHeaderParagraph(reportTitle(report), { size: 20, align: AlignmentType.CENTER, after: 80 }));

  [
    ['姓名', report.userName || ''],
    ['角色', roleLabel(report.role)],
    ['月份', monthLabel(report)],
    ['狀態', report.status],
    ['最後更新', report.updatedAt],
  ].forEach(([label, value]) => {
    paragraphs.push(makeHeaderParagraph(`${label}：${value}`, { size: 18, after: 40 }));
  });

  const sections = report.role === 'teacher' ? teacherSections(report) : adminSections(report);
  sections.forEach((section) => {
    paragraphs.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } }));
    if (section.rows?.length) {
      paragraphs.push(makeTable(section.headers, section.rows));
    }
    if (section.lines?.length) {
      section.lines.forEach((line) => paragraphs.push(makeHeaderParagraph(line, { size: 18, after: 30 })));
    }
  });

  paragraphs.push(new Paragraph({ text: '簽核欄位', heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } }));
  if (report.submissionHistory?.length) {
    paragraphs.push(new Paragraph({ text: '送出與退回後重新送出紀錄', heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } }));
    paragraphs.push(makeTable(['時間', '送出人', '動作', '送出前狀態'], submissionHistoryRows(report.submissionHistory)));
  }

  paragraphs.push(signatureTable());

  if (report.reviewHistory?.length) {
    paragraphs.push(new Paragraph({ text: '主管審核紀錄', heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } }));
    paragraphs.push(makeTable(['時間', '審核者', '狀態', '評語'], reviewHistoryRows(report.reviewHistory)));
  }

  return paragraphs;
}

function docxFooter(report) {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: schoolHeader(report), size: 16 }),
          new TextRun({ text: `｜${monthLabel(report)}｜第 `, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun({ text: ' 頁', size: 16 }),
        ],
      }),
    ],
  });
}

function docxHeader(report) {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `${schoolHeader(report)}｜${monthLabel(report)}月報`, size: 16, bold: true })],
      }),
    ],
  });
}

export async function buildReportDocxBuffer(report) {
  const doc = new Document({
    sections: [
      {
        headers: { default: docxHeader(report) },
        footers: { default: docxFooter(report) },
        children: buildDocxBody(report),
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Microsoft JhengHei',
          },
        },
      },
    },
  });

  return Packer.toBuffer(doc);
}

function registerPdfFont(doc) {
  const fontCandidates = [
    'C:/Windows/Fonts/NotoSansTC-VF.ttf',
    'C:/Windows/Fonts/msjh.ttc',
    'C:/Windows/Fonts/mingliu.ttc',
  ];

  for (const fontPath of fontCandidates) {
    if (fs.existsSync(fontPath)) {
      try {
        doc.registerFont('Body', fontPath);
        doc.font('Body');
        return;
      } catch {
        continue;
      }
    }
  }

  doc.font('Helvetica');
}

function addPdfSection(doc, title, lines) {
  doc.moveDown(0.6);
  doc.fontSize(13).text(title, { underline: true });
  doc.moveDown(0.2);
  lines.forEach((line) => {
    doc.fontSize(10).text(line);
  });
}

export async function buildReportPdfBuffer(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    registerPdfFont(doc);
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(schoolHeader(report), { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(15).text('月報正式版', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).text(reportTitle(report), { align: 'center' });
    doc.moveDown(0.6);

    [
      `姓名：${report.userName || ''}`,
      `角色：${roleLabel(report.role)}`,
      `月份：${monthLabel(report)}`,
      `狀態：${report.status}`,
      `最後更新：${report.updatedAt}`,
    ].forEach((line) => doc.fontSize(10).text(line));

    const sections = report.role === 'teacher' ? teacherSections(report) : adminSections(report);
    sections.forEach((section) => {
      if (section.rows?.length) {
        const tableLines = section.rows.map((row) => row.join(' ｜ '));
        addPdfSection(doc, section.heading, tableLines);
      }

      if (section.lines?.length) {
        addPdfSection(doc, section.heading, section.lines);
      }
    });

    addPdfSection(doc, '簽核欄位', ['填表人：', '主管審核：', '簽核日期：']);

    if (report.submissionHistory?.length) {
      const submissionLines = report.submissionHistory.map((item) => `${item.submittedAt || ''} ｜ ${item.userName || ''} ｜ ${submissionHistoryRows([item])[0][2]} ｜ 送出前狀態：${item.previousStatus || '新月報'}`);
      addPdfSection(doc, '送出與退回後重新送出紀錄', submissionLines);
    }

    if (report.reviewHistory?.length) {
      const reviewLines = report.reviewHistory.map((item) => `${item.reviewedAt} ｜ ${item.reviewerName} ｜ ${item.status === 'reviewed' ? '已核准' : '退回修正'} ｜ ${item.reviewerNote || ''}`);
      addPdfSection(doc, '主管審核紀錄', reviewLines);
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      const footerY = doc.page.height - 32;
      doc.fontSize(9).text(`${schoolHeader(report)}｜${monthLabel(report)}｜第 ${i + 1} 頁 / 共 ${range.count} 頁`, 40, footerY, {
        width: doc.page.width - 80,
        align: 'center',
      });
    }

    doc.end();
  });
}
