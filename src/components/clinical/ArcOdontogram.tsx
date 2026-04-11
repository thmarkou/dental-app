/**
 * FDI odontogram (11–48) in a U-shaped dual-arch layout on a fixed design canvas.
 * Smooth ellipse-based arch with arc-length spacing, tangent gap fixes, and SVG guides.
 */

import React, {useMemo} from 'react';
import {View, Text, useWindowDimensions} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {
  TOOTH_CONDITIONS,
  type ToothCondition,
} from '../../services/clinical/treatment.service';
import {
  type OdontogramProps,
  buildChartLookup,
  ToothCell,
} from './odontogramShared';

/** Reference canvas (design px). Taller canvas gives top/bottom margin for labels. */
export const ARC_ODONTOGRAM_BASE_WIDTH = 400;
export const ARC_ODONTOGRAM_BASE_HEIGHT = 268;

/** Easier tap targets; gap is enforced along the arch tangent. */
const CELL_BASE_W = 34;
const CELL_BASE_H = 40;

const TOOTH_GAP_DESIGN = 3;
const MIN_CENTER_DIST = CELL_BASE_W + TOOTH_GAP_DESIGN;

const ARC_INTEGRATION_STEPS = 640;
const GUIDE_PATH_SEGMENTS = 56;

/**
 * Shared geometry for tooth layout and SVG guide curves (must stay in sync).
 * Shallow `b` = gentle curve, small vertical steps between posteriors (18→17).
 */
const ARCH = {
  cx: ARC_ODONTOGRAM_BASE_WIDTH / 2,
  a: 152,
  b: 18,
  upperCy: 72,
  lowerCy: 160,
} as const;

const LABEL_UPPER_TOP = 10;
/** "Lower" sits in the inter-arch gap so it does not collide with tooth48/38. */
function labelLowerTopDesign(): number {
  return (ARCH.upperCy + ARCH.lowerCy) / 2 - 8;
}

const UPPER_ARCH_ORDER = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
] as const;
const LOWER_ARCH_ORDER = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

const UPPER_ANTERIOR = new Set([13, 12, 11, 21, 22, 23]);
const LOWER_ANTERIOR = new Set([43, 42, 41, 31, 32, 33]);

type Pos = {top: number; left: number};
type Center = {x: number; y: number};

function ellipseArcSpeed(a: number, b: number, theta: number): number {
  return Math.hypot(a * Math.sin(theta), b * Math.cos(theta));
}

function thetasForUniformArcLength(n: number, a: number, b: number): number[] {
  const steps = ARC_INTEGRATION_STEPS;
  const cum: number[] = new Array(steps + 1).fill(0);
  for (let i = 1; i <= steps; i++) {
    const t0 = ((i - 1) / steps) * Math.PI;
    const t1 = (i / steps) * Math.PI;
    const tm = (t0 + t1) / 2;
    cum[i] = cum[i - 1] + ellipseArcSpeed(a, b, tm) * (t1 - t0);
  }
  const total = cum[steps];
  const thetas: number[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let lo = 0;
    let hi = steps;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (cum[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    const idx = Math.max(1, Math.min(lo, steps));
    const c0 = cum[idx - 1];
    const c1 = cum[idx];
    const t0 = ((idx - 1) / steps) * Math.PI;
    const t1 = (idx / steps) * Math.PI;
    const alpha = c1 > c0 ? (target - c0) / (c1 - c0) : 0;
    thetas.push(t0 + alpha * (t1 - t0));
  }
  return thetas;
}

function upperPoint(theta: number): Center {
  return {
    x: ARCH.cx - ARCH.a * Math.cos(theta),
    y: ARCH.upperCy + ARCH.b * Math.sin(theta),
  };
}

function lowerPoint(theta: number): Center {
  return {
    x: ARCH.cx - ARCH.a * Math.cos(theta),
    y: ARCH.lowerCy - ARCH.b * Math.sin(theta),
  };
}

function unitTangent(theta: number, upper: boolean): Center {
  const tx = ARCH.a * Math.sin(theta);
  const ty = upper ? ARCH.b * Math.cos(theta) : -ARCH.b * Math.cos(theta);
  const L = Math.hypot(tx, ty);
  return {x: tx / L, y: ty / L};
}

/** Separate neighbors along the local tangent — avoids zigzag from chord-only pushes. */
function enforceNeighborGapAlongTangent(
  points: Center[],
  thetas: number[],
  upper: boolean,
  minDist: number,
  passes: number,
): Center[] {
  const out = points.map((p) => ({...p}));
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < out.length - 1; i++) {
      const dx = out[i + 1].x - out[i].x;
      const dy = out[i + 1].y - out[i].y;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6 || d >= minDist - 0.25) {
        continue;
      }
      const th = (thetas[i] + thetas[i + 1]) / 2;
      const T = unitTangent(th, upper);
      const dot = dx * T.x + dy * T.y;
      const sign = dot >= 0 ? 1 : -1;
      const push = (minDist - d) / 2;
      out[i].x -= T.x * push * sign;
      out[i].y -= T.y * push * sign;
      out[i + 1].x += T.x * push * sign;
      out[i + 1].y += T.y * push * sign;
    }
  }
  return out;
}

