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

const TOOTH_PROC_SET = new Set<string>(TOOTH_SITE_PROCEDURE_VALUES);
const PROCEDURE_OPTIONS = [
  ...TOOTH_SITE_PROCEDURE_VALUES,
  ...GENERAL_PROCEDURE_VALUES.filter((g) => !TOOTH_PROC_SET.has(g)),
];

const STATUS_LABEL: Record<TreatmentPlanStatus, string> = {
  draft: '\u03A0\u03C1\u03CC\u03C7\u03B5\u03B9\u03C1\u03BF',
  presented: '\u03A0\u03B1\u03C1\u03BF\u03C5\u03C3\u03B9\u03AC\u03C3\u03C4\u03B7\u03BA\u03B5',
  approved: '\u0395\u03B3\u03BA\u03B5\u03BA\u03C1\u03B9\u03BC\u03AD\u03BD\u03BF',
  in_progress: '\u03A3\u03B5 \u03B5\u03BE\u03AD\u03BB\u03B9\u03BE\u03B7',
  completed: '\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
  cancelled: '\u0391\u03BA\u03C5\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
};

const PRIORITY_LABEL: Record<PhasePriority, string> = {
  urgent: '\u0395\u03C0\u03B5\u03AF\u03B3\u03BF\u03C5\u03C3\u03B1',
  high: '\u03A5\u03C8\u03B7\u03BB\u03AE',
  medium: '\u039C\u03B5\u03C3\u03B1\u03AF\u03B1',
  low: '\u03A7\u03B1\u03BC\u03B7\u03BB\u03AE',
};

const ITEM_STATUS_LABEL: Record<PlanItemStatus, string> = {
  pending: '\u0391\u03BD\u03B1\u03BC\u03BF\u03BD\u03AE',
  scheduled: '\u03A0\u03C1\u03BF\u03B3\u03C1\u03B1\u03BC\u03BC\u03AD\u03BD\u03B7',
  completed: '\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
  cancelled: '\u0391\u03BA\u03C5\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
};

const currencyEl = (n: number) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: 'EUR'}).format(n);

