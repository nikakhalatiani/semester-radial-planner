export function dateToAngle(date: Date, year: number): number {
  // Anchor at Jan 15 so month labels align intuitively:
  // Jan bottom-center, Apr right, Jul top-center, Oct left.
  const anchor = Date.UTC(year, 0, 15);
  const msInYear = Date.UTC(year + 1, 0, 15) - anchor;
  const t = (date.getTime() - anchor) / msInYear;
  return ((180 - t * 360) % 360 + 360) % 360;
}
