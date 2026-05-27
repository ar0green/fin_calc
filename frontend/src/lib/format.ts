export function formatMoney(value: number | string): string {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(numericValue);
}

export function formatPercent(value: number | string): string {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return `${numericValue.toFixed(2)}%`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}