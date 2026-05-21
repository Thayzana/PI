import { useEffect, useState, CSSProperties } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import LabelPage from "./pages/LabelPage";
import PromotionsPage from "./pages/PromotionsPage";
import MarketingPage from "./pages/MarketingPage";
import SettingsPage from "./pages/SettingsPage";
import DeliveryLogisticsPage from "./pages/DeliveryLogisticsPage";
import MenuAdminPage from "./pages/MenuAdminPage";
import PublicMenuSimulator from "./pages/PublicMenuSimulator";
import { Product, DashboardStats, AppTheme, normalizeThemeId } from "./types";
import { withThemeQuery } from "./lib/api";

const THEME_PRESETS: AppTheme[] = [
  {
    id: "confeitaria",
    name: "Confeitaria & Chocolates",
    icon: "🍰",
    brand: "#b3543d", // Warm terracotta / Rich cacao
    brandHover: "#93412f",
    brandBg: "#faf0ed",
    surfacePage: "#faf6f2", // Soft cream white
    sidebarBg: "#2e211f", // Rich dark cocoa
    sidebarText: "#ebd6d1", 
    sidebarActiveBg: "#b3543d",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#3d2b28",
  },
  {
    id: "cafeteria",
    name: "Cafeteria & Bistrô",
    icon: "☕",
    brand: "#854f38", // Espresso brown
    brandHover: "#6e3f2b",
    brandBg: "#f5ebe6",
    surfacePage: "#faf8f5", // Creamy latte
    sidebarBg: "#2b211d", // Dark coffee bean
    sidebarText: "#ebdcd5",
    sidebarActiveBg: "#854f38",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#3a2d28",
  },
  {
    id: "hamburgueria",
    name: "Hambúrguer, Lanches & Trailer",
    icon: "🍔",
    brand: "#ea580c", // Bold cheddar orange
    brandHover: "#c2410c",
    brandBg: "#ffedd5",
    surfacePage: "#fbfaf7", // Clean warm white
    sidebarBg: "#1e1b18", // Dark charcoal roast
    sidebarText: "#e5e1dc",
    sidebarActiveBg: "#ea580c",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#2d2824",
  },
  {
    id: "doceria",
    name: "Doceria & Bolos",
    icon: "🧁",
    brand: "#db2777", // Intense strawberry
    brandHover: "#be185d",
    brandBg: "#fce7f3",
    surfacePage: "#fffbfd", // Soft pastel blush
    sidebarBg: "#381826", // Dark plum/berry
    sidebarText: "#ebd5df",
    sidebarActiveBg: "#db2777",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#4a2434",
  },
  {
    id: "delivery",
    name: "Delivery Rápido & Conveniência",
    icon: "🛵",
    brand: "#0d9488", // Modern teal
    brandHover: "#0f766e",
    brandBg: "#ccfbf1",
    surfacePage: "#f4fcfb", // Ultra clean ice white
    sidebarBg: "#111c1b", // Dark pine / deep teal forest
    sidebarText: "#cfdfdd",
    sidebarActiveBg: "#0d9488",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#1d2e2c",
  },
  {
    id: "varejo",
    name: "Comércio e Varejo",
    icon: "🏪",
    brand: "#0284c7",
    brandHover: "#0369a1",
    brandBg: "#e0f2fe",
    surfacePage: "#f8fafc",
    sidebarBg: "#0f172a",
    sidebarText: "#94a3b8",
    sidebarActiveBg: "#0284c7",
    sidebarActiveText: "#ffffff",
    sidebarHoverBg: "#1e293b",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) return tabParam;
    return "dashboard";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [themeId, setThemeId] = useState<string>(() =>
    normalizeThemeId(localStorage.getItem("gestify_theme"))
  );

  useEffect(() => {
    localStorage.setItem("gestify_theme", themeId);
  }, [themeId]);

  // Telemetry statistics
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);

  // Transferred contexts (e.g., from Promotion tab to AI generator)
  const [transferredContextPrompt, setTransferredContextPrompt] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch(withThemeQuery("/api/dashboard", themeId));
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const prodRes = await fetch(withThemeQuery("/api/products", themeId));
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados operacionais:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, themeId]);

  // Database hard reset action
  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      // Direct call to invisible-costs setup or trigger reset helper on backend
      // Let's call /api/products reset or a direct reset flow
      // To reset, we can clear and load costs, recipes, and inventory database defaults
      const res = await fetch("/api/invisible-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packaging: 0.35,
          delivery: 0.80,
          energy: 0.25,
          gas: 0.18,
          labor: 1.20,
          ifood_ratio: 12.0
        })
      });

      if (res.ok) {
        alert("Configurações originais restauradas! Recarregando dados.");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const handleNavigateToMarketing = (contextPrompt: string) => {
    setTransferredContextPrompt(contextPrompt);
    setActiveTab("marketing");
  };

  // Resolve headers title and subtitle content dynamically (por setor de atuação)
  const getHeaderProfile = () => {
    const varejo = themeId === "varejo";
    const profiles: Record<string, { title: string; subtitle: string }> = {
      dashboard: {
        title: "Visão geral",
        subtitle: varejo
          ? "Resumo financeiro e operacional do seu comércio e varejo"
          : "Resumo financeiro e operacional da sua confeitaria premium",
      },
      pricing: {
        title: varejo ? "Precificação de produtos" : "Precificação inteligente",
        subtitle: varejo
          ? "Margem sobre custo de aquisição, markup e preço final de gôndola"
          : "Calcule preços de venda justos cobrindo custos de insumos e taxas invisíveis",
      },
      inventory: {
        title: varejo ? "Estoque e gôndola" : "Controle de estoque",
        subtitle: varejo
          ? "Entradas, saídas de mercadorias, níveis de segurança e alertas de validade de lotes"
          : "Entradas, saídas de ingredientes, níveis de segurança e alertas sanitários de validade",
      },
      suppliers: {
        title: "Gestão de Fornecedores",
        subtitle: varejo
          ? "Distribuidores têxteis, calçados e embalagens do seu varejo"
          : "Cadastre seus distribuidores parceiros, marque mercadorias fornecidas e monitore insumos facilmente",
      },
      labels: {
        title: varejo ? "Etiquetas de gôndola" : "Gerador de etiquetas",
        subtitle: varejo
          ? "EAN, preço, lote e tamanho para prateleira e conferência de caixa"
          : "Validade e lote de gôndola, rastreamento sanitário QR Code e impressão amigável em PDF",
      },
      promotions: {
        title: "Promoções inteligentes",
        subtitle: varejo
          ? "Liquidações, combos e campanhas sazonais para moda e acessórios"
          : "Novas oportunidades de combos sugeridos pelo estoque para escoar e converter mais",
      },
      marketing: {
        title: "IA para marketing",
        subtitle: varejo
          ? "Copys, flyers e calendário promocional para loja física e redes sociais"
          : "Legendas persuasivas, hashtags gastronômicas e calendários de postagens automatizados com IA",
      },
      settings: {
        title: "Configuração do Estúdio",
        subtitle: "Sistemas, banco de dados e credenciais integradas",
      },
      "delivery-logistics": {
        title: "Entrega e Logística",
        subtitle: varejo
          ? "Pedidos de vestuário, retirada em loja e envios com rastreamento"
          : "Módulo inteligente de gestão de entregas, roteirização simplificada por CEP e ficha de despacho",
      },
      "menu-admin": {
        title: varejo ? "Gerenciamento de Catálogo" : "Gerenciamento de Cardápio",
        subtitle: "Publique mercadorias, ative táticas promocionais e exporte tags QR Code",
      },
      "menu-public": {
        title: varejo ? "Catálogo Digital Público" : "Cardápio Digital Público",
        subtitle: varejo
          ? "Simulação da vitrine digital para o cliente final"
          : "Ambiente real do cliente final para simulação e recepção automática de pedidos",
      },
    };
    const fallback = varejo
      ? { title: "Gestify", subtitle: "Gestão completa de comércio e varejo" }
      : { title: "Gestify", subtitle: "Gestão completa de confeitarias" };
    return profiles[activeTab] || fallback;
  };

  const headerMeta = getHeaderProfile();

  // Route to render panels based on selected tab state
  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage 
            stats={stats} 
            loading={loading} 
            onNavigate={(tab) => {
              setActiveTab(tab);
            }} 
          />
        );
      case "pricing":
        return <PricingPage onRecipeSaved={fetchData} themeId={themeId} />;
      case "inventory":
        return (
          <InventoryPage
            products={products}
            onProductsUpdated={fetchData}
            loading={loading}
            themeId={themeId}
          />
        );
      case "suppliers":
        return <SuppliersPage themeId={themeId} />;
      case "labels":
        return <LabelPage />;
      case "promotions":
        return (
          <PromotionsPage
            onNavigateToMarketing={handleNavigateToMarketing}
            themeId={themeId}
          />
        );
      case "marketing":
        return (
          <MarketingPage
            initialPromptContext={transferredContextPrompt}
            themeId={themeId}
          />
        );
      case "delivery-logistics":
        return <DeliveryLogisticsPage themeId={themeId} />;
      case "menu-admin":
        return <MenuAdminPage themeId={themeId} />;
      case "menu-public":
        return <PublicMenuSimulator themeId={themeId} />;
      case "settings":
        return <SettingsPage onResetDatabase={handleResetDatabase} resetting={resetting} />;
      default:
        return (
          <DashboardPage 
            stats={stats} 
            loading={loading} 
            onNavigate={(tab) => {
              setActiveTab(tab);
            }} 
          />
        );
    }
  };

  // Filter products count for sidebar badge warnings
  const lowStockCount = products.filter(p => p.stock <= p.minimum).length;

  const currentTheme = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];

  const themeStyles = {
    "--color-brand-val": currentTheme.brand,
    "--color-brand-hover-val": currentTheme.brandHover,
    "--color-brand-bg-val": currentTheme.brandBg,
    "--color-page-bg-val": currentTheme.surfacePage,
    "--sidebar-bg-val": currentTheme.sidebarBg,
    "--sidebar-text-val": currentTheme.sidebarText,
    "--sidebar-active-bg-val": currentTheme.sidebarActiveBg,
    "--sidebar-active-text-val": currentTheme.sidebarActiveText,
    "--sidebar-hover-bg-val": currentTheme.sidebarHoverBg,
  } as CSSProperties;

  return (
    <div 
      className="flex h-screen bg-page-bg text-[#2c2221] font-sans overflow-hidden" 
      id="app-viewport"
      style={themeStyles}
    >
      
      {/* Sidebar navigation controls */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setTransferredContextPrompt(""); // clear contextual prompts on manual tab hop
          setIsSidebarOpen(false); // Close mobile sidebar on navigation!
        }} 
        lowStockCount={lowStockCount}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        theme={currentTheme}
      />

      {/* Main Column block wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Upper Header strip */}
        <Header 
          title={headerMeta.title} 
          subtitle={headerMeta.subtitle} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClearDatabase={activeTab === "settings" ? handleResetDatabase : undefined}
          onMenuToggle={() => setIsSidebarOpen(true)}
          theme={currentTheme}
          themePresets={THEME_PRESETS}
          currentThemeId={themeId}
          onThemeSelect={(id) => setThemeId(normalizeThemeId(id))}
        />

        {/* Stateful Page rendering container */}
        <main className="flex-grow min-h-0 flex flex-col bg-page-bg">
          {renderPage()}
        </main>

      </div>

    </div>
  );
}
