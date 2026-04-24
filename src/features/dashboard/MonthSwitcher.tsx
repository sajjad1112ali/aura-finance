import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isAfterMonth(a: Date, b: Date) {
  if (a.getFullYear() !== b.getFullYear()) return a.getFullYear() > b.getFullYear();
  return a.getMonth() > b.getMonth();
}

export function MonthSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(value.getFullYear());
  const today = startOfMonth(new Date());
  const isCurrent = isSameMonth(value, today);

  const goPrev = () => onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1));
  const goNext = () => {
    const next = new Date(value.getFullYear(), value.getMonth() + 1, 1);
    if (!isAfterMonth(next, today)) onChange(next);
  };
  const reset = () => onChange(today);

  const label = value.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="inline-flex items-center rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <button
          onClick={goPrev}
          className="h-9 w-9 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Previous month"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) setPickerYear(value.getFullYear());
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="h-9 px-3 text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors min-w-[140px] justify-center"
              title="Pick a month"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="center">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
                aria-label="Previous year"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="font-display font-semibold">{pickerYear}</div>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                disabled={pickerYear >= today.getFullYear()}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next year"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((m, i) => {
                const d = new Date(pickerYear, i, 1);
                const disabled = isAfterMonth(d, today);
                const selected = isSameMonth(d, value);
                return (
                  <button
                    key={m}
                    disabled={disabled}
                    onClick={() => {
                      onChange(d);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-md text-sm font-medium transition-colors ${
                      selected
                        ? "bg-gradient-brand text-primary-foreground shadow-glow"
                        : "hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <button
          onClick={goNext}
          disabled={isCurrent}
          className="h-9 w-9 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Next month"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {!isCurrent && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9">
          Today
        </Button>
      )}
    </div>
  );
}