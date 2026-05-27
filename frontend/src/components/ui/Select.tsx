import { forwardRef, SelectHTMLAttributes } from "react";
import clsx from "clsx";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, options, className, ...props }, ref) {
    return (
      <label className="block">
        {label ? (
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {label}
          </span>
        ) : null}

        <select
          ref={ref}
          className={clsx(
            "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error ? (
          <span className="mt-1 block text-sm text-red-600">{error}</span>
        ) : null}
      </label>
    );
  }
);