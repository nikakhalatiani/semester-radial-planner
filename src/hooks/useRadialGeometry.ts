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
  examAnchorPoint: { x: number; y: number };
  examPoint: { x: number; y: number; angle: number };
  examGuidePath?: string;
  midtermPoint?: { x: number; y: number; angle: number };
}

const CENTER = { x: 400, y: 400 };

interface UseRadialGeometryOptions {
  transformAngle?: (angle: number) => number;
}

export function useRadialGeometry(
  offerings: RadialDisplayOffering[],
  year: number,
  options?: UseRadialGeometryOptions,
) {
  const transformAngle = options?.transformAngle;

  return useMemo(() => {
    return offerings.map((item) => {
      const rawStartAngle = dateToAngle(new Date(item.offering.startDate), year);
      const rawEndAngle = dateToAngle(new Date(item.offering.endDate), year);
      const radius = courseRadius(item.displayOrder);

      const examDate = item.selectedExamOption?.date;
      const rawExamAngle = dateToAngle(new Date(examDate ?? item.offering.endDate), year);

      const startAngle = transformAngle ? transformAngle(rawStartAngle) : rawStartAngle;
      const endAngle = transformAngle ? transformAngle(rawEndAngle) : rawEndAngle;
      const examAngle = transformAngle ? transformAngle(rawExamAngle) : rawExamAngle;

      const examRadius = radius + 12;
      const examAnchorPoint = polarToCartesian(CENTER.x, CENTER.y, radius, examAngle);
      const examPoint = polarToCartesian(CENTER.x, CENTER.y, examRadius, examAngle);
      const endPoint = polarToCartesian(CENTER.x, CENTER.y, radius, endAngle);

      const angularDistance = Math.abs(((examAngle - endAngle + 540) % 360) - 180);
      const examGuidePath =
        angularDistance > 3
          ? describeArc(CENTER.x, CENTER.y, radius, endAngle, examAngle)
          : undefined;

      const midtermPoint = item.offering.midtermDate
        ? (() => {
            const rawMidtermAngle = dateToAngle(new Date(item.offering.midtermDate), year);
            const midtermAngle = transformAngle ? transformAngle(rawMidtermAngle) : rawMidtermAngle;
            const point = polarToCartesian(CENTER.x, CENTER.y, radius, midtermAngle);
            return { x: point.x, y: point.y, angle: midtermAngle };
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
        examAnchorPoint: { x: examAnchorPoint.x, y: examAnchorPoint.y },
        examPoint: { x: examPoint.x, y: examPoint.y, angle: examAngle },
        examGuidePath,
        midtermPoint,
      } satisfies ComputedArc;
    });
  }, [offerings, year, transformAngle]);
}
