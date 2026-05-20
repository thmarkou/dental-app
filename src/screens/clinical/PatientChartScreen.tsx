/**
 * Patient dental chart (odontogram) with treatment recording modal.
 */

import React, {useCallback, useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {PatientsStackParamList} from '../../navigation/navigation.types';
import {ArcOdontogram} from '../../components/clinical/ArcOdontogram';
import {OdontogramLegend} from '../../components/clinical/odontogramShared';
import {
  getPatientChart,
  getPatientHistory,
  getTreatmentById,
  recordTreatment,
  updateTreatment,
  deleteTreatment,
  isToothPresent,
  coerceToothCondition,
  TOOTH_CONDITIONS,
  TOOTH_SITE_PROCEDURE_VALUES,
  GENERAL_PROCEDURE_VALUES,
  isGeneralProcedureType,
  type DentalChartRow,
  type ClinicalHistoryRow,
  type TreatmentRow,
} from '../../services/clinical/treatment.service';
import {
  findMatchingOpenPlanItems,
  fulfillPlanItemToLedger,
  getOpenPlanItemsForPatient,
  updateTreatmentPlanItemStatus,
  type OpenPlanItemForChart,
} from '../../services/clinical/treatmentPlan.service';
import {getPatientById} from '../../services/patient';
import {offerInventoryDeductionForTreatment} from '../../services/inventory/procedureInventory.service';
import {useAuthStore} from '../../store/auth.store';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el} from '../../i18n';

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientChart'>;

const TOOTH_TREATMENT_OPTIONS = TOOTH_SITE_PROCEDURE_VALUES.map((value) => ({
  label: value,
  value,
}));

const GENERAL_TREATMENT_OPTIONS = GENERAL_PROCEDURE_VALUES.map((value) => ({
  label: value,
  value,
}));

const TOOTH_TREATMENT_VALUES = new Set<string>(TOOTH_SITE_PROCEDURE_VALUES);
const TOOTH_TREATMENT_DEFAULT = TOOTH_SITE_PROCEDURE_VALUES[0];
const GENERAL_TREATMENT_DEFAULT = GENERAL_PROCEDURE_VALUES[0];

function findLatestSiteTreatmentForTooth(
  treatments: ClinicalHistoryRow[],
  toothNumber: number,
): ClinicalHistoryRow | null {
  let best: ClinicalHistoryRow | null = null;
  for (const t of treatments) {
    if (t.toothNumber !== toothNumber) {
      continue;
    }
    if (isGeneralProcedureType(t.procedureType)) {
      continue;
    }
    if (!best || t.createdAt > best.createdAt) {
      best = t;
    }
  }
  return best;
}

const PatientChartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const {patientId, openTreatmentId, highlightTeeth} = route.params as {
    patientId: string;
    openTreatmentId?: string;
    highlightTeeth?: number[];
  };
  const {width} = useWindowDimensions();
  const {user} = useAuthStore();

  const [modalMode, setModalMode] = useState<'tooth' | 'general'>('tooth');

  const [patientName, setPatientName] = useState<string>('');
  const [chartRows, setChartRows] = useState<DentalChartRow[]>([]);
  const [patientTreatments, setPatientTreatments] = useState<ClinicalHistoryRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(
    null,
  );
  const [selectedTreatment, setSelectedTreatment] =
    useState<string>(TOOTH_TREATMENT_DEFAULT);
  const [notes, setNotes] = useState('');
  const [costText, setCostText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toothPresent, setToothPresent] = useState(true);
  const [openPlanItems, setOpenPlanItems] = useState<OpenPlanItemForChart[]>([]);
  const [modalPlanMatches, setModalPlanMatches] = useState<OpenPlanItemForChart[]>(
    [],
  );

  const plannedTeethSet = useMemo(() => {
    const set = new Set<number>();
    for (const item of openPlanItems) {
      for (const t of item.toothNumbers) {
        set.add(t);
      }
    }
    return set;
  }, [openPlanItems]);

  const highlightTeethSet = useMemo(
    () => new Set(highlightTeeth ?? []),
    [highlightTeeth],
  );

  const refreshClinicalData = useCallback(async () => {
    const [rows, history, planItems] = await Promise.all([
      getPatientChart(patientId),
      getPatientHistory(patientId),
      Promise.resolve(getOpenPlanItemsForPatient(patientId)),
    ]);
    setChartRows(rows);
    setPatientTreatments(history);
    setOpenPlanItems(planItems);
  }, [patientId]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [patient, rows, history, planItems] = await Promise.all([
        getPatientById(patientId),
        getPatientChart(patientId),
        getPatientHistory(patientId),
        Promise.resolve(getOpenPlanItemsForPatient(patientId)),
      ]);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
      }
      setChartRows(rows);
      setPatientTreatments(history);
      setOpenPlanItems(planItems);
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.chart.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
  );

  useEffect(() => {
    if (!openTreatmentId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const t = await getTreatmentById(openTreatmentId, patientId);
      if (cancelled) {
        return;
      }
      if (!t) {
        navigation.setParams({patientId, openTreatmentId: undefined});
        return;
      }
      if (t.toothNumber != null) {
        await applyToothTreatmentToModal(t);
      } else {
        applyGeneralTreatmentToModal(t);
      }
      navigation.setParams({patientId, openTreatmentId: undefined});
    })();
    return () => {
      cancelled = true;
    };
  }, [openTreatmentId, patientId, navigation]);

  const applyGeneralTreatmentToModal = (t: TreatmentRow) => {
    setModalMode('general');
    setSelectedTooth(null);
    setEditingTreatmentId(t.id);
    const proc = t.procedureType?.trim() ?? '';
    setSelectedTreatment(
      proc !== '' && isGeneralProcedureType(proc) ? proc : GENERAL_TREATMENT_DEFAULT,
    );
    setNotes(t.notes ?? '');
    setCostText(
      t.cost != null && !Number.isNaN(t.cost) ? String(t.cost) : '',
    );
    setModalVisible(true);
  };

  const applyToothTreatmentToModal = async (t: TreatmentRow) => {
    if (t.toothNumber == null) {
      return;
    }
    setModalMode('tooth');
    setSelectedTooth(t.toothNumber);
    setEditingTreatmentId(t.id);
    const proc = t.procedureType?.trim() || TOOTH_TREATMENT_DEFAULT;
    setSelectedTreatment(
      TOOTH_TREATMENT_VALUES.has(proc) ? proc : TOOTH_TREATMENT_DEFAULT,
    );
    setNotes(t.notes ?? '');
    setCostText(
      t.cost != null && !Number.isNaN(t.cost) ? String(t.cost) : '',
    );
    setModalVisible(true);
    const present = await isToothPresent(patientId, t.toothNumber);
    setToothPresent(present);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('PatientTreatmentHistory', {patientId})}
          className="mr-2 rounded-lg px-3 py-2 active:bg-slate-100">
          <Text className="text-base font-medium text-blue-600">{el.chart.history}</Text>
        </Pressable>
      ),
    });
  }, [navigation, patientId]);

  const openGeneralTreatmentModal = () => {
    setModalMode('general');
    setSelectedTooth(null);
    setEditingTreatmentId(null);
    setSelectedTreatment(GENERAL_TREATMENT_DEFAULT);
    setModalPlanMatches(
      findMatchingOpenPlanItems(
        openPlanItems,
        null,
        GENERAL_TREATMENT_DEFAULT,
      ),
    );
    setNotes('');
    setCostText('');
    setModalVisible(true);
  };

  const openToothModal = async (toothNumber: number) => {
    setModalMode('tooth');
    setSelectedTooth(toothNumber);
    setModalPlanMatches(
      findMatchingOpenPlanItems(openPlanItems, toothNumber, TOOTH_TREATMENT_DEFAULT),
    );
    const latest = findLatestSiteTreatmentForTooth(patientTreatments, toothNumber);
    if (latest) {
      setEditingTreatmentId(latest.id);
      const proc = latest.procedureType?.trim() || TOOTH_TREATMENT_DEFAULT;
      const procResolved = TOOTH_TREATMENT_VALUES.has(proc)
        ? proc
        : TOOTH_TREATMENT_DEFAULT;
      setSelectedTreatment(procResolved);
      setModalPlanMatches(
        findMatchingOpenPlanItems(openPlanItems, toothNumber, procResolved),
      );
      setNotes(latest.notes ?? '');
      setCostText(
        latest.cost != null && !Number.isNaN(latest.cost)
          ? String(latest.cost)
          : '',
      );
    } else {
      setEditingTreatmentId(null);
      setSelectedTreatment(TOOTH_TREATMENT_DEFAULT);
      setModalPlanMatches(
        findMatchingOpenPlanItems(
          openPlanItems,
          toothNumber,
          TOOTH_TREATMENT_DEFAULT,
        ),
      );
      setNotes('');
      setCostText('');
    }
    setModalVisible(true);
    const present = await isToothPresent(patientId, toothNumber);
    setToothPresent(present);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTooth(null);
    setEditingTreatmentId(null);
    setModalPlanMatches([]);
  };

  const completeFromPlanItem = async (planItem: OpenPlanItemForChart) => {
    try {
      setSaving(true);
      updateTreatmentPlanItemStatus(planItem.itemId, 'completed');
      const posted = await fulfillPlanItemToLedger(planItem.itemId);
      await refreshClinicalData();
      closeModal();
      Alert.alert(
        el.common.success,
        posted > 0
          ? el.chart.completeFromPlanSuccess
          : el.treatmentPlans.markCompleteOnly,
      );
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, e instanceof Error ? e.message : el.chart.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const runRecordTreatment = async () => {
    const cost =
      costText.trim() === '' ? null : Number.parseFloat(costText.replace(',', '.'));
    if (costText.trim() !== '' && (cost == null || Number.isNaN(cost))) {
      Alert.alert(el.chart.invalidCost, el.chart.invalidCostBody);
      return;
    }

    if (modalMode === 'tooth' && selectedTooth == null) {
      return;
    }

    try {
      setSaving(true);
      let newTreatmentId: string | null = null;
      if (modalMode === 'general') {
        if (editingTreatmentId) {
          await updateTreatment(editingTreatmentId, {
            patientId,
            treatmentType: selectedTreatment,
            notes: notes.trim() === '' ? null : notes.trim(),
            cost,
          });
        } else {
          const created = await recordTreatment({
            patientId,
            toothNumber: null,
            treatmentType: selectedTreatment,
            notes: notes.trim() === '' ? null : notes.trim(),
            cost,
          });
          newTreatmentId = created.id;
        }
      } else if (selectedTooth != null) {
        if (editingTreatmentId) {
          await updateTreatment(editingTreatmentId, {
            patientId,
            treatmentType: selectedTreatment,
            notes: notes.trim() === '' ? null : notes.trim(),
            cost,
          });
        } else {
          const created = await recordTreatment({
            patientId,
            toothNumber: selectedTooth,
            treatmentType: selectedTreatment,
            notes: notes.trim() === '' ? null : notes.trim(),
            cost,
          });
          newTreatmentId = created.id;
        }
      }
      await refreshClinicalData();
      closeModal();
      if (newTreatmentId) {
        offerInventoryDeductionForTreatment({
          procedureType: selectedTreatment,
          treatmentId: newTreatmentId,
          patientLabel: patientName || undefined,
          performedBy: user?.id ?? null,
        });
      }
      Alert.alert(
        el.common.success,
        modalMode === 'general'
          ? el.chart.savedGeneral
          : editingTreatmentId
            ? el.chart.savedUpdated
            : el.chart.savedNew,
      );
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.chart.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const currentConditionLabel =
    selectedTooth == null
      ? '—'
      : (() => {
          const coerced = coerceToothCondition(
            chartRows.find((r) => r.toothNumber === selectedTooth)?.condition,
          );
          return coerced === TOOTH_CONDITIONS.CLEANING ? 'Healthy' : coerced;
        })();

  const submitTreatment = () => {
    if (editingTreatmentId) {
      void runRecordTreatment();
      return;
    }

    const tooth = modalMode === 'tooth' ? selectedTooth : null;
    const matches = findMatchingOpenPlanItems(
      openPlanItems,
      tooth,
      selectedTreatment,
    );
    if (matches.length === 0) {
      void runRecordTreatment();
      return;
    }

    const planTitle = matches[0]!.planTitle;
    Alert.alert(
      el.chart.planMatchTitle,
      el.chart.planMatchBody.replace('{plan}', planTitle),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.chart.planMatchContinue,
          onPress: () => void runRecordTreatment(),
        },
        {
          text: el.chart.planMatchUsePlan,
          onPress: () => void completeFromPlanItem(matches[0]!),
        },
      ],
    );
  };

  const handleDeleteTreatment = () => {
    if (!editingTreatmentId) {
      return;
    }
    if (modalMode === 'tooth' && selectedTooth == null) {
      return;
    }
    Alert.alert(
      el.chart.deleteTitle,
      modalMode === 'general' ? el.chart.deleteGeneralConfirm : el.chart.deleteToothConfirm,
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.common.delete,
          style: 'destructive',
          onPress: () => void runDeleteTreatment(),
        },
      ],
    );
  };

  const runDeleteTreatment = async () => {
    if (!editingTreatmentId) {
      return;
    }
    const tooth = selectedTooth;
    const mode = modalMode;
    try {
      setSaving(true);
      await deleteTreatment(editingTreatmentId, patientId);
      const [rows, history] = await Promise.all([
        getPatientChart(patientId),
        getPatientHistory(patientId),
      ]);
      setChartRows(rows);
      setPatientTreatments(history);

      if (mode === 'general') {
        closeModal();
        Alert.alert(el.common.success, el.chart.deleted);
      } else if (tooth != null) {
        const nextLatest = findLatestSiteTreatmentForTooth(history, tooth);
        if (nextLatest) {
          setEditingTreatmentId(nextLatest.id);
          const proc = nextLatest.procedureType?.trim() || TOOTH_TREATMENT_DEFAULT;
          setSelectedTreatment(
            TOOTH_TREATMENT_VALUES.has(proc) ? proc : TOOTH_TREATMENT_DEFAULT,
          );
          setNotes(nextLatest.notes ?? '');
          setCostText(
            nextLatest.cost != null && !Number.isNaN(nextLatest.cost)
              ? String(nextLatest.cost)
              : '',
          );
        } else {
          setEditingTreatmentId(null);
          setSelectedTreatment(TOOTH_TREATMENT_DEFAULT);
          setNotes('');
          setCostText('');
        }
        const present = await isToothPresent(patientId, tooth);
        setToothPresent(present);
        Alert.alert(el.common.success, el.chart.deletedChartUpdated);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.chart.deleteFailed);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-slate-600">{el.chart.loading}</Text>
        </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: width >= 900 ? 32 : 12,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="pt-2">
          <Text className="text-center text-lg font-bold text-slate-900">{patientName}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500">FDI notation • Tap a tooth</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="General visit: add full-mouth or non-tooth treatment"
          onPress={openGeneralTreatmentModal}
          className="mx-auto mt-2 w-full max-w-md flex-row items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-emerald-600 px-4 py-3 shadow-md active:bg-emerald-700">
          <MaterialIcons name="add-circle-outline" size={28} color="#ecfdf5" />
          <View className="flex-1">
            <Text className="text-base font-bold text-emerald-50">{el.chart.generalVisit}</Text>
            <Text className="mt-0.5 text-xs text-emerald-100">
              Cleaning, exam, X-ray, whitening, and other non–tooth-specific care
            </Text>
          </View>
        </Pressable>

        <ArcOdontogram
          chartRows={chartRows}
          onToothPress={openToothModal}
          comfortableLayout={width >= 720}
          plannedTeeth={plannedTeethSet}
          highlightTeeth={highlightTeethSet}
        />

        {plannedTeethSet.size > 0 ? (
          <Text className="mt-2 text-center text-xs text-slate-500">
            {el.chart.plannedLegend}
          </Text>
        ) : null}

        <OdontogramLegend />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={closeModal}>
          <Pressable
            className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 h-1 w-12 self-center rounded-full bg-slate-300" />
            {modalMode === 'general' ? (
              <>
                <Text className="text-lg font-bold text-slate-900">{el.chart.generalVisit}</Text>
                <Text className="mt-2 text-sm text-slate-600">
                  Not assigned to a single tooth. Choose the procedure below.
                </Text>
              </>
            ) : (
              <>
                <Text className="text-lg font-bold text-slate-900">
                  {el.chart.tooth} {selectedTooth}
                </Text>
                <Text className="mt-1 text-sm text-slate-600">
                  Current status:{' '}
                  <Text className="font-semibold text-slate-800">{currentConditionLabel}</Text>
                </Text>

                {!toothPresent && (
                  <View className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                    <Text className="text-sm text-amber-900">
                      This tooth is marked missing. You can still add a record if you are correcting
                      the chart.
                    </Text>
                  </View>
                )}
              </>
            )}

            {!editingTreatmentId && modalPlanMatches.length > 0 ? (
              <View className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                <Text className="text-sm font-semibold text-blue-900">
                  {el.chart.fromPlanSection}
                </Text>
                {modalPlanMatches.map((pi) => (
                  <View key={pi.itemId} className="mt-2">
                    <Text className="text-xs text-blue-900">
                      {pi.planTitle} · {pi.procedureType}
                    </Text>
                    <Pressable
                      onPress={() => void completeFromPlanItem(pi)}
                      disabled={saving}
                      className="mt-2 items-center rounded-lg bg-blue-600 py-2.5 active:bg-blue-700 disabled:opacity-50">
                      <Text className="text-xs font-semibold text-white">
                        {el.chart.completeFromPlan}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">
              {modalMode === 'general'
                ? editingTreatmentId
                  ? 'Edit general treatment'
                  : 'New general treatment'
                : editingTreatmentId
                  ? 'Edit treatment'
                  : 'New treatment'}
            </Text>
            {modalMode === 'tooth' ? (
              <ScrollView
                className="mb-4"
                style={{maxHeight: 400}}
                contentContainerStyle={{paddingBottom: 8, flexGrow: 0}}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator>
                <View className="gap-2">
                  {TOOTH_TREATMENT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setSelectedTreatment(opt.value);
                        if (!editingTreatmentId && selectedTooth != null) {
                          setModalPlanMatches(
                            findMatchingOpenPlanItems(
                              openPlanItems,
                              selectedTooth,
                              opt.value,
                            ),
                          );
                        }
                      }}
                      className={`w-full rounded-xl border-2 px-3 py-2.5 ${
                        selectedTreatment === opt.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}>
                      <Text
                        className={`text-xs font-medium leading-snug ${
                          selectedTreatment === opt.value ? 'text-blue-800' : 'text-slate-700'
                        }`}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                className="mb-4 max-h-64"
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                <View className="flex-row flex-wrap gap-2">
                  {GENERAL_TREATMENT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setSelectedTreatment(opt.value);
                        if (!editingTreatmentId) {
                          setModalPlanMatches(
                            findMatchingOpenPlanItems(openPlanItems, null, opt.value),
                          );
                        }
                      }}
                      className={`max-w-[320px] rounded-xl border-2 px-3 py-2 ${
                        selectedTreatment === opt.value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}>
                      <Text
                        className={`text-xs font-medium leading-snug ${
                          selectedTreatment === opt.value ? 'text-emerald-900' : 'text-slate-700'
                        }`}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            <Text className="mb-1 text-xs font-medium text-slate-600">{el.chart.notesLabel}</Text>
            <TextInput
              className="mb-3 min-h-[72px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              placeholder={el.chart.notesPlaceholder}
              placeholderTextColor="#94a3b8"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <Text className="mb-1 text-xs font-medium text-slate-600">{el.chart.costOptional}</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={costText}
              onChangeText={setCostText}
            />

            {editingTreatmentId ? (
              <Pressable
                onPress={handleDeleteTreatment}
                disabled={saving}
                className="mb-3 items-center rounded-xl border-2 border-red-200 bg-red-50 py-3 active:bg-red-100 disabled:opacity-50">
                <Text className="font-semibold text-red-700">{el.chart.deleteTreatment}</Text>
              </Pressable>
            ) : null}

            <View className="flex-row gap-3">
              <Pressable
                onPress={closeModal}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3 active:bg-slate-50">
                <Text className="font-semibold text-slate-700">{el.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => void submitTreatment()}
                disabled={saving}
                className="flex-1 items-center rounded-xl bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">{el.chart.saveTreatment}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
};

export default PatientChartScreen;
