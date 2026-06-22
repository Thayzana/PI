import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  size = 280
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2e2624", light: "#ffffff" },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrPng(text: string, filename: string): Promise<void> {
  const dataUrl = await generateQrDataUrl(text, 512);
  downloadDataUrl(dataUrl, filename);
}

export function printQrCode(dataUrl: string, title: string, subtitle: string): void {
  const win = window.open("", "_blank", "width=420,height=520");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; color: #2e2624; }
    img { width: 280px; height: 280px; margin: 16px auto; display: block; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    p { font-size: 12px; color: #7d6f6b; word-break: break-all; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${subtitle}</p>
  <img src="${dataUrl}" alt="QR Code" />
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
  win.document.close();
}

export function isLocalhostMenuUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}
