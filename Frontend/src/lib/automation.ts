const AUTO_MODE_KEY = "gestify_auto_mode";

export function isAutoModeEnabled(): boolean {
  return localStorage.getItem(AUTO_MODE_KEY) === "true";
}

export function setAutoModeEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_MODE_KEY, enabled ? "true" : "false");
}
