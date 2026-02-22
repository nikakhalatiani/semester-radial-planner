import type { CourseCategory } from '../types';

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  FM: 'Formal Methods',
  SE: 'Software Engineering',
  HCI: 'Human-Computer Interaction',
  DB: 'Databases',
  DS: 'Distributed Systems',
  SS: 'Softskills',
};

export const CATEGORY_COLORS: Record<CourseCategory, string> = {
  FM: '#F5A623',
  SE: '#4A90D9',
  HCI: '#E91E8C',
  DB: '#9B59B6',
  DS: '#27AE60',
  SS: '#95A5A6',
};

export const CATEGORY_ORDER: CourseCategory[] = ['FM', 'SE', 'HCI', 'DB', 'DS', 'SS'];

export const UNCATEGORIZED_LABEL = 'Uncategorized';
export const UNCATEGORIZED_COLOR = '#7A808B';

export const SEASON_LABELS = [
  { label: 'Summer', angle: 0, key: 'summer' },
  { label: 'Spring', angle: 90, key: 'spring' },
  { label: 'Winter', angle: 180, key: 'winter' },
  { label: 'Fall', angle: 270, key: 'autumn' },
] as const;

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