/** Pull anterior band toward a common y for a flatter front (13–23 / 33–43). */
function flattenAnteriorBand(
  points: Center[],
  teeth: readonly number[],
  band: Set<number>,
  strength: number,
): void {
  const idxs: number[] = [];
  teeth.forEach((t, i) => {
    if (band.has(t)) {
      idxs.push(i);
    }
  });
  if (idxs.length === 0) {
    return;
  }
  const avg = idxs.reduce((s, i) => s + points[i].y, 0) / idxs.length;
  idxs.forEach((i) => {
    points[i].y = points[i].y * (1 - strength) + avg * strength;
  });
}

function smoothInteriorY(points: Center[], weight: number): void {
  const ys = points.map((pt) => pt.y);
  for (let i = 1; i < points.length - 1; i++) {
    const avg = (ys[i - 1] + ys[i + 1]) / 2;
    points[i].y += weight * (avg - points[i].y);
  }
}

function centersToPositions(
  centers: Center[],
  teeth: readonly number[],
): Record<number, Pos> {
  const map: Record<number, Pos> = {};
  const halfW = CELL_BASE_W / 2;
  const halfH = CELL_BASE_H / 2;
  teeth.forEach((tooth, i) => {
    const {x, y} = centers[i];
    map[tooth] = {
      left: Math.round((x - halfW) * 2) / 2,
      top: Math.round((y - halfH) * 2) / 2,
    };
  });
  return map;
}

function buildFdiArcPositionMap(): Record<number, Pos> {
  const {a, b} = ARCH;
  const n = UPPER_ARCH_ORDER.length;

  const upperThetas = thetasForUniformArcLength(n, a, b);
  let upperCenters = upperThetas.map((t) => upperPoint(t));
  upperCenters = enforceNeighborGapAlongTangent(
    upperCenters,
    upperThetas,
    true,
    MIN_CENTER_DIST,
    3,
  );
  flattenAnteriorBand(upperCenters, UPPER_ARCH_ORDER, UPPER_ANTERIOR, 0.26);
  smoothInteriorY(upperCenters, 0.14);
  upperCenters = enforceNeighborGapAlongTangent(
    upperCenters,
    upperThetas,
    true,
    MIN_CENTER_DIST,
    1,
  );

  const lowerThetas = thetasForUniformArcLength(n, a, b);
  let lowerCenters = lowerThetas.map((t) => lowerPoint(t));
  lowerCenters = enforceNeighborGapAlongTangent(
    lowerCenters,
    lowerThetas,
    false,
    MIN_CENTER_DIST,
    3,
  );
  flattenAnteriorBand(lowerCenters, LOWER_ARCH_ORDER, LOWER_ANTERIOR, 0.26);
  smoothInteriorY(lowerCenters, 0.14);
  lowerCenters = enforceNeighborGapAlongTangent(
    lowerCenters,
    lowerThetas,
    false,
    MIN_CENTER_DIST,
    1,
  );

  return {
    ...centersToPositions(upperCenters, UPPER_ARCH_ORDER),
    ...centersToPositions(lowerCenters, LOWER_ARCH_ORDER),
  };
}

export const FDI_ARC_POSITIONS_BASE: Record<number, Pos> = buildFdiArcPositionMap();

