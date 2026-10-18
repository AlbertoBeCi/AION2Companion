import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

export type NeoSelectOption = {
  value: string | number;
  label: string;
  group?: string;
};

type NeoSelectProps = {
  value: string | number;
  options: NeoSelectOption[];
  onChange: (value: string | number) => void;
  ariaLabel?: string;
  id?: string;
  name?: string;
  className?: string;
  leadingIcon?: ReactNode;
  disabled?: boolean;
};

export function NeoSelect({ value, options, onChange, ariaLabel, id, name, className = '', leadingIcon, disabled = false }: NeoSelectProps) {
  const generatedId = useId().replace(/:/g, '');
  const baseId = id ?? `neo-select-${generatedId}`;
  const listId = `${baseId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [listStyle, setListStyle] = useState<CSSProperties>({});
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const groups = useMemo(() => {
    const result: Array<{ label: string | undefined; options: Array<{ option: NeoSelectOption; index: number }> }> = [];
    options.forEach((option, index) => {
      const last = result[result.length - 1];
      if (!last || last.label !== option.group) result.push({ label: option.group, options: [{ option, index }] });
      else last.options.push({ option, index });
    });
    return result;
  }, [options]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    listRef.current?.focus();
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${baseId}-option-${activeIndex}`)}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, baseId, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = buttonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const maxHeight = Math.max(120, Math.min(300, Math.max(spaceBelow, spaceAbove)));
      const placeAbove = spaceBelow < Math.min(220, maxHeight) && spaceAbove > spaceBelow;
      setListStyle({
        position: 'fixed',
        top: placeAbove ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
        width: rect.width,
        maxHeight,
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    close(true);
  }

  function openList(index = selectedIndex) {
    if (disabled || options.length === 0) return;
    setActiveIndex(index);
    setOpen(true);
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); openList(selectedIndex); }
    if (event.key === 'ArrowUp') { event.preventDefault(); openList(selectedIndex); }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!options.length) return;
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % options.length); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index - 1 + options.length) % options.length); return; }
    if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); return; }
    if (event.key === 'End') { event.preventDefault(); setActiveIndex(options.length - 1); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(activeIndex); }
  }

  function renderOption(option: NeoSelectOption, index: number) {
    const selectedOption = option.value === value;
    return <div
      key={`${String(option.value)}-${index}`}
      id={`${baseId}-option-${index}`}
      role="option"
      aria-selected={selectedOption}
      data-active={activeIndex === index ? 'true' : undefined}
      className="neo-select-option"
      onMouseMove={() => setActiveIndex(index)}
      onClick={() => choose(index)}
    >{option.label}{selectedOption && <span className="neo-select-check" aria-hidden="true">✓</span>}</div>;
  }

  return <div className={`neo-select ${className}`.trim()} ref={rootRef}>
    {name && <input type="hidden" name={name} value={String(value)} />}
    <button
      ref={buttonRef}
      id={baseId}
      type="button"
      className="neo-select-trigger"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      disabled={disabled}
      onClick={() => open ? close() : openList()}
      onKeyDown={onButtonKeyDown}
    >
      {leadingIcon && <span className="neo-select-leading" aria-hidden="true">{leadingIcon}</span>}
      <span className="neo-select-value">{selected?.label ?? ''}</span>
      <ChevronDown className={`neo-select-chevron${open ? ' is-open' : ''}`} size={18} aria-hidden="true" />
    </button>
    {open && createPortal(<div
      ref={listRef}
      id={listId}
      className="neo-select-list"
      role="listbox"
      tabIndex={-1}
      aria-labelledby={baseId}
      aria-activedescendant={options[activeIndex] ? `${baseId}-option-${activeIndex}` : undefined}
      style={listStyle}
      onKeyDown={onListKeyDown}
    >
      {groups.map((group, groupIndex) => group.label
        ? <div role="group" aria-label={group.label} className="neo-select-group" key={`${group.label}-${groupIndex}`}>
          <span className="neo-select-group-label">{group.label}</span>
          {group.options.map(({ option, index }) => renderOption(option, index))}
        </div>
        : group.options.map(({ option, index }) => renderOption(option, index)))}
    </div>, document.body)}
  </div>;
}
