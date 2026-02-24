import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { type CSSProperties, type ReactNode, useState } from 'react';

import { useI18n } from '../../hooks/useI18n';

interface RulesOverlayPanelProps {
  children: ReactNode;
  collapsedContent?: (controls: { toggle: () => void }) => ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  fullOverlay?: boolean;
  expandedPanelClassName?: string;
  expandedPanelStyle?: CSSProperties;
}

export function RulesOverlayPanel({
  children,
  collapsedContent,
  className,
  defaultExpanded = false,
  fullOverlay = false,
  expandedPanelClassName,
  expandedPanelStyle,
}: RulesOverlayPanelProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = () => setExpanded((prev) => !prev);

  return (
    <div
      className={clsx(
        'relative z-10 overflow-visible',
        expanded
          ? 'h-0 border-0 bg-transparent p-0'
          : 'rounded-3xl border border-border bg-surface p-3',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="rules-overlay"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={clsx(
              'z-20 overflow-hidden rounded-3xl border border-border bg-white shadow-panel',
              expandedPanelClassName ??
                (fullOverlay
                  ? 'absolute -inset-x-px bottom-[calc(100%+0.75rem)] h-[60vh] min-h-[440px]'
                  : 'absolute inset-x-0 bottom-[calc(100%+8px)]'),
            )}
            style={expandedPanelStyle}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold text-text-primary">
                {t('rule.overlay.title', 'Rule checker')}
              </p>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:bg-surface"
                onClick={toggle}
                aria-label={t('rule.overlay.hide', 'Collapse')}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div className={clsx('overflow-auto p-2', fullOverlay ? 'h-[calc(100%-45px)]' : 'max-h-[min(58vh,560px)]')}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!expanded && collapsedContent ? (
        <div className="mt-2">
          {collapsedContent({ toggle })}
        </div>
      ) : null}
    </div>
  );
}
