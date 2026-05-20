/**
 * Bill of materials: procedure catalog entry → inventory items.
 */

export interface ProcedureBomLine {
  id: string;
  procedureType: string;
  inventoryItemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  availableQuantity: number;
}

export interface ProcedureBomInputLine {
  inventoryItemId: string;
  quantity: number;
}

export interface InventoryDeductionPreviewLine {
  inventoryItemId: string;
  itemName: string;
  unit: string;
  quantityPerTreatment: number;
  totalQuantity: number;
  availableQuantity: number;
}

export interface InventoryDeductionPreview {
  procedureType: string;
  lines: InventoryDeductionPreviewLine[];
  canFulfill: boolean;
}
