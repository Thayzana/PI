import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import PublicMenuStandalone from "./pages/PublicMenuStandalone.tsx";
import NotifyHost from "./components/NotifyHost.tsx";
import { isPublicMenuPath } from "./lib/publicMenuUrl.ts";
import "./index.css";

const isPublicMenu = isPublicMenuPath(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPublicMenu ? <PublicMenuStandalone /> : <App />}
    <NotifyHost />
  </StrictMode>
);
