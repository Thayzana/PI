import { useState, useEffect, useRef, MouseEvent } from "react";
import { 
  Search, 
  Bell, 
  Sparkles, 
  Menu, 
  Check, 
  Globe, 
  User, 
  Building, 
  Mail, 
  X,
  AlertTriangle,
  Clock,
  TrendingUp,
  Award
} from "lucide-react";
import { AppTheme } from "../types";

interface HeaderProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearDatabase?: () => void;
  onMenuToggle?: () => void;
  theme: AppTheme;
  themePresets: AppTheme[];
  currentThemeId: string;
  onThemeSelect: (themeId: string) => void;
}

interface NotificationItem {
  id: number;
  type: "danger" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function Header({ 
  title, 
  subtitle, 
  searchQuery, 
  setSearchQuery, 
  onClearDatabase, 
  onMenuToggle,
  theme,
  themePresets,
  currentThemeId,
  onThemeSelect
}: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: "danger",
      title: "Estoque Baixo ⚠️",
      message: "Matéria-prima 'Manteiga Sem Sal' atingiu nível de alerta mínimo (restam 2kg).",
      time: "há 10 min",
      read: false
    },
    {
      id: 2,
      type: "warning",
      title: "Lote Vencendo 🕒",
      message: "O lote 'Nestlé Moça L948' vence em 3 dias.",
      time: "há 45 min",
      read: false
    },
    {
      id: 3,
      type: "info",
      title: "Estratégia de Precificação 💸",
      message: "Margem média sugerida de 45% não foi atingida no 'Bolo Formigueiro'.",
      time: "há 3 horas",
      read: false
    },
    {
      id: 4,
      type: "success",
      title: "Novo Cupom IA 🌟",
      message: "Inteligência Artificial gerou um roteiro automático de combos para escoamento de insumos.",
      time: "há 1 dia",
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkReadSingle = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Close dropdowns on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fechar painéis ao clicar fora
  useEffect(() => {
    const handlePointerOutside = (event: Event) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerOutside);
    document.addEventListener("touchstart", handlePointerOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerOutside);
      document.removeEventListener("touchstart", handlePointerOutside);
    };
  }, []);

  return (
    <header className="h-16 px-4 md:px-8 border-b border-[#eee7de] bg-white flex items-center justify-between font-sans shrink-0 relative z-30" id="app-header">
      {/* Title block with hamburger trigger for smaller screens */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 text-[#7d6f6b] hover:text-brand hover:bg-[#faf7f2] rounded-lg md:hidden cursor-pointer shrink-0"
          title="Abrir menu"
          id="btn-mobile-sidebar-toggle"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <h2 className="text-sm md:text-base font-bold text-[#2e2624] tracking-tight flex items-center gap-1.5 truncate">
            {title}
            {title.includes("IA") && (
              <Sparkles size={13} className="text-brand animate-pulse shrink-0" />
            )}
          </h2>
          <span className="text-[10px] md:text-[11px] text-[#7d6f6b] truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Utilities Column */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Real-time search - responsive sizing */}
        <div className="relative w-24 xs:w-36 sm:w-48 md:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a7a76]" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#faf7f2] border border-[#e5dec9]/60 text-xs text-[#2e2624] placeholder-[#8a7a76]/70 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all rounded-full"
          />
        </div>

        {/* Database Clear helper */}
        {onClearDatabase && (
          <button
            onClick={onClearDatabase}
            className="hidden sm:inline-block px-3 py-1.5 text-xs text-[#7d6f6b] hover:text-brand hover:bg-[#faf7f2] rounded-lg border border-[#e5dec9]/60 transition-colors cursor-pointer font-medium"
            title="Reiniciar banco de dados para dados padrão"
          >
            Resetar DB
          </button>
        )}

        {/* Notification Bell with POPUP */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="p-2 text-[#7d6f6b] hover:text-brand hover:bg-[#faf7f2] rounded-full transition-colors relative cursor-pointer"
            id="btn-alert-bell"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <div className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-brand border border-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-white border border-[#eee7de] shadow-xl rounded-2xl z-50 overflow-hidden text-[#2e2624]" id="notification-popover">
              <div className="p-4 bg-[#faf7f2] border-b border-[#eee7de] flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#2e2624]">Notificações Urgentes</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand text-white rounded-md">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-[#eee7de]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7d6f6b]">
                    Nenhuma notificação por enquanto!
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleMarkReadSingle(n.id)}
                      className={`p-3.5 flex gap-3 text-left transition-colors cursor-pointer select-none ${
                        n.read ? "bg-white" : "bg-brand-bg/30 hover:bg-brand-bg/50"
                      }`}
                    >
                      {/* Left Icon mapping */}
                      <div className="shrink-0 mt-0.5">
                        {n.type === "danger" && <AlertTriangle size={15} className="text-red-500" />}
                        {n.type === "warning" && <Clock size={15} className="text-amber-500" />}
                        {n.type === "info" && <TrendingUp size={15} className="text-blue-500" />}
                        {n.type === "success" && <Sparkles size={15} className="text-emerald-500" />}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-bold text-[#2e2624] truncate">{n.title}</h4>
                          <span className="text-[9px] text-[#8a7a76] font-mono shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#7d6f6b] leading-relaxed mt-0.5">{n.message}</p>
                      </div>

                      {/* Clear Button */}
                      <button 
                        onClick={(e) => handleClearNotification(n.id, e)}
                        className="text-[#8a7a76]/60 hover:text-[#2e2624] p-0.5 rounded shrink-0 cursor-pointer self-start"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge Profile with DROP PANEL */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 border-l border-[#eee7de] pl-4 cursor-pointer select-none group"
            id="user-profile-badge"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-brand-hover flex items-center justify-center text-xs font-bold text-white shadow-inner transition-transform group-hover:scale-105" title="Joas Kelph">
              JK
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#2e2624] group-hover:text-brand transition-colors">Kelph Studio</span>
              <span className="text-[10px] text-[#7d6f6b] font-mono">Chef / Gestor</span>
            </div>
          </div>

          {/* User Profile Popover Modal */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-white border border-[#eee7de] shadow-xl rounded-2xl z-50 overflow-hidden text-[#2e2624]" id="profile-popover">
              
              {/* Header profile design card */}
              <div className="p-5 bg-gradient-to-br from-[#faf7f2] to-[#f2ebda]/60 border-b border-[#eee7de]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shadow-md relative shrink-0">
                    JK
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Ativo" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#2e2624] leading-tight truncate">Joas Kelph</h3>
                    <p className="text-xs text-brand font-medium truncate flex items-center gap-1 mt-0.5">
                      <Award size={12} />
                      <span>Kelph Studio</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Informational specs profile */}
              <div className="p-4 space-y-3.5 text-left text-xs">
                <div className="space-y-1.5 border-b border-[#eee7de]/50 pb-3">
                  <div className="flex items-center gap-2 text-[#7d6f6b]">
                    <Building size={14} className="text-brand shrink-0" />
                    <span className="font-semibold text-[11px] uppercase tracking-wide">Empresa</span>
                    <span className="ml-auto text-xs font-bold text-[#2e2624]">Kelph Studio</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#7d6f6b]">
                    <Mail size={14} className="text-brand shrink-0" />
                    <span className="font-semibold text-[11px] uppercase tracking-wide">E-mail</span>
                    <span className="ml-auto text-xs font-mono font-medium text-[#2e2624] truncate max-w-[180px]">joaskelph18@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#7d6f6b]">
                    <Globe size={14} className="text-brand shrink-0" />
                    <span className="font-semibold text-[11px] uppercase tracking-wide">Idioma</span>
                    <span className="ml-auto text-xs font-semibold text-[#2e2624] flex items-center gap-1">Português (Brasil) 🇧🇷</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#7d6f6b]">
                    <Sparkles size={14} className="text-brand shrink-0" />
                    <span className="font-semibold text-[11px] uppercase tracking-wide">Versão</span>
                    <span className="ml-auto text-xs font-mono font-bold text-[#7d6f6b]">v1.1.0-stable</span>
                  </div>
                </div>

                {/* THEME SELECTOR ("Quero que possa alterar o tema e mude os setores operacionais") */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7d6f6b] flex items-center gap-1.5">
                    <span>Selecionar Ramo de Atuação (Tema)</span>
                  </h4>
                  <p className="text-[10px] text-[#7d6f6b] leading-tight">Escolha o seu setor e mude todas as cores e destaque do sistema para casar com seu negócio ideal!</p>
                  
                  <div className="grid grid-cols-1 gap-2 pt-1" id="sector-theme-presets">
                    {themePresets.map(preset => {
                      const isSelected = currentThemeId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onThemeSelect(preset.id);
                          }}
                          className={`w-full p-2 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                            isSelected 
                              ? "bg-brand/10 border-brand font-bold text-[#2e2624] ring-1 ring-brand/35"
                              : "bg-[#faf7f2] border-[#eee7de] hover:border-brand/45 hover:bg-[#faf7f2] text-[#7d6f6b]"
                          }`}
                        >
                          <span className="text-sm shrink-0">{preset.icon}</span>
                          <span className="text-[11px] font-medium flex-grow truncate">{preset.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                              <Check size={10} className="stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Utility action footer */}
              <div className="p-3 bg-[#faf7f2] border-t border-[#eee7de] text-center">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full py-1.5 bg-white border border-[#eee7de] hover:border-brand/45 hover:text-brand text-xs font-bold text-[#7d6f6b] rounded-lg transition-colors cursor-pointer"
                >
                  Fechar Painel
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
