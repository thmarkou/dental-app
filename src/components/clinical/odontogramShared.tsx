/**
 * Shared FDI chart helpers, tooth cell, and legend (used by ArcOdontogram).
 */

import React from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {
  TOOTH_CONDITIONS,
  TOOTH_SITE_PROCEDURE_VALUES,
  coerceToothCondition,
  type DentalChartRow,
  type ToothCondition,
} from '../../services/clinical/treatment.service';

export interface OdontogramProps {
  chartRows: DentalChartRow[];
  onToothPress: (toothNumber: number) => void;
  /** Wider cells on tablets / landscape */
  comfortableLayout?: boolean;
}

const styles = StyleSheet.create({
  legendScroll: {
    maxHeight: 320,
    width: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 8,
    columnGap: 8,
    paddingBottom: 4,
  },
  legendCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginBottom: 4,
  },
  legendSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    flexShrink: 0,
  },
  swatchCaries: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  swatchFilling: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.22)',
  },
  swatchRootCanal: {
    borderWidth: 2,
    borderColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.22)',
  },
  swatchCrown: {
    borderWidth: 2,
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168,85,247,0.22)',
  },
  /** Emerald — distinct from crown (purple), filling (blue), implant (steel), orange, red, gray. */
  swatchBridge: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: 'rgba(5,150,105,0.22)',
  },
  swatchImplant: {
    borderWidth: 2,
    borderColor: '#4682B4',
    backgroundColor: 'rgba(70,130,180,0.22)',
  },
  swatchMissing: {
    borderWidth: 2,
    borderColor: '#6B7280',
    backgroundColor: 'rgba(107,114,128,0.35)',
  },
  swatchHealthy: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#334155',
    fontWeight: '500',
  },
});

/**
 * Legend swatches mirror modal order in TOOTH_SITE_PROCEDURE_VALUES (8 rows).
 * Bridge uses emerald; Root Canal and Post & Core share orange.
 */
const LEGEND_SWATCH_BY_PROCEDURE_INDEX = [
  styles.swatchFilling,
  styles.swatchRootCanal,
  styles.swatchMissing,
  styles.swatchCrown,
  styles.swatchBridge,
  styles.swatchImplant,
  styles.swatchRootCanal,
  styles.swatchCaries,
] as const;

export function conditionVisualClasses(condition: ToothCondition): {
  box: string;
  label: string;
} {
  switch (condition) {
    case TOOTH_CONDITIONS.MISSING:
      return {
        box: 'border-2 border-[#6B7280] bg-[rgba(107,114,128,0.35)]',
        label: 'text-[#374151]',
      };
    case TOOTH_CONDITIONS.CARIES:
      return {
        box: 'border-2 border-[#EF4444] bg-white',
        label: 'text-[#991B1B]',
      };
    case TOOTH_CONDITIONS.FILLING:
      return {
        box: 'border-2 border-[#3B82F6] bg-[rgba(59,130,246,0.22)]',
        label: 'text-[#1E3A8A]',
      };
    case TOOTH_CONDITIONS.ROOT_CANAL:
      return {
        box: 'border-2 border-[#F97316] bg-[rgba(249,115,22,0.22)]',
        label: 'text-[#9A3412]',
      };
    case TOOTH_CONDITIONS.CROWN:
      return {
        box: 'border-2 border-[#A855F7] bg-[rgba(168,85,247,0.22)]',
        label: 'text-[#581C87]',
      };
    case TOOTH_CONDITIONS.BRIDGE:
      return {
        box: 'border-2 border-[#059669] bg-[rgba(5,150,105,0.22)]',
        label: 'text-[#065F46]',
      };
    case TOOTH_CONDITIONS.IMPLANT:
      return {
        box: 'border-2 border-[#4682B4] bg-[rgba(70,130,180,0.22)]',
        label: 'text-[#1a3d52]',
      };
    case TOOTH_CONDITIONS.CLEANING:
    default:
      return {
        box: 'border-2 border-slate-300 bg-white',
        label: 'text-slate-800',
      };
  }
}

export function buildChartLookup(rows: DentalChartRow[]): Map<number, ToothCondition> {
  const map = new Map<number, ToothCondition>();
  for (const row of rows) {
    map.set(row.toothNumber, coerceToothCondition(row.condition));
  }
  return map;
}

export interface ToothCellProps {
  toothNumber: number;
  condition: ToothCondition;
  onPress: (n: number) => void;
  width: number;
  height: number;
}

function toothAccessibilityStatus(condition: ToothCondition): string {
  return condition === TOOTH_CONDITIONS.CLEANING ? 'Healthy' : condition;
}

export const ToothCell: React.FC<ToothCellProps> = ({
  toothNumber,
  condition,
  onPress,
  width,
  height,
}) => {
  const {box, label} = conditionVisualClasses(condition);
  const missing = condition === TOOTH_CONDITIONS.MISSING;
  const iconSize = height >= 40 ? 20 : 16;

  const numberStyle = {
    textAlign: 'center' as const,
    textShadowColor: 'rgba(255,255,255,0.92)',
    textShadowOffset: {width: 0, height: 0.5},
    textShadowRadius: 2.5,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tooth ${toothNumber}, ${toothAccessibilityStatus(condition)}`}
      onPress={() => onPress(toothNumber)}
      hitSlop={{top: 10, bottom: 10, left: 5, right: 5}}
      className={`items-center justify-center rounded-md ${box}`}
      style={{
        width,
        height,
        alignSelf: 'stretch',
        zIndex: 20,
      }}>
      {missing ? (
        <View className="items-center justify-center">
          <MaterialIcons name="close" size={iconSize} color="#6B7280" />
          <Text
            className={`text-[11px] font-semibold ${label}`}
            style={numberStyle}>
            {toothNumber}
          </Text>
        </View>
      ) : (
        <Text className={`text-[11px] font-semibold ${label}`} style={numberStyle}>
          {toothNumber}
        </Text>
      )}
    </Pressable>
  );
};

export const OdontogramLegend: React.FC = () => (
  <View className="mt-2 w-full max-w-4xl self-center rounded-xl border border-slate-200 bg-white px-3 py-2">
    <Text className="mb-1 text-center text-sm font-semibold text-slate-800">Legend</Text>
    <ScrollView
      style={styles.legendScroll}
      nestedScrollEnabled
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled">
      <View style={styles.legendGrid}>
        {TOOTH_SITE_PROCEDURE_VALUES.map((fullLabel, index) => (
          <View key={fullLabel} style={styles.legendCell}>
            <View
              style={[
                styles.legendSwatch,
                LEGEND_SWATCH_BY_PROCEDURE_INDEX[index] ?? styles.swatchHealthy,
              ]}
            />
            <Text style={styles.legendLabel}>{fullLabel}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);
