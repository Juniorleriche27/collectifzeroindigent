"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  email: string | null;
  id: string;
  name: string;
  status: string | null;
};

type Props = {
  defaultValue?: string;
  name: string;
  placeholder?: string;
};

function statusDot(status: string | null) {
  if (status === "active") return "bg-green-400";
  if (status === "pending") return "bg-yellow-400";
  if (status === "rejected" || status === "suspended") return "bg-red-400";
  return "bg-gray-300";
}

export function MembersSearchInput({ defaultValue = "", name, placeholder }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/suggest?q=${encodeURIComponent(value.trim())}`);
        const data = (await res.json()) as { items?: Suggestion[] };
        const items = data.items ?? [];
        setSuggestions(items);
        setOpen(items.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(item: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    router.push(`/app/membres/${item.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        name={name}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />

      {open && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-xl border border-border bg-white shadow-lg"
          role="listbox"
        >
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                idx === activeIndex ? "bg-blue-50" : "hover:bg-muted-surface/60"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(item);
              }}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span
                className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${statusDot(item.status)}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{item.name}</p>
                <p className="truncate font-mono text-[10px] text-muted">{item.id}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
