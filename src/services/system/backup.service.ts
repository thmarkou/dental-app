/**
 * Full DB export and accountant-friendly payment CSV via native share sheet.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {getMonthlyPaymentReportRows} from '../financial/payment.service';
import type {MonthlyPaymentReportRow} from '../financial/payment.service';

const DB_FILE_NAME = 'dentalapp';

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(row: MonthlyPaymentReportRow): string {
  const patient = `${row.firstName} ${row.lastName}`.trim();
  const cells = [
    patient,
    row.amount.toFixed(2),
    row.paymentMethod,
    row.transactionDate,
    row.receiptIssued ? 'yes' : 'no',
    row.mydataMark ?? '',
    row.notes ?? '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

function buildMonthlyCsv(yearMonth: string): string {
  const rows = getMonthlyPaymentReportRows(yearMonth);
  const header =
    'Patient,Amount EUR,Payment method,Transaction date,Receipt issued,myDATA mark,Notes';
  if (rows.length === 0) {
    return `${header}\n`;
  }
  return `${header}\n${rows.map(rowToCsvLine).join('\n')}\n`;
}

/**
 * Copies `dentalapp` SQLite file to cache and opens the OS share sheet.
 */
export async function exportDatabase(): Promise<void> {
  const doc = FileSystem.documentDirectory;
  const cache = FileSystem.cacheDirectory;
  if (!doc || !cache) {
    throw new Error('File system locations are not available');
  }

  const src = `${doc}${DB_FILE_NAME}`;
  const info = await FileSystem.getInfoAsync(src);
  if (!info.exists) {
    throw new Error('Database file not found');
  }

  const dest = `${cache}dentalapp-export-${Date.now()}.db`;
  await FileSystem.copyAsync({from: src, to: dest});

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(dest, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Backup database',
  });
}

/**
 * CSV of this calendar month's payments (device local month), then share.
 */
export async function generateExcelReport(): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) {
    throw new Error('Cache directory is not available');
  }

  const ym = currentYearMonth();
  const csv = buildMonthlyCsv(ym);
  const path = `${cache}dental-payments-${ym}.csv`;

  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: 'Monthly payments (CSV)',
  });
}
