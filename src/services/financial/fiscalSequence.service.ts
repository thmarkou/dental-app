/**
 * Sequential fiscal document numbers (invoices, receipts) per calendar year.
 */

import {getDatabase} from '../database';

export type FiscalDocumentKind = 'invoice' | 'receipt';

const PREFIX: Record<FiscalDocumentKind, string> = {
  invoice: 'TIM',
  receipt: 'APY',
};

export const allocateFiscalNumber = (kind: FiscalDocumentKind): string => {
  const year = new Date().getFullYear();
  const key = `${kind}_${year}`;
  const db = getDatabase();

  const existing = db.execute(
    'SELECT last_value FROM fiscal_sequences WHERE key = ?',
    [key],
  ).rows?._array?.[0] as {last_value?: number} | undefined;

  let seq: number;
  if (existing == null) {
    db.execute(
      'INSERT INTO fiscal_sequences (key, last_value) VALUES (?, ?)',
      [key, 1],
    );
    seq = 1;
  } else {
    seq = Number(existing.last_value) + 1;
    db.execute('UPDATE fiscal_sequences SET last_value = ? WHERE key = ?', [
      seq,
      key,
    ]);
  }

  const prefix = PREFIX[kind];
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`;
};
