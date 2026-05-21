/**
 * Link procedure catalog entries to inventory items (BOM).
 */

import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {el} from '../../i18n';
import {isDatabaseAvailable} from '../../services/database';
import {getInventoryItems} from '../../services/inventory/inventory.service';
import {
  countBomLinesByProcedure,
  getBomForProcedure,
  getCatalogProcedureGroups,
  procedureShortLabel,
  saveBomForProcedure,
} from '../../services/inventory/procedureInventory.service';
import type {InventoryItem} from '../../types/inventory';
import type {ProcedureBomInputLine} from '../../types/procedureInventory';
import type {ReportsStackParamList} from '../../navigation/navigation.types';

type Nav = NativeStackNavigationProp<
  ReportsStackParamList,
  'ProcedureInventoryLinks'
>;

type EditorLine = ProcedureBomInputLine & {itemName: string; unit: string};

const ProcedureInventoryLinksScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {tooth, general} = getCatalogProcedureGroups();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(
    null,
  );
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      setCounts({});
      setInventory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cnt, items] = await Promise.all([
        countBomLinesByProcedure(),
        getInventoryItems({activeOnly: true}),
      ]);
      setCounts(cnt);
      setInventory(items);
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.procedureInventory.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openEditor = async (procedureType: string) => {
    setSelectedProcedure(procedureType);
    setEditorOpen(true);
    try {
      const bom = await getBomForProcedure(procedureType);
      setLines(
        bom.map((b) => ({
          inventoryItemId: b.inventoryItemId,
          quantity: b.quantity,
          itemName: b.itemName,
          unit: b.unit,
        })),
      );
    } catch {
      setLines([]);
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedProcedure(null);
    setLines([]);
    setPickerOpen(false);
  };

  const addLine = (item: InventoryItem) => {
    if (lines.some((l) => l.inventoryItemId === item.id)) {
      Alert.alert(el.common.error, el.procedureInventory.duplicateItem);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        inventoryItemId: item.id,
        quantity: 1,
        itemName: item.name,
        unit: item.unit,
      },
    ]);
    setPickerOpen(false);
  };

  const updateLineQty = (inventoryItemId: string, text: string) => {
    const n = Number.parseFloat(text.replace(',', '.'));
    setLines((prev) =>
      prev.map((l) =>
        l.inventoryItemId === inventoryItemId
          ? {...l, quantity: Number.isFinite(n) && n > 0 ? n : 1}
          : l,
      ),
    );
  };

  const removeLine = (inventoryItemId: string) => {
    setLines((prev) => prev.filter((l) => l.inventoryItemId !== inventoryItemId));
  };

  const saveEditor = async () => {
    if (!selectedProcedure) {
      return;
    }
    setSaving(true);
    try {
      await saveBomForProcedure(
        selectedProcedure,
        lines.map((l) => ({
          inventoryItemId: l.inventoryItemId,
          quantity: l.quantity,
        })),
      );
      await load();
      closeEditor();
      Alert.alert(el.common.success, el.procedureInventory.saved);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error && e.message === 'DUPLICATE_ITEM'
          ? el.procedureInventory.duplicateItem
          : el.procedureInventory.saveFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const renderProcedure = (procedureType: string) => {
    const cnt = counts[procedureType] ?? 0;
    return (
      <Pressable
        key={procedureType}
        onPress={() => void openEditor(procedureType)}
        className="mb-2 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 active:bg-slate-50">
        <View className="flex-1">
          <Text className="text-sm font-medium text-slate-900">
            {procedureShortLabel(procedureType)}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>
            {procedureType}
          </Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            cnt > 0 ? 'bg-blue-50' : 'bg-slate-100'
          }`}>
          <Text
            className={`text-xs font-semibold ${
              cnt > 0 ? 'text-blue-800' : 'text-slate-500'
            }`}>
            {cnt > 0
              ? el.procedureInventory.linkedCount.replace('{n}', String(cnt))
              : el.procedureInventory.notLinked}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color="#94a3b8"
          style={{marginLeft: 8}}
        />
      </Pressable>
    );
  };

  return (
    <ScreenSafeArea variant="full">
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="rounded-lg p-2 active:bg-slate-100">
            <MaterialIcons name="arrow-back" size={24} color="#334155" />
          </Pressable>
          <View className="ml-1 flex-1">
            <Text className="text-lg font-bold text-slate-900">
              {el.procedureInventory.title}
            </Text>
            <Text className="text-xs text-slate-500">
              {el.procedureInventory.subtitle}
            </Text>
          </View>
        </View>

        {!isDatabaseAvailable && (
          <View className="px-3 pt-2">
            <DatabaseWarning />
          </View>
        )}

        {loading ? (
          <ActivityIndicator className="mt-8" color="#64748b" />
        ) : (
          <ScrollView className="flex-1 px-3 pt-3" contentContainerStyle={{paddingBottom: 32}}>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {el.procedureInventory.groupTooth}
            </Text>
            {tooth.map(renderProcedure)}
            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {el.procedureInventory.groupGeneral}
            </Text>
            {general.map(renderProcedure)}
          </ScrollView>
        )}

        <Modal
          visible={editorOpen}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
          onRequestClose={closeEditor}>
          <View className="flex-1 bg-slate-50">
            <View
              className="border-b border-slate-200 bg-white"
              style={{paddingTop: insets.top}}>
              <View className="min-h-[52px] flex-row items-center px-2 py-2">
                <Pressable
                  onPress={closeEditor}
                  accessibilityRole="button"
                  accessibilityLabel={el.common.cancel}
                  className="rounded-lg p-2 active:bg-slate-100">
                  <MaterialIcons name="close" size={24} color="#334155" />
                </Pressable>
                <View className="ml-1 min-w-0 flex-1 pr-2">
                  <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                    {selectedProcedure
                      ? procedureShortLabel(selectedProcedure)
                      : '—'}
                  </Text>
                  {selectedProcedure ? (
                    <Text className="text-xs text-slate-500" numberOfLines={2}>
                      {selectedProcedure}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => void saveEditor()}
                  disabled={saving}
                  accessibilityRole="button"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 disabled:opacity-50">
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      {el.common.save}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-3 pt-4"
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 16) + 24,
                flexGrow: lines.length === 0 ? 1 : undefined,
              }}
              keyboardShouldPersistTaps="handled">
              <Text className="mb-4 text-sm leading-5 text-slate-600">
                {el.procedureInventory.editorHint}
              </Text>

              {lines.length === 0 ? (
                <View className="flex-1 justify-center py-8">
                  <Text className="text-center text-sm text-slate-500">
                    {el.procedureInventory.noLines}
                  </Text>
                </View>
              ) : (
                lines.map((line) => (
                  <View
                    key={line.inventoryItemId}
                    className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
                    <Text className="text-sm font-medium text-slate-900">
                      {line.itemName}
                    </Text>
                    <View className="mt-2 flex-row flex-wrap items-center">
                      <Text className="mr-2 text-sm text-slate-600">
                        {el.procedureInventory.qtyPerTreatment}
                      </Text>
                      <TextInput
                        className="min-w-[72px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        keyboardType="decimal-pad"
                        value={String(line.quantity)}
                        onChangeText={(t) =>
                          updateLineQty(line.inventoryItemId, t)
                        }
                      />
                      <Text className="ml-2 text-sm text-slate-500">
                        {line.unit}
                      </Text>
                      <Pressable
                        onPress={() => removeLine(line.inventoryItemId)}
                        accessibilityRole="button"
                        className="ml-auto rounded-lg p-2">
                        <MaterialIcons name="delete-outline" size={22} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Pressable
                onPress={() => {
                  if (inventory.length === 0) {
                    Alert.alert(
                      el.common.error,
                      el.procedureInventory.noInventoryItems,
                    );
                    return;
                  }
                  setPickerOpen(true);
                }}
                className="mt-4 flex-row items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-4 active:bg-slate-50">
                <MaterialIcons name="add" size={22} color="#475569" />
                <Text className="ml-2 text-sm font-semibold text-slate-700">
                  {el.procedureInventory.addMaterial}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>

        <Modal visible={pickerOpen} transparent animationType="fade">
          <Pressable
            className="flex-1 justify-end bg-black/40"
            onPress={() => setPickerOpen(false)}>
            <Pressable
              className="max-h-[70%] rounded-t-2xl bg-white px-3 pt-4"
              style={{paddingBottom: Math.max(insets.bottom, 16) + 12}}
              onPress={(e) => e.stopPropagation()}>
              <Text className="mb-3 text-base font-semibold text-slate-900">
                {el.procedureInventory.pickMaterial}
              </Text>
              <FlatList
                data={inventory}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <Pressable
                    onPress={() => addLine(item)}
                    className="border-b border-slate-100 py-3">
                    <Text className="text-sm font-medium text-slate-900">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {el.inventory.listMinShort} {item.quantity} {item.unit}
                    </Text>
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ScreenSafeArea>
  );
};

export default ProcedureInventoryLinksScreen;
