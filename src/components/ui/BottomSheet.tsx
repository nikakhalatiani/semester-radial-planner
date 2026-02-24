import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label={t('common.closeSheet', 'Close sheet')}
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            className={clsx(
              'fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-3xl bg-white px-3 pb-6 pt-3 shadow-panel sm:px-4',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-neutral-300" />
            {title ? <h3 className="mb-4 text-lg font-semibold text-text-primary">{title}</h3> : null}
            <div className="max-h-[calc(92vh-6.5rem)] min-w-0 overflow-x-hidden overflow-y-auto pr-1">
              {children}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
