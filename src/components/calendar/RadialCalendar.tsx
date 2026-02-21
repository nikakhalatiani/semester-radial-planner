import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useRadialGeometry } from '../../hooks/useRadialGeometry';
import type { RadialDisplayOffering } from '../../types';
import { polarToCartesian } from '../../utils/arcPath';
import { dateToAngle } from '../../utils/dateToAngle';
import { MONTH_NAMES, SEASON_LABELS } from '../../utils/constants';
import { Tooltip } from '../ui/Tooltip';
import {
  type SeasonKey,
  type ZoomFocus,
  monthToSeason,
  remapAngleByFocus,
} from '../../utils/radialZoom';
import { CourseArc } from './CourseArc';
import { MonthLabel } from './MonthLabel';
import { MonthRing } from './MonthRing';
import { SeasonLabel } from './SeasonLabel';
import { ZoomOverlay } from './ZoomOverlay';

interface RadialCalendarProps {
  year: number;
  offerings: RadialDisplayOffering[];
  onSelectOffering: (offeringId: string) => void;
}

const MONTH_RING_RADII = Array.from({ length: 12 }, (_, index) => 146 + index * 14);

const MONTH_BY_SEASON: Record<SeasonKey, number> = {
  winter: 11,
  spring: 2,
  summer: 5,
  autumn: 8,
};

function defaultSeasonForDate(date: Date): SeasonKey {
  return monthToSeason(date.getMonth());
}

