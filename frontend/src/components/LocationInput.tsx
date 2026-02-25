import { useEffect, useRef, useState } from "react";
import { useController, type Control } from "react-hook-form";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Nominatim types ──────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

async function fetchSuggestions(query: string): Promise<NominatimResult[]> {
  if (query.trim().length < 2) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("countrycodes", "us");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  return res.json() as Promise<NominatimResult[]>;
}

// ── Component ─────────────────────────────────────────────────────────────
interface LocationInputProps {
  // react-hook-form field name — must be a key of your form values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: string;
}

export default function LocationInput({
  control,
  name,
  label,
  placeholder = "Search location…",
  icon = <MapPin className="w-3.5 h-3.5 text-muted-foreground" />,
  error,
  required,
}: LocationInputProps) {
  const {
    field: { value, onChange, onBlur, ref },
  } = useController({ control, name, rules: { required } });

  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external form reset
  useEffect(() => {
    if (value !== inputValue) setInputValue(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchSuggestions(inputValue);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(result: NominatimResult) {
    const label = result.display_name;
    setInputValue(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    onChange(v); // keep form value in sync as user types
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
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

  function clear() {
    setInputValue("");
    onChange("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <Label
        htmlFor={name}
        className="flex items-center gap-1.5 text-sm font-medium"
      >
        {icon}
        {label}
      </Label>

      <div className="relative">
        <Input
          id={name}
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "pr-8",
            error ? "border-destructive focus-visible:ring-destructive" : "",
          )}
        />

        {/* Right adornment: spinner or clear */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
          ) : inputValue ? (
            <button
              type="button"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-lg border bg-popover text-popover-foreground shadow-md overflow-hidden"
          >
            {suggestions.map((s, i) => {
              // Show city / state / country parts only
              const parts = s.display_name.split(", ");
              const primary = parts.slice(0, 2).join(", ");
              const secondary = parts.slice(2).join(", ");

              return (
                <li
                  key={s.place_id}
                  role="option"
                  aria-selected={i === activeIndex ? "true" : "false"}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click
                    selectSuggestion(s);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 cursor-pointer text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    i === activeIndex && "bg-accent text-accent-foreground",
                    i < suggestions.length - 1 && "border-b border-border/40",
                  )}
                >
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-muted-foreground truncate">
                        {secondary}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
