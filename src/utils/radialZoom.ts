export type ZoomLevel = 'year' | 'season' | 'month';
export type SeasonKey = 'winter' | 'spring' | 'summer' | 'autumn';

export interface ZoomFocus {
  level: ZoomLevel;
  season?: SeasonKey;
  month?: number;
}

const SEASON_START: Record<SeasonKey, number> = {
  summer: 315,
  spring: 45,
  winter: 135,
  autumn: 225,
};

export function getSeasonStartAngle(season: SeasonKey): number {
  return SEASON_START[season];
}

export function remapAngleByFocus(angle: number, focus: ZoomFocus): number {
  if (focus.level === 'year') {
    return normalizeAngle(angle);
  }

  if (focus.level === 'season' && focus.season) {
    return remapSector(angle, getSeasonStartAngle(focus.season), 90, 240);
  }

  if (focus.level === 'month' && typeof focus.month === 'number') {
    const monthStart = 210 + focus.month * 30;
    return remapSector(angle, normalizeAngle(monthStart), 30, 240);
  }

  return normalizeAngle(angle);
}

function remapSector(angle: number, focusStart: number, focusSpan: number, expandedSpan: number): number {
  const normalized = normalizeAngle(angle);
  const phase = normalizeAngle(normalized - focusStart);

  const remainingIn = 360 - focusSpan;
  const remainingOut = 360 - expandedSpan;

  const mappedPhase =
    phase <= focusSpan
      ? (phase / focusSpan) * expandedSpan
      : expandedSpan + ((phase - focusSpan) / remainingIn) * remainingOut;

  return normalizeAngle(focusStart + mappedPhase);
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function monthToSeason(month: number): SeasonKey {
  if (month >= 2 && month <= 4) {
    return 'spring';
  }
  if (month >= 5 && month <= 7) {
    return 'summer';
  }
  if (month >= 8 && month <= 10) {
    return 'autumn';
  }
  return 'winter';
}
