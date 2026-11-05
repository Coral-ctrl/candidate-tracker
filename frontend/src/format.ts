import type { Stage } from "./api/candidates";

// "INTERVIEW" -> "Interview"
export function formatStage(stage: Stage): string {
  return stage[0] + stage.slice(1).toLowerCase();
}

// ISO string from the API -> a date in the user's own locale
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
