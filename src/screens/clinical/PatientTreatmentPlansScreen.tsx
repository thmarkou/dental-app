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

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientTreatmentPlans'>;

const STATUS_LABEL: Record<TreatmentPlanStatus, string> = {
  draft: '\u03A0\u03C1\u03CC\u03C7\u03B5\u03B9\u03C1\u03BF',
  presented: '\u03A0\u03B1\u03C1\u03BF\u03C5\u03C3\u03B9\u03AC\u03C3\u03C4\u03B7\u03BA\u03B5',
  approved: '\u0395\u03B3\u03BA\u03B5\u03BA\u03C1\u03B9\u03BC\u03AD\u03BD\u03BF',
  in_progress: '\u03A3\u03B5 \u03B5\u03BE\u03AD\u03BB\u03B9\u03BE\u03B7',
  completed: '\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
  cancelled: '\u0391\u03BA\u03C5\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5',
};

const STATUS_COLOR: Record<TreatmentPlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  presented: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-900',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const currencyEl = (n: number) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: 'EUR'}).format(n);

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
      Alert.alert(
        '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
        '\u0394\u03CE\u03C3\u03C4\u03B5 \u03C4\u03AF\u03C4\u03BB\u03BF \u03C3\u03C7\u03B5\u03B4\u03AF\u03BF\u03C5.',
      );
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
        '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
        e instanceof Error ? e.message : 'Could not create plan.',
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
                {patientName || '\u0391\u03C3\u03B8\u03B5\u03BD\u03AE\u03C2'} —{' '}
                {'\u03A3\u03C7\u03AD\u03B4\u03B9\u03B1 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1\u03C2'}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                {'\u03A6\u03AC\u03C3\u03B5\u03B9\u03C2 \u03BA\u03B1\u03B9 \u03B5\u03C5\u03C1\u03CE\u03C0\u03B7 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u03B1\u03BD\u03AC \u03B1\u03C3\u03B8\u03B5\u03BD\u03AE.'}
              </Text>
              <Pressable
                onPress={openCreate}
                className="mt-4 flex-row items-center justify-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700">
                <MaterialIcons name="add" size={22} color="#fff" />
                <Text className="ml-1 text-base font-semibold text-white">
                  {'\u039D\u03AD\u03BF \u03C3\u03C7\u03AD\u03B4\u03B9\u03BF'}
                </Text>
              </Pressable>
            </>
          }
          ListEmptyComponent={
            <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-12">
              <MaterialIcons name="assignment" size={44} color="#94a3b8" />
              <Text className="mt-3 text-center text-slate-600">
                {'\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03C3\u03C7\u03AD\u03B4\u03B9\u03B1.'}
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
                      {STATUS_LABEL[item.status]}
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
                        ? '\u0388\u03C7\u03B5\u03B9 \u03C0\u03B5\u03C1\u03AC\u03C3\u03B5\u03B9 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF'
                        : nonePosted
                          ? '\u039A\u03B1\u03BC\u03AF\u03B1 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF'
                          : `\u03A7\u03C1\u03B5\u03CE\u03C3\u03B5\u03B9\u03C2 \u03C3\u03C4\u03BF \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF: ${ledger.postedToLedgerCount}/${ledger.activeItemCount}`}
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
              {'\u039D\u03AD\u03BF \u03C3\u03C7\u03AD\u03B4\u03B9\u03BF \u03B8\u03B5\u03B1\u03C0\u03B5\u03AF\u03B1\u03C2'}
            </Text>
            <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">
              {'\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2'}
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-base"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={'\u03C0.\u03C7. \u03A0\u03BB\u03AE\u03C1\u03B5\u03C2 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1'}
            />
            <Text className="mb-1 mt-3 text-sm font-medium text-slate-700">
              {'\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE (\u03C0\u03B1\u03B9\u03C1\u03B5\u03C4\u03B9\u03BA\u03AC)'}
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
                  {'\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7'}
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
                    {'\u0394\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1'}
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
