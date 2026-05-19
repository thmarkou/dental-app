/**
 * Practice / clinic profile (issuer details for invoices, PDF, myDATA).
 * Single row in SQLite (id = default).
 */

import {getDatabase} from '../database';

export const PRACTICE_SETTINGS_ID = 'default';

export interface PracticeSettings {
  id: string;
  legalName: string;
  tradeName: string | null;
  afm: string | null;
  doy: string | null;
  activityCode: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  defaultVatRate: number;
  invoiceFooter: string | null;
  updatedAt: string;
}

export type SavePracticeSettingsInput = Omit<
  PracticeSettings,
  'id' | 'updatedAt'
>;

const EMPTY_ROW: PracticeSettings = {
  id: PRACTICE_SETTINGS_ID,
  legalName: '',
  tradeName: null,
  afm: null,
  doy: null,
  activityCode: null,
  addressStreet: null,
  addressCity: null,
  addressPostalCode: null,
  addressCountry: 'Ελλάδα',
  phone: null,
  email: null,
  website: null,
  defaultVatRate: 24,
  invoiceFooter: null,
  updatedAt: new Date(0).toISOString(),
};

function mapRow(row: Record<string, unknown>): PracticeSettings {
  return {
    id: String(row.id),
    legalName: String(row.legal_name ?? ''),
    tradeName:
      row.trade_name != null && String(row.trade_name).trim() !== ''
        ? String(row.trade_name)
        : null,
    afm:
      row.afm != null && String(row.afm).trim() !== '' ? String(row.afm) : null,
    doy:
      row.doy != null && String(row.doy).trim() !== '' ? String(row.doy) : null,
    activityCode:
      row.activity_code != null && String(row.activity_code).trim() !== ''
        ? String(row.activity_code)
        : null,
    addressStreet:
      row.address_street != null && String(row.address_street).trim() !== ''
        ? String(row.address_street)
        : null,
    addressCity:
      row.address_city != null && String(row.address_city).trim() !== ''
        ? String(row.address_city)
        : null,
    addressPostalCode:
      row.address_postal_code != null &&
      String(row.address_postal_code).trim() !== ''
        ? String(row.address_postal_code)
        : null,
    addressCountry:
      row.address_country != null && String(row.address_country).trim() !== ''
        ? String(row.address_country)
        : 'Ελλάδα',
    phone:
      row.phone != null && String(row.phone).trim() !== ''
        ? String(row.phone)
        : null,
    email:
      row.email != null && String(row.email).trim() !== ''
        ? String(row.email)
        : null,
    website:
      row.website != null && String(row.website).trim() !== ''
        ? String(row.website)
        : null,
    defaultVatRate:
      row.default_vat_rate != null ? Number(row.default_vat_rate) : 24,
    invoiceFooter:
      row.invoice_footer != null && String(row.invoice_footer).trim() !== ''
        ? String(row.invoice_footer)
        : null,
    updatedAt: String(row.updated_at),
  };
}

export function getPracticeSettings(): PracticeSettings {
  const db = getDatabase();
  const row = db.execute('SELECT * FROM practice_settings WHERE id = ?', [
    PRACTICE_SETTINGS_ID,
  ]).rows?._array?.[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : {...EMPTY_ROW};
}

export function formatPracticeAddress(settings: PracticeSettings): string {
  if (!settings.addressStreet?.trim()) {
    return '';
  }
  const parts = [
    settings.addressStreet.trim(),
    [settings.addressPostalCode, settings.addressCity]
      .filter((p) => p != null && String(p).trim() !== '')
      .join(' '),
    settings.addressCountry,
  ].filter((p) => p && String(p).trim() !== '');
  return parts.join(', ');
}

/** Display name for invoices / PDF (trade name preferred). */
export function getPracticeDisplayName(settings: PracticeSettings): string {
  return (
    settings.tradeName?.trim() ||
    settings.legalName.trim() ||
    'Οδοντιατρείο'
  );
}

export function isValidGreekAfm(value: string | null | undefined): boolean {
  return /^\d{9}$/.test((value ?? '').trim());
}

export function savePracticeSettings(input: SavePracticeSettingsInput): PracticeSettings {
  const afm = input.afm?.trim() || null;
  if (afm != null && !isValidGreekAfm(afm)) {
    throw new Error('INVALID_AFM');
  }

  const vat = Number(input.defaultVatRate);
  if (!Number.isFinite(vat) || vat < 0 || vat > 100) {
    throw new Error('INVALID_VAT');
  }

  const now = new Date().toISOString();
  const db = getDatabase();

  db.execute(
    `INSERT INTO practice_settings (
      id, legal_name, trade_name, afm, doy, activity_code,
      address_street, address_city, address_postal_code, address_country,
      phone, email, website, default_vat_rate, invoice_footer, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      legal_name = excluded.legal_name,
      trade_name = excluded.trade_name,
      afm = excluded.afm,
      doy = excluded.doy,
      activity_code = excluded.activity_code,
      address_street = excluded.address_street,
      address_city = excluded.address_city,
      address_postal_code = excluded.address_postal_code,
      address_country = excluded.address_country,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      default_vat_rate = excluded.default_vat_rate,
      invoice_footer = excluded.invoice_footer,
      updated_at = excluded.updated_at`,
    [
      PRACTICE_SETTINGS_ID,
      input.legalName.trim(),
      input.tradeName?.trim() || null,
      afm,
      input.doy?.trim() || null,
      input.activityCode?.trim() || null,
      input.addressStreet?.trim() || null,
      input.addressCity?.trim() || null,
      input.addressPostalCode?.trim() || null,
      input.addressCountry?.trim() || 'Ελλάδα',
      input.phone?.trim() || null,
      input.email?.trim() || null,
      input.website?.trim() || null,
      vat,
      input.invoiceFooter?.trim() || null,
      now,
    ],
  );

  return getPracticeSettings();
}
