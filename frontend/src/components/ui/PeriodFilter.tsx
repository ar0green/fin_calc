import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";

interface PeriodFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply?: () => void;
  disabled?: boolean;
  showDemoPresets?: boolean;
}

interface PeriodPreset {
  label: string;
  dateFrom: string;
  dateTo: string;
}

function toInputDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getCurrentMonthPreset(): PeriodPreset {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    label: "Текущий месяц",
    dateFrom: toInputDate(firstDay),
    dateTo: toInputDate(lastDay)
  };
}

function getCurrentYearPreset(): PeriodPreset {
  const now = new Date();

  return {
    label: "Текущий год",
    dateFrom: toInputDate(new Date(now.getFullYear(), 0, 1)),
    dateTo: toInputDate(new Date(now.getFullYear(), 11, 31))
  };
}

function getPresets(showDemoPresets: boolean): PeriodPreset[] {
  const presets: PeriodPreset[] = [];

  if (showDemoPresets) {
    presets.push(
      {
        label: "Апрель 2026",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-30"
      },
      {
        label: "Янв–Апр 2026",
        dateFrom: "2026-01-01",
        dateTo: "2026-04-30"
      }
    );
  }

  presets.push(getCurrentMonthPreset(), getCurrentYearPreset());

  return presets;
}

export function PeriodFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  disabled = false,
  showDemoPresets = true
}: PeriodFilterProps) {
  const presets = getPresets(showDemoPresets);

  const applyPreset = (preset: PeriodPreset) => {
    onDateFromChange(preset.dateFrom);
    onDateToChange(preset.dateTo);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = preset.dateFrom === dateFrom && preset.dateTo === dateTo;

          return (
            <Button
              key={`${preset.dateFrom}-${preset.dateTo}`}
              variant={isActive ? "primary" : "secondary"}
              className="h-9 px-3"
              onClick={() => applyPreset(preset)}
              disabled={disabled}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <DateInput
            label="Дата от"
            value={dateFrom}
            onChange={onDateFromChange}
            disabled={disabled}
          />

          <DateInput
            label="Дата до"
            value={dateTo}
            onChange={onDateToChange}
            disabled={disabled}
          />
        </div>

        {onApply ? (
          <Button onClick={onApply} disabled={disabled}>
            Применить
          </Button>
        ) : null}
      </div>
    </div>
  );
}