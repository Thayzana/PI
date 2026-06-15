import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  Tag, 
  Sparkles, 
  BrainCircuit, 
  Settings, 
  LogOut,
  ShoppingBag,
  Truck,
  Users,
  BookOpen,
  Globe,
  UserCircle,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { AppTheme } from "../types";
import { comparePt } from "../lib/sort";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  theme: AppTheme;
  onLogout: () => void;
  isAdmin?: boolean;
  currentUserName?: string;
}

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  ping?: boolean;
  badge?: string | number;
};

const MENU_BASE: MenuItem[] = [
  { id: "assistant", label: "Assistente Inteligente", icon: BrainCircuit, ping: true as const },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "delivery-logistics", label: "Entrega e Logística", icon: Truck },
  { id: "inventory", label: "Estoque", icon: Package },
  { id: "labels", label: "Etiquetas", icon: Tag },
  { id: "menu-admin", label: "Cardápio", icon: BookOpen },
  { id: "menu-public", label: "Cardápio Cliente", icon: Globe, badge: "Online" as const },
  { id: "marketing", label: "IA Marketing", icon: Sparkles },
  { id: "pricing", label: "Precificação", icon: Calculator },
  { id: "promotions", label: "Promoções", icon: Sparkles },
  { id: "suppliers", label: "Fornecedores", icon: Users },
  { id: "customers", label: "Clientes", icon: UserCircle },
];

function getSectorLabel(themeId: string): string {
  switch (themeId) {
    case "confeitaria": return "Confeitaria";
    case "cafeteria": return "Cafeteria";
    case "hamburgueria": return "Hambúrguer & Lanches";
    case "doceria": return "Doceria";
    case "varejo": return "Comércio & Varejo";
    case "delivery": return "Delivery";
    default: return "Gestify";
  }
}

export default function Sidebar({ activeTab, setActiveTab, lowStockCount, isOpen, setIsOpen, theme, onLogout, isAdmin, currentUserName }: SidebarProps) {
  const isVarejo = theme.id === "varejo";

  const adminItems: MenuItem[] = isAdmin
    ? [{ id: "users", label: "Usuários", icon: Shield }]
    : [];

  const menuItems: MenuItem[] = [...MENU_BASE, ...adminItems].map((item) => {
    let label = item.label;
    if (isVarejo && item.id === "menu-admin") label = "Catálogo";
    if (isVarejo && item.id === "menu-public") label = "Catálogo Cliente";

    const badge =
      item.id === "inventory" && lowStockCount > 0
        ? lowStockCount
        : item.badge;

    return { ...item, label, badge };
  }).sort((a, b) => comparePt(a.label, b.label));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div 
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out w-64 bg-sidebar-bg border-r border-black/15 flex flex-col justify-between h-screen text-sidebar-text font-sans select-none shrink-0`} 
        id="app-sidebar"
      >
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-1 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="p-2 bg-white/10 text-brand rounded-lg">
            <ShoppingBag size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              <span>Gestify</span>
            </h1>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-brand mt-0.5">
              {getSectorLabel(theme.id)}
            </p>
            {currentUserName && (
              <p className="text-[9px] text-sidebar-text/60 truncate max-w-[140px]">{currentUserName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`tab-btn-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                isActive
                  ? "bg-sidebar-active-bg text-sidebar-active-text border-l-4 border-brand pl-3 shadow-sm font-semibold"
                  : "hover:bg-sidebar-hover-bg hover:text-white text-sidebar-text/90"
              }`}
            >
              <IconComponent 
                size={18} 
                className={`transition-colors duration-200 ${isActive ? "text-sidebar-active-text" : "text-sidebar-text/70 group-hover:text-white"}`} 
              />
              <span className="flex-1 text-left">{item.label}</span>
              
              {isActive && (
                <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              
              {item.badge !== undefined && !isActive && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-brand text-white rounded-full">
                  {item.badge}
                </span>
              )}

              {item.ping && !isActive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          id="btn-settings"
          onClick={() => setActiveTab("settings")}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-250 cursor-pointer ${
            activeTab === "settings"
              ? "bg-sidebar-active-bg text-sidebar-active-text border-l-4 border-brand pl-3 font-semibold"
              : "hover:bg-sidebar-hover-bg hover:text-white text-sidebar-text/90"
          }`}
        >
          <Settings size={18} className={activeTab === "settings" ? "text-sidebar-active-text" : "text-sidebar-text/70"} />
          <span className="text-left">Configurações</span>
        </button>

        <button
          id="btn-logout"
          onClick={() => {
            if (confirm("Deseja realmente sair da sua sessão?")) {
              onLogout();
            }
          }}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-500/20 hover:text-red-300 text-red-200/90 transition-colors duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-left">Sair</span>
        </button>
      </div>
    </div>
    </>
  );
}
