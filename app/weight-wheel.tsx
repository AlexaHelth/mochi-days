'use client';

import { useEffect, useId, useRef } from 'react';

const rowHeight = 44;

export function WeightWheel({ label, values, value, disabled, onChange }: {
  label: string; values: number[]; value: number; disabled: boolean; onChange: (value: number) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const emitted = useRef<number | undefined>(undefined);
  const previousValues = useRef<number[] | undefined>(undefined);
  useEffect(() => {
    if (!ref.current || (emitted.current === value && previousValues.current === values)) return;
    emitted.current = value;
    previousValues.current = values;
    ref.current.scrollTop = Math.max(0, values.indexOf(value)) * rowHeight;
  }, [value, values]);

  function choose(next: number) {
    if (disabled || !ref.current) return;
    emitted.current = next;
    ref.current.scrollTop = values.indexOf(next) * rowHeight;
    onChange(next);
  }

  return <div ref={ref} className={'weight-wheel ' + (disabled ? 'disabled' : '')}
    role="listbox" aria-label={label} aria-disabled={disabled} aria-activedescendant={`${id}-${value}`}
    tabIndex={disabled ? -1 : 0}
    onScroll={event => {
      if (disabled) return;
      const index = Math.max(0, Math.min(values.length - 1, Math.round(event.currentTarget.scrollTop / rowHeight)));
      const next = values[index];
      if (next !== emitted.current) { emitted.current = next; onChange(next); }
    }}
    onKeyDown={event => {
      const index = values.indexOf(value);
      const steps: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 };
      if (event.key in steps) { event.preventDefault(); choose(values[Math.max(0, Math.min(values.length - 1, index + steps[event.key]))]); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); choose(event.key === 'Home' ? values[0] : values[values.length - 1]); }
    }}>
    {values.map(number => <div key={number} id={`${id}-${number}`} role="option" aria-selected={number === value}
      className={'weight-wheel-option ' + (number === value ? 'selected' : '')} onClick={() => choose(number)}>{number}</div>)}
  </div>;
}
