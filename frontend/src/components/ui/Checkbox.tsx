import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, error, className, ...props }, ref) {
    return (
      <label
        className={clsx(
          "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50",
          props.disabled && "cursor-not-allowed opacity-60",
          error && "border-red-500 bg-red-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
          {...props}
        />

        <span>
          <span className="block font-medium text-slate-800">{label}</span>

          {description ? (
            <span className="mt-0.5 block text-xs text-slate-500">
              {description}
            </span>
          ) : null}

          {error ? (
            <span className="mt-1 block text-sm text-red-600">{error}</span>
          ) : null}
        </span>
      </label>
    );
  }
);