/**
 * Links treatment procedure catalog entries to inventory BOM lines.
 */

import {Alert} from 'react-native';
import {getDatabase, transaction} from '../database';
import {
  GENERAL_PROCEDURE_VALUES,
  TOOTH_SITE_PROCEDURE_VALUES,
  procedureDisplayBase,
} from '../clinical/treatment.service';
import {recordStockMovement} from './inventory.service';
import {uuidv4} from '../../utils/uuid';
import {el} from '../../i18n';
import type {
  InventoryDeductionPreview,
  ProcedureBomInputLine,
  ProcedureBomLine,
} from '../../types/procedureInventory';

export {getAllCatalogProcedureTypes} from '../clinical/treatment.service';

function queryRows(result: {rows?: {_array?: unknown[]}}): Record<string, unknown>[] {
  return (result.rows?._array ?? []) as Record<string, unknown>[];
}

export function getCatalogProcedureGroups(): {
  tooth: string[];
  general: string[];
} {
  return {
    tooth: [...TOOTH_SITE_PROCEDURE_VALUES],
    general: [...GENERAL_PROCEDURE_VALUES],
  };
}

export function procedureShortLabel(procedureType: string): string {
  return procedureDisplayBase(procedureType);
}

export async function getBomForProcedure(
  procedureType: string,
): Promise<ProcedureBomLine[]> {
  const db = getDatabase();
  const result = db.execute(
    `SELECT b.id, b.procedure_type, b.inventory_item_id, b.quantity,
            i.name AS item_name, i.unit, i.quantity AS available_quantity
     FROM procedure_inventory_bom b
     INNER JOIN inventory_items i ON i.id = b.inventory_item_id
     WHERE b.procedure_type = ? AND i.is_active = 1
     ORDER BY i.name COLLATE NOCASE ASC`,
    [procedureType],
  );
  return queryRows(result).map((row) => ({
    id: String(row.id),
    procedureType: String(row.procedure_type),
    inventoryItemId: String(row.inventory_item_id),
    itemName: String(row.item_name),
    unit: String(row.unit ?? 'τεμ'),
    quantity: Number(row.quantity),
    availableQuantity: Number(row.available_quantity ?? 0),
  }));
}

export async function countBomLinesByProcedure(): Promise<
  Record<string, number>
> {
  const db = getDatabase();
  const result = db.execute(
    `SELECT procedure_type, COUNT(*) AS cnt
     FROM procedure_inventory_bom
     GROUP BY procedure_type`,
  );
  const map: Record<string, number> = {};
  for (const row of queryRows(result)) {
    map[String(row.procedure_type)] = Number(row.cnt);
  }
  return map;
}

export async function saveBomForProcedure(
  procedureType: string,
  lines: ProcedureBomInputLine[],
): Promise<void> {
  const normalized = lines
    .filter((l) => l.quantity > 0)
    .map((l) => ({
      inventoryItemId: l.inventoryItemId,
      quantity: l.quantity,
    }));

  const seen = new Set<string>();
  for (const line of normalized) {
    if (seen.has(line.inventoryItemId)) {
      throw new Error('DUPLICATE_ITEM');
    }
    seen.add(line.inventoryItemId);
  }

  const now = new Date().toISOString();
  await transaction(async () => {
    const db = getDatabase();
    db.execute('DELETE FROM procedure_inventory_bom WHERE procedure_type = ?', [
      procedureType,
    ]);
    for (const line of normalized) {
      db.execute(
        `INSERT INTO procedure_inventory_bom (
          id, procedure_type, inventory_item_id, quantity, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), procedureType, line.inventoryItemId, line.quantity, now],
      );
    }
  });
}

export async function getDeductionPreview(
  procedureType: string,
  multiplier = 1,
): Promise<InventoryDeductionPreview> {
  const bom = await getBomForProcedure(procedureType);
  const mult = Math.max(1, Math.floor(multiplier));
  const lines = bom.map((b) => ({
    inventoryItemId: b.inventoryItemId,
    itemName: b.itemName,
    unit: b.unit,
    quantityPerTreatment: b.quantity,
    totalQuantity: b.quantity * mult,
    availableQuantity: b.availableQuantity,
  }));
  const canFulfill = lines.every((l) => l.availableQuantity >= l.totalQuantity);
  return {procedureType, lines, canFulfill};
}

export async function deductMaterialsForTreatment(params: {
  procedureType: string;
  treatmentId: string;
  multiplier?: number;
  performedBy?: string | null;
  patientLabel?: string;
}): Promise<void> {
  const preview = await getDeductionPreview(
    params.procedureType,
    params.multiplier ?? 1,
  );
  if (preview.lines.length === 0) {
    return;
  }
  if (!preview.canFulfill) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  const procLabel = procedureShortLabel(params.procedureType);
  const patientPart = params.patientLabel?.trim()
    ? ` · ${params.patientLabel.trim()}`
    : '';

  for (const line of preview.lines) {
    await recordStockMovement({
      itemId: line.inventoryItemId,
      movementType: 'usage',
      amount: line.totalQuantity,
      treatmentId: params.treatmentId,
      performedBy: params.performedBy ?? null,
      notes: `${el.procedureInventory.usageNotePrefix} ${procLabel}${patientPart}`,
    });
  }
}

function formatDeductionMessage(preview: InventoryDeductionPreview): string {
  const lines = preview.lines
    .map((l) =>
      el.procedureInventory.deductLine
        .replace('{name}', l.itemName)
        .replace('{qty}', String(l.totalQuantity))
        .replace('{unit}', l.unit),
    )
    .join('\n');
  return `${el.procedureInventory.deductBody}\n\n${lines}`;
}

/**
 * After a new treatment is recorded, offer to deduct linked inventory (if BOM exists).
 */
export function offerInventoryDeductionForTreatment(params: {
  procedureType: string;
  treatmentId: string;
  multiplier?: number;
  performedBy?: string | null;
  patientLabel?: string;
}): void {
  void (async () => {
    try {
      const preview = await getDeductionPreview(
        params.procedureType,
        params.multiplier ?? 1,
      );
      if (preview.lines.length === 0) {
        return;
      }

      if (!preview.canFulfill) {
        Alert.alert(
          el.procedureInventory.deductTitle,
          el.procedureInventory.insufficientStock,
        );
        return;
      }

      Alert.alert(
        el.procedureInventory.deductTitle,
        formatDeductionMessage(preview),
        [
          {text: el.procedureInventory.deductSkip, style: 'cancel'},
          {
            text: el.procedureInventory.deductConfirm,
            onPress: () => {
              void (async () => {
                try {
                  await deductMaterialsForTreatment(params);
                  Alert.alert(
                    el.common.success,
                    el.procedureInventory.deductSuccess,
                  );
                } catch (e) {
                  Alert.alert(
                    el.common.error,
                    e instanceof Error &&
                      e.message === 'INSUFFICIENT_STOCK'
                      ? el.procedureInventory.insufficientStock
                      : el.procedureInventory.deductFailed,
                  );
                }
              })();
            },
          },
        ],
      );
    } catch {
      // BOM table may be missing before migration
    }
  })();
}
