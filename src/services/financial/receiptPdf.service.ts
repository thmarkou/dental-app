/**
 * Receipt PDF export via HTML → expo-print → share sheet.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {getPatientById} from '../patient';
import {
  formatPracticeAddress,
  getPracticeDisplayName,
  getPracticeSettings,
} from '../settings/practiceSettings.service';
import type {Patient} from '../../types/patient';
import {
  getReceiptById,
  type ReceiptLineRow,
  type ReceiptRow,
} from './receipt.service';
import {el, paymentMethodLabel, UI_LOCALE} from '../../i18n';

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

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(UI_LOCALE, {dateStyle: 'medium'}).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatPatientAddress(patient: Patient): string {
  if (!patient.address?.street) {
    return '';
  }
  const parts = [
    patient.address.street,
    [patient.address.postalCode, patient.address.city].filter(Boolean).join(' '),
    patient.address.country,
  ].filter((p) => p && String(p).trim() !== '');
  return parts.join(', ');
}

function issuerBlock(): {
  name: string;
  legalName: string;
  afm: string;
  doy: string;
  address: string;
  phone: string;
  email: string;
} {
  const practice = getPracticeSettings();
  return {
    name: getPracticeDisplayName(practice),
    legalName: practice.legalName.trim(),
    afm: practice.afm?.trim() ?? '',
    doy: practice.doy?.trim() ?? '',
    address: formatPracticeAddress(practice),
    phone: practice.phone?.trim() ?? '',
    email: practice.email?.trim() ?? '',
  };
}

function buildLinesTableHtml(lines: ReceiptLineRow[]): string {
  const rows = lines
    .map(
      (line, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatMoney(line.unitPrice)}</td>
        <td class="num">${line.vatRate}%</td>
        <td class="num">${formatMoney(line.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  return `
    <table class="lines">
      <thead>
        <tr>
          <th>#</th>
          <th>${escapeHtml(el.receipts.pdfColDescription)}</th>
          <th>${escapeHtml(el.receipts.pdfColQty)}</th>
          <th>${escapeHtml(el.receipts.pdfColUnit)}</th>
          <th>${escapeHtml(el.receipts.pdfColVat)}</th>
          <th>${escapeHtml(el.receipts.pdfColTotal)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function buildReceiptHtml(
  receipt: ReceiptRow,
  patient: Patient,
  lines: ReceiptLineRow[],
): string {
  const issuer = issuerBlock();
  const practice = getPracticeSettings();
  const patientName = `${patient.firstName} ${patient.lastName}`.trim();
  const patientAddress = formatPatientAddress(patient);
  const patientAfm = patient.afm?.trim() ?? '';
  const payLabel = paymentMethodLabel(receipt.paymentMethod);

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #0f172a;
      margin: 24px;
      line-height: 1.45;
    }
    h1 {
      font-size: 18pt;
      margin: 0 0 4px;
      letter-spacing: 0.02em;
    }
    .muted { color: #64748b; font-size: 9pt; }
    .row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
    .block { flex: 1; }
    .block h2 {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 0 0 6px;
    }
    .block p { margin: 0 0 4px; }
    .meta {
      text-align: right;
      min-width: 200px;
    }
    .meta .number {
      font-family: ui-monospace, monospace;
      font-size: 12pt;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #047857;
      font-size: 9pt;
      font-weight: 600;
    }
    table.lines {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    table.lines th,
    table.lines td {
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 6px;
      text-align: left;
    }
    table.lines th {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom-width: 2px;
    }
    table.lines td.num,
    table.lines th:nth-child(n+3) {
      text-align: right;
      white-space: nowrap;
    }
    .totals {
      margin-left: auto;
      width: 260px;
      margin-top: 8px;
    }
    .totals tr td {
      padding: 4px 0;
    }
    .totals tr td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .totals .grand td {
      font-size: 13pt;
      font-weight: 700;
      padding-top: 8px;
      border-top: 2px solid #0f172a;
    }
    .notes {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #475569;
    }
    .footer {
      margin-top: 32px;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(el.receipts.pdfTitle)}</h1>
  <p class="muted">${escapeHtml(el.receipts.pdfSubtitle)}</p>

  <div class="row">
    <div class="block">
      <h2>${escapeHtml(el.receipts.pdfIssuer)}</h2>
      <p><strong>${escapeHtml(issuer.name)}</strong></p>
      ${
        issuer.legalName && issuer.legalName !== issuer.name
          ? `<p class="muted">${escapeHtml(issuer.legalName)}</p>`
          : ''
      }
      ${issuer.afm ? `<p>${escapeHtml(el.patients.afm)}: ${escapeHtml(issuer.afm)}</p>` : ''}
      ${issuer.doy ? `<p>${escapeHtml(el.patients.taxOffice)}: ${escapeHtml(issuer.doy)}</p>` : ''}
      ${issuer.address ? `<p>${escapeHtml(issuer.address)}</p>` : ''}
      ${issuer.phone ? `<p>${escapeHtml(el.patients.phone)}: ${escapeHtml(issuer.phone)}</p>` : ''}
      ${issuer.email ? `<p>${escapeHtml(el.patients.email)}: ${escapeHtml(issuer.email)}</p>` : ''}
    </div>
    <div class="block meta">
      <p class="number">${escapeHtml(receipt.receiptNumber)}</p>
      <p>${escapeHtml(el.receipts.pdfIssueDate)}: ${escapeHtml(formatDate(receipt.issueDate))}</p>
      <span class="badge">${escapeHtml(el.receipts.pdfPayment)}: ${escapeHtml(payLabel)}</span>
    </div>
  </div>

  <div class="row">
    <div class="block">
      <h2>${escapeHtml(el.receipts.pdfCustomer)}</h2>
      <p><strong>${escapeHtml(patientName)}</strong></p>
      ${patientAfm ? `<p>${escapeHtml(el.patients.afm)}: ${escapeHtml(patientAfm)}</p>` : ''}
      ${patientAddress ? `<p>${escapeHtml(patientAddress)}</p>` : ''}
    </div>
  </div>

  ${buildLinesTableHtml(lines)}

  <table class="totals">
    <tr>
      <td>${escapeHtml(el.receipts.netLabel)}</td>
      <td>${formatMoney(receipt.subtotal)}</td>
    </tr>
    <tr>
      <td>${escapeHtml(el.receipts.vatLabel)}</td>
      <td>${formatMoney(receipt.vatAmount)}</td>
    </tr>
    <tr class="grand">
      <td>${escapeHtml(el.receipts.pdfTotal)}</td>
      <td>${formatMoney(receipt.totalAmount)}</td>
    </tr>
  </table>

  ${
    receipt.mydataMark
      ? `<div class="notes"><strong>myDATA:</strong> ${escapeHtml(receipt.mydataMark)}</div>`
      : ''
  }
  ${
    receipt.notes?.trim()
      ? `<div class="notes"><strong>${escapeHtml(el.common.notes)}:</strong> ${escapeHtml(receipt.notes.trim())}</div>`
      : ''
  }
  ${
    practice.invoiceFooter?.trim()
      ? `<div class="notes">${escapeHtml(practice.invoiceFooter.trim())}</div>`
      : ''
  }

  <p class="footer">${escapeHtml(el.receipts.pdfFooter)}</p>
</body>
</html>`;
}

/** Generate PDF file and open OS share sheet. */
export async function shareReceiptPdf(receiptId: string): Promise<void> {
  const receipt = getReceiptById(receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  const lines = receipt.lines ?? [];
  if (lines.length === 0) {
    throw new Error('Receipt has no line items');
  }

  const patient = await getPatientById(receipt.patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const html = buildReceiptHtml(receipt, patient, lines);
  const {uri} = await Print.printToFileAsync({html});

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${el.receipts.pdfShareTitle} ${receipt.receiptNumber}`,
    UTI: 'com.adobe.pdf',
  });
}
