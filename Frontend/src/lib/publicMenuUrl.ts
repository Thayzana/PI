import { normalizeThemeId } from "../types";

const PUBLIC_MENU_PATH = "/cardapio";

/** URL base do cardápio público (produção pode definir VITE_PUBLIC_MENU_BASE_URL). */
export function getPublicMenuBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_MENU_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${PUBLIC_MENU_PATH}`;
  }
  return PUBLIC_MENU_PATH;
}

/** Link completo do cardápio digital para QR Code e compartilhamento. */
export function getPublicMenuUrl(themeId?: string | null): string {
  const base = getPublicMenuBaseUrl();
  const theme = normalizeThemeId(themeId ?? null);

  if (typeof window === "undefined") {
    return `${base}?theme=${encodeURIComponent(theme)}`;
  }

  try {
    const url = base.startsWith("http")
      ? new URL(base)
      : new URL(base, window.location.origin);
    url.searchParams.set("theme", theme);
    return url.toString();
  } catch {
    return `${window.location.origin}${PUBLIC_MENU_PATH}?theme=${encodeURIComponent(theme)}`;
  }
}

export function isPublicMenuPath(pathname: string): boolean {
  return pathname === PUBLIC_MENU_PATH || pathname === `${PUBLIC_MENU_PATH}/`;
}
