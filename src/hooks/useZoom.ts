import { useMemo, useRef, useState } from 'react';

export interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.8;
const MAX_SCALE = 3;

export function useZoom() {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const pinchDistanceRef = useRef<number | null>(null);

  const style = useMemo(
    () => ({
      transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
      transformOrigin: 'center center',
    }),
    [zoom],
  );

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    setZoom((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta)),
    }));
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length === 2) {
      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (!first || !second) {
        return;
      }
      const dx = first.clientX - second.clientX;
      const dy = first.clientY - second.clientY;
      pinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
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
    const delta = (nextDistance - pinchDistanceRef.current) * 0.004;

    setZoom((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta)),
    }));

    pinchDistanceRef.current = nextDistance;
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    pinchDistanceRef.current = null;
  };

  const resetZoom = () => setZoom({ scale: 1, x: 0, y: 0 });

  return {
    zoom,
    style,
    setZoom,
    resetZoom,
    handlers: {
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
