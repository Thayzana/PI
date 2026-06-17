import { useEffect } from "react";
import PublicMenuSimulator from "./PublicMenuSimulator";
import { normalizeThemeId } from "../types";

export default function PublicMenuStandalone() {
  const params = new URLSearchParams(window.location.search);
  const themeId = normalizeThemeId(params.get("theme"));

  useEffect(() => {
    document.title = "Cardápio Digital — Gestify";
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <PublicMenuSimulator themeId={themeId} standalone />
    </div>
  );
}
