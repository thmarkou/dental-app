/**
 * Chronological treatment log for a patient (treatments + optional appointment context).
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {PatientsStackParamList} from '../../navigation/navigation.types';
import {
  getPatientHistory,
  type ClinicalHistoryRow,
} from '../../services/clinical/treatment.service';
import {getPatientById} from '../../services/patient';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

type Nav = NativeStackNavigationProp<PatientsStackParamList, 'PatientTreatmentHistory'>;

const PatientTreatmentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;

  const [title, setTitle] = useState('');
  const [items, setItems] = useState<ClinicalHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [patient, history] = await Promise.all([
        getPatientById(patientId),
        getPatientHistory(patientId),
      ]);
      if (patient) {
        setTitle(`${patient.firstName} ${patient.lastName}`);
      }
      setItems(history);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const formatWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('el-GR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const renderItem = ({item}: {item: ClinicalHistoryRow}) => (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens dental chart to edit this treatment"
      onPress={() =>
        navigation.navigate('PatientChart', {patientId, openTreatmentId: item.id})
      }
      className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
      <Text className="text-xs font-medium text-slate-500">{formatWhen(item.createdAt)}</Text>

      <Text className="mt-2 text-base font-semibold leading-snug text-slate-900">
        {item.procedureType ?? '—'}
      </Text>

      <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        {item.toothNumber != null ? (
          <Text className="text-sm font-medium text-slate-700">
            Tooth <Text className="font-bold text-slate-900">{item.toothNumber}</Text>
          </Text>
        ) : (
          <View className="rounded-md bg-slate-200 px-2 py-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-800">
              General
            </Text>
          </View>
        )}
        <Text className="text-sm text-slate-700">
          Cost:{' '}
          <Text className="font-semibold text-slate-900">
            {item.cost != null ? `€${item.cost.toFixed(2)}` : '—'}
          </Text>
        </Text>
      </View>

      {item.notes ? (
        <Text
          className="mt-3 text-sm leading-relaxed text-slate-800"
          numberOfLines={3}>
          {item.notes}
        </Text>
      ) : (
        <Text className="mt-3 text-sm italic text-slate-400">No notes</Text>
      )}

      <Text className="mt-2 text-xs text-slate-400">Tap to edit or delete</Text>

      {item.appointmentDate ? (
        <Text className="mt-2 text-xs text-slate-500">
          Appointment: {item.appointmentDate}
          {item.appointmentStartTime ? ` ${item.appointmentStartTime}` : ''}
          {item.appointmentType ? ` • ${item.appointmentType}` : ''}
          {item.appointmentStatus ? ` (${item.appointmentStatus})` : ''}
        </Text>
      ) : null}
    </Pressable>
  );

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
    <View className="flex-1 bg-slate-50" style={{paddingHorizontal: pad, paddingTop: 12}}>
      <Text className="mb-3 text-center text-base font-semibold text-slate-800">{title}</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="py-8 text-center text-slate-500">No treatments recorded yet.</Text>
        }
        contentContainerStyle={{paddingBottom: 32}}
      />
    </View>
    </ScreenSafeArea>
  );
};

export default PatientTreatmentHistoryScreen;
