import { useEffect, useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Percent,
  Sparkles
} from "lucide-react";
import { DashboardStats } from "../types";

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
}

export default function DashboardPage({ stats, loading, onNavigate }: DashboardPageProps) {
  if (loading || !stats) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-[#faf6f2] space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-[#b3543d] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#7d6f6b] font-medium font-sans">Carregando métricas operacionais do Studio...</p>
      </div>
    );
  }

  // Find max value in chart to provide nice padding
  const maxRevenue = Math.max(...stats.sales_chart.map(d => d.revenue), 3500);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans space-y-6" id="dashboard-page">
      
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Faturamento */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-xl flex flex-col justify-between shadow-sm hover:border-[#b3543d]/35 transition-all" id="stat-faturamento">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#7d6f6b] uppercase tracking-wider block">Faturamento (Semana)</span>
              <h3 className="text-3xl font-bold text-[#2e2624] font-sans">
                R$ {stats.weekly_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-2 bg-[#b3543d]/10 text-[#b3543d] rounded-lg">
              <DollarSign size={20} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
            <TrendingUp size={14} />
            <span>+{stats.revenue_vs_last_week}% vs semana anterior</span>
          </p>
        </div>

        {/* Card 2: Lucro Líquido */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-xl flex flex-col justify-between shadow-sm hover:border-[#b3543d]/35 transition-all" id="stat-lucro">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#7d6f6b] uppercase tracking-wider block">Lucro Líquido</span>
              <h3 className="text-3xl font-bold text-[#2e2624] font-sans">
                R$ {stats.weekly_profit.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-2 bg-[#b3543d]/10 text-[#b3543d] rounded-lg">
              <TrendingUp size={20} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
            <TrendingUp size={14} />
            <span>+{stats.profit_vs_last_week}% vs semana anterior</span>
          </p>
        </div>

        {/* Card 3: Estoque Baixo */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-[#b3543d]/35 transition-all" onClick={() => onNavigate("inventory")} id="stat-estoque-alert">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#7d6f6b] uppercase tracking-wider block">Estoque Baixo</span>
              <h3 className="text-3xl font-bold text-amber-600 font-sans">
                {stats.low_stock_count} itens
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-4 flex items-center gap-1">
            <span>+{stats.low_stock_vs_last_week} necessitam reposição</span>
          </p>
        </div>

        {/* Card 4: Proximos da Validade */}
        <div className="bg-white border border-[#eee7de] p-5 rounded-xl flex flex-col justify-between shadow-sm cursor-pointer hover:border-[#b3543d]/35 transition-all" onClick={() => onNavigate("inventory")} id="stat-validade-alert">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#7d6f6b] uppercase tracking-wider block">Próximos da Validade</span>
              <h3 className="text-3xl font-bold text-[#b3543d] font-sans">
                {stats.near_expiry_count} itens
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 text-[#b3543d] rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-xs text-rose-750 font-medium mt-4 flex items-center gap-1">
            <span>Vencendo em até 7 dias</span>
          </p>
        </div>

      </div>

      {/* Grid: Charts + Side Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Weekly Chart (Vendas & Lucro) */}
        <div className="lg:col-span-2 bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm" id="chart-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-[#2e2624] text-base">Vendas & lucro</h4>
              <p className="text-xs text-[#7d6f6b]">Últimos 7 dias de movimentação da confeitaria</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/60 text-[11px] font-bold uppercase tracking-wider">
              Semana
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sales_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b3543d" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#b3543d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#7d6f6b" 
                  fontSize={11}
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#7d6f6b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#white", 
                    borderColor: "#eee7de", 
                    borderRadius: "12px",
                    color: "#2e2624",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }} 
                  formatter={(value) => [`R$ ${value}`, ""]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#b3543d" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#gradientRevenue)" 
                  name="Faturamento"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#gradientProfit)" 
                  name="Lucro Atribuído"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Mais vendidos progress lines */}
        <div className="bg-white border border-[#eee7de] p-6 rounded-2xl flex flex-col justify-between shadow-sm" id="mais-vendidos-section">
          <div>
            <h4 className="font-bold text-[#2e2624] text-base">Mais vendidos</h4>
            <p className="text-xs text-[#7d6f6b] mb-6">Unidades vendidas nesta semana ativa</p>
            
            <div className="space-y-4">
              {stats.top_sold.map((item, index) => {
                const maxVal = stats.top_sold[0].sales;
                const pct = (item.sales / maxVal) * 105;
                const finalPct = Math.min(pct, 100);
                return (
                  <div key={item.id} className="space-y-1.5" id={`top-sold-${index}`}>
                    <div className="flex justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-[#2e2624]">
                        <span className="w-5 h-5 rounded-full bg-[#faf7f2] flex items-center justify-center text-[10px] font-bold text-[#b3543d]">
                          {index + 1}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[#7d6f6b] font-mono">{item.sales} un</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 rounded-full bg-[#faf6f2] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#b3543d] to-[#d48c6f] transition-all duration-1000"
                        style={{ width: `${finalPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => onNavigate("inventory")}
            className="mt-6 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e5dec9]/60 text-xs font-bold text-[#b3543d] hover:bg-[#f2ebda] transition-all cursor-pointer"
          >
            <span>Ver estoque completo</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* Grid Row 2: Slow Selling Promos + Finance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Product items with slow outcome requiring promos */}
        <div className="lg:col-span-2 bg-white border border-[#eee7de] p-6 rounded-2xl flex flex-col justify-between shadow-sm" id="pouca-saida-section">
          <div>
            <h4 className="font-bold text-[#2e2624] text-base">Produtos com pouca saída</h4>
            <p className="text-xs text-[#7d6f6b] mb-6 font-sans">Sugestões de promoções preventivas baseadas em inteligência de inventário</p>
            
            <div className="divide-y divide-[#eee7de]">
              {stats.inactive_products.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-semibold text-[#2e2624]">{p.name}</h5>
                    <p className="text-xs text-[#7d6f6b]">
                      Sem venda há <span className="font-semibold text-amber-600 font-mono">{p.days_inactive} dias</span> • <span className="font-mono">{p.stock} em estoque</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate("promotions")}
                    className="px-3 py-1.5 rounded-lg bg-[#faf7f2] text-[#b3543d] hover:bg-[#f2ebda] border border-[#e5dec9]/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Promoção sugerida</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial MTD Statement Card */}
        <div className="bg-white border border-[#eee7de] p-6 rounded-2xl flex flex-col justify-between shadow-sm animate-fade-in" id="financial-summary-section">
          <div>
            <h4 className="font-bold text-[#2e2624] text-base">Resumo financeiro</h4>
            <p className="text-xs text-[#7d6f6b] mb-6">Demonstrativo bruto do mês atual consolidado</p>
            
            <div className="space-y-3.5 font-sans">
              
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#7d6f6b]">Receita bruta:</span>
                <span className="font-bold text-[#2e2624] font-mono">
                  R$ {stats.monthly_totals.gross_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#7d6f6b]">Custos de produção:</span>
                <span className="font-semibold text-[#5e4f4c] font-mono">
                  R$ {stats.monthly_totals.production_costs.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#7d6f6b]">Custos invisíveis:</span>
                <span className="font-semibold text-[#5e4f4c] font-mono">
                  R$ {stats.monthly_totals.invisible_costs.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between text-xs font-medium border-b border-[#eee7de] pb-3">
                <span className="text-[#7d6f6b]">Taxa iFood (12%):</span>
                <span className="font-semibold text-[#5e4f4c] font-mono">
                  R$ {stats.monthly_totals.ifood_tax.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-[#2e2624] flex items-center gap-1.5">
                  Lucro líquido:
                </span>
                <span className="text-[#b3543d] font-bold font-mono text-base">
                  R$ {stats.monthly_totals.net_profit.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#7d6f6b]">Margem de Lucro:</span>
                <span className="text-emerald-600 font-semibold font-mono">{stats.monthly_totals.margin_ratio}%</span>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
