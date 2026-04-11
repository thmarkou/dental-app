/**
 * FDI odontogram (11–18, 21–28, 31–38, 41–48) with quadrant layout.
 */

import React, {useMemo} from 'react';
import {View, Text, Pressable, useWindowDimensions} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {
  TOOTH_CONDITIONS,
  type DentalChartRow,
  type ToothCondition,
} from '../../services/clinical/treatment.service';

export interface OdontogramProps {
  chartRows: DentalChartRow[];
  onToothPress: (toothNumber: number) => void;
  /** Wider cells and gaps for tablets / landscape */
  comfortableLayout?: boolean;
}

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const LEGACY_CONDITION_MAP: Record<string, ToothCondition> = {
  FILLED: TOOTH_CONDITIONS.FILLING,
  MISSING: TOOTH_CONDITIONS.MISSING,
  MISSING_TOOTH: TOOTH_CONDITIONS.MISSING,
  HEALTHY: TOOTH_CONDITIONS.HEALTHY,
  ROOT_CANAL_TREATED: TOOTH_CONDITIONS.ENDO,
  IMPLANT: TOOTH_CONDITIONS.CROWN,
  CROWN: TOOTH_CONDITIONS.CROWN,
  BRIDGE: TOOTH_CONDITIONS.BRIDGE,
  CARIES: TOOTH_CONDITIONS.CARIES,
  FILLING: TOOTH_CONDITIONS.FILLING,
  ENDO: TOOTH_CONDITIONS.ENDO,
};

const ALL_CANONICAL = new Set<string>(Object.values(TOOTH_CONDITIONS));

export function normalizeToothCondition(
  raw: string | null | undefined,
): ToothCondition {
  if (raw == null || String(raw).trim() === '') {
    return TOOTH_CONDITIONS.HEALTHY;
  }
  const u = String(raw).trim().toUpperCase();
  if (ALL_CANONICAL.has(u)) {
    return u as ToothCondition;
  }
  return LEGACY_CONDITION_MAP[u] ?? TOOTH_CONDITIONS.HEALTHY;
}

function conditionVisualClasses(condition: ToothCondition): {
  box: string;
  label: string;
} {
  switch (condition) {
    case TOOTH_CONDITIONS.MISSING:
      return {
        box: 'border-slate-500 bg-slate-300 opacity-70',
        label: 'text-slate-600',
      };
    case TOOTH_CONDITIONS.CARIES:
      return {
        box: 'border-red-600 bg-red-200',
        label: 'text-red-900',
      };
    case TOOTH_CONDITIONS.FILLING:
      return {
        box: 'border-blue-600 bg-blue-200',
        label: 'text-blue-900',
      };
    case TOOTH_CONDITIONS.ENDO:
      return {
        box: 'border-orange-600 bg-orange-200',
        label: 'text-orange-900',
      };
    case TOOTH_CONDITIONS.CROWN:
      return {
        box: 'border-violet-600 bg-violet-200',
        label: 'text-violet-900',
      };
    case TOOTH_CONDITIONS.BRIDGE:
      return {
        box: 'border-teal-600 bg-teal-200',
        label: 'text-teal-900',
      };
    case TOOTH_CONDITIONS.HEALTHY:
    default:
      return {
        box: 'border-emerald-500 bg-emerald-100',
        label: 'text-emerald-900',
      };
  }
}

function buildChartLookup(rows: DentalChartRow[]): Map<number, ToothCondition> {
  const map = new Map<number, ToothCondition>();
  for (const row of rows) {
    map.set(row.toothNumber, normalizeToothCondition(row.condition));
  }
  return map;
}

interface ToothCellProps {
  toothNumber: number;
  condition: ToothCondition;
  onPress: (n: number) => void;
  minWidth: number;
  minHeight: number;
}

