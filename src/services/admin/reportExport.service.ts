/**
 * Share monthly management report as CSV (Module K+).
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {getMonthSummary, type MonthSummary} from './report.service';
import {getMonthlyPaymentReportRows} from '../financial/payment.service';
import {el} from '../../i18n';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function line(cells: string[]): string {
  return cells.map((c) => escapeCsvCell(c)).join(',');
}

function buildReportCsv(summary: MonthSummary): string {
  const rows = getMonthlyPaymentReportRows(summary.periodKey);
  const lines: string[] = [];

  lines.push(line([el.reports.csvSectionSummary]));
  lines.push(
    line([
      el.reports.csvPeriod,
      summary.periodKey,
      el.reports.revenue,
      summary.revenue.toFixed(2),
      el.reports.charges,
      summary.charges.toFixed(2),
      el.reports.csvGap,
      (summary.charges - summary.revenue).toFixed(2),
      el.reports.newPatients,
      String(summary.newPatients),
    ]),
  );
  lines.push('');

  lines.push(line([el.reports.csvSectionPayments]));
  lines.push(
    line([
      el.reports.csvPatient,
      el.reports.csvAmount,
      el.reports.csvMethod,
      el.reports.csvDate,
      el.reports.csvReceipt,
      el.reports.csvNotes,
    ]),
  );
  for (const p of rows) {
    lines.push(
      line([
        `${p.firstName} ${p.lastName}`.trim(),
        p.amount.toFixed(2),
        p.paymentMethod,
        p.transactionDate,
        p.receiptIssued ? 'yes' : 'no',
        p.notes ?? '',
      ]),
    );
  }

  return `${lines.join('\n')}\n`;
}

export async function shareMonthlyReportCsv(
  month: number,
  year: number,
): Promise<void> {
  const summary = await getMonthSummary(month, year);
  const cache = FileSystem.cacheDirectory;
  if (!cache) {
    throw new Error('Cache directory is not available');
  }

  const csv = buildReportCsv(summary);
  const path = `${cache}dental-report-${summary.periodKey}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: `${el.reports.exportCsvTitle} ${summary.periodKey}`,
  });
}
