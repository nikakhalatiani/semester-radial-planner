import clsx from 'clsx';
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

type PillTone = 'neutral' | 'success' | 'muted';
type PillSize = 'sm' | 'md';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: PillSize;
  uppercase?: boolean;
}

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: PillTone;
  size?: PillSize;
  uppercase?: boolean;
}

function toneClass(tone: PillTone): string {
  if (tone === 'success') {
    return 'border-success bg-success text-white';
  }
  if (tone === 'muted') {
    return 'border-[#DDE1E8] bg-[#ECEEF3] text-[#5E6472]';
  }
  return 'border-[#DDE1E8] bg-white text-[#1E2330]';
}

function sizeClass(size: PillSize): string {
  return size === 'md' ? 'h-10 px-4 text-sm' : 'h-8 px-3 text-xs';
}

function textCaseClass(uppercase: boolean): string {
  return uppercase ? 'uppercase tracking-[0.08em]' : 'tracking-[0.01em]';
}

export function Pill({
  tone = 'muted',
  size = 'sm',
  uppercase = false,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold leading-none',
        toneClass(tone),
        sizeClass(size),
        textCaseClass(uppercase),
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export function PillButton({
  tone = 'muted',
  size = 'sm',
  uppercase = false,
  className,
  children,
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={rest.type ?? 'button'}
      className={clsx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border font-semibold leading-none transition',
        'shadow-[0_1px_0_rgba(17,24,39,0.08)] hover:-translate-y-px hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/45 focus-visible:ring-offset-1',
        'active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        toneClass(tone),
        sizeClass(size),
        textCaseClass(uppercase),
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
