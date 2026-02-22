import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

type DropdownValue = string | number;

export interface DropdownOption<T extends DropdownValue = DropdownValue> {
  label: string;
  value: T;
}

interface DropdownProps<T extends DropdownValue = DropdownValue> {
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}

interface MultiDropdownProps {
  values: string[];
  options: Array<DropdownOption<string>>;
  onChange: (values: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function Dropdown<T extends DropdownValue>({
  value,
  options,
  onChange,
  className,
  disabled,
}: DropdownProps<T>) {
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        value={String(value)}
        disabled={disabled}
        className={clsx(
          'h-11 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-9 text-sm text-neutral-900 transition',
          'focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200',
          'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
          className,
        )}
        onChange={(event) => {
          const selected = options.find((option) => String(option.value) === event.target.value);
          if (selected) {
            onChange(selected.value);
          }
        }}
      >
        {options.map((option) => (
          <option key={`${option.value}`} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-neutral-500" />
    </div>
  );
}

export function MultiDropdown({
  values,
  options,
  onChange,
  className,
  disabled,
}: MultiDropdownProps) {
  return (
    <select
      multiple
      value={values}
      disabled={disabled}
      className={clsx('min-h-24 w-full rounded-xl border border-border px-3 py-2', className)}
      onChange={(event) => {
        const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
        onChange(selectedValues);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
