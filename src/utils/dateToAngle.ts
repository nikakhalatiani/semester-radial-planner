export function dateToAngle(date: Date, year: number): number {
  const startOfYear = new Date(year, 0, 1).getTime();
  const msInYear = new Date(year + 1, 0, 1).getTime() - startOfYear;
  const t = (date.getTime() - startOfYear) / msInYear;
  return (210 + t * 360) % 360;
}
