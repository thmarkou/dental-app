/**
 * Inventory items and stock movements (αποθήκη).
 */

import {getDatabase, transaction} from '../database';
import {uuidv4} from '../../utils/uuid';
import type {
  CreateInventoryItemInput,
  InventoryCategory,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  RecordStockMovementInput,
  UpdateInventoryItemInput,
} from '../../types/inventory';
import {INVENTORY_CATEGORIES} from '../../types/inventory';

export {INVENTORY_CATEGORIES};
export type {
  InventoryCategory,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
};

/** react-native-quick-sqlite exposes row arrays on `rows._array`. */
function queryRows(result: {rows?: {_array?: unknown[]}}): Record<string, unknown>[] {
  return (result.rows?._array ?? []) as Record<string, unknown>[];
}

function mapItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    sku:
      row.sku != null && String(row.sku).trim() !== '' ? String(row.sku) : null,
    name: String(row.name),
    category: String(row.category) as InventoryCategory,
    unit: String(row.unit ?? 'τεμ'),
    quantity: Number(row.quantity ?? 0),
    minQuantity: Number(row.min_quantity ?? 0),
    unitCost:
      row.unit_cost != null && row.unit_cost !== ''
        ? Number(row.unit_cost)
        : null,
    supplier:
      row.supplier != null && String(row.supplier).trim() !== ''
        ? String(row.supplier)
        : null,
    location:
      row.location != null && String(row.location).trim() !== ''
        ? String(row.location)
        : null,
    notes:
      row.notes != null && String(row.notes).trim() !== ''
        ? String(row.notes)
        : null,
    isActive: Number(row.is_active ?? 1) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMovement(row: Record<string, unknown>): InventoryMovement {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    movementType: String(row.movement_type) as InventoryMovementType,
    quantityDelta: Number(row.quantity_delta),
    quantityAfter: Number(row.quantity_after),
    notes:
      row.notes != null && String(row.notes).trim() !== ''
        ? String(row.notes)
        : null,
    performedBy:
      row.performed_by != null && String(row.performed_by).trim() !== ''
        ? String(row.performed_by)
        : null,
    treatmentId:
      row.treatment_id != null && String(row.treatment_id).trim() !== ''
        ? String(row.treatment_id)
        : null,
    createdAt: String(row.created_at),
  };
}

export function isLowStock(item: InventoryItem): boolean {
  return item.isActive && item.quantity <= item.minQuantity;
}

export async function getInventoryItems(options?: {
  activeOnly?: boolean;
  lowStockOnly?: boolean;
}): Promise<InventoryItem[]> {
  const activeOnly = options?.activeOnly !== false;
  const db = getDatabase();
  let sql = 'SELECT * FROM inventory_items WHERE 1=1';
  if (activeOnly) {
    sql += ' AND is_active = 1';
  }
  sql += ' ORDER BY name COLLATE NOCASE ASC';
  const result = db.execute(sql);
  let items = queryRows(result).map(mapItem);
  if (options?.lowStockOnly) {
    items = items.filter(isLowStock);
  }
  return items;
}

export async function getInventorySummary(): Promise<{
  totalItems: number;
  lowStockCount: number;
}> {
  const items = await getInventoryItems({activeOnly: true});
  return {
    totalItems: items.length,
    lowStockCount: items.filter(isLowStock).length,
  };
}

