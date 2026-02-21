import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close sheet"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            className={clsx(
              'fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-panel dark:bg-neutral-900',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            {title ? <h3 className="mb-4 text-lg font-semibold text-text-primary dark:text-text-darkPrimary">{title}</h3> : null}
            <div className="overflow-y-auto">{children}</div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
