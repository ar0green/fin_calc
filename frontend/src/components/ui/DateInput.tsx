import { useEffect, useState } from "react";
import clsx from "clsx";

import {
  displayDateToIso,
  formatDateInputValue,
  isoToDisplayDate
} from "@/lib/date";

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (isoValue: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "ДД.ММ.ГГГГ"
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(isoToDisplayDate(value));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayValue(isoToDisplayDate(value));
  }, [value]);

  const handleChange = (nextValue: string) => {
    const formattedValue = formatDateInputValue(nextValue);
    setDisplayValue(formattedValue);
    setLocalError(null);

    const isoValue = displayDateToIso(formattedValue);

    if (isoValue) {
      onChange(isoValue);
    }
  };

  const handleBlur = () => {
    if (!displayValue) {
      setLocalError("Укажи дату");
      return;
    }

    const isoValue = displayDateToIso(displayValue);

    if (!isoValue) {
      setLocalError("Формат даты: ДД.ММ.ГГГГ");
      return;
    }

    setLocalError(null);
    setDisplayValue(isoToDisplayDate(isoValue));
  };

  const errorMessage = error ?? localError ?? undefined;

  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}

      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={clsx(
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          errorMessage && "border-red-500 focus:border-red-500 focus:ring-red-100"
        )}
      />

      {errorMessage ? (
        <span className="mt-1 block text-sm text-red-600">{errorMessage}</span>
      ) : null}
    </label>
  );
}