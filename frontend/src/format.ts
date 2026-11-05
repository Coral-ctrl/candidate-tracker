import type { Stage } from "./api/candidates";

// "INTERVIEW" -> "Interview"
export function formatStage(stage: Stage): string {
  return stage[0] + stage.slice(1).toLowerCase();
}

// ISO string from the API -> a date in the user's own locale
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}

// Notes need the time as well, because several can be added on the same day
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}
