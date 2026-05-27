import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        {
          "bg-slate-900 text-white hover:bg-slate-800": variant === "primary",
          "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50":
            variant === "secondary",
          "bg-red-600 text-white hover:bg-red-500": variant === "danger"
        },
        className
      )}
      {...props}
    />
  );
}