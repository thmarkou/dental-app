/**
 * Inventory (αποθήκη) — items, low-stock filter, stock movements.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryExtendedSummary,
  getPracticeRecentMovements,
  getRecentMovements,
  type InventoryExtendedSummary,
  type InventoryMovementWithItem,
  isLowStock,
  recordStockMovement,
  updateInventoryItem,
  type InventoryItem,
  type InventoryMovement,
  type InventoryMovementType,
} from '../../services/inventory/inventory.service';
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
} from '../../types/inventory';
import {isDatabaseAvailable} from '../../services/database';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {useAuthStore} from '../../store/auth.store';
import {
  el,
  formatCurrencyEur,
  inventoryCategoryLabel,
  inventoryMovementTypeLabel,
  UI_LOCALE,
} from '../../i18n';
import type {ReportsStackParamList} from '../../navigation/navigation.types';

type FilterKey = 'all' | 'low';

const qtyFmt = (n: number) =>
  new Intl.NumberFormat(UI_LOCALE, {maximumFractionDigits: 2}).format(n);

const MOVEMENT_TYPES: InventoryMovementType[] = [
  'purchase',
  'usage',
  'adjustment',
];

const movementAmountHint = (type: InventoryMovementType): string => {
  switch (type) {
    case 'purchase':
      return el.inventory.amountHintAdd;
    case 'usage':
      return el.inventory.amountHintRemove;
    default:
      return el.inventory.amountHintAdjust;
  }
};

const emptyForm = () => ({
  sku: '',
  name: '',
  category: 'other' as InventoryCategory,
  unit: 'τεμ',
  quantity: '0',
  minQuantity: '0',
  unitCost: '',
  supplier: '',
  location: '',
  notes: '',
});

const InventoryScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<ReportsStackParamList>>();
  const {user} = useAuthStore();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventoryExtendedSummary>({
    totalItems: 0,
    lowStockCount: 0,
    estimatedStockValue: 0,
    usageUnitsThisMonth: 0,
    proceduresWithBom: 0,
  });
  const [recentPracticeMovements, setRecentPracticeMovements] = useState<
    InventoryMovementWithItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemModal, setItemModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [movementModal, setMovementModal] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementType, setMovementType] =
    useState<InventoryMovementType>('purchase');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      setItems([]);
      setSummary({
        totalItems: 0,
        lowStockCount: 0,
        estimatedStockValue: 0,
        usageUnitsThisMonth: 0,
        proceduresWithBom: 0,
      });
      setRecentPracticeMovements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, sum, recent] = await Promise.all([
        getInventoryItems({
          activeOnly: true,
          lowStockOnly: filter === 'low',
        }),
        getInventoryExtendedSummary(),
        getPracticeRecentMovements(10),
      ]);
      setItems(list);
      setSummary(sum);
      setRecentPracticeMovements(recent);
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.inventory.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setItemModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      sku: item.sku ?? '',
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      unitCost: item.unitCost != null ? String(item.unitCost) : '',
      supplier: item.supplier ?? '',
      location: item.location ?? '',
      notes: item.notes ?? '',
    });
    setItemModal(true);
  };

  const openMovement = async (item: InventoryItem) => {
    setSelected(item);
    setMovementType('purchase');
    setMovementAmount('');
    setMovementNotes('');
    setMovementModal(true);
    try {
      const recent = await getRecentMovements(item.id, 8);
      setMovements(recent);
    } catch {
      setMovements([]);
    }
  };

  const saveItem = async () => {
    const name = form.name.trim();
    if (!name) {
      Alert.alert(el.common.error, el.inventory.nameRequired);
      return;
    }
    const qty = parseFloat(form.quantity.replace(',', '.'));
    const minQ = parseFloat(form.minQuantity.replace(',', '.'));
    const unitCostRaw = form.unitCost.trim().replace(',', '.');
    const unitCost =
      unitCostRaw === '' ? null : parseFloat(unitCostRaw);
    if (unitCostRaw !== '' && !Number.isFinite(unitCost!)) {
      Alert.alert(el.common.error, el.inventory.saveFailed);
      return;
    }
    const newQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
    if (!Number.isFinite(qty)) {
      Alert.alert(el.common.error, el.inventory.invalidAmount);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateInventoryItem(editing.id, {
          sku: form.sku.trim() || null,
          name,
          category: form.category,
          unit: form.unit,
          minQuantity: Number.isFinite(minQ) ? minQ : 0,
          unitCost,
          supplier: form.supplier.trim() || null,
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
        });
        const delta = newQty - editing.quantity;
        if (delta !== 0) {
          await recordStockMovement({
            itemId: editing.id,
            movementType: 'adjustment',
            amount: delta,
            notes: el.inventory.formAdjustmentNote,
            performedBy: user?.username ?? null,
          });
        }
      } else {
        await createInventoryItem({
          sku: form.sku.trim() || null,
          name,
          category: form.category,
          unit: form.unit,
          quantity: newQty,
          minQuantity: Number.isFinite(minQ) ? minQ : 0,
          unitCost,
          supplier: form.supplier.trim() || null,
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
          initialStockNote: el.inventory.initialStockNote,
        });
      }
      setItemModal(false);
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.inventory.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const submitMovement = async () => {
    if (!selected) {
      return;
    }
    const amount = parseFloat(movementAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount === 0) {
      Alert.alert(el.common.error, el.inventory.invalidAmount);
      return;
    }
    setSaving(true);
    try {
      await recordStockMovement({
        itemId: selected.id,
        movementType,
        amount,
        notes: movementNotes.trim() || null,
        performedBy: user?.username ?? null,
      });
      setMovementModal(false);
      await load();
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'INSUFFICIENT_STOCK') {
        Alert.alert(el.common.error, el.inventory.insufficientStock);
      } else {
        Alert.alert(el.common.error, el.inventory.movementFailed);
      }
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({item}: {item: InventoryItem}) => {
    const low = isLowStock(item);
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => void openMovement(item)}
        className="mb-2 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 active:bg-slate-50">
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-base font-semibold text-slate-900">
              {item.name}
            </Text>
            {low && (
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-amber-800">
                  {el.inventory.lowStock}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-sm text-slate-500">
            {inventoryCategoryLabel(item.category)}
            {item.sku ? ` · ${item.sku}` : ''}
          </Text>
        </View>
        <View className="items-end">
          <Text
            className={`text-lg font-bold ${low ? 'text-amber-700' : 'text-slate-900'}`}>
            {qtyFmt(item.quantity)}
          </Text>
          <Text className="text-xs text-slate-500">{item.unit}</Text>
          {item.minQuantity > 0 && (
            <Text className="text-xs text-slate-400">
              {el.inventory.listMinShort} {qtyFmt(item.minQuantity)}
            </Text>
          )}
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color="#94a3b8"
          style={{marginLeft: 4}}
        />
      </Pressable>
    );
  };

  return (
    <ScreenSafeArea variant="full">
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            className="rounded-lg p-2 active:bg-slate-100">
            <MaterialIcons name="arrow-back" size={24} color="#334155" />
          </Pressable>
          <View className="ml-1 flex-1">
            <Text className="text-lg font-bold text-slate-900">
              {el.inventory.title}
            </Text>
            <Text className="text-xs text-slate-500">{el.inventory.subtitle}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('ProcedureInventoryLinks')}
              className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 active:bg-slate-100">
              <MaterialIcons name="link" size={20} color="#334155" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={openAdd}
              className="flex-row items-center rounded-lg bg-slate-900 px-3 py-2 active:opacity-90">
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text className="ml-1 text-sm font-semibold text-white">
                {el.inventory.addItem}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('ProcedureInventoryLinks')}
          className="mx-3 mt-2 flex-row items-center rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5 active:bg-indigo-100">
          <MaterialIcons name="medical-services" size={20} color="#4f46e5" />
          <Text className="ml-2 flex-1 text-sm text-indigo-900">
            {el.procedureInventory.openFromInventory}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color="#6366f1" />
        </Pressable>

        {!isDatabaseAvailable && (
          <View className="px-3 pt-2">
            <DatabaseWarning />
          </View>
        )}

        <View className="mx-3 mt-3 flex-row flex-wrap gap-2">
          <View className="min-w-[46%] flex-1 rounded-xl bg-white p-3 shadow-sm">
            <Text className="text-xs text-slate-500">{el.inventory.totalItems}</Text>
            <Text className="text-2xl font-bold text-slate-900">
              {summary.totalItems}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-xl bg-white p-3 shadow-sm">
            <Text className="text-xs text-slate-500">{el.inventory.lowStock}</Text>
            <Text
              className={`text-2xl font-bold ${
                summary.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}>
              {summary.lowStockCount}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-xl bg-white p-3 shadow-sm">
            <Text className="text-xs text-slate-500">{el.inventory.stockValue}</Text>
            <Text className="text-xl font-bold text-slate-900">
              {formatCurrencyEur(summary.estimatedStockValue)}
            </Text>
            <Text className="mt-0.5 text-[10px] text-slate-400">
              {el.inventory.stockValueHint}
            </Text>
          </View>
          <View className="min-w-[46%] flex-1 rounded-xl bg-white p-3 shadow-sm">
            <Text className="text-xs text-slate-500">{el.inventory.usageThisMonth}</Text>
            <Text className="text-2xl font-bold text-slate-900">
              {qtyFmt(summary.usageUnitsThisMonth)}
            </Text>
            <Text className="mt-0.5 text-[10px] text-slate-400">
              {el.inventory.usageThisMonthHint}
            </Text>
          </View>
        </View>

        <View className="mx-3 mt-2 rounded-xl border border-indigo-100 bg-white px-3 py-2.5 shadow-sm">
          <Text className="text-xs text-slate-500">{el.inventory.proceduresLinked}</Text>
          <Text className="text-lg font-bold text-indigo-900">
            {summary.proceduresWithBom}
          </Text>
        </View>

        <View className="mx-3 mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {el.inventory.practiceRecentMovements}
          </Text>
          {recentPracticeMovements.length === 0 ? (
            <Text className="text-sm text-slate-400">{el.inventory.noPracticeMovements}</Text>
          ) : (
            recentPracticeMovements.map((m, i) => (
              <View
                key={m.id}
                className={`py-2 ${
                  i < recentPracticeMovements.length - 1
                    ? 'border-b border-slate-100'
                    : ''
                }`}>
                <Text className="text-sm font-medium text-slate-800">{m.itemName}</Text>
                <Text className="text-xs text-slate-500">
                  {inventoryMovementTypeLabel(m.movementType)} ·{' '}
                  {m.quantityDelta > 0 ? '+' : ''}
                  {qtyFmt(m.quantityDelta)} ·{' '}
                  {new Intl.DateTimeFormat(UI_LOCALE, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(m.createdAt))}
                </Text>
              </View>
            ))
          )}
        </View>

        <View className="mx-3 mt-3 flex-row gap-2">
          {(['all', 'low'] as const).map(key => (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => setFilter(key)}
              className={`rounded-full px-4 py-2 ${
                filter === key ? 'bg-slate-900' : 'bg-white border border-slate-200'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  filter === key ? 'text-white' : 'text-slate-700'
                }`}>
                {key === 'all' ? el.inventory.filterAll : el.inventory.filterLow}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#0f172a" />
          </View>
        ) : (
          <FlatList
            className="flex-1 px-3 pt-3"
            data={items}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{paddingBottom: 24}}
            ListEmptyComponent={
              <Text className="py-8 text-center text-slate-500">
                {filter === 'low' ? el.inventory.emptyLow : el.inventory.empty}
              </Text>
            }
          />
        )}

        {/* Add / edit item */}
        <Modal visible={itemModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end bg-black/40">
            <View className="max-h-[90%] rounded-t-2xl bg-white">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{padding: 20, paddingBottom: 32}}>
                <Text className="mb-4 text-xl font-bold text-slate-900">
                  {editing ? el.inventory.editItem : el.inventory.addItem}
                </Text>
                <Field
                  label={el.inventory.name}
                  value={form.name}
                  onChangeText={v => setForm(f => ({...f, name: v}))}
                />
                <QuantityField
                  label={el.inventory.quantity}
                  hint={el.inventory.quantityHint}
                  placeholder={el.inventory.quantityPlaceholder}
                  value={form.quantity}
                  onChangeText={v => setForm(f => ({...f, quantity: v}))}
                />
                <Field
                  label={el.inventory.sku}
                  value={form.sku}
                  onChangeText={v => setForm(f => ({...f, sku: v}))}
                />
                <Text className="mb-1 text-sm font-medium text-slate-700">
                  {el.inventory.category}
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {INVENTORY_CATEGORIES.map(cat => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm(f => ({...f, category: cat}))}
                      className={`rounded-full px-3 py-1.5 ${
                        form.category === cat
                          ? 'bg-slate-900'
                          : 'bg-slate-100'
                      }`}>
                      <Text
                        className={`text-xs ${
                          form.category === cat ? 'text-white' : 'text-slate-700'
                        }`}>
                        {inventoryCategoryLabel(cat)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Field
                  label={el.inventory.unit}
                  value={form.unit}
                  onChangeText={v => setForm(f => ({...f, unit: v}))}
                />
                <Field
                  label={el.inventory.minQuantity}
                  hint={el.inventory.minQuantityHint}
                  value={form.minQuantity}
                  onChangeText={v => setForm(f => ({...f, minQuantity: v}))}
                  keyboardType="decimal-pad"
                />
                <Field
                  label={el.inventory.unitCost}
                  value={form.unitCost}
                  onChangeText={v => setForm(f => ({...f, unitCost: v}))}
                  keyboardType="decimal-pad"
                />
                <Field
                  label={el.inventory.supplier}
                  value={form.supplier}
                  onChangeText={v => setForm(f => ({...f, supplier: v}))}
                />
                <Field
                  label={el.inventory.location}
                  value={form.location}
                  onChangeText={v => setForm(f => ({...f, location: v}))}
                />
                <Field
                  label={el.inventory.notes}
                  value={form.notes}
                  onChangeText={v => setForm(f => ({...f, notes: v}))}
                  multiline
                />
                <View className="mt-4 flex-row gap-3">
                  <Pressable
                    onPress={() => setItemModal(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-3">
                    <Text className="text-center font-semibold text-slate-700">
                      {el.inventory.cancel}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void saveItem()}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-slate-900 py-3">
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-center font-semibold text-white">
                        {el.inventory.save}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Stock movement */}
        <Modal visible={movementModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end bg-black/40">
            <View className="max-h-[92%] rounded-t-2xl bg-white">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{padding: 20, paddingBottom: 32}}>
                {selected && (
                  <>
                    <View className="mb-4 flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {el.inventory.movementModalTitle}
                        </Text>
                        <Text className="mt-0.5 text-xl font-bold text-slate-900">
                          {selected.name}
                        </Text>
                        <Text className="mt-2 text-sm text-slate-700">
                          {el.inventory.statusNow}:{' '}
                          <Text className="font-semibold">
                            {qtyFmt(selected.quantity)} {selected.unit}
                          </Text>
                        </Text>
                        {selected.minQuantity > 0 && (
                          <Text className="mt-0.5 text-sm text-slate-500">
                            {el.inventory.statusWarnAt}{' '}
                            {qtyFmt(selected.minQuantity)} {selected.unit}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={el.inventory.editItemHint}
                        onPress={() => {
                          setMovementModal(false);
                          openEdit(selected);
                        }}
                        className="rounded-lg bg-slate-100 p-2">
                        <MaterialIcons name="edit" size={22} color="#334155" />
                      </Pressable>
                    </View>

                    <Text className="mb-2 text-sm font-medium text-slate-700">
                      {el.inventory.movementType}
                    </Text>
                    <View className="mb-3 flex-row flex-wrap gap-2">
                      {MOVEMENT_TYPES.map(t => (
                        <Pressable
                          key={t}
                          onPress={() => setMovementType(t)}
                          className={`rounded-lg px-3 py-2 ${
                            movementType === t
                              ? 'bg-slate-900'
                              : 'bg-slate-100'
                          }`}>
                          <Text
                            className={`text-xs font-medium ${
                              movementType === t
                                ? 'text-white'
                                : 'text-slate-700'
                            }`}>
                            {inventoryMovementTypeLabel(t)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Field
                      label={el.inventory.amount}
                      hint={movementAmountHint(movementType)}
                      value={movementAmount}
                      onChangeText={setMovementAmount}
                      keyboardType="decimal-pad"
                    />
                    <Field
                      label={el.inventory.notes}
                      value={movementNotes}
                      onChangeText={setMovementNotes}
                      multiline
                    />
                    <Pressable
                      onPress={() => void submitMovement()}
                      disabled={saving}
                      className="mb-6 rounded-xl bg-emerald-700 py-3">
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-center font-semibold text-white">
                          {el.inventory.stockMovement}
                        </Text>
                      )}
                    </Pressable>

                    <Text className="mb-2 text-sm font-semibold text-slate-800">
                      {el.inventory.recentMovements}
                    </Text>
                    {movements.length === 0 ? (
                      <Text className="text-sm text-slate-500">
                        {el.inventory.noMovements}
                      </Text>
                    ) : (
                      movements.map(m => (
                        <View
                          key={m.id}
                          className="mb-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <Text className="text-sm font-medium text-slate-800">
                            {inventoryMovementTypeLabel(m.movementType)}{' '}
                            {m.quantityDelta > 0 ? '+' : ''}
                            {qtyFmt(m.quantityDelta)} → {qtyFmt(m.quantityAfter)}
                          </Text>
                          <Text className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat(UI_LOCALE, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(new Date(m.createdAt))}
                          </Text>
                        </View>
                      ))
                    )}

                    <Pressable
                      onPress={() => setMovementModal(false)}
                      className="mt-4 rounded-xl border border-slate-300 py-3">
                      <Text className="text-center font-semibold text-slate-700">
                        {el.inventory.cancel}
                      </Text>
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenSafeArea>
  );
};

const quantityInputStyle = {
  flex: 1,
  borderWidth: 2,
  borderColor: '#4f46e5',
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 20,
  fontWeight: '600' as const,
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
  color: '#0f172a',
};

const QuantityField: React.FC<{
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}> = ({label, hint, placeholder, value, onChangeText}) => {
  const bump = (delta: number) => {
    const n = parseFloat(value.replace(',', '.'));
    const base = Number.isFinite(n) ? n : 0;
    onChangeText(String(Math.max(0, base + delta)));
  };

  return (
    <View className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3">
      <Text className="text-sm font-semibold text-indigo-900">{label}</Text>
      {hint ? (
        <Text className="mb-2 mt-0.5 text-xs text-indigo-700/90">{hint}</Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="-1"
          onPress={() => bump(-1)}
          className="rounded-full bg-white p-1 active:bg-indigo-100">
          <MaterialIcons name="remove-circle" size={36} color="#4f46e5" />
        </Pressable>
        <TextInput
          style={quantityInputStyle}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          selectTextOnFocus
          editable
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="+1"
          onPress={() => bump(1)}
          className="rounded-full bg-white p-1 active:bg-indigo-100">
          <MaterialIcons name="add-circle" size={36} color="#4f46e5" />
        </Pressable>
      </View>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}> = ({
  label,
  hint,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline,
}) => (
  <View className="mb-3">
    <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
    {hint ? <Text className="mb-1.5 text-xs text-slate-500">{hint}</Text> : null}
    <TextInput
      className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900"
      style={{backgroundColor: '#ffffff'}}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      editable
    />
  </View>
);

export default InventoryScreen;
