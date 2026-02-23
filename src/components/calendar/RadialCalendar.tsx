import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

import { useRadialGeometry } from '../../hooks/useRadialGeometry';
import type { ExamType, RadialDisplayOffering } from '../../types';
import { describeSector, polarToCartesian } from '../../utils/arcPath';
import { MONTH_NAMES, SEASON_LABELS } from '../../utils/constants';
import { dateToAngle } from '../../utils/dateToAngle';
import { formatTimeRange, getLectureSessions } from '../../utils/lectureSchedule';
import { type SeasonKey, type ZoomFocus, monthToSeason } from '../../utils/radialZoom';
import { Tooltip } from '../ui/Tooltip';
import { Dropdown } from '../ui/Dropdown';
import { CourseArc } from './CourseArc';
import { ExamDot } from './ExamDot';
import { MonthLabel } from './MonthLabel';
import { SeasonLabel } from './SeasonLabel';
import { ZoomOverlay } from './ZoomOverlay';

interface RadialCalendarProps {
  year: number;
  offerings: RadialDisplayOffering[];
  onSelectOffering: (offeringId: string) => void;
  availableYears?: number[];
  onYearChange?: (year: number) => void;
  fullCanvas?: boolean;
}

interface DayEvent {
  id: string;
  label: string;
  color: string;
  kind: 'lecture' | 'exam' | 'project';
  dateIso: string;
  examType?: ExamType;
  isReexam?: boolean;
  timeRange?: string;
}

interface SeasonMonthSegment {
  monthIndex: number;
  label: string;
  monthStartAngle: number;
  monthEndAngle: number;
  renderStartAngle: number;
  renderEndAngle: number;
  labelAngle: number;
}

interface SeasonDayDot {
  id: string;
  monthIndex: number;
  day: number;
  x: number;
  y: number;
  weekdayIndex: number;
  weekIndex: number;
  colors: string[];
  examMarkers: Array<{
    id: string;
    type: ExamType;
    color: string;
    label: string;
    dateLabel: string;
    isReexam: boolean;
  }>;
  tooltipText: string;
}

const MONTH_RING_RADII = Array.from({ length: 12 }, (_, index) => 146 + index * 14);
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SEASON_CONFIG: Record<SeasonKey, { months: number[] }> = {
  summer: { months: [5, 6, 7] },
  spring: { months: [2, 3, 4] },
  winter: { months: [11, 0, 1] },
  autumn: { months: [8, 9, 10] },
};

const DEFAULT_MONTH_BY_SEASON: Record<SeasonKey, number> = {
  summer: 6,
  spring: 3,
  winter: 0,
  autumn: 9,
};

const SEASON_DISPLAY_LABELS: Record<SeasonKey, string> = {
  summer: 'Summer',
  spring: 'Spring',
  winter: 'Winter',
  autumn: 'Fall',
};

const SEASON_ORDER: SeasonKey[] = ['winter', 'spring', 'summer', 'autumn'];

const CALENDAR_CENTER = { x: 400, y: 400 };
const MONTH_LABEL_RADIUS = 322;

