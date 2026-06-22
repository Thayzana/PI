import { useState, useEffect, useMemo } from "react";
import { Tag, Printer, QrCode, Apple, Search } from "lucide-react";
import { NutritionalFacts, Recipe } from "../types";
import { loadProfile, getProfileInitials } from "../lib/profile";
import { apiFetch } from "../lib/api";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../lib/pagination";
import PaginationControls from "../components/PaginationControls";

type LabelMode = "sanitary" | "nutritional";

const DEFAULT_NUTRITION: NutritionalFacts = {
  servingSize: "20g (1 unidade)",
  calories: "89 kcal",
  carbs: "12g",
  protein: "1,2g",
  fat: "4,5g",
  fiber: "0,8g",
  sodium: "28mg",
  saturatedFat: "2,8g",
};

export default function LabelPage() {
  const profile = useMemo(() => loadProfile(), []);
  const brandName = profile.company || "Gestify";
  const brandLogo = profile.avatarUrl;
  const brandInitials = getProfileInitials(profile.name);

  const [labelMode, setLabelMode] = useState<LabelMode>("sanitary");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipePage, setRecipePage] = useState(1);
  const [nutrition, setNutrition] = useState<NutritionalFacts>(DEFAULT_NUTRITION);

  const [productName, setProductName] = useState("Brigadeiro Gourmet");
  const [weight, setWeight] = useState("20g");
  const [lot, setLot] = useState("BRG-2026-051");
  const [fabDate, setFabDate] = useState("2026-05-19");
  const [valDate, setValDate] = useState("2026-05-29");
  const [conservation, setConservation] = useState("Refrigerado");
  const [allergenInfo, setAllergenInfo] = useState("Contém glúten, leite, ovos. Pode conter traços de nozes. Manter refrigerado entre 2ºC e 8ºC.");

  // Load recipes for easy quick-fill selector on labels
  useEffect(() => {
    apiFetch("/api/recipes")
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (data) setRecipes(data);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSelectRecipePreset = (recipeNameSelected: string) => {
    setProductName(recipeNameSelected);
    // Find recipe to auto generate a matching Batch ID code
    const abbreviation = recipeNameSelected.slice(0, 3).toUpperCase();
    const todayNum = new Date().toISOString().split("T")[0].replace(/-/g, "").slice(2, 6);
    setLot(`${abbreviation}-${todayNum}-${Math.floor(10 + Math.random() * 90)}`);
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );
  const paginatedRecipes = paginateItems(filteredRecipes, recipePage, DEFAULT_PAGE_SIZE);

  const formattedDate = (rawStr: string) => {
    if (!rawStr) return "";
    try {
      const parts = rawStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(rawStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch (e) {
      return rawStr;
    }
  };

  const brandHeaderHtml = brandLogo
    ? `<img src="${brandLogo}" alt="${brandName}" style="height:36px;object-fit:contain;margin-bottom:6px;" />`
    : `<div style="width:36px;height:36px;border-radius:8px;background:#b3543d;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">${brandInitials}</div>`;

  const nutritionTableHtml = `
    <table style="width:100%;font-size:9px;border-collapse:collapse;margin-top:8px;">
      <tr style="border-bottom:2px solid #2e2624;"><th colspan="2" style="text-align:left;padding:4px 0;font-size:11px;">INFORMAÇÃO NUTRICIONAL</th></tr>
      <tr><td colspan="2" style="padding:4px 0;">Porção: ${nutrition.servingSize}</td></tr>
      <tr style="border-top:1px solid #ccc;"><td>Valor energético</td><td style="text-align:right;font-weight:bold;">${nutrition.calories}</td></tr>
      <tr><td>Carboidratos</td><td style="text-align:right;">${nutrition.carbs}</td></tr>
      <tr><td>Proteínas</td><td style="text-align:right;">${nutrition.protein}</td></tr>
      <tr><td>Gorduras totais</td><td style="text-align:right;">${nutrition.fat}</td></tr>
      <tr><td>Gorduras saturadas</td><td style="text-align:right;">${nutrition.saturatedFat || "—"}</td></tr>
      <tr><td>Fibras</td><td style="text-align:right;">${nutrition.fiber}</td></tr>
      <tr><td>Sódio</td><td style="text-align:right;">${nutrition.sodium}</td></tr>
    </table>
  `;

  const handlePrintLabel = () => {
    const printContent = document.getElementById("label-sticker-preview");
    if (!printContent) return;

    const printHtml = printContent.outerHTML;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor libere os popups do seu navegador para imprimir!");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Etiqueta - ${productName}</title>
          <style>
            body {
              background-color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            /* High Fidelity sticker dimensions for printing */
            .print-wrapper {
              width: 500px;
              padding: 24px;
              background-color: #ffffff;
              color: #2e2624;
              border: 1.5px dashed #b3543d;
              border-radius: 16px;
              box-shadow: none;
              text-align: left;
            }
            .grid-container {
              display: grid;
              grid-template-columns: 2.5fr 1fr;
              gap: 16px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 14px;
              border-top: 1px solid #eee7de;
              padding-top: 12px;
            }
            .brand-block { margin-bottom: 8px; }
            .brand-name {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #b3543d;
              margin: 0;
            }
            .title-product {
              font-size: 20px;
              font-weight: 800;
              color: #2e2624;
              margin: 0;
            }
            .weight-badge {
              font-size: 11px;
              color: #7d6f6b;
              font-weight: 500;
              margin: 4px 0 0 0;
            }
            .meta-label {
              font-size: 8px;
              color: #7d6f6b;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0;
            }
            .meta-val {
              font-size: 11px;
              color: #2e2624;
              font-weight: bold;
              margin: 2px 0 0 0;
            }
            .footer-info {
              font-size: 8px;
              color: #7d6f6b;
              margin-top: 14px;
              line-height: 1.4;
              border-top: 1px solid #eee7de;
              padding-top: 10px;
            }
            .qr-col {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border-left: 1px solid #eee7de;
              padding-left: 16px;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="grid-container">
              <div>
                <div class="brand-block">${brandHeaderHtml}<p class="brand-name">${brandName}</p></div>
                <h1 class="title-product">${productName}</h1>
                ${labelMode === "nutritional" ? nutritionTableHtml : ""}
                <p class="weight-badge">${weight}</p>
                <div class="meta-grid">
                  <div>
                    <p class="meta-label">Lote</p>
                    <p class="meta-val">${lot}</p>
                  </div>
                  <div>
                    <p class="meta-label">Fabricação</p>
                    <p class="meta-val">${formattedDate(fabDate)}</p>
                  </div>
                  <div>
                    <p class="meta-label">Validade</p>
                    <p class="meta-val" style="color: #b3543d">${formattedDate(valDate)}</p>
                  </div>
                  <div>
                    <p class="meta-label">CONSERVAÇÃO</p>
                    <p class="meta-val">${conservation}</p>
                  </div>
                </div>
              </div>
              <div class="qr-col">
                <svg width="84" height="84" viewBox="0 0 29 29" style="fill: #2e2624; shape-rendering: crispEdges;">
                  <!-- Embed high quality standard vector SVG QR Code blocks -->
                  <path d="M0,0h7v7h-7z M2,2h3v3h-3z M22,0h7v7h-7z M24,2h3v3h-3z M0,22h7v7h-7z M2,24h3v3h-3z M10,0h2v2h-2z M14,0h4v2h-4z M10,4h4v2h-4z M16,4h2v2h-2z M12,2h2v2h-2z M18,2h2v4h-2z M0,9h2v2h-2z M4,9h4v2h-4z M12,8h3v3h-3z M16,8h2v1h-2z M20,8h2v2h-2z M24,9h4v2h-4z M0,14h3v2h-3z M5,14h2v2h-2z M10,13h2v3h-2z M14,14h5v2h-5z M21,13h3v3h-3z M26,14h3v2h-3z M0,18h4v2h-4z M6,18h2v2h-2z M12,18h3v2h-3z M17,17h3v3h-3z M22,18h4v2h-4z M28,18v2h-1z M9,22h2v3h-2z M13,22h4v2h-4z M19,21h3v3h-3z M24,22h3v2h-3z M10,26h3v3h-3z M15,26h4v3h-4z M21,26h2v3h-2z M25,25h4v3h-4z" />
                </svg>
                <span class="meta-label" style="font-size: 7px; margin-top: 8px;">QR Rastreável</span>
              </div>
            </div>
            <div class="footer-info">${allergenInfo}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#faf6f2] text-[#2c2221] font-sans" id="labels-page">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor Form Panel */}
        <div className="bg-white border border-[#eee7de] p-6 rounded-2xl shadow-sm space-y-5" id="label-editor-panel">
          <div>
            <h3 className="text-base font-bold text-[#2e2624] flex items-center gap-2">
              <Tag size={18} className="text-[#b3543d]" />
              <span>Dados da etiqueta</span>
            </h3>
            <p className="text-xs text-[#7d6f6b]">
              Marca: <strong>{brandName}</strong> (perfil). Logo da foto de perfil nas impressões.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLabelMode("sanitary")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                labelMode === "sanitary"
                  ? "bg-[#2e2624] text-white border-[#2e2624]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              Etiqueta sanitária
            </button>
            <button
              type="button"
              onClick={() => setLabelMode("nutritional")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1 ${
                labelMode === "nutritional"
                  ? "bg-[#2e2624] text-white border-[#2e2624]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              <Apple size={14} />
              Tabela nutricional
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Quick preset dropdown selection */}
            {recipes.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Preencher com receita salva</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
                  <input
                    type="text"
                    placeholder="Buscar receita..."
                    value={recipeSearch}
                    onChange={(e) => {
                      setRecipeSearch(e.target.value);
                      setRecipePage(1);
                    }}
                    className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#b3543d]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {paginatedRecipes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRecipePreset(r.name)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                        productName === r.name
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-gray-600 border-gray-200 hover:border-brand/40"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
                <PaginationControls
                  page={recipePage}
                  pageSize={DEFAULT_PAGE_SIZE}
                  totalItems={filteredRecipes.length}
                  onPageChange={setRecipePage}
                />
              </div>
            )}

            {/* Inputs */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#7d6f6b] block">Nome do produto</label>
              <input
                id="label-product-name-input"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Brigadeiro Gourmet"
                className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Peso / porção</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 20g ou 120ml"
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Lote do Studio</label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  placeholder="Ex: BRG-2026-051"
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Data de fabricação</label>
                <input
                  type="date"
                  value={fabDate}
                  onChange={(e) => setFabDate(e.target.value)}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Data de validade</label>
                <input
                  type="date"
                  value={valDate}
                  onChange={(e) => setValDate(e.target.value)}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none focus:border-[#b3543d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b] block">Conservação</label>
                <select
                  value={conservation}
                  onChange={(e) => setConservation(e.target.value)}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] cursor-pointer focus:outline-none focus:border-[#b3543d]"
                >
                  <option value="Refrigerado">Refrigerado (2°C a 8°C)</option>
                  <option value="Congelado">Congelado (-18°C)</option>
                  <option value="Temperatura Ambiente">Temperatura Ambiente</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b] block">Gerar código</label>
                <button
                  type="button"
                  onClick={() => handleSelectRecipePreset(productName)}
                  className="w-full mt-1 py-2.5 bg-[#faf7f2] text-[#b3543d] border border-[#e5dec9]/60 text-xs font-bold rounded-xl hover:bg-[#f2ebda] cursor-pointer transition-all"
                >
                  Gerar Novo Lote LFT
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#7d6f6b] block">Restrição de Alérgenos & Avisos</label>
              <textarea
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                rows={2}
                placeholder="Ex e avisos de lactose, glúten, etc."
                className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#2e2624] focus:outline-none resize-none focus:border-[#b3543d]"
              />
            </div>

            {labelMode === "nutritional" && (
              <div className="space-y-3 p-3 rounded-xl border border-[#e5dec9]/60 bg-[#faf7f2]">
                <p className="text-[10px] font-black uppercase text-[#b3543d]">Tabela nutricional dinâmica</p>
                {(
                  [
                    ["servingSize", "Porção"],
                    ["calories", "Valor energético"],
                    ["carbs", "Carboidratos"],
                    ["protein", "Proteínas"],
                    ["fat", "Gorduras totais"],
                    ["saturatedFat", "Gorduras saturadas"],
                    ["fiber", "Fibras"],
                    ["sodium", "Sódio"],
                  ] as [keyof NutritionalFacts, string][]
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[9px] font-bold text-[#7d6f6b] uppercase">{label}</label>
                    <input
                      value={nutrition[key] || ""}
                      onChange={(e) =>
                        setNutrition((n) => ({ ...n, [key]: e.target.value }))
                      }
                      className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#e5dec9]/60 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              id="btn-print-stamp"
              onClick={handlePrintLabel}
              className="w-full py-3 bg-gradient-to-r from-[#b3543d] to-[#d48c6f] text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow shadow-[#b3543d]/15 cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Etiqueta em PDF</span>
            </button>

          </div>
        </div>

        {/* Right Column: High Fidelity Preview Sticker Card */}
        <div className="flex flex-col justify-start space-y-4" id="label-sticker-preview-container">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#7d6f6b]">Pré-visualização da etiqueta</span>
          
          {/* Real stamp card matching screen 5 */}
          <div 
            id="label-sticker-preview"
            className="p-7 bg-white border-2 border-dashed border-[#b3543d]/40 rounded-3xl relative overflow-hidden flex flex-col justify-between aspect-[1.5/1] w-full max-w-[500px] shadow"
          >
            {/* Glow backing */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b3543d]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Inner Grid splits into metadata and procedural vector QR */}
            <div className="grid grid-cols-12 gap-4 items-start">
              
              {/* Left Column metadata */}
              <div className="col-span-8 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  {brandLogo ? (
                    <img src={brandLogo} alt={brandName} className="h-8 w-8 rounded-lg object-cover border border-[#eee7de]" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-[#b3543d] text-white text-[10px] font-black flex items-center justify-center">
                      {brandInitials}
                    </div>
                  )}
                  <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#b3543d] block">
                    {brandName}
                  </span>
                </div>
                <h4 className="text-xl font-black text-[#2e2624] leading-tight block truncate" title={productName}>
                  {productName}
                </h4>
                <span className="text-xs font-bold text-[#7d6f6b] block mt-0.5">
                  {weight}
                </span>

                {/* Grid matrix labels */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 pt-4 mt-2 border-t border-[#eee7de]">
                  
                  <div>
                    <span className="text-[8px] font-bold uppercase text-[#7d6f6b] block">Lote</span>
                    <span className="text-xs font-mono font-bold text-[#2e2624]">{lot}</span>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold uppercase text-[#7d6f6b] block">Fabricação</span>
                    <span className="text-xs font-mono font-bold text-[#2e2624]">{formattedDate(fabDate)}</span>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold uppercase text-[#7d6f6b] block">Validade</span>
                    <span className="text-xs font-mono font-bold text-[#b3543d]">{formattedDate(valDate)}</span>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold uppercase text-[#7d6f6b] block">Conservação</span>
                    <span className="text-xs font-mono font-bold text-[#2e2624]">{conservation}</span>
                  </div>

                </div>

                {labelMode === "nutritional" && (
                  <table className="w-full text-[8px] mt-3 border-t border-[#eee7de] pt-2">
                    <thead>
                      <tr className="text-left font-black text-[#2e2624]">
                        <th colSpan={2}>Informação nutricional</th>
                      </tr>
                      <tr>
                        <td colSpan={2} className="text-[#7d6f6b] font-normal py-0.5">
                          Porção: {nutrition.servingSize}
                        </td>
                      </tr>
                    </thead>
                    <tbody className="text-[#2e2624]">
                      <tr><td>Valor energético</td><td className="text-right font-bold">{nutrition.calories}</td></tr>
                      <tr><td>Carboidratos</td><td className="text-right">{nutrition.carbs}</td></tr>
                      <tr><td>Proteínas</td><td className="text-right">{nutrition.protein}</td></tr>
                      <tr><td>Gorduras</td><td className="text-right">{nutrition.fat}</td></tr>
                      <tr><td>Sódio</td><td className="text-right">{nutrition.sodium}</td></tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Right Column QR Stamp */}
              <div className="col-span-4 border-l border-[#eee7de] pl-4 text-center flex flex-col items-center justify-center space-y-1.5 h-full self-center">
                <div className="p-2 bg-[#faf7f2] border border-[#e5dec9]/30 rounded-2xl relative">
                  <svg width="80" height="80" viewBox="0 0 29 29" style={{ fill: "#2e2624", shapeRendering: "crispEdges" }}>
                    {/* Generates standard QR Code paths */}
                    <path d="M0,0h7v7h-7z M2,2h3v3h-3z M22,0h7v7h-7z M24,2h3v3h-3z M0,22h7v7h-7z M2,24h3v3h-3z M10,0h2v2h-2z M14,0h4v2h-4z M10,4h4v2h-4z M16,4h2v2h-2z M12,2h2v2h-2z M18,2h2v4h-2z M0,9h2v2h-2z M4,9h4v2h-4z M12,8h3v3h-3z M16,8h2v1h-2z M20,8h2v2h-2z M24,9h4v2h-4z M0,14h3v2h-3z M5,14h2v2h-2z M10,13h2v3h-2z M14,14h5v2h-5z M21,13h3v3h-3z M26,14h3v2h-3z M0,18h4v2h-4z M6,18h2v2h-2z M12,18h3v2h-3z M17,17h3v3h-3z M22,18h4v2h-4z M28,18v2h-1z M9,22h2v3h-2z M13,22h4v2h-4z M19,21h3v3h-3z M24,22h3v2h-3z M10,26h3v3h-3z M15,26h4v3h-4z M21,26h2v3h-2z M25,25h4v3h-4z" />
                  </svg>
                </div>
                <span className="text-[8px] font-bold text-[#7d6f6b] uppercase tracking-wider flex items-center gap-1">
                  <QrCode size={10} className="text-[#b3543d]" />
                  <span>Código LFT</span>
                </span>
              </div>

            </div>

            {/* Warnings footer */}
            <div className="text-[8px] text-[#7d6f6b] leading-normal pt-3 border-t border-[#eee7de] select-none block" title={allergenInfo}>
              {allergenInfo}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}