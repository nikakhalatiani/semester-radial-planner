interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-text-secondary">Color</span>
      <input
        aria-label="Color"
        type="color"
        className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
