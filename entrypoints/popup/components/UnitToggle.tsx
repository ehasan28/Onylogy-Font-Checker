import { ToggleGroup, ToggleGroupItem } from './ui/ToggleGroup';
import type { SizeUnit } from '../../../src/shared/types';

const UNITS: { value: SizeUnit; label: string }[] = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
];

export function UnitToggle({
  value,
  onChange,
}: {
  value: SizeUnit;
  onChange: (next: SizeUnit) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as SizeUnit)}
      layoutGroupId="unit-chip"
    >
      {UNITS.map((u) => (
        <ToggleGroupItem key={u.value} value={u.value} aria-label={`Display in ${u.label}`}>
          {u.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
