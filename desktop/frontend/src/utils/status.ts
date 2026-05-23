import type { I18nKey } from "../i18n";

export function statusKeyFromRun(status?: string): I18nKey {
  switch (status) {
    case "running":
      return "status.running";
    case "completed":
      return "status.complete";
    case "canceled":
      return "status.canceled";
    case "idle":
    default:
      return "status.idle";
  }
}