export async function getInventoryItemById(
  id: string,
): Promise<InventoryItem | null> {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM inventory_items WHERE id = ?', [
    id,
  ]);
  const rows = queryRows(result);
  if (rows.length === 0) {
    return null;
  }
  return mapItem(rows[0]);
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('NAME_REQUIRED');
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  const quantity = Math.max(0, input.quantity ?? 0);
  const minQuantity = Math.max(0, input.minQuantity ?? 0);

  await transaction(async () => {
    const db = getDatabase();
    db.execute(
      `INSERT INTO inventory_items (
        id, sku, name, category, unit, quantity, min_quantity, unit_cost,
        supplier, location, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.sku?.trim() || null,
        name,
        input.category,
        (input.unit?.trim() || 'τεμ').slice(0, 32),
        quantity,
        minQuantity,
        input.unitCost ?? null,
        input.supplier?.trim() || null,
        input.location?.trim() || null,
        input.notes?.trim() || null,
        now,
        now,
      ],
    );
    if (quantity > 0) {
      db.execute(
        `INSERT INTO inventory_movements (
          id, item_id, movement_type, quantity_delta, quantity_after,
          notes, performed_by, created_at
        ) VALUES (?, ?, 'purchase', ?, ?, ?, NULL, ?)`,
        [
          uuidv4(),
          id,
          quantity,
          quantity,
          input.initialStockNote?.trim() || 'Initial stock',
          now,
        ],
      );
    }
  });

  const item = await getInventoryItemById(id);
  if (!item) {
    throw new Error('CREATE_FAILED');
  }
  return item;
}

export async function updateInventoryItem(
  id: string,
  input: UpdateInventoryItemInput,
): Promise<InventoryItem> {
  const existing = await getInventoryItemById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }
  const now = new Date().toISOString();
  const db = getDatabase();
  db.execute(
    `UPDATE inventory_items SET
      sku = ?,
      name = ?,
      category = ?,
      unit = ?,
      min_quantity = ?,
      unit_cost = ?,
      supplier = ?,
      location = ?,
      notes = ?,
      is_active = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      input.sku !== undefined
        ? input.sku?.trim() || null
        : existing.sku,
      input.name !== undefined ? input.name.trim() : existing.name,
      input.category ?? existing.category,
      input.unit !== undefined
        ? (input.unit.trim() || 'τεμ').slice(0, 32)
        : existing.unit,
      input.minQuantity !== undefined
        ? Math.max(0, input.minQuantity)
        : existing.minQuantity,
      input.unitCost !== undefined ? input.unitCost : existing.unitCost,
      input.supplier !== undefined
        ? input.supplier?.trim() || null
        : existing.supplier,
      input.location !== undefined
        ? input.location?.trim() || null
        : existing.location,
      input.notes !== undefined
        ? input.notes?.trim() || null
        : existing.notes,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive
        ? 1
        : 0,
      now,
      id,
    ],
  );
  const updated = await getInventoryItemById(id);
  if (!updated) {
    throw new Error('UPDATE_FAILED');
  }
  return updated;
}

function movementDelta(
  movementType: InventoryMovementType,
  amount: number,
): number {
  const n = Math.abs(amount);
  if (movementType === 'purchase') {
    return n;
  }
  if (movementType === 'usage') {
    return -n;
  }
  return amount;
}

export async function recordStockMovement(
  input: RecordStockMovementInput,
): Promise<InventoryItem> {
  const amount = input.amount;
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('INVALID_AMOUNT');
  }
  const delta = movementDelta(input.movementType, amount);
  const movementId = uuidv4();
  const now = new Date().toISOString();

  await transaction(async () => {
    const db = getDatabase();
    const itemResult = db.execute(
      'SELECT * FROM inventory_items WHERE id = ?',
      [input.itemId],
    );
    const rows = queryRows(itemResult);
    if (rows.length === 0) {
      throw new Error('NOT_FOUND');
    }
    const item = mapItem(rows[0]);
    const quantityAfter = item.quantity + delta;
    if (quantityAfter < 0) {
      throw new Error('INSUFFICIENT_STOCK');
    }
    db.execute(
      `INSERT INTO inventory_movements (
        id, item_id, movement_type, quantity_delta, quantity_after,
        notes, performed_by, treatment_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        input.itemId,
        input.movementType,
        delta,
        quantityAfter,
        input.notes?.trim() || null,
        input.performedBy?.trim() || null,
        input.treatmentId?.trim() || null,
        now,
      ],
    );
    db.execute(
      `UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE id = ?`,
      [quantityAfter, now, input.itemId],
    );
  });

  const updated = await getInventoryItemById(input.itemId);
  if (!updated) {
    throw new Error('UPDATE_FAILED');
  }
  return updated;
}

export async function getRecentMovements(
  itemId: string,
  limit = 10,
): Promise<InventoryMovement[]> {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM inventory_movements
     WHERE item_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [itemId, limit],
  );
  return queryRows(result).map(mapMovement);
}
