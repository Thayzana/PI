/** Ordenação alfabética pt-BR (ignora acentos na prática via locale). */
export function comparePt(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

export function sortByNamePt<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((x, y) => comparePt(x.name, y.name));
}
