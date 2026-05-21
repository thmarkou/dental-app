/**
 * Monthly management report PDF — HTML → expo-print → share sheet.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  getMonthSummary,
  getOutstandingDebts,
  getReportsOverview,
  percentChange,
  previousCalendarMonth,
  type MonthSummary,
  type OutstandingDebtRow,
  type ReportsOverview,
} from './report.service';
import {getInventorySummary} from '../inventory/inventory.service';
import {
  getPracticeDisplayName,
  getPracticeSettings,
} from '../settings/practiceSettings.service';
import {el, invoiceStatusLabel, UI_LOCALE} from '../../i18n';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat(UI_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat(UI_LOCALE, {month: 'long', year: 'numeric'}).format(
    new Date(y, m - 1, 1),
  );

function formatPctDelta(current: number, previous: number): string {
  const pct = percentChange(current, previous);
  if (pct === null) {
    return current > 0 ? el.reports.vsPrevMonthNew : el.reports.vsPrevMonthSame;
  }
  if (pct === 0) {
    return el.reports.vsPrevMonthSame;
  }
  const abs = Math.abs(pct).toFixed(1).replace(/\.0$/, '');
  return pct > 0
    ? el.reports.vsPrevMonthUp.replace('{pct}', abs)
    : el.reports.vsPrevMonthDown.replace('{pct}', abs);
}

function kpiRow(label: string, value: string, vsPrev?: string): string {
  return `<tr>
    <td>${escapeHtml(label)}</td>
    <td class="num"><strong>${escapeHtml(value)}</strong></td>
    <td class="muted">${vsPrev ? escapeHtml(vsPrev) : ''}</td>
  </tr>`;
}

export function buildMonthlyReportHtml(params: {
  summary: MonthSummary;
  prevSummary: MonthSummary | null;
  overview: ReportsOverview;
  debts: OutstandingDebtRow[];
  lowStockCount: number;
}): string {
  const {summary, prevSummary, overview, debts, lowStockCount} = params;
  const practice = getPracticeSettings();
  const practiceName = getPracticeDisplayName(practice);
  const prev = prevSummary;

  const summaryRows = [
    kpiRow(
      el.reports.revenue,
      formatMoney(summary.revenue),
      prev ? formatPctDelta(summary.revenue, prev.revenue) : undefined,
    ),
    kpiRow(
      el.reports.charges,
      formatMoney(summary.charges),
      prev ? formatPctDelta(summary.charges, prev.charges) : undefined,
    ),
    kpiRow(
      el.reports.newPatients,
      String(summary.newPatients),
      prev ? formatPctDelta(summary.newPatients, prev.newPatients) : undefined,
    ),
    kpiRow(el.reports.totalReceivables, formatMoney(overview.totalReceivables)),
    kpiRow(
      el.reports.pendingInvoices,
      `${overview.pendingInvoiceCount} · ${formatMoney(overview.pendingInvoiceAmount)}`,
    ),
    kpiRow(el.reports.lowStockKpi, String(lowStockCount)),
  ].join('');

  const procedureRows =
    summary.procedures.length === 0
      ? `<tr><td colspan="2" class="muted">${escapeHtml(el.reports.noProceduresMonth)}</td></tr>`
      : summary.procedures
          .map(
            (p) => `<tr>
              <td>${escapeHtml(p.procedureType)}</td>
              <td class="num">${p.count}</td>
            </tr>`,
          )
          .join('');

  const pendingRows =
    overview.pendingInvoices.length === 0
      ? `<tr><td colspan="3" class="muted">${escapeHtml(el.reports.noPendingInvoices)}</td></tr>`
      : overview.pendingInvoices
          .map(
            (inv) => `<tr>
              <td>${escapeHtml(inv.invoiceNumber)}</td>
              <td>${escapeHtml(`${inv.firstName} ${inv.lastName}`)}</td>
              <td class="num">${formatMoney(inv.totalAmount)} · ${escapeHtml(invoiceStatusLabel(inv.status as 'draft' | 'issued' | 'paid' | 'cancelled'))}</td>
            </tr>`,
          )
          .join('');

  const debtRows =
    debts.length === 0
      ? `<tr><td colspan="2" class="muted">${escapeHtml(el.reports.noReceivables)}</td></tr>`
      : debts
          .map(
            (d) => `<tr>
              <td>${escapeHtml(`${d.firstName} ${d.lastName}`)}</td>
              <td class="num">${formatMoney(d.balanceOwed)}</td>
            </tr>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #0f172a;
      margin: 24px;
      line-height: 1.4;
    }
    h1 { font-size: 16pt; margin: 0 0 4px; }
    h2 {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 20px 0 8px;
    }
    .muted { color: #64748b; font-size: 9pt; }
    table.data {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    table.data th,
    table.data td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 4px;
      text-align: left;
      vertical-align: top;
    }
    table.data th {
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748b;
      border-bottom-width: 2px;
    }
    table.data td.num,
    table.data th:last-child { text-align: right; }
    .footer {
      margin-top: 28px;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(el.reports.pdfTitle)}</h1>
  <p class="muted">${escapeHtml(practiceName)} · ${escapeHtml(monthLabel(summary.year, summary.month))}</p>
  <p class="muted">${escapeHtml(el.reports.pdfSubtitle)}</p>

  <h2>${escapeHtml(el.reports.pdfSectionSummary)}</h2>
  <table class="data">
    <thead>
      <tr>
        <th>${escapeHtml(el.reports.pdfColMetric)}</th>
        <th>${escapeHtml(el.reports.pdfColValue)}</th>
        <th>${escapeHtml(el.reports.vsPrevMonthHeader)}</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>${escapeHtml(el.reports.clinicalProcedures)}</h2>
  <table class="data">
    <thead>
      <tr>
        <th>${escapeHtml(el.reports.pdfColProcedure)}</th>
        <th>${escapeHtml(el.reports.pdfColCount)}</th>
      </tr>
    </thead>
    <tbody>${procedureRows}</tbody>
  </table>

  <h2>${escapeHtml(el.reports.pendingInvoices)}</h2>
  <table class="data">
    <thead>
      <tr>
        <th>#</th>
        <th>${escapeHtml(el.reports.csvPatient)}</th>
        <th>${escapeHtml(el.reports.pdfColAmount)}</th>
      </tr>
    </thead>
    <tbody>${pendingRows}</tbody>
  </table>

  <h2>${escapeHtml(el.reports.topOutstanding)}</h2>
  <table class="data">
    <thead>
      <tr>
        <th>${escapeHtml(el.reports.csvPatient)}</th>
        <th>${escapeHtml(el.reports.pdfColBalance)}</th>
      </tr>
    </thead>
    <tbody>${debtRows}</tbody>
  </table>

  <p class="footer">${escapeHtml(el.reports.pdfFooter)}</p>
</body>
</html>`;
}

/** Generate monthly report PDF and open OS share sheet. */
export async function shareMonthlyReportPdf(
  month: number,
  year: number,
): Promise<void> {
  const prev = previousCalendarMonth(month, year);
  const [summary, prevSummary, overview, debts, inventory] = await Promise.all([
    getMonthSummary(month, year),
    getMonthSummary(prev.month, prev.year),
    getReportsOverview(20),
    getOutstandingDebts(15),
    getInventorySummary(),
  ]);

  const html = buildMonthlyReportHtml({
    summary,
    prevSummary,
    overview,
    debts,
    lowStockCount: inventory.lowStockCount,
  });

  const {uri} = await Print.printToFileAsync({html});
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${el.reports.exportPdfTitle} ${summary.periodKey}`,
    UTI: 'com.adobe.pdf',
  });
}
