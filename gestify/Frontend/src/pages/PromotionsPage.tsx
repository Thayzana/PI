import { useState, useEffect } from "react";
import { Sparkles, Check, Play, Percent, Tag, ShieldCheck, HelpCircle } from "lucide-react";
import { Promotion } from "../types";
import { withThemeQuery } from "../lib/api";
import confetti from "canvas-confetti";

interface PromotionsPageProps {
  onNavigateToMarketing: (contextPrompt: string) => void;
  themeId: string;
}

export default function PromotionsPage({ onNavigateToMarketing, themeId }: PromotionsPageProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch(withThemeQuery("/api/promotions", themeId));
      if (res.ok) {
        const data = await res.json();
        setSavedPromotions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setSavedPromotions = (data: Promotion[]) => {
    setPromotions(data);
  };

  useEffect(() => {
    fetchPromotions();
  }, [themeId]);

  const handleApplyPromotion = async (promo: Promotion) => {
    const isActivating = !promo.active;
    try {
      const res = await fetch(`/api/promotions/${promo.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: isActivating ? 1 : 0 })
      });

      if (res.ok) {
        if (isActivating) {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#b3543d", "#d48c6f", "#e5dec9"]
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#b3543d", "#d48c6f", "#e5dec9"]
          });
        }
        fetchPromotions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Aggregated estimations
  const totalPotentialRecuperation = promotions.reduce((sum, p) => sum + (p.recovery || 0), 0);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans space-y-6" id="promotions-page">
      
      {/* Banner: opportunity tracker */}
      <div className="p-6 rounded-2xl bg-white border border-[#eee7de] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="opportunity-banner">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/60 rounded-xl shrink-0">
            <Sparkles size={20} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#2e2624] text-base">
              {promotions.length} oportunidades detectadas
            </h3>
            <p className="text-xs text-[#7d6f6b]">
              Potencial de recuperação estimado em <span className="font-bold text-[#b3543d] font-sans">R$ {totalPotentialRecuperation.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span> esta semana
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigateToMarketing("Estou promovendo um combo de Trufa Belga e doces finos com 25% de desconto para escoar estoque")}
          className="px-5 py-2.5 bg-gradient-to-r from-[#b3543d] to-[#d48c6f] text-white text-xs font-bold rounded-xl hover:opacity-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm shadow-[#b3543d]/15"
        >
          <Sparkles size={14} />
          <span>Gerar campanha automática</span>
        </button>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#7d6f6b]">Campanhas Sugeridas</span>
        
        {loading && promotions.length === 0 ? (
          <p className="text-xs text-[#7d6f6b]">Buscando dados de cupom...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="promotions-grid">
            {promotions.map((p) => {
              const isApplied = p.active === 1;
              const isBOGO = p.type === "BOGO";

              return (
                <div 
                  key={p.id}
                  className={`bg-white border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-sm ${
                    isApplied 
                      ? "border-[#b3543d] ring-1 ring-[#b3543d]/25 scale-[1.01]" 
                      : "border-[#eee7de] hover:border-[#b3543d]/30"
                  }`}
                  id={`promo-card-${p.id}`}
                >
                  <div className="space-y-4">
                    
                    {/* Upper row header */}
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-wide font-mono px-2.5 py-1 bg-[#faf7f2] border border-[#e5dec9]/60 text-[#b3543d] rounded-lg">
                        {p.type}
                      </span>
                      <span className={`text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-full border ${
                        isBOGO ? "bg-cyan-50 text-cyan-600 border-cyan-150" : "bg-rose-50 text-[#b3543d] border-rose-150"
                      }`}>
                        {p.discount}
                      </span>
                    </div>

                    {/* Middle Details */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#2e2624] text-base leading-snug">{p.title}</h4>
                      <p className="text-xs text-[#7d6f6b] leading-relaxed">{p.subtitle}</p>
                    </div>

                  </div>

                  {/* Operational Bottom details */}
                  <div className="mt-6 pt-4 border-t border-[#eee7de] flex justify-between items-center bg-[#faf7f2] -mx-5 -mb-5 px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-[#7d6f6b]">Meta Estimada</span>
                      <span className="text-xs font-bold text-[#2e2624] font-sans">
                        {p.recovery > 100 ? `Recupere R$ ${p.recovery}` : `Gire ${p.recovery} unidades`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigateToMarketing(`Estou fazendo promoção do tipo ${p.type} para: ${p.title} (${p.subtitle})`)}
                        className="p-2 bg-white text-[#7d6f6b] border border-[#e5dec9]/60 rounded-xl hover:text-[#b3543d] hover:bg-[#faf7f2] cursor-pointer"
                        title="Divulgar esta promoção com IA"
                      >
                        <Sparkles size={14} />
                      </button>

                      <button
                        onClick={() => handleApplyPromotion(p)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                          isApplied 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-150" 
                            : "bg-[#b3543d] text-white hover:opacity-95 font-bold shadow-sm"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check size={12} className="stroke-[3]" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <span>Aplicar</span>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
