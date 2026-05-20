/**
 * Editable invoice line items with live totals preview.
 */

import React, {useMemo} from 'react';
import {View, Text, TextInput, Pressable} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {
  DEFAULT_VAT_RATE,
  previewInvoiceTotals,
  type InvoiceLineInput,
} from '../../services/financial/invoice.service';
import {previewReceiptTotals} from '../../services/financial/receipt.service';
import {el, UI_LOCALE} from '../../i18n';

export interface InvoiceLineDraft {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export function createEmptyLineDraft(): InvoiceLineDraft {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: '',
    quantity: '1',
    unitPrice: '',
  };
}

export function draftsFromSuggestions(lines: InvoiceLineInput[]): InvoiceLineDraft[] {
  if (lines.length === 0) {
    return [createEmptyLineDraft()];
  }
  return lines.map((line) => ({
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: String(line.unitPrice),
  }));
}

const currencyEl = (n: number) =>
  new Intl.NumberFormat(UI_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

type LinesEditorCopy = {
  importTreatments: string;
  lineNumber: string;
  description: string;
  descriptionPlaceholder: string;
  quantity: string;
  unitPrice: string;
  addLine: string;
  netLabel: string;
  vatLabel: string;
  totalLabel: string;
};

const invoiceCopy = (): LinesEditorCopy => ({
  importTreatments: el.invoices.importTreatments,
  lineNumber: el.invoices.lineNumber,
  description: el.invoices.description,
  descriptionPlaceholder: el.invoices.descriptionPlaceholder,
  quantity: el.invoices.quantity,
  unitPrice: el.invoices.unitPrice,
  addLine: el.invoices.addLine,
  netLabel: el.invoices.netLabel,
  vatLabel: el.invoices.vatLabel,
  totalLabel: el.invoices.pdfTotal,
});

const receiptCopy = (): LinesEditorCopy => ({
  importTreatments: el.receipts.importTreatments,
  lineNumber: el.receipts.lineNumber,
  description: el.receipts.description,
  descriptionPlaceholder: el.receipts.descriptionPlaceholder,
  quantity: el.receipts.quantity,
  unitPrice: el.receipts.unitPrice,
  addLine: el.receipts.addLine,
  netLabel: el.receipts.netLabel,
  vatLabel: el.receipts.vatLabel,
  totalLabel: el.receipts.totalLabel,
});

interface InvoiceLinesEditorProps {
  lines: InvoiceLineDraft[];
  onChange: (lines: InvoiceLineDraft[]) => void;
  onImportTreatments?: () => void;
  vatRate?: number;
  variant?: 'invoice' | 'receipt';
}

const InvoiceLinesEditor: React.FC<InvoiceLinesEditorProps> = ({
  lines,
  onChange,
  onImportTreatments,
  vatRate = DEFAULT_VAT_RATE,
  variant = 'invoice',
}) => {
  const copy = variant === 'receipt' ? receiptCopy() : invoiceCopy();
  const parsedForPreview = useMemo(() => {
    const inputs: InvoiceLineInput[] = [];
    for (const row of lines) {
      const description = row.description.trim();
      if (!description) {
        continue;
      }
      const qty = Number.parseFloat(row.quantity.replace(',', '.'));
      const unit = Number.parseFloat(row.unitPrice.replace(',', '.'));
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit < 0) {
        continue;
      }
      inputs.push({description, quantity: qty, unitPrice: unit});
    }
    if (inputs.length === 0) {
      return null;
    }
    return variant === 'receipt'
      ? previewReceiptTotals(inputs, vatRate)
      : previewInvoiceTotals(inputs, vatRate);
  }, [lines, vatRate, variant]);

  const updateLine = (id: string, patch: Partial<InvoiceLineDraft>) => {
    onChange(lines.map((row) => (row.id === id ? {...row, ...patch} : row)));
  };

  const removeLine = (id: string) => {
    const next = lines.filter((row) => row.id !== id);
    onChange(next.length > 0 ? next : [createEmptyLineDraft()]);
  };

  const addLine = () => {
    onChange([...lines, createEmptyLineDraft()]);
  };

  return (
    <View>
      {onImportTreatments ? (
        <Pressable
          onPress={onImportTreatments}
          className="mb-3 flex-row items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 py-2.5">
          <MaterialIcons name="playlist-add" size={20} color="#1d4ed8" />
          <Text className="ml-2 text-sm font-semibold text-blue-800">
            {copy.importTreatments}
          </Text>
        </Pressable>
      ) : null}

      {lines.map((row, index) => (
        <View
          key={row.id}
          className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {copy.lineNumber} {index + 1}
            </Text>
            {lines.length > 1 ? (
              <Pressable onPress={() => removeLine(row.id)} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={22} color="#dc2626" />
              </Pressable>
            ) : null}
          </View>

          <Text className="text-xs font-medium text-slate-600">
            {copy.description}
          </Text>
          <TextInput
            className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={row.description}
            onChangeText={(text) => updateLine(row.id, {description: text})}
            placeholder={copy.descriptionPlaceholder}
          />

          <View className="mt-2 flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs font-medium text-slate-600">
                {copy.quantity}
              </Text>
              <TextInput
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={row.quantity}
                onChangeText={(text) => updateLine(row.id, {quantity: text})}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-[2]">
              <Text className="text-xs font-medium text-slate-600">
                {copy.unitPrice}
              </Text>
              <TextInput
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={row.unitPrice}
                onChangeText={(text) => updateLine(row.id, {unitPrice: text})}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          </View>
        </View>
      ))}

      <Pressable
        onPress={addLine}
        className="flex-row items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5">
        <MaterialIcons name="add" size={20} color="#0f172a" />
        <Text className="ml-1 text-sm font-semibold text-slate-800">
          {copy.addLine}
        </Text>
      </Pressable>

      {parsedForPreview ? (
        <View className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-600">{copy.netLabel}</Text>
            <Text className="text-sm font-semibold text-slate-900">
              {currencyEl(parsedForPreview.subtotal)}
            </Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-sm text-slate-600">
              {copy.vatLabel} ({vatRate}%)
            </Text>
            <Text className="text-sm font-semibold text-slate-900">
              {currencyEl(parsedForPreview.vatAmount)}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between border-t border-slate-100 pt-2">
            <Text className="text-base font-semibold text-slate-900">
              {copy.totalLabel}
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {currencyEl(parsedForPreview.totalAmount)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default InvoiceLinesEditor;
