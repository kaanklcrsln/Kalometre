// Ücretli plan tanımı. Fiyat ileride Google Play'den yerelleştirilmiş olarak gelecek;
// ürün henüz yüklenemediyse burada yazan etiket gösterilir.

export const KALO_PLUS = {
  /** Google Play Console'da tanımlanacak abonelik ürün kimliği. */
  productId: "kalo_plus_monthly",
  name: "Kalo+",
  fallbackPriceLabel: "Aylık 200 TL",
  features: [
    "Yapay zeka destekli kalori takibi",
    "Fotoğraf çekimi veya görsel yükleme ile tam doğrulukta kalori hesabı",
    "Kişiye özel diyetler",
    "Sağlık analizleri",
  ],
} as const;
