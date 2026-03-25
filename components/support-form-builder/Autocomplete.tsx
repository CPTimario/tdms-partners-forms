"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./FormBuilder.module.css";
import type { Suggestion } from "@/hooks/useTeams";

type AutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: Suggestion) => void;
  suggestions: Suggestion[];
  placeholder?: string;
};

export function Autocomplete({ value, onChange, onSelect, suggestions, placeholder }: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  // -1 means nothing highlighted; keeps keyboard navigation predictable
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!value) return suggestions.slice(0, 10);
    const q = value.toLowerCase();
    return suggestions.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 10);
  }, [suggestions, value]);

  // grouped view: separate teams and missioners but keep a flat index for keyboard nav
  const grouped = useMemo(() => {
    const teams = filtered.filter((s) => s.type === "team");
    const missioners = filtered.filter((s) => s.type === "missioner");
    const flat = [...teams, ...missioners];
    return { teams, missioners, flat };
  }, [filtered]);

  useEffect(() => {
    // reset highlight when the filtered list changes (deferred to avoid
    // triggering synchronous setState inside effect)
    const t = setTimeout(() => setHighlight(-1), 0);
    return () => clearTimeout(t);
  }, [filtered.length]);

  const reactId = useId();
  const listId = `autocomplete-${reactId}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => {
        if (grouped.flat.length === 0) return -1;
        return h < 0 ? 0 : Math.min(h + 1, grouped.flat.length - 1);
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => {
        if (grouped.flat.length === 0) return -1;
        return Math.max(-1, h - 1);
      });
      return;
    }
    if (e.key === "Enter") {
      if (open && highlight >= 0 && grouped.flat[highlight]) {
        e.preventDefault();
        const sel = grouped.flat[highlight];
        // update value first, then notify selection so parent handlers that
        // clear on typing don't override a deliberate selection
        onChange(sel.label);
        onSelect?.(sel);
        setOpen(false);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className={styles.autocompleteWrap}
      style={{ position: "relative" }}
      ref={containerRef}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        const related = (e as React.FocusEvent).relatedTarget as Node | null;
        if (!containerRef.current) {
          setOpen(false);
          return;
        }
        if (!related || !containerRef.current.contains(related)) {
          setOpen(false);
        }
      }}
    >
      <input
        ref={ref}
        className={styles.textInput}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        // focus/blur handled on the container to avoid timing races
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open && highlight >= 0 ? `${listId}-option-${highlight}` : undefined}
      />

      {open && grouped.flat.length > 0 ? (
        <ul id={listId} className={styles.autocompleteList} role="listbox">
          {/* Teams group */}
          {grouped.teams.length > 0 ? (
            <li role="group" aria-label="Teams">
              <div className={styles.groupLabel}>Teams</div>
              {grouped.teams.map((s) => {
                const i = grouped.flat.indexOf(s);
                return (
                  <div
                    key={s.id}
                    id={`${listId}-option-${i}`}
                    role="option"
                    aria-selected={i === highlight}
                    className={`${styles.autocompleteItem} ${i === highlight ? styles.autocompleteItemActive : ""}`}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      // ensure the input value is updated first so parent
                      // "typing clears selection" handlers don't stomp the
                      // explicit selection notification
                      onChange(s.label);
                      onSelect?.(s);
                      setOpen(false);
                    }}
                  >
                    <span className={styles.autocompleteLabel}>{s.label}</span>
                    <span className={styles.autocompleteMeta}>{s.team}</span>
                  </div>
                );
              })}
            </li>
          ) : null}

          {/* Missioners group */}
          {grouped.missioners.length > 0 ? (
            <li role="group" aria-label="Missioners">
              <div className={styles.groupLabel}>Missioners</div>
              {grouped.missioners.map((s) => {
                const i = grouped.flat.indexOf(s);
                return (
                  <div
                    key={s.id}
                    id={`${listId}-option-${i}`}
                    role="option"
                    aria-selected={i === highlight}
                    className={`${styles.autocompleteItem} ${i === highlight ? styles.autocompleteItemActive : ""}`}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      onChange(s.label);
                      onSelect?.(s);
                      setOpen(false);
                    }}
                  >
                    <span className={styles.autocompleteLabel}>{s.label}</span>
                    <span className={styles.autocompleteMeta}>{s.team}</span>
                  </div>
                );
              })}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export default Autocomplete;
