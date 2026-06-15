const ALLOWED_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".jfif",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
];

const ALLOWED_MIME_PREFIX = "image/";

export const IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.jfif,.webp,.gif,.bmp,.svg,image/png,image/jpeg,image/webp,image/gif";

export function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  const name = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasImageMime = file.type.startsWith(ALLOWED_MIME_PREFIX);

  if (!hasAllowedExt && !hasImageMime) {
    return {
      ok: false,
      message:
        "Formato não suportado. Use PNG, JPG, JPEG, JFIF, WEBP ou outro formato de imagem comum.",
    };
  }

  const maxMb = 5;
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, message: `Imagem muito grande. Máximo ${maxMb} MB.` };
  }

  return { ok: true };
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}
