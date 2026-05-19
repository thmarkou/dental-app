/**
 * Inventory (αποθήκη) types.
 */

export const INVENTORY_CATEGORIES = [
  'anesthetic',
  'filling_materials',
  'crowns',
  'implants',
  'orthodontic',
  'periodontal',
  'cleaning_supplies',
  'disposables',
  'equipment',
  'other',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export type InventoryMovementType = 'purchase' | 'usage' | 'adjustment';

export interface InventoryItem {
  id: string;
  sku: string | null;
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCost: number | null;
  supplier: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  quantityAfter: number;
  notes: string | null;
  performedBy: string | null;
  createdAt: string;
}

export interface CreateInventoryItemInput {
  sku?: string | null;
  name: string;
  category: InventoryCategory;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  unitCost?: number | null;
  supplier?: string | null;
  location?: string | null;
  notes?: string | null;
  /** Recorded on first stock movement when quantity > 0 on create. */
  initialStockNote?: string | null;
}

export interface UpdateInventoryItemInput {
  sku?: string | null;
  name?: string;
  category?: InventoryCategory;
  unit?: string;
  minQuantity?: number;
  unitCost?: number | null;
  supplier?: string | null;
  location?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface RecordStockMovementInput {
  itemId: string;
  movementType: InventoryMovementType;
  /** Positive number; sign applied by movement type. */
  amount: number;
  notes?: string | null;
  performedBy?: string | null;
}
