import { useEffect, useState } from "react";
import { QrCode, Download, Link as LinkIcon, ExternalLink, Printer, AlertCircle } from "lucide-react";
import {
  downloadQrPng,
  generateQrDataUrl,
  isLocalhostMenuUrl,
  printQrCode,
} from "../lib/qrcode";
import { toast } from "../lib/notify";

interface QrCodeCardProps {
  menuUrl: string;
}

export default function QrCodeCard({ menuUrl }: QrCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const isLocalhost = isLocalhostMenuUrl(menuUrl);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    generateQrDataUrl(menuUrl, 280)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível gerar o QR Code.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handleDownload = async () => {
    try {
      await downloadQrPng(menuUrl, "qrcode_gestify_cardapio.png");
      toast.success("QR Code baixado com sucesso!");
    } catch {
      toast.error("Erro ao baixar o QR Code.");
    }
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    printQrCode(
      qrDataUrl,
      "Cardápio Digital — Gestify",
      "Escaneie para abrir o cardápio e fazer seu pedido."
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#eee7de] shadow-2xs p-5 flex flex-col sm:flex-row items-center gap-5">
      <a
        href={menuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#fad6cc]/20 p-4 rounded-2xl flex items-center justify-center shrink-0 border border-brand/10 hover:border-brand/30 transition-colors"
        title="Abrir cardápio público (mesmo destino do QR)"
      >
        {loading || !qrDataUrl ? (
          <div className="w-28 h-28 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <img src={qrDataUrl} alt="QR Code do cardápio digital" className="w-28 h-28" />
        )}
      </a>

      <div className="space-y-2 text-center sm:text-left flex-1">
        <span className="inline-flex items-center gap-1 bg-[#faf0ed] text-brand border border-[#faf0ed] text-[9px] font-black uppercase tracking-wider py-1 px-2 rounded-md">
          <QrCode size={12} />
          Mesa & Delivery Conectado
        </span>
        <h4 className="text-xs font-black text-[#2e2624]">Link do seu Cardápio Digital</h4>
        <p className="text-[10px] text-[#7d6f6b] max-w-sm break-all border-b border-gray-100 pb-2">
          {menuUrl}
        </p>

        {isLocalhost && (
          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 flex items-start gap-1.5 text-left">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <span>
              Em desenvolvimento, o QR aponta para <strong>localhost</strong> — celular na mesma rede não abrirá.
              Defina <code className="font-mono">VITE_PUBLIC_MENU_BASE_URL</code> no .env com a URL pública.
            </span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download size={12} />
            Baixar QR Code (PNG)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || !qrDataUrl}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={12} />
            Imprimir
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LinkIcon size={12} />
            Copiar Link
          </button>

          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all"
          >
            <ExternalLink size={12} />
            Testar cardápio
          </a>
        </div>
      </div>
    </div>
  );
}
