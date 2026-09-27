// Yemek fotoğrafı: tarayıcıda küçültülüp JPEG'e çevrilir. Böylece istek küçük kalır, EXIF (konum vb.)
// üst verisi yeniden çizimle silinir ve fotoğraf hiçbir sunucuda saklanmaz.

import { IMAGE_MAX_FILE_BYTES, IMAGE_MAX_SIDE } from "../config/ai";

export interface PreparedImage {
  /** data: öneki olmadan base64 */
  base64: string;
  mimeType: "image/jpeg";
  /** Sohbette göstermek için data URL */
  dataUrl: string;
}

export class ImageError extends Error {}

/** Uzun kenarı `maxSide`'ı aşmayacak şekilde orantılı boyut. */
export function fitSize(width: number, height: number, maxSide = IMAGE_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError("Bu dosya açılamadı. Başka bir fotoğraf dene."));
    };
    img.src = url;
  });
}

export async function prepareFoodImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new ImageError("Yalnızca fotoğraf gönderebilirsin.");
  if (file.size > IMAGE_MAX_FILE_BYTES) throw new ImageError("Fotoğraf çok büyük. Daha küçük bir fotoğraf dene.");

  // Tarayıcılar <img> çizerken EXIF yönünü uygular; fotoğraf yan dönmez.
  const img = await loadImage(file);
  const { width, height } = fitSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("Fotoğraf hazırlanamadı.");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), mimeType: "image/jpeg", dataUrl };
}
