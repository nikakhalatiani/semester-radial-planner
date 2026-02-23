import { useMemo } from 'react';

import type { RadialDisplayOffering } from '../types';
import { describeArc, courseRadius, polarToCartesian } from '../utils/arcPath';
import { dateToAngle } from '../utils/dateToAngle';

export interface ComputedArc {
  offeringId: string;
  path: string;
  startAngle: number;
  endAngle: number;
  examAngle: number;
  radius: number;
  color: string;
  endPoint: { x: number; y: number };
  examPoint: { x: number; y: number; angle: number };
  reexamPoint?: { x: number; y: number; angle: number };
}

const CENTER = { x: 400, y: 400 };

interface UseRadialGeometryOptions {
  transformAngle?: (angle: number) => number;
}

interface DateInterval {
  startMs: number;
  endMs: number;
}

function toDateInterval(startDate: string, endDate: string): DateInterval {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { startMs: 0, endMs: 0 };
  }
  return startMs <= endMs ? { startMs, endMs } : { startMs: endMs, endMs: startMs };
}

function intervalsOverlap(a: DateInterval, b: DateInterval): boolean {
  return !(a.endMs < b.startMs || b.endMs < a.startMs);
}

function assignLaneIndices(offerings: RadialDisplayOffering[]): Map<string, number> {
  const laneIntervals: DateInterval[][] = [];
  const laneByOfferingId = new Map<string, number>();

  offerings.forEach((item) => {
    const interval = toDateInterval(item.offering.startDate, item.offering.endDate);
    let assignedLane = -1;

    for (let laneIndex = 0; laneIndex < laneIntervals.length; laneIndex += 1) {
      const hasOverlap = laneIntervals[laneIndex].some((existing) => intervalsOverlap(existing, interval));
      if (!hasOverlap) {
        assignedLane = laneIndex;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneIntervals.length;
      laneIntervals.push([]);
    }

    laneIntervals[assignedLane].push(interval);
    laneByOfferingId.set(item.offering.id, assignedLane);
  });

  return laneByOfferingId;
}

export function useRadialGeometry(
  offerings: RadialDisplayOffering[],
  year: number,
  options?: UseRadialGeometryOptions,
) {
  const transformAngle = options?.transformAngle;

  return useMemo(() => {
    const laneByOfferingId = assignLaneIndices(offerings);

    return offerings.map((item) => {
      const rawStartAngle = dateToAngle(new Date(item.offering.startDate), year);
      const rawEndAngle = dateToAngle(new Date(item.offering.endDate), year);
      const lane = laneByOfferingId.get(item.offering.id) ?? item.displayOrder;
      const radius = courseRadius(lane);

      const examDate = item.selectedExamOption?.date;
      const rawExamAngle = dateToAngle(new Date(examDate ?? item.offering.endDate), year);

      const startAngle = transformAngle ? transformAngle(rawStartAngle) : rawStartAngle;
      const endAngle = transformAngle ? transformAngle(rawEndAngle) : rawEndAngle;
      const examAngle = transformAngle ? transformAngle(rawExamAngle) : rawExamAngle;

      // Keep markers centered on the exact course radius so dots sit on the painted course path.
      const markerRadius = radius;
      const examPoint = polarToCartesian(CENTER.x, CENTER.y, markerRadius, examAngle);
      const endPoint = polarToCartesian(CENTER.x, CENTER.y, radius, endAngle);
      const reexamPoint = item.selectedExamOption?.reexamDate
        ? (() => {
            const rawReexamAngle = dateToAngle(new Date(item.selectedExamOption.reexamDate), year);
            const reexamAngle = transformAngle ? transformAngle(rawReexamAngle) : rawReexamAngle;
            const point = polarToCartesian(CENTER.x, CENTER.y, markerRadius, reexamAngle);
            return { x: point.x, y: point.y, angle: reexamAngle };
          })()
        : undefined;

      return {
        offeringId: item.offering.id,
        path: describeArc(CENTER.x, CENTER.y, radius, startAngle, endAngle),
        startAngle,
        endAngle,
        examAngle,
        radius,
        color: item.definition.color,
        endPoint: { x: endPoint.x, y: endPoint.y },
        examPoint: { x: examPoint.x, y: examPoint.y, angle: examAngle },
        reexamPoint,
      } satisfies ComputedArc;
    });
  }, [offerings, year, transformAngle]);
}
