import { getToken } from "./auth";

/** Monta URL da API com parâmetro de tema do setor ativo */
export function withThemeQuery(path: string, themeId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}theme=${encodeURIComponent(themeId)}`;
}

/** Fetch autenticado — envia JWT em todas as requisições protegidas */
export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
