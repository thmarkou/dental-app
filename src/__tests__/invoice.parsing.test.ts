jest.mock('../services/database/database.service', () => ({
  getDatabase: jest.fn(),
}));

import {
  parseInvoiceLineDrafts,
  previewInvoiceTotals,
} from '../services/financial/invoice.service';

describe('invoice.service parsing', () => {
  it('parses valid line drafts', () => {
    const lines = parseInvoiceLineDrafts([
      {description: '  Cleaning  ', quantity: '2', unitPrice: '50'},
      {description: 'X-Ray', quantity: '1', unitPrice: '30,5'},
    ]);
    expect(lines).toEqual([
      {description: 'Cleaning', quantity: 2, unitPrice: 50},
      {description: 'X-Ray', quantity: 1, unitPrice: 30.5},
    ]);
  });

  it('rejects invalid line drafts', () => {
    expect(parseInvoiceLineDrafts([{description: '', quantity: '1', unitPrice: '10'}])).toBeNull();
    expect(parseInvoiceLineDrafts([{description: 'A', quantity: '0', unitPrice: '10'}])).toBeNull();
  });

  it('computes invoice totals with VAT', () => {
    const totals = previewInvoiceTotals(
      [{description: 'Service', quantity: 1, unitPrice: 100}],
      24,
    );
    expect(totals.subtotal).toBe(100);
    expect(totals.vatAmount).toBe(24);
    expect(totals.totalAmount).toBe(124);
  });
});
