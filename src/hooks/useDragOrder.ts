import { useCallback } from 'react';

import type { SelectedOffering } from '../types';

export function reorderByOfferingId(
  selections: SelectedOffering[],
  activeId: string,
  overId: string,
): SelectedOffering[] {
  const included = selections.filter((selection) => selection.isIncluded);
  const excluded = selections.filter((selection) => !selection.isIncluded);

  const activeIndex = included.findIndex((selection) => selection.offeringId === activeId);
  const overIndex = included.findIndex((selection) => selection.offeringId === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return selections;
  }

  const reordered = [...included];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);

  const withOrder = reordered.map((selection, index) => ({
    ...selection,
    displayOrder: index,
  }));

  return [...withOrder, ...excluded];
}

export function useDragOrder() {
  return useCallback(
    (selections: SelectedOffering[], activeId: string, overId: string) =>
      reorderByOfferingId(selections, activeId, overId),
    [],
  );
}
