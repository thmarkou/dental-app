jest.mock('../services/database/database.service', () => ({
  getDatabase: jest.fn(),
}));

import {
  EXPIRING_SOON_DAYS,
  isExpired,
  isExpiringSoon,
  normalizeExpiryDateInput,
} from '../services/inventory/inventory.service';
import type {InventoryItem} from '../types/inventory';

const baseItem = (expiryDate: string | null): InventoryItem => ({
  id: '1',
  sku: null,
  name: 'Test',
  category: 'other',
  unit: 'τεμ',
  quantity: 10,
  minQuantity: 0,
  unitCost: null,
  supplier: null,
  location: null,
  notes: null,
  expiryDate,
  isActive: true,
  createdAt: '',
  updatedAt: '',
});

describe('inventory expiry helpers', () => {
  it('normalizeExpiryDateInput accepts YYYY-MM-DD or empty', () => {
    expect(normalizeExpiryDateInput('')).toBeNull();
    expect(normalizeExpiryDateInput('2026-06-15')).toBe('2026-06-15');
    expect(() => normalizeExpiryDateInput('15-06-2026')).toThrow('INVALID_EXPIRY_DATE');
  });

  it('isExpired and isExpiringSoon use reference date', () => {
    const ref = '2026-06-15';
    expect(isExpired(baseItem('2026-06-14'), ref)).toBe(true);
    expect(isExpired(baseItem('2026-06-15'), ref)).toBe(false);
    expect(isExpired(baseItem('2026-06-20'), ref)).toBe(false);

    const limit = '2026-07-15';
    const soon = baseItem(limit);
    expect(isExpiringSoon(soon, ref)).toBe(true);
    expect(EXPIRING_SOON_DAYS).toBe(30);
    expect(isExpiringSoon(baseItem('2026-08-01'), ref)).toBe(false);
  });
});