export function RadialCalendar({ year, offerings, onSelectOffering }: RadialCalendarProps) {
  const [focus, setFocus] = useState<ZoomFocus>({ level: 'year' });
  const pinchDistanceRef = useRef<number | null>(null);
  const lastWheelAtRef = useRef(0);

  const transformAngle = useCallback((angle: number) => remapAngleByFocus(angle, focus), [focus]);
  const geometry = useRadialGeometry(offerings, year, { transformAngle });

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  const geometryById = useMemo(
    () => new Map(geometry.map((item) => [item.offeringId, item])),
    [geometry],
  );

  const monthLabels = useMemo(() => {
    return MONTH_NAMES.map((label, monthIndex) => {
      const rawAngle = dateToAngle(new Date(Date.UTC(year, monthIndex, 15)), year);
      return {
        label,
        monthIndex,
        angle: transformAngle(rawAngle),
      };
    });
  }, [transformAngle, year]);

  const monthDateTicks = useMemo(() => {
    if (focus.level !== 'month' || typeof focus.month !== 'number') {
      return [];
    }

    const daysInMonth = new Date(year, focus.month + 1, 0).getDate();
    const tickDays = [1, 8, 15, 22, 29].filter((day) => day <= daysInMonth);

    return tickDays.map((day) => {
      const rawAngle = dateToAngle(new Date(Date.UTC(year, focus.month as number, day)), year);
      const angle = transformAngle(rawAngle);
      const inner = polarToCartesian(400, 400, 116, angle);
      const outer = polarToCartesian(400, 400, 134, angle);
      const label = polarToCartesian(400, 400, 146, angle);

      return {
        day,
        inner,
        outer,
        label,
      };
    });
  }, [focus.level, focus.month, transformAngle, year]);

  const zoomScale = focus.level === 'year' ? 1 : focus.level === 'season' ? 1.08 : 1.16;

  const zoomIn = useCallback(() => {
    setFocus((prev) => {
      if (prev.level === 'year') {
        return {
          level: 'season',
          season: defaultSeasonForDate(new Date()),
        };
      }

      if (prev.level === 'season') {
        return {
          level: 'month',
          season: prev.season,
          month: MONTH_BY_SEASON[prev.season ?? defaultSeasonForDate(new Date())],
        };
      }

      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setFocus((prev) => {
      if (prev.level === 'month') {
        return {
          level: 'season',
          season: prev.season ?? monthToSeason(prev.month ?? new Date().getMonth()),
        };
      }

      if (prev.level === 'season') {
        return { level: 'year' };
      }

      return prev;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setFocus({ level: 'year' });
  }, []);

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelAtRef.current < 220) {
      return;
    }

    lastWheelAtRef.current = now;
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length !== 2) {
      return;
    }
    const first = event.touches.item(0);
    const second = event.touches.item(1);
    if (!first || !second) {
      return;
    }

    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    pinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length !== 2 || pinchDistanceRef.current == null) {
      return;
    }

    const first = event.touches.item(0);
    const second = event.touches.item(1);
    if (!first || !second) {
      return;
    }

    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    const nextDistance = Math.sqrt(dx * dx + dy * dy);

    if (Math.abs(nextDistance - pinchDistanceRef.current) > 18) {
      if (nextDistance > pinchDistanceRef.current) {
        zoomIn();
      } else {
        zoomOut();
      }
      pinchDistanceRef.current = nextDistance;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    pinchDistanceRef.current = null;
  };

  return (
    <div
      className="relative h-[60vh] min-h-[440px] w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <ZoomOverlay level={focus.level} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
      <motion.svg
        id="radial-calendar-svg"
        viewBox="0 0 800 800"
        className="h-full w-full"
        animate={{ scale: zoomScale }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      >
        <g>
          {MONTH_RING_RADII.map((radius, index) => (
            <MonthRing key={radius} radius={radius} index={index} />
          ))}

          {SEASON_LABELS.map((season) => (
            <SeasonLabel
              key={season.label}
              label={season.label}
              angle={season.angle}
              active={focus.season === season.key && focus.level !== 'year'}
              onSelect={() => {
                const seasonKey = season.key;
                setFocus((prev) => {
                  if (prev.level === 'month') {
                    return {
                      level: 'month',
                      season: seasonKey,
                      month: MONTH_BY_SEASON[seasonKey],
                    };
                  }
                  return { level: 'season', season: seasonKey };
                });
              }}
            />
          ))}

          {monthLabels.map((month) => (
            <MonthLabel
              key={month.label}
              label={month.label}
              angle={month.angle}
              active={focus.level === 'month' && focus.month === month.monthIndex}
              onSelect={() => {
                setFocus({
                  level: 'month',
                  season: monthToSeason(month.monthIndex),
                  month: month.monthIndex,
                });
              }}
            />
          ))}

          <circle cx={400} cy={400} r={98} fill="#FAFAFC" stroke="rgba(125,125,130,0.12)" strokeWidth={2} />
          {monthDateTicks.map((tick) => (
            <g key={tick.day}>
              <line
                x1={tick.inner.x}
                y1={tick.inner.y}
                x2={tick.outer.x}
                y2={tick.outer.y}
                stroke="rgba(32,32,36,0.6)"
                strokeWidth={1}
              />
              <text
                x={tick.label.x}
                y={tick.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-neutral-500 text-[10px] font-medium"
              >
                {tick.day}
              </text>
            </g>
          ))}
          <text x={400} y={394} textAnchor="middle" className="fill-neutral-900 text-[28px] font-bold">
            {year}
          </text>

          {offerings.map((item) => {
            const computed = geometryById.get(item.offering.id);
            if (!computed) {
              return null;
            }

            return (
              <CourseArc
                key={item.offering.id}
                path={computed.path}
                definition={item.definition}
                offering={item.offering}
                selectedExamOption={item.selectedExamOption}
                examPoint={computed.examPoint}
                examAnchorPoint={computed.examAnchorPoint}
                endPoint={computed.endPoint}
                examGuidePath={computed.examGuidePath}
                midtermPoint={computed.midtermPoint}
                onSelect={() => onSelectOffering(item.offering.id)}
                onHover={(event) => {
                  const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!rect) {
                    return;
                  }
                  setTooltip({
                    visible: true,
                    x: event.clientX - rect.left + 12,
                    y: event.clientY - rect.top + 12,
                    content: item.definition.name,
                  });
                }}
                onLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
              />
            );
          })}
        </g>
      </motion.svg>
      <Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>
        {tooltip.content}
      </Tooltip>

      <div className="absolute bottom-3 left-3 rounded-xl border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-600">
        Zoom: <span className="font-semibold text-neutral-900">{focus.level}</span> • click season/month labels to focus
      </div>
    </div>
  );
}
