/**
 * Shows patient balance: red if amount owed, green if clear (credit or zero).
 * Currency formatted with Greek locale (e.g. 50,00 €).
 */

import React, {useCallback, useState} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getPatientBalance} from '../../services/financial/payment.service';

const currencyElGR = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export interface BalanceBadgeProps {
  patientId: string;
}

const BalanceBadge: React.FC<BalanceBadgeProps> = ({patientId}) => {
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(() => {
    try {
      const b = getPatientBalance(patientId);
      setBalance(Number.isFinite(b) ? b : 0);
    } catch {
      setBalance(0);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (balance === null) {
    return (
      <View className="flex-row items-center gap-2 py-1">
        <ActivityIndicator size="small" color="#64748b" />
        <Text className="text-sm text-slate-500">Balance…</Text>
      </View>
    );
  }

  const owes = balance > 0.005;
  const label = owes ? 'Owed' : 'Balance';

  return (
    <View
      className={`self-start rounded-full border px-3 py-1.5 ${
        owes ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
      }`}>
      <Text
        className={`text-sm font-semibold ${owes ? 'text-red-700' : 'text-emerald-700'}`}>
        {label}: {currencyElGR(Math.abs(balance))}
        {!owes && balance < -0.005 ? ' (credit)' : ''}
      </Text>
    </View>
  );
};

export default BalanceBadge;
