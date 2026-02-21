import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
}

export function Tooltip({ visible, x, y, children }: TooltipProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none absolute z-20 rounded-lg bg-black/80 px-2 py-1 text-xs text-white"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