function ellipticalGuidePathD(upper: boolean): string {
  const {cx, a, b, upperCy, lowerCy} = ARCH;
  const cy = upper ? upperCy : lowerCy;
  const parts: string[] = [];
  for (let i = 0; i <= GUIDE_PATH_SEGMENTS; i++) {
    const theta = (i / GUIDE_PATH_SEGMENTS) * Math.PI;
    const x = cx - a * Math.cos(theta);
    const y = upper ? cy + b * Math.sin(theta) : cy - b * Math.sin(theta);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join(' ');
}

const UPPER_GUIDE_D = ellipticalGuidePathD(true);
const LOWER_GUIDE_D = ellipticalGuidePathD(false);

function archRenderOrder(order: readonly number[]): number[] {
  const indices = order.map((_, i) => i);
  indices.sort((ia, ib) => {
    const ka = Math.min(ia, order.length - 1 - ia);
    const kb = Math.min(ib, order.length - 1 - ib);
    return ka - kb;
  });
  return indices.map((i) => order[i]);
}

const ALL_TEETH_RENDER: number[] = [
  ...archRenderOrder(UPPER_ARCH_ORDER),
  ...archRenderOrder(LOWER_ARCH_ORDER),
];

export const ArcOdontogram: React.FC<OdontogramProps> = ({
  chartRows,
  onToothPress,
  comfortableLayout: comfortableProp,
}) => {
  const {width: screenW} = useWindowDimensions();
  const comfortable = comfortableProp ?? screenW >= 720;

  const scale = useMemo(() => {
    const horizontalPadding = screenW >= 900 ? 56 : 20;
    const available = Math.max(280, screenW - horizontalPadding);
    const raw = available / ARC_ODONTOGRAM_BASE_WIDTH;
    const minS = 0.88;
    const maxS = comfortable ? 1.34 : 1.18;
    return Math.min(Math.max(raw, minS), maxS);
  }, [comfortable, screenW]);

  const lookup = useMemo(() => buildChartLookup(chartRows), [chartRows]);

  const cellW = CELL_BASE_W * scale;
  const cellH = CELL_BASE_H * scale;
  const canvasW = ARC_ODONTOGRAM_BASE_WIDTH * scale;
  const canvasH = ARC_ODONTOGRAM_BASE_HEIGHT * scale;

  const lowerLabelTop = labelLowerTopDesign() * scale;

  return (
    <View className="w-full items-center px-1">
      <Text className="mb-1 text-center text-xs font-medium text-slate-500">
        FDI 11–48 • Upper & lower arch (tap a tooth)
      </Text>
      <View
        className="rounded-2xl border border-slate-200 bg-slate-50/90"
        style={{
          width: canvasW,
          height: canvasH,
          overflow: 'hidden',
        }}
        collapsable={false}>
        {/* First child: decorative guides only — must not participate in hit-testing */}
        <Svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${ARC_ODONTOGRAM_BASE_WIDTH} ${ARC_ODONTOGRAM_BASE_HEIGHT}`}
          style={{position: 'absolute', left: 0, top: 0, zIndex: 0}}
          pointerEvents="none">
          <Path
            d={UPPER_GUIDE_D}
            stroke="rgba(148, 163, 184, 0.42)"
            strokeWidth={1.15}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          <Path
            d={LOWER_GUIDE_D}
            stroke="rgba(148, 163, 184, 0.42)"
            strokeWidth={1.15}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        </Svg>

        {/* Single hit layer: all teeth are siblings; lower arch drawn after upper for tie-breaks */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: canvasW,
            height: canvasH,
            zIndex: 1,
          }}
          pointerEvents="box-none"
          collapsable={false}>
          <View
            pointerEvents="none"
            className="absolute"
            style={{
              left: 12 * scale,
              top: LABEL_UPPER_TOP * scale,
              zIndex: 0,
            }}>
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Upper
            </Text>
          </View>
          <View
            pointerEvents="none"
            className="absolute"
            style={{
              left: 12 * scale,
              top: lowerLabelTop,
              zIndex: 0,
            }}>
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Lower
            </Text>
          </View>

          {ALL_TEETH_RENDER.map((tooth) => {
            const pos = FDI_ARC_POSITIONS_BASE[tooth];
            if (!pos) {
              return null;
            }
            const condition: ToothCondition =
              lookup.get(tooth) ?? TOOTH_CONDITIONS.CLEANING;
            const lowerArch = tooth >= 31 && tooth <= 48;
            return (
              <View
                key={tooth}
                style={{
                  position: 'absolute',
                  left: pos.left * scale,
                  top: pos.top * scale,
                  width: cellW,
                  height: cellH,
                  zIndex: lowerArch ? 25 : 20,
                  elevation: lowerArch ? 6 : 4,
                }}
                pointerEvents="auto"
                collapsable={false}>
                <ToothCell
                  toothNumber={tooth}
                  condition={condition}
                  onPress={onToothPress}
                  width={cellW}
                  height={cellH}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
