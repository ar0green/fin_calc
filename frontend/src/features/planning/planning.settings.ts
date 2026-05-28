import type { PlanningSettings } from "@/features/planning/planning.types";

const PLANNING_SETTINGS_KEY = "finance_calculator_planning_settings";

export const DEFAULT_PLANNING_SETTINGS: PlanningSettings = {
  month: "2026-04",
  safetyBufferType: "percent",
  safetyBufferValue: 10,
  strategyType: "avalanche",
  maxMonths: 240
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePlanningSettings(value: unknown): PlanningSettings {
  if (!isObject(value)) {
    return DEFAULT_PLANNING_SETTINGS;
  }

  const month =
    typeof value.month === "string" && value.month.length > 0
      ? value.month
      : DEFAULT_PLANNING_SETTINGS.month;

  const safetyBufferType =
    value.safetyBufferType === "percent" || value.safetyBufferType === "fixed"
      ? value.safetyBufferType
      : DEFAULT_PLANNING_SETTINGS.safetyBufferType;

  const safetyBufferValue =
    typeof value.safetyBufferValue === "number" && value.safetyBufferValue >= 0
      ? value.safetyBufferValue
      : DEFAULT_PLANNING_SETTINGS.safetyBufferValue;

  const strategyType =
    value.strategyType === "snowball" || value.strategyType === "avalanche"
      ? value.strategyType
      : DEFAULT_PLANNING_SETTINGS.strategyType;

  const maxMonths =
    typeof value.maxMonths === "number" &&
    Number.isInteger(value.maxMonths) &&
    value.maxMonths >= 1 &&
    value.maxMonths <= 1200
      ? value.maxMonths
      : DEFAULT_PLANNING_SETTINGS.maxMonths;

  return {
    month,
    safetyBufferType,
    safetyBufferValue,
    strategyType,
    maxMonths
  };
}

export function loadPlanningSettings(): PlanningSettings {
  try {
    const rawValue = localStorage.getItem(PLANNING_SETTINGS_KEY);

    if (!rawValue) {
      return DEFAULT_PLANNING_SETTINGS;
    }

    return normalizePlanningSettings(JSON.parse(rawValue));
  } catch {
    return DEFAULT_PLANNING_SETTINGS;
  }
}

export function savePlanningSettings(settings: PlanningSettings): void {
  localStorage.setItem(PLANNING_SETTINGS_KEY, JSON.stringify(settings));
}

export function resetPlanningSettings(): PlanningSettings {
  localStorage.removeItem(PLANNING_SETTINGS_KEY);
  return DEFAULT_PLANNING_SETTINGS;
}