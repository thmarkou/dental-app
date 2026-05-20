/**
 * Treatment plan PDF export via HTML → expo-print → share sheet.
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
  getTreatmentPlanById,
  type TreatmentPlanAlternativeRow,
  type TreatmentPlanPhaseRow,
  type TreatmentPlanRow,
} from './treatmentPlan.service';
import {
  el,
  phasePriorityLabel,
  planItemStatusLabel,
  treatmentPlanStatusLabel,
  UI_LOCALE,
} from '../../i18n';

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

function phaseStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Αναμονή',
    in_progress: 'Σε εξέλιξη',
    completed: 'Ολοκληρώθηκε',
  };
  return map[status] ?? status;
}

function formatTeeth(teeth: number[]): string {
  return teeth.length > 0 ? teeth.join(', ') : '—';
}

function buildPhaseSectionHtml(phase: TreatmentPlanPhaseRow): string {
  const rows = phase.items
    .map(
      (item, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(item.procedureType)}</td>
        <td class="num">${escapeHtml(formatTeeth(item.toothNumbers))}</td>
        <td>${escapeHtml(item.description?.trim() || '—')}</td>
        <td class="num">${
          item.estimatedCost != null ? formatMoney(item.estimatedCost) : '—'
        }</td>
        <td>${escapeHtml(planItemStatusLabel(item.status))}</td>
      </tr>`,
    )
    .join('');

  const emptyRow =
    phase.items.length === 0
      ? `<tr><td colspan="6" class="muted">${escapeHtml(el.treatmentPlans.noItemsInPhase)}</td></tr>`
      : '';

  return `
    <div class="phase">
      <h3>${escapeHtml(String(phase.phaseNumber))}. ${escapeHtml(phase.name)}</h3>
      <p class="phase-meta">${escapeHtml(el.treatmentPlans.pdfPhasePriority)}: ${escapeHtml(phasePriorityLabel(phase.priority))} · ${escapeHtml(el.treatmentPlans.pdfPhaseStatus)}: ${escapeHtml(phaseStatusLabel(phase.status))}</p>
      <table class="lines">
        <thead>
          <tr>
            <th>#</th>
            <th>${escapeHtml(el.treatmentPlans.procedureType)}</th>
            <th>${escapeHtml(el.treatmentPlans.pdfColTeeth)}</th>
            <th>${escapeHtml(el.treatmentPlans.description)}</th>
            <th>${escapeHtml(el.treatmentPlans.estimatedCost)}</th>
            <th>${escapeHtml(el.treatmentPlans.pdfColStatus)}</th>
          </tr>
        </thead>
        <tbody>${rows}${emptyRow}</tbody>
      </table>
    </div>`;
}

export function buildTreatmentPlanHtml(
  plan: TreatmentPlanRow,
  patient: Patient,
): string {
  const practice = getPracticeSettings();
  const issuerName = getPracticeDisplayName(practice);
  const patientName = `${patient.firstName} ${patient.lastName}`.trim();
  const patientAddress = formatPatientAddress(patient);
  const patientAfm = patient.afm?.trim() ?? '';
  const alternatives: TreatmentPlanAlternativeRow[] =
    plan.alternatives && plan.alternatives.length > 0
      ? plan.alternatives
      : [
          {
            id: plan.selectedAlternativeId ?? 'default',
            planId: plan.id,
            name: el.treatmentPlans.selectedAlternative,
            description: null,
            sortOrder: 0,
            totalEstimatedCost: plan.totalEstimatedCost,
            isSelected: true,
            phases: plan.phases ?? [],
          },
        ];

  const alternativesHtml = alternatives
    .map((alt) => {
      const phasesHtml = alt.phases.map(buildPhaseSectionHtml).join('');
      const noPhasesHtml =
        alt.phases.length === 0
          ? `<p class="muted">${escapeHtml(el.treatmentPlans.addPhaseHint)}</p>`
          : '';
      const selectedBadge = alt.isSelected
        ? `<span class="status-badge" style="margin-left:8px">${escapeHtml(el.treatmentPlans.pdfSelectedAlternative)}</span>`
        : '';
      return `
    <div class="alt-section">
      <h2 class="alt-title">${escapeHtml(el.treatmentPlans.pdfAlternativeSection)}: ${escapeHtml(alt.name)}${selectedBadge}</h2>
      ${
        alt.description?.trim()
          ? `<p class="muted">${escapeHtml(alt.description.trim())}</p>`
          : ''
      }
      <p class="alt-total">${escapeHtml(el.treatmentPlans.pdfAlternativeTotal)}: ${formatMoney(alt.totalEstimatedCost)}</p>
      ${phasesHtml}
      ${noPhasesHtml}
    </div>`;
    })
    .join('');

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
    h1 { font-size: 18pt; margin: 0 0 4px; }
    h3 { font-size: 12pt; margin: 16px 0 6px; color: #1e293b; }
    .muted { color: #64748b; font-size: 9pt; }
    .row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 16px; }
    .block { flex: 1; }
    .block h2 {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 0 0 6px;
    }
    .block p { margin: 0 0 4px; }
    .plan-box {
      margin: 16px 0;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    .plan-title { font-size: 14pt; font-weight: 700; margin: 0 0 6px; }
    .plan-total { font-size: 13pt; font-weight: 700; margin-top: 8px; }
    .alt-section {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 2px solid #e2e8f0;
    }
    .alt-title { font-size: 13pt; margin: 0 0 6px; color: #1e293b; }
    .alt-total { font-size: 11pt; font-weight: 600; margin: 0 0 12px; }
    .status-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #e0e7ff;
      font-size: 9pt;
      font-weight: 600;
      color: #3730a3;
    }
    .phase-meta { font-size: 9pt; color: #64748b; margin: 0 0 8px; }
    table.lines {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    table.lines th,
    table.lines td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 5px;
      text-align: left;
      font-size: 10pt;
    }
    table.lines th {
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748b;
      border-bottom-width: 2px;
    }
    table.lines td.num,
    table.lines th:nth-child(1),
    table.lines th:nth-child(3),
    table.lines th:nth-child(5) {
      text-align: right;
      white-space: nowrap;
    }
    .footer {
      margin-top: 28px;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(el.treatmentPlans.pdfTitle)}</h1>
  <p class="muted">${escapeHtml(el.treatmentPlans.pdfSubtitle)}</p>

  <div class="row">
    <div class="block">
      <h2>${escapeHtml(el.treatmentPlans.pdfClinic)}</h2>
      <p><strong>${escapeHtml(issuerName)}</strong></p>
      ${
        practice.legalName.trim() && practice.legalName.trim() !== issuerName
          ? `<p class="muted">${escapeHtml(practice.legalName.trim())}</p>`
          : ''
      }
      ${practice.afm ? `<p>${escapeHtml(el.patients.afm)}: ${escapeHtml(practice.afm)}</p>` : ''}
      ${formatPracticeAddress(practice) ? `<p>${escapeHtml(formatPracticeAddress(practice))}</p>` : ''}
      ${practice.phone ? `<p>${escapeHtml(el.patients.phone)}: ${escapeHtml(practice.phone)}</p>` : ''}
    </div>
    <div class="block">
      <h2>${escapeHtml(el.treatmentPlans.pdfPatient)}</h2>
      <p><strong>${escapeHtml(patientName)}</strong></p>
      ${patientAfm ? `<p>${escapeHtml(el.patients.afm)}: ${escapeHtml(patientAfm)}</p>` : ''}
      ${patientAddress ? `<p>${escapeHtml(patientAddress)}</p>` : ''}
      ${patient.phone ? `<p>${escapeHtml(el.patients.phone)}: ${escapeHtml(patient.phone)}</p>` : ''}
    </div>
  </div>

  <div class="plan-box">
    <p class="plan-title">${escapeHtml(plan.title)}</p>
    ${
      plan.description?.trim()
        ? `<p>${escapeHtml(plan.description.trim())}</p>`
        : ''
    }
    <span class="status-badge">${escapeHtml(treatmentPlanStatusLabel(plan.status))}</span>
    <p class="muted">${escapeHtml(el.treatmentPlans.pdfCreated)}: ${escapeHtml(formatDate(plan.createdAt))}</p>
    <p class="plan-total">${escapeHtml(el.treatmentPlans.pdfEstimatedTotal)}: ${formatMoney(plan.totalEstimatedCost)}</p>
  </div>

  ${alternativesHtml}

  ${
    practice.invoiceFooter?.trim()
      ? `<p class="muted" style="margin-top:16px">${escapeHtml(practice.invoiceFooter.trim())}</p>`
      : ''
  }

  <p class="footer">${escapeHtml(el.treatmentPlans.pdfFooter)}</p>
</body>
</html>`;
}

/** Generate PDF and open OS share sheet. */
export async function shareTreatmentPlanPdf(planId: string): Promise<void> {
  const plan = getTreatmentPlanById(planId);
  if (!plan) {
    throw new Error('Treatment plan not found');
  }

  const patient = await getPatientById(plan.patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const html = buildTreatmentPlanHtml(plan, patient);
  const {uri} = await Print.printToFileAsync({html});

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  const safeTitle = plan.title.replace(/[^\w\u0370-\u03FF\s-]/g, '').trim() || 'plan';
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${el.treatmentPlans.pdfShareTitle} ${safeTitle}`,
    UTI: 'com.adobe.pdf',
  });
}
