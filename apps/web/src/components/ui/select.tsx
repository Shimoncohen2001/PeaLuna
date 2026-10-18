'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
};

const SEARCH_AFTER = 8;

export function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = '',
  disabled = false,
  invalid = false,
  error,
  searchable,
  searchPlaceholder,
  emptyLabel,
  className,
}: SelectProps) {
  const listId = useId();
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [panel, setPanel] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null,
  );

  const showSearch = searchable ?? options.length >= SEARCH_AFTER;
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => {
      const hay = `${option.label} ${option.description ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  function pick(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    close();
  }

  useEffect(() => {
    if (!open) return;

    function place() {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mobile = window.innerWidth < 640;
      if (mobile) {
        setPanel({
          top: Math.round(window.innerHeight * 0.28),
          left: 12,
          width: Math.round(window.innerWidth - 24),
          maxHeight: Math.round(window.innerHeight * 0.62),
        });
        return;
      }
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(320, openUp ? spaceAbove : spaceBelow));
      setPanel({
        top: Math.round(openUp ? rect.top - maxHeight - 8 : rect.bottom + 8),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        maxHeight,
      });
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | PointerEvent) {
      const target = event.target as Node | null;
      if (rootRef.current?.contains(target)) return;
      const panelEl = document.getElementById(listId);
      if (panelEl?.contains(target)) return;
      close();
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open, listId]);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[active];
      if (option) pick(option);
    }
  }

  const describedBy = error ? `${id ?? listId}-error` : undefined;
  const isInvalid = Boolean(invalid || error);

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (disabled ? undefined : setOpen((v) => !v))}
        onKeyDown={onKeyDown}
        className={cn(
          'flex min-h-11 w-full items-center gap-3 rounded-2xl border bg-warm-white px-4 py-2.5 text-start shadow-soft transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/70',
          disabled && 'cursor-not-allowed bg-beige/40 text-muted opacity-60',
          isInvalid && 'border-red-400/80',
          !isInvalid && open && 'border-champagne shadow-elevated',
          !isInvalid && !open && 'border-ink/10 hover:border-champagne/60',
        )}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-sm font-medium text-ink">{selected.label}</span>
              {selected.description ? (
                <span className="mt-0.5 block truncate text-xs text-muted">{selected.description}</span>
              ) : null}
            </>
          ) : (
            <span className="block truncate text-sm text-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-champagne transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {error ? (
        <p id={describedBy} className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {open && panel
        ? createPortal(
            <>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="fixed inset-0 z-[74] bg-ink/25 sm:bg-transparent"
              onClick={close}
            />
            <div
              id={listId}
              role="listbox"
              aria-labelledby={id}
              style={{ top: panel.top, left: panel.left, width: panel.width, maxHeight: panel.maxHeight }}
              className="fixed z-[75] flex flex-col overflow-hidden rounded-t-3xl border border-ink/10 bg-warm-white shadow-elevated sm:rounded-2xl"
            >
              {showSearch ? (
                <div className="border-b border-ink/5 p-3">
                  <label htmlFor={searchId} className="sr-only">
                    {searchPlaceholder}
                  </label>
                  <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-beige/30 px-3">
                    <Search className="h-4 w-4 text-champagne" />
                    <input
                      ref={searchRef}
                      id={searchId}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder={searchPlaceholder}
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                </div>
              ) : null}
              <ul className="min-h-0 flex-1 overflow-y-auto p-1.5" role="presentation">
                {filtered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted">{emptyLabel}</li>
                ) : (
                  filtered.map((option, index) => {
                    const isSelected = option.value === value;
                    const isActive = index === active;
                    return (
                      <li key={option.value} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled || undefined}
                          disabled={option.disabled}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => pick(option)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition-colors duration-150',
                            option.disabled && 'cursor-not-allowed opacity-40',
                            !option.disabled && isActive && 'bg-beige/60',
                            !option.disabled && isSelected && 'bg-champagne/15',
                            !option.disabled && !isSelected && !isActive && 'hover:bg-beige/40',
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{option.label}</span>
                            {option.description ? (
                              <span className="mt-0.5 block truncate text-xs text-muted">{option.description}</span>
                            ) : null}
                          </span>
                          {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" /> : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
