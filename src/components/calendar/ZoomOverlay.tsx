import type { ZoomLevel } from '../../utils/radialZoom';

interface ZoomOverlayProps {
  level: ZoomLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function labelForLevel(level: ZoomLevel) {
  if (level === 'month') {
    return 'Month';
  }
  if (level === 'season') {
    return 'Season';
  }
  return 'Year';
}

export function ZoomOverlay({ level, onZoomIn, onZoomOut, onReset }: ZoomOverlayProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
      <button
        className="h-11 w-11 rounded-full border border-neutral-200 bg-white text-lg font-semibold shadow-sm"
        onClick={onZoomIn}
        type="button"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        className="h-11 w-11 rounded-full border border-neutral-200 bg-white text-lg font-semibold shadow-sm"
        onClick={onZoomOut}
        type="button"
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        className="whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
        onClick={onReset}
        type="button"
      >
        {labelForLevel(level)}
      </button>
    </div>
  );
}
