jest.mock('../services/database/database.service', () => ({
  query: jest.fn(),
}));

import {query} from '../services/database';
import {
  getMonthSummary,
  getMonthlyFinancialSummary,
  percentChange,
  previousCalendarMonth,
} from '../services/admin/report.service';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('report.service', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('aggregates monthly revenue, charges, and new patients', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM payments')) {
        return [{total: 526.4}];
      }
      if (sql.includes('SUM(cost)') && sql.includes('treatments')) {
        return [{total: 300}];
      }
      if (sql.includes('FROM patients')) {
        return [{cnt: 3}];
      }
      if (sql.includes('procedure_type')) {
        return [{procedure_type: 'Crown', cnt: 1}];
      }
      return [];
    });

    const summary = await getMonthSummary(5, 2026);
    expect(summary.periodKey).toBe('2026-05');
    expect(summary.revenue).toBe(526.4);
    expect(summary.charges).toBe(300);
    expect(summary.newPatients).toBe(3);
    expect(summary.procedures).toHaveLength(1);
  });

  it('rejects invalid month', async () => {
    await expect(getMonthSummary(13, 2026)).rejects.toThrow(
      'Month must be between 1 and 12',
    );
  });
});

describe('report.service getMonthlyFinancialSummary', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('aggregates invoices, receipts, and payments for the month', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("status IN ('issued', 'paid')")) {
        return [{cnt: 2, total: 400}];
      }
      if (sql.includes("status = 'paid'")) {
        return [{cnt: 1, total: 200}];
      }
      if (sql.includes('FROM receipts')) {
        return [{cnt: 1, net: 80, vat: 19.2, gross: 99.2}];
      }
      if (sql.includes('FROM payments')) {
        return [{total: 150}];
      }
      return [];
    });

    const fin = await getMonthlyFinancialSummary(5, 2026);
    expect(fin.periodKey).toBe('2026-05');
    expect(fin.invoicesIssuedCount).toBe(2);
    expect(fin.invoicesPaidCount).toBe(1);
    expect(fin.receiptsVat).toBe(19.2);
    expect(fin.paymentsTotal).toBe(150);
  });
});

describe('report.service month helpers', () => {
  it('previousCalendarMonth rolls year boundary', () => {
    expect(previousCalendarMonth(1, 2026)).toEqual({month: 12, year: 2025});
    expect(previousCalendarMonth(5, 2026)).toEqual({month: 4, year: 2026});
  });

  it('percentChange handles zero previous', () => {
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
  });
});