const ToothCell: React.FC<ToothCellProps> = ({
  toothNumber,
  condition,
  onPress,
  minWidth,
  minHeight,
}) => {
  const {box, label} = conditionVisualClasses(condition);
  const missing = condition === TOOTH_CONDITIONS.MISSING;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tooth ${toothNumber}, ${condition}`}
      onPress={() => onPress(toothNumber)}
      className={`items-center justify-center rounded-md border-2 ${box} m-0.5`}
      style={{minWidth, minHeight}}>
      {missing ? (
        <View className="items-center justify-center">
          <MaterialIcons name="close" size={minHeight > 44 ? 22 : 18} color="#475569" />
          <Text className={`text-[10px] font-medium ${label}`}>{toothNumber}</Text>
        </View>
      ) : (
        <Text className={`text-xs font-semibold ${label}`}>{toothNumber}</Text>
      )}
    </Pressable>
  );
}

const QuadrantBlock: React.FC<{
  title: string;
  teeth: number[];
  lookup: Map<number, ToothCondition>;
  onToothPress: (n: number) => void;
  cellW: number;
  cellH: number;
}> = ({title, teeth, lookup, onToothPress, cellW, cellH}) => (
  <View className="items-center">
    <Text className="mb-1 text-center text-xs font-medium text-slate-500">{title}</Text>
    <View className="flex-row flex-wrap justify-center">
      {teeth.map((n) => (
        <ToothCell
          key={n}
          toothNumber={n}
          condition={lookup.get(n) ?? TOOTH_CONDITIONS.HEALTHY}
          onPress={onToothPress}
          minWidth={cellW}
          minHeight={cellH}
        />
      ))}
    </View>
  </View>
);

export const Odontogram: React.FC<OdontogramProps> = ({
  chartRows,
  onToothPress,
  comfortableLayout: comfortableProp,
}) => {
  const {width} = useWindowDimensions();
  const comfortable = comfortableProp ?? width >= 720;
  const cellW = comfortable ? 52 : 40;
  const cellH = comfortable ? 56 : 44;

  const lookup = useMemo(() => buildChartLookup(chartRows), [chartRows]);

  return (
    <View className="w-full max-w-4xl self-center px-2 py-3">
      <Text className="mb-3 text-center text-sm font-semibold text-slate-700">
        Upper arch (FDI)
      </Text>
      <View className="mb-4 flex-row flex-wrap items-start justify-center gap-3">
        <QuadrantBlock
          title="Upper right (18–11)"
          teeth={UPPER_RIGHT}
          lookup={lookup}
          onToothPress={onToothPress}
          cellW={cellW}
          cellH={cellH}
        />
        <QuadrantBlock
          title="Upper left (21–28)"
          teeth={UPPER_LEFT}
          lookup={lookup}
          onToothPress={onToothPress}
          cellW={cellW}
          cellH={cellH}
        />
      </View>

      <Text className="mb-3 text-center text-sm font-semibold text-slate-700">
        Lower arch (FDI)
      </Text>
      <View className="flex-row flex-wrap items-start justify-center gap-3">
        <QuadrantBlock
          title="Lower right (48–41)"
          teeth={LOWER_RIGHT}
          lookup={lookup}
          onToothPress={onToothPress}
          cellW={cellW}
          cellH={cellH}
        />
        <QuadrantBlock
          title="Lower left (31–38)"
          teeth={LOWER_LEFT}
          lookup={lookup}
          onToothPress={onToothPress}
          cellW={cellW}
          cellH={cellH}
        />
      </View>
    </View>
  );
};

const LEGEND_ITEMS: {condition: ToothCondition; label: string}[] = [
  {condition: TOOTH_CONDITIONS.HEALTHY, label: 'Healthy'},
  {condition: TOOTH_CONDITIONS.CARIES, label: 'Caries'},
  {condition: TOOTH_CONDITIONS.FILLING, label: 'Filling'},
  {condition: TOOTH_CONDITIONS.ENDO, label: 'Endo (RCT)'},
  {condition: TOOTH_CONDITIONS.CROWN, label: 'Crown'},
  {condition: TOOTH_CONDITIONS.BRIDGE, label: 'Bridge'},
  {condition: TOOTH_CONDITIONS.MISSING, label: 'Missing'},
];

export const OdontogramLegend: React.FC = () => (
  <View className="mt-4 w-full max-w-4xl self-center rounded-xl border border-slate-200 bg-white p-4">
    <Text className="mb-3 text-center text-sm font-semibold text-slate-800">Legend</Text>
    <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2">
      {LEGEND_ITEMS.map(({condition, label}) => {
        const {box} = conditionVisualClasses(condition);
        return (
          <View key={condition} className="flex-row items-center gap-2">
            <View className={`h-4 w-4 rounded border-2 ${box}`} />
            <Text className="text-xs text-slate-700">{label}</Text>
          </View>
        );
      })}
    </View>
  </View>
);
