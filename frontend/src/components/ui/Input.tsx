import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}

      <input
        className={clsx(
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200",
          error && "border-red-500 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />

      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}