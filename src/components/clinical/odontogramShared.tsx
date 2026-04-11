/**
 * Shared FDI chart helpers, tooth cell, and legend (used by ArcOdontogram).
 */

import React, {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import Svg, {G, Line, Path} from 'react-native-svg';
import {
  SILHOUETTE_VB,
  bridgeConnectorYs,
  fdiToMorphology,
  getSilhouettePaths,
  implantBodyPath,
  implantThreadYs,
} from './toothSilhouettePaths';
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
  /** Bridge pontic / connector — magenta (anatomical chart spec). */
  swatchBridge: {
    borderWidth: 2,
    borderColor: '#DB2777',
    backgroundColor: 'rgba(236,72,153,0.25)',
  },
  /** Post & Core: orange family + gold accent in chart; legend uses gold border. */
  swatchPostCore: {
    borderWidth: 2,
    borderColor: '#CA8A04',
    backgroundColor: 'rgba(249,115,22,0.22)',
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
 * Bridge: magenta. Post & Core legend: orange fill + gold border (gold post in SVG).
 */
const LEGEND_SWATCH_BY_PROCEDURE_INDEX = [
  styles.swatchFilling,
  styles.swatchRootCanal,
  styles.swatchMissing,
  styles.swatchCrown,
  styles.swatchBridge,
  styles.swatchImplant,
  styles.swatchPostCore,
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
    case TOOTH_CONDITIONS.POST_CORE:
      return {
        box: 'border-2 border-[#CA8A04] bg-[rgba(249,115,22,0.22)]',
        label: 'text-[#9A3412]',
      };
    case TOOTH_CONDITIONS.CROWN:
      return {
        box: 'border-2 border-[#A855F7] bg-[rgba(168,85,247,0.22)]',
        label: 'text-[#581C87]',
      };
    case TOOTH_CONDITIONS.BRIDGE:
      return {
        box: 'border-2 border-[#DB2777] bg-[rgba(236,72,153,0.25)]',
        label: 'text-[#9D174D]',
      };
    case TOOTH_CONDITIONS.IMPLANT:
      return {
        box: 'border-2 border-[#4682B4] bg-[rgba(70,130,180,0.22)]',
        label: 'text-[#1a3d52]',
      };
    case TOOTH_CONDITIONS.GINGIVECTOMY:
      return {
        box: 'border-2 border-[#EF4444] bg-white',
        label: 'text-[#991B1B]',
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
  /** FDI number above (upper arch) or below (lower arch) the schematic tooth. */
  labelPosition: 'above' | 'below';
}

function toothAccessibilityStatus(condition: ToothCondition): string {
  return condition === TOOTH_CONDITIONS.CLEANING ? 'Healthy' : condition;
}

const schematic = StyleSheet.create({
  slot: {
    alignItems: 'center',
  },
  fdi: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  body: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  missingXWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Clinical silhouette SVG (crown/root split) + same procedure logic as before. Legend unchanged. */
export const ToothCell: React.FC<ToothCellProps> = ({
  toothNumber,
  condition,
  onPress,
  width,
  height,
  labelPosition,
}) => {
  const morph = useMemo(() => fdiToMorphology(toothNumber), [toothNumber]);
  const {crown: crownD, root: rootD} = useMemo(
    () => getSilhouettePaths(morph),
    [morph],
  );
  const implantPath = useMemo(() => implantBodyPath(morph), [morph]);
  const threadsY = useMemo(() => implantThreadYs(morph), [morph]);
  const bridgeY = useMemo(() => bridgeConnectorYs(morph), [morph]);

  const missing = condition === TOOTH_CONDITIONS.MISSING;
  const implant = condition === TOOTH_CONDITIONS.IMPLANT;
  const gingivectomy = condition === TOOTH_CONDITIONS.GINGIVECTOMY;
  const bridge = condition === TOOTH_CONDITIONS.BRIDGE;

  let crownFill = '#f1f5f9';
  let crownStroke = '#64748b';
  let crownSw = 0.9;
  let rootFill = '#e2e8f0';
  let rootStroke = '#64748b';
  let rootSw = 0.9;
  let groupOpacity = 1;

  if (missing) {
    groupOpacity = 0.4;
    crownFill = '#e5e7eb';
    rootFill = '#e5e7eb';
    crownStroke = '#9ca3af';
    rootStroke = '#9ca3af';
  } else if (condition === TOOTH_CONDITIONS.FILLING) {
    crownFill = '#3B82F6';
    crownStroke = '#1D4ED8';
  } else if (condition === TOOTH_CONDITIONS.CARIES) {
    crownFill = '#FFFFFF';
    crownStroke = '#EF4444';
    crownSw = 2.2;
  } else if (condition === TOOTH_CONDITIONS.CROWN) {
    crownFill = '#A855F7';
    crownStroke = '#7C3AED';
  } else if (bridge) {
    crownFill = '#EC4899';
    crownStroke = '#DB2777';
  } else if (condition === TOOTH_CONDITIONS.ROOT_CANAL) {
    rootFill = '#F97316';
    rootStroke = '#C2410C';
  } else if (condition === TOOTH_CONDITIONS.POST_CORE) {
    rootFill = '#EAB308';
    rootStroke = '#CA8A04';
  } else if (implant) {
    rootFill = '#4682B4';
    rootStroke = '#1e3a5f';
  }

  const cejY =
    morph === 'molar' ? 66 : morph === 'premolar' ? 55 : morph === 'canine' ? 50 : 49;

  const labelEl = (
    <Text style={[schematic.fdi, {width}]} numberOfLines={1}>
      {toothNumber}
    </Text>
  );

  return (
    <View style={[schematic.slot, {width}]}>
      {labelPosition === 'above' ? labelEl : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tooth ${toothNumber}, ${toothAccessibilityStatus(condition)}`}
        onPress={() => onPress(toothNumber)}
        hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
        style={[schematic.body, {width, height}]}>
        {missing ? (
          <View style={{width, height, backgroundColor: '#f1f5f9'}}>
            <Svg width={width} height={height} viewBox={`0 0 ${SILHOUETTE_VB.w} ${SILHOUETTE_VB.h}`}>
              <G opacity={0.45}>
                <Path d={crownD} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
                <Path d={rootD} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
              </G>
            </Svg>
            <View style={schematic.missingXWrap} pointerEvents="none">
              <MaterialIcons name="close" size={Math.min(28, height * 0.55)} color="#374151" />
            </View>
          </View>
        ) : (
          <Svg width={width} height={height} viewBox={`0 0 ${SILHOUETTE_VB.w} ${SILHOUETTE_VB.h}`}>
            <G opacity={groupOpacity}>
              {!implant && (
                <>
                  <Path
                    d={rootD}
                    fill={rootFill}
                    stroke={rootStroke}
                    strokeWidth={rootSw}
                    strokeLinejoin="round"
                  />
                  <Path
                    d={crownD}
                    fill={crownFill}
                    stroke={crownStroke}
                    strokeWidth={crownSw}
                    strokeLinejoin="round"
                  />
                </>
              )}
              {implant && (
                <>
                  <Path
                    d={crownD}
                    fill={crownFill}
                    stroke={crownStroke}
                    strokeWidth={crownSw}
                    strokeLinejoin="round"
                  />
                  <Path
                    d={implantPath}
                    fill={rootFill}
                    stroke={rootStroke}
                    strokeWidth={1}
                    strokeLinejoin="round"
                  />
                  {threadsY.map((y) => (
                    <Line
                      key={y}
                      x1={43}
                      x2={57}
                      y1={y}
                      y2={y}
                      stroke="#1e3a5f"
                      strokeWidth={0.85}
                    />
                  ))}
                </>
              )}
              {gingivectomy && (
                <Line
                  x1={18}
                  y1={cejY}
                  x2={82}
                  y2={cejY}
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              )}
              {bridge && (
                <G stroke="#F472B6" strokeWidth={2} strokeLinecap="round">
                  <Line x1={-2} y1={bridgeY} x2={10} y2={bridgeY} />
                  <Line x1={90} y1={bridgeY} x2={102} y2={bridgeY} />
                </G>
              )}
            </G>
          </Svg>
        )}
      </Pressable>
      {labelPosition === 'below' ? labelEl : null}
    </View>
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