interface SeasonFrameConfig {
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function clockwiseSpan(start: number, end: number): number {
  return (normalizeAngle(end) - normalizeAngle(start) + 360) % 360;
}

function counterclockwiseSpan(start: number, end: number): number {
  return (normalizeAngle(start) - normalizeAngle(end) + 360) % 360;
}

function interpolateClockwise(start: number, end: number, t: number): number {
  return normalizeAngle(start + clockwiseSpan(start, end) * t);
}

function interpolateCounterclockwise(start: number, end: number, t: number): number {
  return normalizeAngle(start - counterclockwiseSpan(start, end) * t);
}

function sectorCenterAngle(start: number, end: number): number {
  const span = clockwiseSpan(start, end);
  return normalizeAngle(start + span / 2);
}

function angleInSweep(angle: number, start: number, end: number): boolean {
  const normalizedStart = normalizeAngle(start);
  const normalizedEnd = normalizeAngle(end);
  const normalizedAngle = normalizeAngle(angle);
  const sweep = (normalizedEnd - normalizedStart + 360) % 360;
  const progress = (normalizedAngle - normalizedStart + 360) % 360;
  return progress <= sweep;
}

function describePieSlice(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const sweep = clockwiseSpan(startAngle, endAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function weekdayMondayFirst(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function seasonViewBox(
  start: number,
  end: number,
  frame: SeasonFrameConfig,
  extraAngles: number[] = [],
): string {
  const points: Array<{ x: number; y: number }> = [];
  const radii = [frame.innerRadius, frame.outerRadius, frame.labelRadius];
  const sampleAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const mergedAngles = Array.from(new Set([...sampleAngles, ...extraAngles.map((angle) => normalizeAngle(angle))]));

  radii.forEach((radius) => {
    points.push(polarToCartesian(CALENDAR_CENTER.x, CALENDAR_CENTER.y, radius, start));
    points.push(polarToCartesian(CALENDAR_CENTER.x, CALENDAR_CENTER.y, radius, end));
    mergedAngles.forEach((angle) => {
      if (angleInSweep(angle, start, end)) {
        points.push(polarToCartesian(CALENDAR_CENTER.x, CALENDAR_CENTER.y, radius, angle));
      }
    });
  });

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  const padding = 24;
  let boxX = minX - padding;
  let boxY = minY - padding;
  let width = maxX - minX + padding * 2;
  let height = maxY - minY + padding * 2;

  if (width > height) {
    boxY -= (width - height) / 2;
    height = width;
  } else if (height > width) {
    boxX -= (height - width) / 2;
    width = height;
  }

  return `${boxX} ${boxY} ${width} ${height}`;
}

function toUtcDay(dateInput: string): Date {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatUtcDateLabel(dateIso: string): string {
  const date = toUtcDay(dateIso);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function resolveCalendarYearForMonth(academicYear: number, monthIndex: number): number {
  // Academic cycle: Mar..Dec stay in year, Jan/Feb belong to year+1.
  return monthIndex <= 1 ? academicYear + 1 : academicYear;
}

function addEvent(eventsByDay: Map<number, DayEvent[]>, day: number, event: DayEvent) {
  const dayEvents = eventsByDay.get(day) ?? [];
  dayEvents.push(event);
  eventsByDay.set(day, dayEvents);
}

function buildMonthEvents(offerings: RadialDisplayOffering[], year: number, month: number): Map<number, DayEvent[]> {
  const eventsByDay = new Map<number, DayEvent[]>();
  const calendarYear = resolveCalendarYearForMonth(year, month);
  const monthStart = new Date(Date.UTC(calendarYear, month, 1));
  const monthEnd = new Date(Date.UTC(calendarYear, month + 1, 0));

  offerings.forEach((item) => {
    const start = toUtcDay(item.offering.startDate);
    const end = toUtcDay(item.offering.endDate);
    const explicitLectureSessions = getLectureSessions(item.offering).map((session) => ({
      ...session,
      utcDate: toUtcDay(session.date),
      timeRange: formatTimeRange(session.startTime, session.endTime),
    }));

    if (end < monthStart || start > monthEnd) {
      return;
    }

    if (explicitLectureSessions.length > 0) {
      explicitLectureSessions.forEach((session) => {
        const lectureDate = session.utcDate;
        if (lectureDate < monthStart || lectureDate > monthEnd) {
          return;
        }
        addEvent(eventsByDay, lectureDate.getUTCDate(), {
          id: `${item.offering.id}-lecture-${session.id}-${lectureDate.toISOString()}`,
          label: `${item.definition.shortCode} lecture`,
          color: item.definition.color,
          kind: 'lecture',
          dateIso: lectureDate.toISOString(),
          timeRange: session.timeRange,
        });
      });
    } else {
      const lectureWeekday = start.getUTCDay();
      const cursor = new Date(Math.max(start.getTime(), monthStart.getTime()));
      while (cursor.getUTCDay() !== lectureWeekday) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      while (cursor <= end && cursor <= monthEnd) {
        addEvent(eventsByDay, cursor.getUTCDate(), {
          id: `${item.offering.id}-lecture-${cursor.toISOString()}`,
          label: `${item.definition.shortCode} lecture`,
          color: item.definition.color,
          kind: 'lecture',
          dateIso: cursor.toISOString(),
        });
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }
    }

    const examOptionsForCalendar =
      item.offering.examOptions.length > 0
        ? item.offering.examOptions
        : item.selectedExamOption
          ? [item.selectedExamOption]
          : [];

    examOptionsForCalendar.forEach((examOption, optionIndex) => {
      if (!examOption.date) {
        return;
      }

      const examDate = toUtcDay(examOption.date);
      if (examDate.getUTCFullYear() === calendarYear && examDate.getUTCMonth() === month) {
        addEvent(eventsByDay, examDate.getUTCDate(), {
          id: `${item.offering.id}-exam-${optionIndex}-${examDate.toISOString()}`,
          label: `${item.definition.shortCode} ${examOption.type}`,
          color: item.definition.color,
          kind: examOption.type === 'project' ? 'project' : 'exam',
          examType: examOption.type,
          dateIso: examDate.toISOString(),
          isReexam: false,
        });
      }

      if (!examOption.reexamDate) {
        return;
      }

      const reexamDate = toUtcDay(examOption.reexamDate);
      if (reexamDate.getUTCFullYear() === calendarYear && reexamDate.getUTCMonth() === month) {
        addEvent(eventsByDay, reexamDate.getUTCDate(), {
          id: `${item.offering.id}-reexam-${optionIndex}-${reexamDate.toISOString()}`,
          label: `${item.definition.shortCode} reexam ${examOption.type}`,
          color: item.definition.color,
          kind: examOption.type === 'project' ? 'project' : 'exam',
          examType: examOption.type,
          dateIso: reexamDate.toISOString(),
          isReexam: true,
        });
      }
    });
  });

  return eventsByDay;
}

function defaultSeasonForDate(date: Date): SeasonKey {
  return monthToSeason(date.getUTCMonth());
}

function offeringOverlapsSeason(offering: RadialDisplayOffering['offering'], season: SeasonKey): boolean {
  const start = toUtcDay(offering.startDate);
  const end = toUtcDay(offering.endDate);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    if (monthToSeason(cursor.getUTCMonth()) === season) {
      return true;
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return false;
}

function MonthGridView({
  year,
  month,
  offerings,
  onBack,
  onPrevMonth,
  onNextMonth,
  fullCanvas = false,
}: {
  year: number;
  month: number;
  offerings: RadialDisplayOffering[];
  onBack: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  fullCanvas?: boolean;
}) {
  const eventsByDay = useMemo(() => buildMonthEvents(offerings, year, month), [offerings, year, month]);
  const calendarYear = resolveCalendarYearForMonth(year, month);

  const monthStart = new Date(Date.UTC(calendarYear, month, 1));
  const daysInMonth = new Date(Date.UTC(calendarYear, month + 1, 0)).getUTCDate();
  const firstWeekday = (monthStart.getUTCDay() + 6) % 7;
  const slots = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? undefined : index - firstWeekday + 1,
  );

  return (
    <div
      className={clsx(
        'h-full w-full overflow-auto bg-white p-3 sm:p-4',
        fullCanvas ? 'rounded-none border-0' : 'rounded-3xl border border-neutral-200',
      )}
    >
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          className="h-10 whitespace-nowrap rounded-xl border border-neutral-200 px-3 text-sm font-medium"
          onClick={onBack}
        >
          Back to season
        </button>
        <h3 className="truncate text-center text-[30px] font-semibold text-neutral-900">
          {MONTH_NAMES[month]} {calendarYear}
        </h3>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-900"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-900"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <p className="mb-3 max-w-[740px] text-sm leading-6 text-neutral-500">
        Lecture days come from offering lecture schedule. If none is set, weekly pattern is inferred from start date.
      </p>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-neutral-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-1 py-1 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {slots.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-[72px] rounded-xl bg-transparent sm:min-h-[88px]" />;
          }

          const dayEvents = eventsByDay.get(day) ?? [];
          return (
            <div key={`day-${day}`} className="min-h-[72px] rounded-xl border border-neutral-200 bg-white p-2 sm:min-h-[88px]">
              <div className="mb-1 text-sm font-semibold text-neutral-900">{day}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: event.color }}
                    title={event.label}
                  >
                    {((event.kind === 'lecture'
                      ? 'Lecture'
                      : event.kind === 'project'
                          ? 'Project'
                          : event.examType === 'oral'
                              ? 'Oral'
                              : 'Written') + (event.timeRange ? ` ${event.timeRange}` : ''))}
                  </div>
                ))}
                {dayEvents.length > 3 ? (
                  <div className="text-[10px] font-medium text-neutral-500">+{dayEvents.length - 3} more</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RadialCalendar({
  year,
  offerings,
  onSelectOffering,
  availableYears = [],
  onYearChange,
  fullCanvas = false,
}: RadialCalendarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [focus, setFocus] = useState<ZoomFocus>({ level: 'year' });
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const pinchDistanceRef = useRef<number | null>(null);
  const lastWheelAtRef = useRef(0);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  const resolvedSeason: SeasonKey = focus.season ?? defaultSeasonForDate(new Date());
  const seasonConfig = SEASON_CONFIG[resolvedSeason];
  const yearOptions = useMemo(
    () =>
      availableYears
        .slice()
        .sort((a, b) => b - a)
        .map((candidateYear) => ({ value: candidateYear, label: String(candidateYear) })),
    [availableYears],
  );
  const selectedYearOption = yearOptions.find((option) => option.value === year)?.value ?? yearOptions[0]?.value;

  useEffect(() => {
    if (focus.level !== 'year' && yearDropdownOpen) {
      setYearDropdownOpen(false);
    }
  }, [focus.level, yearDropdownOpen]);

  const yearGeometry = useRadialGeometry(offerings, year);
  const yearGeometryById = useMemo(
    () => new Map(yearGeometry.map((item) => [item.offeringId, item])),
    [yearGeometry],
  );

  const seasonOfferings = useMemo(
    () => offerings.filter((item) => offeringOverlapsSeason(item.offering, resolvedSeason)),
    [offerings, resolvedSeason],
  );

  const yearMonthLabels = useMemo(
    () =>
      MONTH_NAMES.map((label, monthIndex) => ({
        label,
        monthIndex,
        angle: dateToAngle(new Date(Date.UTC(year, monthIndex, 15)), year),
      })),
    [year],
  );

  const seasonMonthSegments = useMemo<SeasonMonthSegment[]>(() => {
    const monthStartAngles = seasonConfig.months.map((monthIndex) =>
      dateToAngle(new Date(Date.UTC(year, monthIndex, 1)), year),
    );
    const lastMonth = seasonConfig.months[seasonConfig.months.length - 1];
    const nextMonth = (lastMonth + 1) % 12;
    const boundaryYear = nextMonth === 0 ? year + 1 : year;
    const afterSeasonStart = dateToAngle(new Date(Date.UTC(boundaryYear, nextMonth, 1)), year);
    const boundaries = [...monthStartAngles, afterSeasonStart];

    return seasonConfig.months.map((monthIndex, index) => {
      const monthStartAngle = boundaries[index];
      const monthEndAngle = boundaries[index + 1];
      const renderStartAngle = monthEndAngle;
      const renderEndAngle = monthStartAngle;

      return {
        monthIndex,
        label: MONTH_NAMES[monthIndex],
        monthStartAngle,
        monthEndAngle,
        renderStartAngle,
        renderEndAngle,
        labelAngle: interpolateClockwise(renderStartAngle, renderEndAngle, 0.5),
      };
    });
  }, [seasonConfig.months, year]);

  const seasonMonthLabels = useMemo(
    () =>
      seasonMonthSegments.map((segment) => ({
        label: segment.label,
        monthIndex: segment.monthIndex,
        angle: segment.labelAngle,
      })),
    [seasonMonthSegments],
  );

  const seasonBoundaryAngles = useMemo(() => {
    if (seasonMonthSegments.length === 0) {
      return [];
    }
    return [
      ...seasonMonthSegments.map((segment) => segment.monthStartAngle),
      seasonMonthSegments[seasonMonthSegments.length - 1].monthEndAngle,
    ];
  }, [seasonMonthSegments]);

  const monthForView = focus.month ?? DEFAULT_MONTH_BY_SEASON[resolvedSeason];

  const seasonMonthEvents = useMemo(() => {
    const byMonth = new Map<number, Map<number, DayEvent[]>>();
    seasonMonthSegments.forEach((segment) => {
      byMonth.set(segment.monthIndex, buildMonthEvents(seasonOfferings, year, segment.monthIndex));
    });
    return byMonth;
  }, [seasonMonthSegments, seasonOfferings, year]);

  const seasonExamCount = useMemo(
    () => Array.from(seasonMonthEvents.values()).reduce((count, map) => {
      map.forEach((eventsForDay) => {
        count += eventsForDay.filter((event) => event.kind === 'exam' || event.kind === 'project').length;
      });
      return count;
    }, 0),
    [seasonMonthEvents],
  );

  const zoomIn = useCallback(() => {
    setFocus((prev) => {
      if (prev.level === 'year') {
        return {
          level: 'season',
          season: prev.season ?? defaultSeasonForDate(new Date()),
        };
      }

      if (prev.level === 'season') {
        const season = prev.season ?? defaultSeasonForDate(new Date());
        return {
          level: 'month',
          season,
          month: DEFAULT_MONTH_BY_SEASON[season],
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

  const handleWheelDelta = useCallback((deltaY: number) => {
    const now = Date.now();
    if (now - lastWheelAtRef.current < 220) {
      return;
    }

    lastWheelAtRef.current = now;
    if (deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const onNativeWheel = (event: WheelEvent) => {
      if (focus.level === 'month') {
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      event.preventDefault();
      handleWheelDelta(event.deltaY);
    };

    element.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => element.removeEventListener('wheel', onNativeWheel);
  }, [focus.level, handleWheelDelta]);

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

  const seasonFrame = {
    minRadius: 128,
    maxRadius: 286,
    labelRadius: MONTH_LABEL_RADIUS,
    clipInnerRadius: 104,
    clipOuterRadius: MONTH_RING_RADII[MONTH_RING_RADII.length - 1] + 12,
  } as const;

  const seasonArcStart =
    seasonMonthSegments.length > 0
      ? seasonMonthSegments[seasonMonthSegments.length - 1].monthEndAngle
      : 210;
  const seasonArcEnd = seasonMonthSegments.length > 0 ? seasonMonthSegments[0].monthStartAngle : 300;
  const seasonClipId = `season-clip-${resolvedSeason}`;
  const seasonClipPath = describeSector(
    CALENDAR_CENTER.x,
    CALENDAR_CENTER.y,
    seasonFrame.clipInnerRadius,
    seasonFrame.clipOuterRadius,
    seasonArcStart,
    seasonArcEnd,
  );
  const seasonFocusAngle = sectorCenterAngle(seasonArcStart, seasonArcEnd);
  const seasonLabelPoint = polarToCartesian(
    CALENDAR_CENTER.x,
    CALENDAR_CENTER.y,
    Math.max(seasonFrame.minRadius - 30, 94),
    seasonFocusAngle,
  );

  const seasonDotBand = {
    inner: seasonFrame.clipInnerRadius + 22,
    outer: seasonFrame.clipOuterRadius - 22,
  } as const;

  const seasonDayDots = (() => {
    if (!seasonDotBand) {
      return [];
    }

    const dots: SeasonDayDot[] = [];

    seasonMonthSegments.forEach((segment) => {
      const calendarYear = resolveCalendarYearForMonth(year, segment.monthIndex);
      const daysInMonth = new Date(Date.UTC(calendarYear, segment.monthIndex + 1, 0)).getUTCDate();
      const firstWeekday = weekdayMondayFirst(new Date(Date.UTC(calendarYear, segment.monthIndex, 1)));
      const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
      const radialSpan = seasonDotBand.outer - seasonDotBand.inner;

      const eventsByDay = seasonMonthEvents.get(segment.monthIndex) ?? new Map<number, DayEvent[]>();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const events = eventsByDay.get(day) ?? [];

        const slot = firstWeekday + (day - 1);
        const weekIndex = Math.floor(slot / 7);
        const weekdayIndex = slot % 7;
        const angleT = weeks <= 1 ? 0.5 : (weekIndex + 0.5) / weeks;
        const angle = interpolateCounterclockwise(segment.monthStartAngle, segment.monthEndAngle, angleT);
        const radius = seasonDotBand.inner + ((weekdayIndex + 0.5) / 7) * radialSpan;
        const point = polarToCartesian(CALENDAR_CENTER.x, CALENDAR_CENTER.y, radius, angle);

        const lectureColors = Array.from(
          new Set(events.filter((event) => event.kind === 'lecture').map((event) => event.color)),
        ).slice(0, 3);
        const examEvents = events.filter((event) => event.kind === 'exam' || event.kind === 'project');
        const examMarkers = examEvents.slice(0, 3).map((event, index) => ({
          id: `${event.id}-${index}`,
          type: event.examType ?? (event.kind === 'project' ? 'project' : 'written'),
          color: event.color,
          label: event.label,
          dateLabel: formatUtcDateLabel(event.dateIso),
          isReexam: Boolean(event.isReexam),
        }));
        const colors =
          lectureColors.length > 0
            ? lectureColors
            : Array.from(new Set(examMarkers.map((marker) => marker.color))).slice(0, 3);
        const tooltipParts = [
          ...examMarkers.map((marker) => {
            const typeLabel =
              marker.type === 'oral' ? 'Oral exam' : marker.type === 'project' ? 'Project' : 'Written exam';
            const reexamLabel = marker.isReexam ? ' reexam' : '';
            return `${typeLabel}${reexamLabel}: ${marker.label} (${marker.dateLabel})`;
          }),
          ...events
            .filter((event) => event.kind === 'lecture')
            .slice(0, 3)
            .map((event) => `Lecture: ${event.label}${event.timeRange ? ` ${event.timeRange}` : ''}`),
        ];

        dots.push({
          id: `season-dot-${segment.monthIndex}-${day}`,
          monthIndex: segment.monthIndex,
          day,
          x: point.x,
          y: point.y,
          weekdayIndex,
          weekIndex,
          colors,
          examMarkers,
          tooltipText: tooltipParts.join(' | ') || 'No lectures or exams scheduled',
        });
      }
    });

    return dots;
  })() as SeasonDayDot[];

  const seasonDotRadius = seasonDotBand
    ? Math.max(2.2, Math.min(3.4, (seasonDotBand.outer - seasonDotBand.inner) / 14))
    : 2.8;

  const svgViewBox =
    focus.level === 'season'
      ? seasonViewBox(
          seasonArcStart,
          seasonArcEnd,
          {
            innerRadius: seasonFrame.clipInnerRadius,
            outerRadius: seasonFrame.clipOuterRadius,
            labelRadius: seasonFrame.labelRadius,
          },
          [...seasonMonthLabels.map((month) => month.angle), ...seasonBoundaryAngles],
        )
      : '0 0 800 800';

  const focusMotionKey =
    focus.level === 'month'
      ? `month-${monthForView}-${year}`
      : focus.level === 'season'
        ? `season-${resolvedSeason}-${year}`
        : `year-${year}`;
  const focusMotionTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full overflow-hidden bg-white',
        fullCanvas
          ? 'h-[calc(100vh-124px)] min-h-[520px] rounded-none border-0'
          : 'h-[60vh] min-h-[440px] rounded-3xl border border-neutral-200',
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {focus.level !== 'month' ? (
        <ZoomOverlay level={focus.level} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {focus.level === 'month' ? (
          <motion.div
            key={focusMotionKey}
            className="h-full w-full"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={focusMotionTransition}
          >
            <MonthGridView
              year={year}
              month={monthForView}
              offerings={offerings}
              onBack={() => setFocus({ level: 'season', season: resolvedSeason })}
              onPrevMonth={() => {
                const prevMonth = monthForView === 0 ? 11 : monthForView - 1;
                setFocus({ level: 'month', month: prevMonth, season: monthToSeason(prevMonth) });
              }}
              onNextMonth={() => {
                const nextMonth = monthForView === 11 ? 0 : monthForView + 1;
                setFocus({ level: 'month', month: nextMonth, season: monthToSeason(nextMonth) });
              }}
              fullCanvas={fullCanvas}
            />
          </motion.div>
        ) : (
          <motion.svg
            key={focusMotionKey}
            id="radial-calendar-svg"
            viewBox={svgViewBox}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={focusMotionTransition}
          >
            <defs>
              <clipPath id={seasonClipId} clipPathUnits="userSpaceOnUse">
                <path d={seasonClipPath} />
              </clipPath>
            </defs>

            {focus.level === 'year' ? (
              <g>
                {SEASON_LABELS.map((season) => (
                  <SeasonLabel
                    key={season.label}
                    label={season.label}
                    angle={season.angle}
                    active={false}
                    onSelect={() => setFocus({ level: 'season', season: season.key })}
                  />
                ))}

                {yearMonthLabels.map((month) => (
                  <MonthLabel
                    key={month.label}
                    label={month.label}
                    angle={month.angle}
                    onSelect={() => setFocus({ level: 'month', month: month.monthIndex, season: monthToSeason(month.monthIndex) })}
                  />
                ))}

                <circle cx={400} cy={400} r={98} fill="#FAFAFC" stroke="rgba(125,125,130,0.12)" strokeWidth={2} />

                {offerings.map((item) => {
                  const computed = yearGeometryById.get(item.offering.id);
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
                      reexamPoint={computed.reexamPoint}
                      endPoint={computed.endPoint}
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
            ) : (
              <g>
                <g clipPath={`url(#${seasonClipId})`}>
                  {seasonDayDots.map((dot) => {
                    const x = dot.x;
                    const y = dot.y;
                    const colors = dot.colors;
                    const examOffset = seasonDotRadius * 0.75;
                    const examOffsets =
                      dot.examMarkers.length <= 1
                        ? [{ x: 0, y: 0 }]
                        : dot.examMarkers.length === 2
                          ? [
                              { x: -examOffset, y: 0 },
                              { x: examOffset, y: 0 },
                            ]
                          : [
                              { x: 0, y: -examOffset },
                              { x: -examOffset * 0.85, y: examOffset * 0.7 },
                              { x: examOffset * 0.85, y: examOffset * 0.7 },
                            ];

                    return (
                      <g
                        key={dot.id}
                        className="cursor-pointer"
                        onMouseEnter={(event) => {
                          const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                          if (!rect) {
                            return;
                          }
                          setTooltip({
                            visible: true,
                            x: event.clientX - rect.left + 12,
                            y: event.clientY - rect.top + 12,
                            content: `${MONTH_NAMES[dot.monthIndex]} ${dot.day}: ${dot.tooltipText}`,
                          });
                        }}
                        onMouseMove={(event) => {
                          const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                          if (!rect) {
                            return;
                          }
                          setTooltip((prev) => ({
                            ...prev,
                            visible: true,
                            x: event.clientX - rect.left + 12,
                            y: event.clientY - rect.top + 12,
                          }));
                        }}
                        onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                      >
                        {colors.length === 0 ? (
                          <circle cx={x} cy={y} r={seasonDotRadius} fill="#CDD3DE" opacity={0.82} />
                        ) : colors.length === 1 ? (
                          <circle cx={x} cy={y} r={seasonDotRadius} fill={colors[0]} opacity={0.9} />
                        ) : (
                          colors.map((color, index) => {
                            const segmentStart = index * (360 / colors.length);
                            const segmentEnd = (index + 1) * (360 / colors.length);
                            return (
                              <path
                                key={`${dot.id}-slice-${index}`}
                                d={describePieSlice(x, y, seasonDotRadius, segmentStart, segmentEnd)}
                                fill={color}
                                opacity={0.95}
                              />
                            );
                          })
                        )}
                        <circle cx={x} cy={y} r={seasonDotRadius} fill="none" stroke="white" strokeWidth={0.45} />
                        {dot.examMarkers.map((marker, markerIndex) => {
                          const offset = examOffsets[markerIndex] ?? examOffsets[examOffsets.length - 1];
                          return (
                            <ExamDot
                              key={marker.id}
                              type={marker.type}
                              x={x + offset.x}
                              y={y + offset.y}
                              color={marker.color}
                              size={Math.max(0.35, seasonDotRadius / 10)}
                              reexam={marker.isReexam}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </g>

                {seasonMonthLabels.map((month) => (
                  <MonthLabel
                    key={`season-${month.label}`}
                    label={month.label}
                    angle={month.angle}
                    radius={seasonFrame.labelRadius}
                    active={month.monthIndex === monthForView}
                    onSelect={() => setFocus({ level: 'month', month: month.monthIndex, season: resolvedSeason })}
                  />
                ))}

                <text
                  x={seasonLabelPoint.x}
                  y={seasonLabelPoint.y}
                  textAnchor="middle"
                  className="fill-neutral-700 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  {SEASON_DISPLAY_LABELS[resolvedSeason]}
                </text>
              </g>
            )}
          </motion.svg>
        )}
      </AnimatePresence>

      {focus.level === 'year' ? (
        <button
          type="button"
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[24px] font-bold text-neutral-900 shadow-sm sm:px-5 sm:py-3 sm:text-[32px]"
          onClick={() => setYearDropdownOpen((prev) => !prev)}
        >
          {year}
        </button>
      ) : null}

      {focus.level === 'season' ? (
        <>
          <div className="absolute left-3 right-[84px] top-3 z-20 space-y-2">
            <div className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
              {SEASON_ORDER.map((season) => (
                <button
                  key={`season-pill-${season}`}
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                    season === resolvedSeason
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                  onClick={() => setFocus({ level: 'season', season })}
                >
                  {SEASON_DISPLAY_LABELS[season]}
                </button>
              ))}
            </div>

            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-3 py-1.5 text-xs text-neutral-600 shadow-sm backdrop-blur">
              <BookOpen className="h-3.5 w-3.5 text-neutral-500" />
              <span className="font-semibold text-neutral-800">{seasonOfferings.length} courses</span>
              <span className="text-neutral-300">|</span>
              <CalendarDays className="h-3.5 w-3.5 text-neutral-500" />
              <span className="font-semibold text-neutral-800">{seasonExamCount} exams</span>
            </div>
          </div>

        </>
      ) : null}

      {focus.level !== 'month' && yearDropdownOpen && yearOptions.length > 0 && selectedYearOption !== undefined ? (
        <div className="absolute left-1/2 top-1/2 z-30 w-[128px] -translate-x-1/2 translate-y-8 rounded-2xl border border-neutral-200 bg-white/98 p-1.5 shadow-panel sm:w-[148px] sm:translate-y-10 sm:p-2">
          <Dropdown
            className="h-10 rounded-xl border border-neutral-200 bg-white px-2.5 text-sm font-semibold"
            value={selectedYearOption}
            options={yearOptions}
            onChange={(candidateYear) => {
              setYearDropdownOpen(false);
              onYearChange?.(candidateYear);
            }}
          />
        </div>
      ) : null}

      {focus.level !== 'month' ? (
        <Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>
          {tooltip.content}
        </Tooltip>
      ) : null}

      {focus.level !== 'month' ? (
        <div className="absolute bottom-3 left-3 rounded-xl border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-600">
          {focus.level === 'year'
            ? 'Year view: click a season or month.'
            : 'Season view: dots are days (split colors = multiple subjects); click a month label for day grid.'}
        </div>
      ) : null}
    </div>
  );
}
