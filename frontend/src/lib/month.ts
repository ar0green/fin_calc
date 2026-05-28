export interface MonthOption {
  label: string;
  value: string;
}

export function toMonthValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function addMonths(date: Date, monthsToAdd: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
}

export function formatMonthLabel(monthValue: string): string {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!year || !month) {
    return monthValue;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

export function buildMonthOptions(params?: {
  monthsBack?: number;
  monthsForward?: number;
  includeDemoMonths?: boolean;
}): MonthOption[] {
  const monthsBack = params?.monthsBack ?? 6;
  const monthsForward = params?.monthsForward ?? 18;
  const includeDemoMonths = params?.includeDemoMonths ?? true;

  const now = new Date();
  const result = new Map<string, MonthOption>();

  if (includeDemoMonths) {
    ["2026-01", "2026-02", "2026-03", "2026-04"].forEach((month) => {
      result.set(month, {
        value: month,
        label: `${formatMonthLabel(month)} · demo`
      });
    });
  }

  for (let offset = -monthsBack; offset <= monthsForward; offset += 1) {
    const date = addMonths(now, offset);
    const value = toMonthValue(date);

    result.set(value, {
      value,
      label: formatMonthLabel(value)
    });
  }

  return Array.from(result.values()).sort((a, b) =>
    a.value.localeCompare(b.value)
  );
}

export function getCurrentMonthValue(): string {
  return toMonthValue(new Date());
}

export function monthValueFromIsoDate(value: string): string {
  return value.slice(0, 7);
}