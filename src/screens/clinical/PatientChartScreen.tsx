/**
 * Patient dental chart (odontogram) with treatment recording modal.
 */

import React, {useCallback, useLayoutEffect, useState} from 'react';
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
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {PatientsStackParamList} from '../../navigation/navigation.types';
import {Odontogram, OdontogramLegend, normalizeToothCondition} from '../../components/clinical/Odontogram';
import {
  getPatientChart,
  recordTreatment,
  isToothPresent,
  type DentalChartRow,
} from '../../services/clinical/treatment.service';
import {getPatientById} from '../../services/patient';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientChart'>;

const TREATMENT_OPTIONS: {label: string; value: string}[] = [
  {label: 'Filling', value: 'Filling'},
  {label: 'Extraction', value: 'Extraction'},
  {label: 'Root Canal', value: 'Root Canal'},
  {label: 'Crown', value: 'Crown'},
  {label: 'Bridge', value: 'Bridge'},
  {label: 'Caries (chart)', value: 'Caries'},
  {label: 'Cleaning / Healthy', value: 'Cleaning'},
];

const PatientChartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();

  const [patientName, setPatientName] = useState<string>('');
  const [chartRows, setChartRows] = useState<DentalChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('Filling');
  const [notes, setNotes] = useState('');
  const [costText, setCostText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toothPresent, setToothPresent] = useState(true);

  const loadChart = useCallback(async () => {
    const rows = await getPatientChart(patientId);
    setChartRows(rows);
  }, [patientId]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [patient, rows] = await Promise.all([
        getPatientById(patientId),
        getPatientChart(patientId),
      ]);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
      }
      setChartRows(rows);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load dental chart.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('PatientTreatmentHistory', {patientId})}
          className="mr-2 rounded-lg px-3 py-2 active:bg-slate-100">
          <Text className="text-base font-medium text-blue-600">History</Text>
        </Pressable>
      ),
    });
  }, [navigation, patientId]);

  const openToothModal = async (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedTreatment('Filling');
    setNotes('');
    setCostText('');
    setModalVisible(true);
    const present = await isToothPresent(patientId, toothNumber);
    setToothPresent(present);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTooth(null);
  };

  const currentConditionLabel =
    selectedTooth == null
      ? '—'
      : normalizeToothCondition(
          chartRows.find((r) => r.toothNumber === selectedTooth)?.condition,
        );

  const submitTreatment = async () => {
    if (selectedTooth == null) {
      return;
    }
    const cost =
      costText.trim() === '' ? null : Number.parseFloat(costText.replace(',', '.'));
    if (costText.trim() !== '' && (cost == null || Number.isNaN(cost))) {
      Alert.alert('Invalid cost', 'Enter a valid number or leave cost empty.');
      return;
    }

    try {
      setSaving(true);
      await recordTreatment({
        patientId,
        toothNumber: selectedTooth,
        treatmentType: selectedTreatment,
        notes: notes.trim() === '' ? null : notes.trim(),
        cost,
      });
      await loadChart();
      closeModal();
      Alert.alert('Saved', 'Treatment recorded and chart updated.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save treatment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-slate-600">Loading chart…</Text>
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
        <View className="pt-3">
          <Text className="text-center text-lg font-bold text-slate-900">{patientName}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500">FDI notation • Tap a tooth</Text>
        </View>

        <Odontogram
          chartRows={chartRows}
          onToothPress={openToothModal}
          comfortableLayout={width >= 720}
        />

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
            <Text className="text-lg font-bold text-slate-900">Tooth {selectedTooth}</Text>
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

            <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">New treatment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row flex-wrap gap-2">
                {TREATMENT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSelectedTreatment(opt.value)}
                    className={`rounded-full border-2 px-3 py-2 ${
                      selectedTreatment === opt.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                    <Text
                      className={`text-xs font-medium ${
                        selectedTreatment === opt.value ? 'text-blue-800' : 'text-slate-700'
                      }`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className="mb-1 text-xs font-medium text-slate-600">Notes (UTF-8 / Greek OK)</Text>
            <TextInput
              className="mb-3 min-h-[72px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              placeholder="Clinical notes…"
              placeholderTextColor="#94a3b8"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <Text className="mb-1 text-xs font-medium text-slate-600">Cost (optional)</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={costText}
              onChangeText={setCostText}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={closeModal}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3 active:bg-slate-50">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void submitTreatment()}
                disabled={saving}
                className="flex-1 items-center rounded-xl bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">Save treatment</Text>
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