const formatChargeAmount = (cost: number | null) =>
  cost != null ? currencyEl(cost) : '\u20AC0 (\u03C7\u03C9\u03C1\u03AF\u03C2 \u03BA\u03CC\u03C3\u03C4\u03BF\u03C2)';

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
      '\u039A\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF',
      `\u0398\u03AD\u03BB\u03B5\u03C4\u03B5 \u03BD\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03B7\u03B8\u03BF\u03CD\u03BD ${completedPending.length} \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u03C3\u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF / \u03A0\u03BB\u03B7\u03C1\u03CE\u03BC\u03B5\u03B9\u03C2;\n\n\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7\u03C2: ${currencyEl(total)}`,
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u039A\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7',
          onPress: () => {
            void (async () => {
              try {
                const posted = await postPendingLedgerItemsForPlan(planId);
                load();
                Alert.alert(
                  '\u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF',
                  posted > 0
                    ? `\u039A\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B1\u03BD ${posted} \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7(\u03B5\u03B9\u03C2).`
                    : '\u0394\u03B5\u03BD \u03C5\u03C0\u03AE\u03C1\u03C7\u03B5 \u03BD\u03AD\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7.',
                );
              } catch (e) {
                Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
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
      '\u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 \u03BA\u03B1\u03B9 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7',
      `\u0398\u03B1 \u03C3\u03B7\u03BC\u03B5\u03B9\u03C9\u03B8\u03B5\u03AF \u03C9\u03C2 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03BD\u03B7 \u03BA\u03B1\u03B9 \u03B8\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03B7\u03B8\u03B5\u03AF \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 ${formatChargeAmount(item.estimatedCost)} \u03C3\u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF / \u03A0\u03BB\u03B7\u03C1\u03CE\u03BC\u03B5\u03B9\u03C2.\n\n${item.procedureType}`,
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u039C\u03CC\u03BD\u03BF \u03BF\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7',
          onPress: () => {
            updateTreatmentPlanItemStatus(item.id, 'completed');
            load();
          },
        },
        {
          text: '\u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 + \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7',
          onPress: () => {
            void (async () => {
              try {
                updateTreatmentPlanItemStatus(item.id, 'completed');
                const posted = await fulfillPlanItemToLedger(item.id);
                load();
                if (posted) {
                  Alert.alert(
                    '\u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF',
                    '\u0397 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B5.',
                  );
                }
              } catch (e) {
                Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
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
        Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
      }
      return;
    }

    const pending = getPendingLedgerPostsForPlan(planId);
    const chargeTotal = pending.totalAmount;
    const chargeCount = pending.itemCount;

    Alert.alert(
      '\u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 \u03C3\u03C7\u03B5\u03B4\u03AF\u03BF\u03C5',
      chargeCount > 0
        ? `\u0398\u03AD\u03BB\u03B5\u03C4\u03B5 \u03BD\u03B1 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5 \u03CC\u03BB\u03BF \u03C4\u03BF \u03C3\u03C7\u03AD\u03B4\u03B9\u03BF;\n\n\u039C\u03B5 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7: ${chargeCount} \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2, \u03C3\u03CD\u03BD\u03BF\u03BB\u03BF ${currencyEl(chargeTotal)} \u03C3\u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF / \u03A0\u03BB\u03B7\u03C1\u03CE\u03BC\u03B5\u03B9\u03C2.`
        : '\u0398\u03AD\u03BB\u03B5\u03C4\u03B5 \u03BD\u03B1 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5 \u03CC\u03BB\u03BF \u03C4\u03BF \u03C3\u03C7\u03AD\u03B4\u03B9\u03BF; (\u03CC\u03BB\u03B5\u03C2 \u03BF\u03B9 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03AE\u03B4\u03B7 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.)',
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u039C\u03CC\u03BD\u03BF \u03BF\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7',
          onPress: () => {
            try {
              updateTreatmentPlan(planId, {status: 'completed'});
              markAllPlanItemsCompleted(planId);
              load();
            } catch (e) {
              Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
            }
          },
        },
        ...(chargeCount > 0
          ? [
              {
                text: '\u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 + \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7',
                onPress: () => {
                  void (async () => {
                    try {
                      updateTreatmentPlan(planId, {status: 'completed'});
                      const posted = await completeTreatmentPlanAndPostToLedger(planId);
                      load();
                      Alert.alert(
                        '\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
                        `\u039A\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B1\u03BD ${posted} \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7(\u03B5\u03B9\u03C2) \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.`,
                      );
                    } catch (e) {
                      Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
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
      Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
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
      Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', '\u0388\u03B3\u03BA\u03C5\u03C1\u03BF \u03C0\u03BF\u03C3\u03CC.');
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
      Alert.alert('\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1', e instanceof Error ? e.message : '');
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
        ? `\n\n\u03A0\u03B5\u03C1\u03B9\u03AD\u03C7\u03B5\u03B9 ${phaseCount} \u03C6\u03AC\u03C3\u03B5\u03B9\u03C2 \u03BA\u03B1\u03B9 ${itemCount} \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2. \u0397 \u03B5\u03BD\u03AD\u03C1\u03B3\u03B5\u03B9\u03B1 \u03B4\u03B5\u03BD \u03B1\u03BD\u03B1\u03B9\u03C1\u03B5\u03AF\u03C4\u03B1\u03B9.`
        : '';
    const ledgerNote =
      ledger.postedToLedgerCount > 0
        ? `\n\n\u0398\u03B1 \u03B1\u03C6\u03B1\u03B9\u03C1\u03B5\u03B8\u03BF\u03CD\u03BD \u03BA\u03B1\u03B9 ${ledger.postedToLedgerCount} \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7(\u03B5\u03B9\u03C2) \u03B1\u03C0\u03CC \u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF / \u03A0\u03BB\u03B7\u03C1\u03CE\u03BC\u03B5\u03B9\u03C2.`
        : '';

    Alert.alert(
      '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03C7\u03B5\u03B4\u03AF\u03BF\u03C5',
      `\u039D\u03B1 \u03B4\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03B5\u03AF \u03BF\u03C1\u03B9\u03C3\u03C4\u03B9\u03BA\u03AC \u03C4\u03BF \u03C3\u03C7\u03AD\u03B4\u03B9\u03BF \u00AB${plan.title}\u00BB;${details}${ledgerNote}`,
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlan(planId);
                navigation.goBack();
              } catch (e) {
                Alert.alert(
                  '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
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
        ? `\n\n\u0398\u03B1 \u03B4\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03BF\u03CD\u03BD \u03BA\u03B1\u03B9 ${itemCount} \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u03C4\u03B7\u03C2 \u03C6\u03AC\u03C3\u03B7\u03C2. \u0397 \u03B5\u03BD\u03AD\u03C1\u03B3\u03B5\u03B9\u03B1 \u03B4\u03B5\u03BD \u03B1\u03BD\u03B1\u03B9\u03C1\u03B5\u03AF\u03C4\u03B1\u03B9.`
        : '\n\n\u0397 \u03B5\u03BD\u03AD\u03C1\u03B3\u03B5\u03B9\u03B1 \u03B4\u03B5\u03BD \u03B1\u03BD\u03B1\u03B9\u03C1\u03B5\u03AF\u03C4\u03B1\u03B9.';
    const ledgerNote =
      postedCount > 0
        ? `\n\n\u0398\u03B1 \u03B1\u03C6\u03B1\u03B9\u03C1\u03B5\u03B8\u03BF\u03CD\u03BD \u03BA\u03B1\u03B9 ${postedCount} \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7(\u03B5\u03B9\u03C2) \u03B1\u03C0\u03CC \u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.`
        : '';

    Alert.alert(
      '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C6\u03AC\u03C3\u03B7\u03C2',
      `\u039D\u03B1 \u03B4\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03B5\u03AF \u03B7 \u03C6\u03AC\u03C3\u03B7 \u00AB${phase.phaseNumber}. ${phase.name}\u00BB;${details}${ledgerNote}`,
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlanPhase(phase.id);
                load();
              } catch (e) {
                Alert.alert(
                  '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
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
      ? `\n\n\u0398\u03B1 \u03B1\u03C6\u03B1\u03B9\u03C1\u03B5\u03B8\u03B5\u03AF \u03BA\u03B1\u03B9 \u03B7 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 ${formatChargeAmount(item.estimatedCost)} \u03B1\u03C0\u03CC \u03C4\u03BF \u039B\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.`
      : '';

    Alert.alert(
      '\u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1\u03C2',
      `\u039D\u03B1 \u03B1\u03C6\u03B1\u03B9\u03C1\u03B5\u03B8\u03B5\u03AF \u00AB${item.procedureType}\u00BB;${ledgerNote}`,
      [
        {text: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7', style: 'cancel'},
        {
          text: '\u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTreatmentPlanItem(item.id);
                load();
              } catch (e) {
                Alert.alert(
                  '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
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
          {STATUS_LABEL[plan.status]}
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
                {STATUS_LABEL[s]}
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
                {
                  '\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03BD\u03B5\u03C2 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF'
                }
              </Text>
              <Text className="mt-1 text-xs text-amber-800">
                {unposted.length}{' '}
                {'\u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u00B7 '}
                {currencyEl(total)}
                {' \u00B7 '}
                {'\u03A0\u03AC\u03C4\u03B1 \u03B3\u03B9\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7'}
              </Text>
            </Pressable>
          );
        })()}

        <Pressable
          onPress={() => setPhaseModal(true)}
          className="mt-5 flex-row items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 py-3">
          <MaterialIcons name="add" size={20} color="#1d4ed8" />
          <Text className="ml-1 font-semibold text-blue-800">
            {'\u039D\u03AD\u03B1 \u03C6\u03AC\u03C3\u03B7'}
          </Text>
        </Pressable>

        {(plan.phases ?? []).length === 0 ? (
          <Text className="mt-6 text-center text-slate-500">
            {'\u03A0\u03C1\u03BF\u03C3\u03B8\u03AD\u03C3\u03C4\u03B5 \u03BC\u03AF\u03B1 \u03C6\u03AC\u03C3\u03B7 \u03BA\u03B1\u03B9 \u03C0\u03C1\u03BF\u03C3\u03B8\u03AD\u03C3\u03C4\u03B5 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2.'}
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
                  {PRIORITY_LABEL[phase.priority]} · {phase.status}
                </Text>
              </View>

              {phase.items.length === 0 ? (
                <Text className="px-4 py-3 text-sm text-slate-500">
                  {'\u039A\u03B1\u03BC\u03AF\u03B1 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1.'}
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
                        {'\u0394\u03CC\u03BD\u03C4\u03B9\u03B1: '}
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
                        {ITEM_STATUS_LABEL[item.status]}
                        {item.treatmentId
                          ? ' \u00B7 \u03A3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF'
                          : ''}
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
                            {ITEM_STATUS_LABEL[st]}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable
                        onPress={() => confirmDeleteItem(item)}
                        className="rounded-lg bg-red-50 px-2 py-1">
                        <Text className="text-xs text-red-700">
                          {'\u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7'}
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
                  {'\u0398\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1 \u03C3\u03C4\u03B7 \u03C6\u03AC\u03C3\u03B7'}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          onPress={confirmDeletePlan}
          className="mt-8 items-center rounded-xl border border-red-200 bg-red-50 py-3">
          <Text className="font-semibold text-red-700">
            {'\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03C7\u03B5\u03B4\u03AF\u03BF\u03C5'}
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
            <Text className="text-lg font-bold">{'\u039D\u03AD\u03B1 \u03C6\u03AC\u03C3\u03B7'}</Text>
            <TextInput
              className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5"
              placeholder={'\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C6\u03AC\u03C3\u03B7\u03C2'}
              value={phaseName}
              onChangeText={setPhaseName}
            />
            <Text className="mb-2 mt-3 text-sm text-slate-600">
              {'\u03A0\u03C1\u03BF\u03C4\u03B5\u03C1\u03B1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1'}
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
                    {PRIORITY_LABEL[p]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={() => setPhaseModal(false)}
                className="flex-1 rounded-xl border py-3">
                <Text className="text-center font-semibold">{'\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7'}</Text>
              </Pressable>
              <Pressable
                onPress={savePhase}
                disabled={busy}
                className="flex-1 rounded-xl bg-blue-600 py-3">
                <Text className="text-center font-semibold text-white">
                  {'\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7'}
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
                {'\u0398\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1'}
              </Text>
              <Text className="mb-2 mt-3 text-sm font-medium text-slate-700">
                {'\u03A4\u03CD\u03C0\u03BF\u03C2'}
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
                {'\u0394\u03CC\u03BD\u03C4\u03B9\u03B1 (FDI, \u03C0.\u03C7. 11, 12 \u03AE 25)'}
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={itemTeeth}
                onChangeText={setItemTeeth}
                placeholder="11, 12"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="mb-1 mt-2 text-sm font-medium text-slate-700">
                {'\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE'}
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={itemDesc}
                onChangeText={setItemDesc}
              />
              <Text className="mb-1 mt-2 text-sm font-medium text-slate-700">
                {'\u0395\u03BA\u03C4\u03B9\u03BC\u03C9\u03BC\u03AD\u03BD\u03BF \u03BA\u03CC\u03C3\u03C4\u03BF\u03C2 (\u20AC)'}
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
                  <Text className="text-center font-semibold">{'\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7'}</Text>
                </Pressable>
                <Pressable
                  onPress={saveItem}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-blue-600 py-3">
                  <Text className="text-center font-semibold text-white">
                    {'\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7'}
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
