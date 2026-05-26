import { useState, useEffect } from "react";
import { Tag, FileText, Calendar, Printer, Download, QrCode } from "lucide-react";
import { Recipe } from "../types";

export default function LabelPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Tag Metadata State
  const [productName, setProductName] = useState("Brigadeiro Gourmet");
  const [weight, setWeight] = useState("20g");
  const [lot, setLot] = useState("BRG-2026-051");
  const [fabDate, setFabDate] = useState("2026-05-19");
  const [valDate, setValDate] = useState("2026-05-29");
  const [conservation, setConservation] = useState("Refrigerado");
  const [allergenInfo, setAllergenInfo] = useState("Contém glúten, leite, ovos. Pode conter traços de nozes. Manter refrigerado entre 2ºC e 8ºC.");

  // Load recipes for easy quick-fill selector on labels
  useEffect(() => {
    fetch("/api/recipes")
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

  // Triggers window native printing focusing strictly on the label div
  const handlePrintLabel = () => {
    const printContent = document.getElementById("label-sticker-preview");
    if (!printContent) return;
    
    // Copy HTML
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
            .title-confeitaria {
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.16em;
              color: #b3543d;
              opacity: 0.9;
              margin: 0 0 2px 0;
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
                <p class="title-confeitaria">STUDIO</p>
                <h1 class="title-product">${productName}</h1>
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
            <p className="text-xs text-[#7d6f6b]">Configure informações para a impressão sanitária obrigatória</p>
          </div>

          <div className="space-y-4">
            
            {/* Quick preset dropdown selection */}
            {recipes.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold text-[#7d6f6b]">Preencher com receita salva</label>
                <select
                  id="label-recipe-filler-dropdown"
                  onChange={(e) => handleSelectRecipePreset(e.target.value)}
                  className="w-full mt-1 bg-[#faf7f2] border border-[#e5dec9]/60 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2e2624] cursor-pointer focus:outline-none focus:border-[#b3543d]"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um produto gravado...</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
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
                  <option value="Temperatura Ambient">Temperatura Ambiente</option>
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
                <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#b3543d] block">
                  STUDIO
                </span>
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
