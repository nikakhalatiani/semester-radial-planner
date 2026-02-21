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
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
      <button
        className="h-10 w-10 rounded-full border border-neutral-200 bg-white text-lg shadow-sm"
        onClick={onZoomIn}
        type="button"
      >
        +
      </button>
      <button
        className="h-10 w-10 rounded-full border border-neutral-200 bg-white text-lg shadow-sm"
        onClick={onZoomOut}
        type="button"
      >
        -
      </button>
      <button
        className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold shadow-sm"
        onClick={onReset}
        type="button"
      >
        {labelForLevel(level)}
      </button>
    </div>
  );
}
