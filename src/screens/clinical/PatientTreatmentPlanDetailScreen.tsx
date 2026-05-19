/**
 * Treatment plan detail — phases and planned items.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {PatientsStackParamList} from '../../navigation/navigation.types';
import {MaterialIcons} from '@expo/vector-icons';
import {
  TOOTH_SITE_PROCEDURE_VALUES,
  GENERAL_PROCEDURE_VALUES,
} from '../../services/clinical/treatment.service';
import {
  addTreatmentPlanItem,
  addTreatmentPlanPhase,
  completeTreatmentPlanAndPostToLedger,
  deleteTreatmentPlan,
  deleteTreatmentPlanItem,
  deleteTreatmentPlanPhase,
  fulfillPlanItemToLedger,
  getPendingLedgerPostsForPlan,
  getPlanLedgerPostingSummary,
  getTreatmentPlanById,
  markAllPlanItemsCompleted,
  parseTeethInput,
  postPendingLedgerItemsForPlan,
  updateTreatmentPlan,
  updateTreatmentPlanItemStatus,
  type PhasePriority,
  type PlanItemStatus,
  type TreatmentPlanItemRow,
  type TreatmentPlanPhaseRow,
  type TreatmentPlanRow,
  type TreatmentPlanStatus,
} from '../../services/clinical/treatmentPlan.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {
  el,
  phasePriorityLabel,
  planCompleteItemBody,
  planCompletePlanSuccess,
  planCompletePlanWithCharges,
  planDeleteItemBody,
  planDeleteItemLedgerNote,
  planDeletePhaseBody,
  planDeletePhaseEmpty,
  planDeletePhaseLedgerNote,
  planDeletePhaseWithItems,
  planDeletePlanBody,
  planDeletePlanDetails,
  planDeletePlanLedgerNote,
  planItemStatusLabel,
  planPendingBannerSub,
  planPostPendingBody,
  planPostPendingSuccess,
  treatmentPlanStatusLabel,
  UI_LOCALE,
} from '../../i18n';

const TOOTH_PROC_SET = new Set<string>(TOOTH_SITE_PROCEDURE_VALUES);
const PROCEDURE_OPTIONS = [
  ...TOOTH_SITE_PROCEDURE_VALUES,
  ...GENERAL_PROCEDURE_VALUES.filter((g) => !TOOTH_PROC_SET.has(g)),
];

const currencyEl = (n: number) =>
  new Intl.NumberFormat(UI_LOCALE, {style: 'currency', currency: 'EUR'}).format(n);

const formatChargeAmount = (cost: number | null) =>
  cost != null ? currencyEl(cost) : el.treatmentPlans.zeroCost;

const PatientTreatmentPlanDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<PatientsStackParamList, 'PatientTreatmentPlanDetail'>
    >();
  const route = useRoute();
  const {planId} = route.params as {patientId: string; planId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;

  const [plan, setPlan] = useState<TreatmentPlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseModal, setPhaseModal] = useState(false);
  const [itemModal, setItemModal] = useState<{phaseId: string} | null>(null);
  const [phaseName, setPhaseName] = useState('');
  const [phasePriority, setPhasePriority] = useState<PhasePriority>('medium');
  const [itemProcedure, setItemProcedure] = useState(PROCEDURE_OPTIONS[0]);
  const [itemTeeth, setItemTeeth] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    try {
      setLoading(true);
      setPlan(getTreatmentPlanById(planId));
    } catch (e) {
      console.error(e);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmPostPendingToLedger = () => {
    const pending = getPendingLedgerPostsForPlan(planId);
    const completedPending = pending.items.filter((i) => i.status === 'completed');
    if (completedPending.length === 0) {
      return;
    }
    const total = completedPending.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
    Alert.alert(
      el.treatmentPlans.postToLedger,
      planPostPendingBody(completedPending.length, currencyEl(total)),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.treatmentPlans.postToLedgerBtn,
          onPress: () => {
            void (async () => {
              try {
                const posted = await postPendingLedgerItemsForPlan(planId);
                load();
                Alert.alert(
                  el.treatmentPlans.ledgerTitle,
                  planPostPendingSuccess(posted),
                );
              } catch (e) {
                Alert.alert(
                  el.common.error,
                  e instanceof Error ? e.message : '',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const confirmCompleteItem = (item: TreatmentPlanItemRow, st: PlanItemStatus) => {
    if (item.status === st) {
      return;
    }
    if (st !== 'completed') {
      updateTreatmentPlanItemStatus(item.id, st);
      load();
      return;
    }
    if (item.treatmentId) {
      updateTreatmentPlanItemStatus(item.id, 'completed');
      load();
      return;
    }

    Alert.alert(
      el.treatmentPlans.completeItemTitle,
      planCompleteItemBody(formatChargeAmount(item.estimatedCost), item.procedureType),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.treatmentPlans.markCompleteOnly,
          onPress: () => {
            updateTreatmentPlanItemStatus(item.id, 'completed');
            load();
          },
        },
        {
          text: el.treatmentPlans.completeAndCharge,
          onPress: () => {
            void (async () => {
              try {
                updateTreatmentPlanItemStatus(item.id, 'completed');
                const posted = await fulfillPlanItemToLedger(item.id);
                load();
                if (posted) {
                  Alert.alert(
                    el.treatmentPlans.ledgerTitle,
                    el.treatmentPlans.chargeRecorded,
                  );
                }
              } catch (e) {
                Alert.alert(
                  el.common.error,
                  e instanceof Error ? e.message : '',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const setStatus = (status: TreatmentPlanStatus) => {
    const current = getTreatmentPlanById(planId);
    if (current?.status === status) {
      return;
    }

    if (status !== 'completed') {
      try {
        updateTreatmentPlan(planId, {status});
        load();
      } catch (e) {
        Alert.alert(el.common.error, e instanceof Error ? e.message : '');
      }
      return;
    }

    const pending = getPendingLedgerPostsForPlan(planId);
    const chargeTotal = pending.totalAmount;
    const chargeCount = pending.itemCount;

    Alert.alert(
      el.treatmentPlans.completePlanTitle,
      chargeCount > 0
        ? planCompletePlanWithCharges(chargeCount, currencyEl(chargeTotal))
        : el.treatmentPlans.completePlanNoCharges,
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.treatmentPlans.completePlanOnly,
          onPress: () => {
            try {
              updateTreatmentPlan(planId, {status: 'completed'});
              markAllPlanItemsCompleted(planId);
              load();
            } catch (e) {
              Alert.alert(el.common.error, e instanceof Error ? e.message : '');
            }
          },
        },
        ...(chargeCount > 0
          ? [
              {
                text: el.treatmentPlans.completePlanAndCharge,
                onPress: () => {
                  void (async () => {
                    try {
                      updateTreatmentPlan(planId, {status: 'completed'});
                      const posted = await completeTreatmentPlanAndPostToLedger(planId);
                      load();
                      Alert.alert(
                        el.treatmentPlans.planCompleted,
                        planCompletePlanSuccess(posted),
                      );
                    } catch (e) {
                      Alert.alert(
                        el.common.error,
                        e instanceof Error ? e.message : '',
                      );
                    }
                  })();
                },
              },
            ]
          : []),
      ],
    );
  };

  const savePhase = () => {
    if (!phaseName.trim()) {
      return;
    }
    setBusy(true);
    try {
      addTreatmentPlanPhase(planId, phaseName, phasePriority);
      setPhaseModal(false);
      load();
    } catch (e) {
      Alert.alert(el.common.error, e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  };

  const saveItem = () => {
    if (!itemModal) {
      return;
    }
    const cost =
      itemCost.trim() === ''
        ? null
        : Number.parseFloat(itemCost.replace(',', '.'));
    if (itemCost.trim() !== '' && (cost == null || !Number.isFinite(cost))) {
      Alert.alert(el.common.error, el.treatmentPlans.invalidCost);
      return;
    }
    setBusy(true);
    try {
      addTreatmentPlanItem({
        phaseId: itemModal.phaseId,
        procedureType: itemProcedure,
        toothNumbers: parseTeethInput(itemTeeth),
        description: itemDesc || null,
        estimatedCost: cost,
      });
      setItemModal(null);
      load();
    } catch (e) {
      Alert.alert(el.common.error, e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeletePlan = () => {
    if (!plan) {
      return;
    }
    const phaseCount = plan.phases?.length ?? 0;
    const itemCount =
      plan.phases?.reduce((sum, ph) => sum + ph.items.length, 0) ?? 0;
    const ledger = getPlanLedgerPostingSummary(planId);
    const details =
      phaseCount > 0
        ? planDeletePlanDetails(phaseCount, itemCount)
        : '';
    const ledgerNote =
      ledger.postedToLedgerCount > 0
        ? planDeletePlanLedgerNote(ledger.postedToLedgerCount)
        : '';

    Alert.alert(
      el.treatmentPlans.deletePlan,
      planDeletePlanBody(plan.title, details, ledgerNote),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.common.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlan(planId);
                navigation.goBack();
              } catch (e) {
                Alert.alert(
                  el.common.error,
                  e instanceof Error ? e.message : '',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const confirmDeletePhase = (phase: TreatmentPlanPhaseRow) => {
    const itemCount = phase.items.length;
    const postedCount = phase.items.filter((i) => i.treatmentId).length;
    const details =
      itemCount > 0
        ? planDeletePhaseWithItems(itemCount)
        : planDeletePhaseEmpty();
    const ledgerNote =
      postedCount > 0 ? planDeletePhaseLedgerNote(postedCount) : '';

    Alert.alert(
      el.treatmentPlans.deletePhase,
      planDeletePhaseBody(
        `${phase.phaseNumber}. ${phase.name}`,
        details,
        ledgerNote,
      ),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.common.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlanPhase(phase.id);
                load();
              } catch (e) {
                Alert.alert(
                  el.common.error,
                  e instanceof Error ? e.message : '',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const confirmDeleteItem = (item: TreatmentPlanItemRow) => {
    const ledgerNote = item.treatmentId
      ? planDeleteItemLedgerNote(formatChargeAmount(item.estimatedCost))
      : '';

    Alert.alert(
      el.treatmentPlans.removeItemTitle,
      planDeleteItemBody(item.procedureType, ledgerNote),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.treatmentPlans.removeItem,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlanItem(item.id);
                load();
              } catch (e) {
                Alert.alert(
                  el.common.error,
                  e instanceof Error ? e.message : '',
                );
              }
            })();
          },
        },
      ],
    );
  };

  if (loading || !plan) {
    return (
      <ScreenSafeArea variant="content">
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{padding: pad, paddingBottom: 40}}>
        <Text className="text-xl font-bold text-slate-900">{plan.title}</Text>
        {plan.description ? (
          <Text className="mt-2 text-sm text-slate-600">{plan.description}</Text>
        ) : null}
        <Text className="mt-3 text-lg font-bold text-slate-900">
          {currencyEl(plan.totalEstimatedCost)}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          {treatmentPlanStatusLabel(plan.status)}
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {(
            [
              'presented',
              'approved',
              'in_progress',
              'completed',
            ] as TreatmentPlanStatus[]
          ).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 ${
                plan.status === s
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}>
              <Text
                className={`text-xs font-medium ${
                  plan.status === s ? 'text-blue-800' : 'text-slate-600'
                }`}>
                {treatmentPlanStatusLabel(s)}
              </Text>
            </Pressable>
          ))}
        </View>

        {(() => {
          const pending = getPendingLedgerPostsForPlan(planId);
          const unposted = pending.items.filter((i) => i.status === 'completed');
          if (unposted.length === 0) {
            return null;
          }
          const total = unposted.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
          return (
            <Pressable
              onPress={confirmPostPendingToLedger}
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Text className="text-sm font-semibold text-amber-900">
                {el.treatmentPlans.pendingNoChargeBanner}
              </Text>
              <Text className="mt-1 text-xs text-amber-800">
                {planPendingBannerSub(unposted.length, currencyEl(total))}
              </Text>
            </Pressable>
          );
        })()}

        <Pressable
          onPress={() => setPhaseModal(true)}
          className="mt-5 flex-row items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 py-3">
          <MaterialIcons name="add" size={20} color="#1d4ed8" />
          <Text className="ml-1 font-semibold text-blue-800">
            {el.treatmentPlans.newPhase}
          </Text>
        </Pressable>

        {(plan.phases ?? []).length === 0 ? (
          <Text className="mt-6 text-center text-slate-500">
            {el.treatmentPlans.addPhaseHint}
          </Text>
        ) : (
          (plan.phases ?? []).map((phase) => (
            <View
              key={phase.id}
              className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <View className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-slate-900">
                    {phase.phaseNumber}. {phase.name}
                  </Text>
                  <Pressable
                    onPress={() => confirmDeletePhase(phase)}
                    hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={22} color="#dc2626" />
                  </Pressable>
                </View>
                <Text className="mt-1 text-xs text-slate-500">
                  {phasePriorityLabel(phase.priority)} · {phase.status}
                </Text>
              </View>

              {phase.items.length === 0 ? (
                <Text className="px-4 py-3 text-sm text-slate-500">
                  {el.treatmentPlans.noItemsInPhase}
                </Text>
              ) : (
                phase.items.map((item) => (
                  <View
                    key={item.id}
                    className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <Text className="text-sm font-medium text-slate-900">
                      {item.procedureType}
                    </Text>
                    {item.toothNumbers.length > 0 ? (
                      <Text className="mt-0.5 text-xs text-slate-600">
                        {el.treatmentPlans.teeth}
                        {item.toothNumbers.join(', ')}
                      </Text>
                    ) : null}
                    {item.description ? (
                      <Text className="mt-1 text-xs text-slate-600">{item.description}</Text>
                    ) : null}
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-slate-800">
                        {item.estimatedCost != null
                          ? currencyEl(item.estimatedCost)
                          : '—'}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {planItemStatusLabel(item.status)}
                        {item.treatmentId ? el.treatmentPlans.onLedger : ''}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {(
                        ['pending', 'scheduled', 'completed'] as PlanItemStatus[]
                      ).map((st) => (
                        <Pressable
                          key={st}
                          onPress={() => confirmCompleteItem(item, st)}
                          className={`rounded-lg px-2 py-1 ${
                            item.status === st ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                          <Text className="text-xs text-slate-700">
                            {planItemStatusLabel(st)}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable
                        onPress={() => confirmDeleteItem(item)}
                        className="rounded-lg bg-red-50 px-2 py-1">
                        <Text className="text-xs text-red-700">
                          {el.treatmentPlans.removeItem}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Pressable
                onPress={() => {
                  setItemProcedure(PROCEDURE_OPTIONS[0]);
                  setItemTeeth('');
                  setItemDesc('');
                  setItemCost('');
                  setItemModal({phaseId: phase.id});
                }}
                className="flex-row items-center justify-center border-t border-slate-100 py-3 active:bg-slate-50">
                <MaterialIcons name="add" size={18} color="#1d4ed8" />
                <Text className="ml-1 text-sm font-semibold text-blue-700">
                  {el.treatmentPlans.treatmentInPhase}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          onPress={confirmDeletePlan}
          className="mt-8 items-center rounded-xl border border-red-200 bg-red-50 py-3">
          <Text className="font-semibold text-red-700">
            {el.treatmentPlans.deletePlanBtn}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={phaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPhaseModal(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPhaseModal(false)}>
          <Pressable
            className="rounded-t-2xl bg-white p-5 pb-8"
            onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold">{el.treatmentPlans.newPhaseModal}</Text>
            <TextInput
              className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5"
              placeholder={el.treatmentPlans.phaseNamePlaceholder}
              value={phaseName}
              onChangeText={setPhaseName}
            />
            <Text className="mb-2 mt-3 text-sm text-slate-600">
              {el.treatmentPlans.priorityLabel}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(['urgent', 'high', 'medium', 'low'] as PhasePriority[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPhasePriority(p)}
                  className={`rounded-full px-3 py-1.5 ${
                    phasePriority === p ? 'bg-blue-600' : 'bg-slate-100'
                  }`}>
                  <Text
                    className={`text-xs font-medium ${
                      phasePriority === p ? 'text-white' : 'text-slate-700'
                    }`}>
                    {phasePriorityLabel(p)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={() => setPhaseModal(false)}
                className="flex-1 rounded-xl border py-3">
                <Text className="text-center font-semibold">{el.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={savePhase}
                disabled={busy}
                className="flex-1 rounded-xl bg-blue-600 py-3">
                <Text className="text-center font-semibold text-white">
                  {el.treatmentPlans.save}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={itemModal != null}
        transparent
        animationType="slide"
        onRequestClose={() => setItemModal(null)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setItemModal(null)}>
          <Pressable
            className="max-h-[88%] rounded-t-2xl bg-white"
            onPress={(e) => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              className="p-5 pb-8">
              <Text className="text-lg font-bold">
                {el.treatmentPlans.treatmentModal}
              </Text>
              <Text className="mb-2 mt-3 text-sm font-medium text-slate-700">
                {el.treatmentPlans.procedureType}
              </Text>
              <ScrollView className="max-h-40" nestedScrollEnabled>
                {PROCEDURE_OPTIONS.map((proc) => (
                  <Pressable
                    key={proc}
                    onPress={() => setItemProcedure(proc)}
                    className={`mb-2 rounded-lg border px-3 py-2 ${
                      itemProcedure === proc
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200'
                    }`}>
                    <Text className="text-xs text-slate-800">{proc}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text className="mb-1 mt-2 text-sm font-medium text-slate-700">
                {el.treatmentPlans.teethFdi}
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={itemTeeth}
                onChangeText={setItemTeeth}
                placeholder={el.treatmentPlans.teethPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="mb-1 mt-2 text-sm font-medium text-slate-700">
                {el.treatmentPlans.description}
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={itemDesc}
                onChangeText={setItemDesc}
              />
              <Text className="mb-1 mt-2 text-sm font-medium text-slate-700">
                {el.treatmentPlans.estimatedCost}
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={itemCost}
                onChangeText={setItemCost}
                keyboardType="decimal-pad"
              />
              <View className="mt-5 flex-row gap-2">
                <Pressable
                  onPress={() => setItemModal(null)}
                  className="flex-1 rounded-xl border py-3">
                  <Text className="text-center font-semibold">{el.common.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={saveItem}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-blue-600 py-3">
                  <Text className="text-center font-semibold text-white">
                    {el.treatmentPlans.save}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenSafeArea>
  );
};

export default PatientTreatmentPlanDetailScreen;
