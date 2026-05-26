/** Monta URL da API com parâmetro de tema do setor ativo */
export function withThemeQuery(path: string, themeId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}theme=${encodeURIComponent(themeId)}`;
}
