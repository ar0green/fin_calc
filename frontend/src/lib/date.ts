export function isoToDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return "";
  }

  const [year, month, day] = parts;

  if (!year || !month || !day) {
    return "";
  }

  return `${day}.${month}.${year}`;
}

export function displayDateToIso(value: string): string | null {
  const normalized = value.trim();

  const match = normalized.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  if (dayNumber < 1 || dayNumber > 31) {
    return null;
  }

  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  const isValidDate =
    date.getFullYear() === yearNumber &&
    date.getMonth() === monthNumber - 1 &&
    date.getDate() === dayNumber;

  if (!isValidDate) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function formatDateInputValue(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}