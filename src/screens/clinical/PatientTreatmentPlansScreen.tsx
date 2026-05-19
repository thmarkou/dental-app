/**
 * List of treatment plans for a patient.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';
import {getPatientById} from '../../services/patient';
import {
  createTreatmentPlan,
  getPatientTreatmentPlans,
  getPlanLedgerPostingSummary,
  type TreatmentPlanRow,
  type TreatmentPlanStatus,
} from '../../services/clinical/treatmentPlan.service';
import {useAuthStore} from '../../store/auth.store';
import type {PatientsStackParamList} from '../../navigation/navigation.types';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {
  el,
  treatmentPlanLedgerPartial,
  treatmentPlanStatusLabel,
  UI_LOCALE,
} from '../../i18n';

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientTreatmentPlans'>;

const STATUS_COLOR: Record<TreatmentPlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  presented: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-900',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const currencyEl = (n: number) =>
  new Intl.NumberFormat(UI_LOCALE, {style: 'currency', currency: 'EUR'}).format(n);

const PatientTreatmentPlansScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;
  const {user} = useAuthStore();

  const [patientName, setPatientName] = useState('');
  const [plans, setPlans] = useState<TreatmentPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getPatientById(patientId);
      setPatientName(p ? `${p.firstName} ${p.lastName}` : '');
      setPlans(getPatientTreatmentPlans(patientId));
    } catch (e) {
      console.error(e);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openCreate = () => {
    setNewTitle('');
    setNewDesc('');
    setModalOpen(true);
  };

  const savePlan = () => {
    if (!newTitle.trim()) {
      Alert.alert(el.common.error, el.treatmentPlans.titleRequired);
      return;
    }
    setSaving(true);
    try {
      const plan = createTreatmentPlan({
        patientId,
        title: newTitle,
        description: newDesc || null,
        createdBy: user?.id ?? null,
      });
      setModalOpen(false);
      navigation.navigate('PatientTreatmentPlanDetail', {
        patientId,
        planId: plan.id,
      });
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.treatmentPlans.createFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <View className="flex-1 bg-slate-50">
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{padding: pad, paddingBottom: 32}}
          ListHeaderComponent={
            <>
              <Text className="text-lg font-semibold text-slate-900">
                {patientName || el.common.patient} — {el.treatmentPlans.headerSuffix}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{el.treatmentPlans.intro}</Text>
              <Pressable
                onPress={openCreate}
                className="mt-4 flex-row items-center justify-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700">
                <MaterialIcons name="add" size={22} color="#fff" />
                <Text className="ml-1 text-base font-semibold text-white">
                  {el.treatmentPlans.newPlan}
                </Text>
              </Pressable>
            </>
          }
          ListEmptyComponent={
            <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-12">
              <MaterialIcons name="assignment" size={44} color="#94a3b8" />
              <Text className="mt-3 text-center text-slate-600">
                {el.treatmentPlans.noPlans}
              </Text>
            </View>
          }
          renderItem={({item}) => {
            const ledger = getPlanLedgerPostingSummary(item.id);
            const showLedger =
              item.status === 'completed' && ledger.activeItemCount > 0;
            const allPosted =
              ledger.postedToLedgerCount === ledger.activeItemCount;
            const nonePosted = ledger.postedToLedgerCount === 0;

            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('PatientTreatmentPlanDetail', {
                    patientId,
                    planId: item.id,
                  })
                }
                className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-base font-semibold text-slate-900">
                    {item.title}
                  </Text>
                  <View className={`rounded-full px-2.5 py-1 ${STATUS_COLOR[item.status]}`}>
                    <Text className="text-xs font-semibold">
                      {treatmentPlanStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {item.description ? (
                  <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text className="mt-2 text-sm font-semibold text-slate-800">
                  {currencyEl(item.totalEstimatedCost)}
                </Text>
                {showLedger ? (
                  <View
                    className={`mt-2 flex-row items-center rounded-lg px-2.5 py-1.5 ${
                      allPosted
                        ? 'bg-emerald-50'
                        : nonePosted
                          ? 'bg-amber-50'
                          : 'bg-amber-50'
                    }`}>
                    <MaterialIcons
                      name={
                        allPosted
                          ? 'check-circle'
                          : nonePosted
                            ? 'warning'
                            : 'info'
                      }
                      size={16}
                      color={allPosted ? '#059669' : '#d97706'}
                    />
                    <Text
                      className={`ml-1.5 flex-1 text-xs font-medium ${
                        allPosted ? 'text-emerald-800' : 'text-amber-900'
                      }`}>
                      {allPosted
                        ? el.treatmentPlans.ledgerAllPosted
                        : nonePosted
                          ? el.treatmentPlans.ledgerNonePosted
                          : treatmentPlanLedgerPartial(
                              ledger.postedToLedgerCount,
                              ledger.activeItemCount,
                            )}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setModalOpen(false)}>
          <Pressable
            className="rounded-t-2xl bg-white p-5 pb-8"
            onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-slate-900">
              {el.treatmentPlans.newPlanModalTitle}
            </Text>
            <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">
              {el.treatmentPlans.titleLabel}
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-base"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={el.treatmentPlans.titlePlaceholder}
            />
            <Text className="mb-1 mt-3 text-sm font-medium text-slate-700">
              {el.treatmentPlans.descriptionOptional}
            </Text>
            <TextInput
              className="min-h-[72px] rounded-lg border border-slate-200 px-3 py-2.5 text-base"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />
            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3">
                <Text className="text-center font-semibold text-slate-700">
                  {el.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={savePlan}
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 py-3 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    {el.treatmentPlans.create}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenSafeArea>
  );
};

export default PatientTreatmentPlansScreen;
