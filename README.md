# Kalometre

Kalori takip web uygulaması (MVP). React + Vite + TypeScript, Firebase (Auth, Firestore, AI Logic, App Check, Hosting).

## Gereksinimler

- Node.js 20+ (22 ile test edildi)
- Emülatör kullanacaksan **Java 21+** (firebase-tools 15, Java 17'yi kabul etmiyor)
- `firebase-tools` projeye devDependency olarak kurulu: `npx firebase ...`

## 1. Firebase projesi

Proje `kalometre` zaten açık. Yeni bir proje açacaksan:

1. [Firebase Console](https://console.firebase.google.com) → **Proje ekle**.
2. **Proje ayarları → Genel → Uygulamalarınız → Web (</>)** ile bir web uygulaması ekle; çıkan `firebaseConfig` değerlerini `.env` dosyasına yaz (bkz. 5. adım).
3. **Authentication → Başlayın → Oturum açma yöntemi**: yalnızca **E-posta/Şifre** sağlayıcısını etkinleştir ("E-posta bağlantısı" kapalı kalsın). Uygulama kullanıcı adı + şifre kullanır; kullanıcı adı arka planda `kullaniciadi@users.kalometre.firebaseapp.com` biçiminde sentetik bir e-postaya çevrilir ve bu adrese hiçbir zaman e-posta gönderilmez. Bu yüzden şifre sıfırlama yok.
   - **Authentication → Ayarlar → Yetkili alan adları**: `localhost` ve Hosting alan adın (`kalometre.web.app`) listede olmalı.
4. **Firestore Database → Veritabanı oluştur** → üretim modu, bölge olarak `eur3` veya `europe-west`.

## 2. Firebase AI Logic (Gemini Developer API)

1. Console'da **AI Logic** (Yapay zekâ → AI Logic) → **Başlayın**.
2. **Gemini Developer API**'yi seç. Console gerekli API'leri (Generative Language API + Firebase AI Logic API) açar ve Gemini API anahtarını **sunucu tarafında** tutar. Anahtar istemci koduna hiçbir zaman girmez.
3. Model adını doğrula: [src/config/ai.ts](src/config/ai.ts) içindeki `GEMINI_MODEL` (şu an `gemini-3.5-flash-lite`). AI Studio'daki model listesinde tam adı kontrol et.
4. İsteğe bağlı maliyet ayarı: model destekliyorsa `GEMINI_THINKING_LEVEL = "MINIMAL"` yap.

## 3. App Check (reCAPTCHA Enterprise)

1. Google Cloud Console → **reCAPTCHA Enterprise** → API'yi etkinleştir → **Anahtar oluştur** (tür: Web sitesi, alan adları: `localhost`, `kalometre.web.app`, `kalometre.firebaseapp.com`).
2. Firebase Console → **App Check → Uygulamalar** → web uygulamanı **reCAPTCHA Enterprise** ile kaydet, site anahtarını gir.
3. Site anahtarını `.env` içindeki `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` alanına yaz.
4. **Geliştirme için debug token:** `.env` içinde `VITE_APPCHECK_DEBUG=true` iken `npm run dev` ile açtığında tarayıcı konsolunda bir debug token yazar. Onu **App Check → Uygulamalar → ⋮ → Debug token'ları yönet** kısmına ekle.
5. Her şey çalıştıktan sonra **App Check → API'ler** kısmında **Firebase AI Logic** için **Zorunlu kıl (Enforce)** düğmesine bas. (Sonra Firestore ve Authentication için de açılabilir.)

## 4. Firestore güvenlik kuralları

[firestore.rules](firestore.rules) varsayılan olarak her şeyi kapatır; yalnızca açıkça izin verilenler yapılabilir:

- Kullanıcı yalnızca `users/{kendi uid}/**` altına erişir; kullanıcı listesi okunamaz, tanımsız koleksiyonlar kapalı.
- Her doküman alan alan doğrulanır: izin verilmeyen alan eklenemez, tip ve aralıklar kontrol edilir.
- Profildeki kullanıcı adı, giriş yapılan hesabın kullanıcı adıyla aynı olmak zorunda.
- Sağlık tabanı sunucuda da geçerli: günlük kalori kadında 1200, erkekte 1500'ün altında kaydedilemez; öğün toplamı günlük kaloriye eşit olmalı.
- `createdAt` sunucu zamanıdır, değiştirilemez; kaydın ham metni ve kategorisi sonradan değiştirilemez.
- Plan kilitliyken hedef kilo, başlangıç ve kilit tarihi ve profil (isim hariç) değiştirilemez; günlük kalori, öğünler (0 olabilir) ve hedef tarihi her zaman değişebilir.
- Günlük AI sayacı yalnızca 1'er artar, azaltılamaz, 50'yi geçemez; gün dokümanı silinemez.
- Kullanıcı dokümanı istemciden silinemez (hesap silme ileride sunucu tarafında yapılmalı).

Kural testleri (57 test, emülatörde, Java 21 gerekir): `npm run test:rules`

Gerçek projeye yüklemek için: `npx firebase login` → `npm run deploy:rules`

> AI sayacı kötüye kullanıma karşı tek başına koruma değildir; Gemini çağrısı Firestore'dan geçmez. Asıl koruma **App Check (Enforce)** ve Firebase Console → AI Logic → **kullanıcı başına istek sınırı** ayarıdır.

## 5. Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyala ve doldur:

| Değişken | Açıklama |
|---|---|
| `VITE_FIREBASE_*` | Firebase web yapılandırması (gizli değil, istemcide görünür) |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | App Check site anahtarı; boşsa App Check kapalı |
| `VITE_APPCHECK_DEBUG` | `true` → geliştirmede debug token kullan |
| `VITE_USE_EMULATORS` | `true` → Auth ve Firestore emülatörlerine bağlan |

`.env` dosyası `.gitignore`'da.

## 6. Çalıştırma

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # hesaplama birim testleri (vitest)
npm run build        # tip kontrolü + üretim derlemesi
```

### Emülatörle (gerçek projeye dokunmadan)

```bash
npm run emulators   # 1. terminal — Auth + Firestore (kurallar dahil)
npm run dev:emu     # 2. terminal — .env.emulator ile emülatöre bağlanır
```

Emülatör verisi kapatınca silinir.

Emülatör arayüzü: http://127.0.0.1:4000. Not: AI Logic'in emülatörü yok; emülatör modunda AI çağrısı "yapılandırılmamış" hatası verir ve **elle kalori girme** akışı devreye girer.

## 7. Deploy

```bash
npx firebase login
npm run deploy                                 # yalnızca hosting
npm run deploy:rules                           # Firestore kuralları
```

## 8. Android uygulaması (Capacitor) — `kalometre-android` branch'i

Aynı React kodu Capacitor ile Android uygulamasına paketlenir; web sürümü değişmez. Android'e özel kod
yalnızca `src/platform/` altındadır ve `isNative` iken yüklenir (web paketine girmez).

- **Uygulama kimliği:** `com.kaanklcrsln.kalometre` ([capacitor.config.json](capacitor.config.json)). Play'e yüklendikten sonra değiştirilemez.
- **Firebase Android uygulaması:** `1:627999701177:android:a05268f4c7beaafcc04368`. `android/app/google-services.json` repoda yok:
  ```bash
  npx firebase apps:sdkconfig ANDROID 1:627999701177:android:a05268f4c7beaafcc04368 -o android/app/google-services.json
  ```
- **Gereksinim:** Android Studio (JDK 21 ve Android SDK 36 ile gelir).

```bash
npm run android:dev     # web derlemesi (App Check debug sağlayıcısı) + android/ klasörüne kopyala
npm run android:open    # Android Studio'da aç → ▶ Run (emülatör ya da USB'li telefon)
npm run android:build   # mağaza derlemesi (Play Integrity) + kopyala
```

**App Check (Android):** reCAPTCHA WebView'da çalışmaz; token'ı Android'in Play Integrity'si üretir ve
[src/platform/appCheck.ts](src/platform/appCheck.ts) Firebase JS SDK'sına aktarır (Firestore ve KaloAI aynı token'ı kullanır).
- Geliştirme (`android:dev`): debug sağlayıcı. Her kurulum ilk açılışta logcat'e bir secret yazar
  (`adb logcat | grep DebugAppCheckProvider`, Android Studio'da Logcat'te `DebugAppCheckProvider` ara). Bu secret'ı
  Firebase Console → App Check → Apps → Kalometre Android → ⋮ → *Manage debug tokens*'a ekle. Debug APK'yı kimseyle paylaşma.
- Mağaza (`android:build`): Play Integrity. Yalnızca Play üzerinden (iç test dahil) kurulan uygulamada geçer.

**Android davranışları** ([src/platform/android.ts](src/platform/android.ts)): geri tuşu önce açık paneli kapatır, sonra
önceki sayfaya döner, ilk sayfada uygulamadan çıkar; yeni sekmede açılan linkler uygulama içi tarayıcıda açılır;
durum çubuğu simgeleri temaya uyar. Uçtan uca çizim için güvenli alan payları `--safe-top` / `--safe-bottom`
(styles.css); klavye açılınca görünüm küçülür.

**İmzalama anahtarı** (`*.jks`, `keystore.properties`) ve `google-services.json` `.gitignore`'dadır; asla repoya ekleme.

## Ürün kuralları

- **Renkler:** yalnızca 4 renk — Deep Teal `#4E6E58` (olumlu), Brick Red `#BB0A21` (olumsuz), Coffee Bean `#261C15` ve Porcelain `#F7F7F2` (genel). CSS'te [src/styles.css](src/styles.css) `:root` değişkenleri, SVG/grafiklerde [src/config/theme.ts](src/config/theme.ts).
- **Font:** `font/` klasöründeki Rubik değişken fontu (normal + italik), derlemede pakete dahil edilir.
- **Kalori modeli (tek formül):** günlük harcama = bazal × 1,2 + spor. Seçilen hız bir kalori **önerir**: harcama − hız açığı (Acelem yok 3 / Olması gerektiği gibi 4 / Acelem var 6 kg/ay; 1 kg = 7700 kcal, 1 ay = 30 gün). Günlük kaloriyi kullanıcı seçer (onboarding sonu, Ayarlar ya da ana sayfadaki kalem); hedef tarihi her zaman kalan kilo × 7700 / (harcama − günlük kalori) ile hesaplanır. Sonradan değiştirince en son girilen kilo kullanılır.
- **Sağlık tabanı:** günlük kalori kadında 1200, erkekte 1500 kcal'nin altına inmez (18 yaş altında harcamanın altına inmez). Bu tabana inmeden ulaşılamayan hızlar "güvenli değil" olarak kapatılır ve güvenli en yüksek hız gösterilir. Tabanda bile açık yoksa ya da hedef 3 yıldan uzun sürecekse koruma planı önerilir. Hedef VKİ < 18,5 ve 18 yaş altında kilo verme reddedilir.
- **Spor:** her antrenman 1 saat sayılır; harcama = (MET − 1) × kg × gün / 7. MET değerleri [src/config/sports.ts](src/config/sports.ts).
- **Kilit:** yalnızca hedef kilo (yeni plan) hedef tarihine kadar (koruma planında 30 gün) sabittir; kilit bitince Ayarlar → "Yeni plan oluştur". Günlük kalori ve öğünler her zaman değiştirilebilir; öğün 0 olabilir.
- **Sohbet (KaloAI):** Gemini ile sohbet; son 6 mesaj gönderilir, geçmiş yalnızca bellekte tutulur. Her mesaj ve fotoğraf günlük 50 AI hakkından düşer.
- **Sohbetten öğüne ekleme:** yanıt JSON gelir (`reply`, `food`, `kcal`). Kullanıcı yediği bir şeyi anlatırsa (soru sorması sayılmaz) yazı kutusunun üstünde "Öğüne ekleyelim mi?" kutusu çıkar: Sabah / Öğle / Akşam (saate uygun olan vurgulu) ya da ×. Öğün seçilince "Kalorisini biliyorum" paneli ad ve kalori dolu açılır; yalnızca Geri / Devam.
- **Fotoğraftan kalori:** kamera düğmesi (telefonda kamera ya da galeri). Fotoğraf tarayıcıda uzun kenarı 768 px olacak şekilde küçültülür, JPEG'e çevrilir (EXIF/konum silinir), yalnızca Gemini'ye gönderilir ve hiçbir yerde saklanmaz; sonuç aynı ekleme kutusuna düşer.

## Kalo+ (ücretli üyelik) — altyapı hazır, ödeme henüz bağlı değil

- **KaloAI sohbeti** yalnızca Kalo+ üyelerine açık; diğerleri kilit ekranını görür (özellikler, fiyat, "Kilidi aç"). Plan tanımı: [src/config/plans.ts](src/config/plans.ts).
- **Üyelik kaynağı:** `entitlements/{uid}` dokümanı `{ plan: "kalo_plus", status, expiresAtMs, source: "google_play" }`. Kullanıcı yalnızca **okur**; Firestore kuralları istemciden yazmayı tamamen kapatır. Geçerlilik: `status` "active" ya da "grace" ve `expiresAtMs` gelecekte ([src/lib/entitlement.ts](src/lib/entitlement.ts)). Doküman değişince kilit sayfa yenilenmeden açılır/kapanır.
- **Ödeme katmanı:** [src/services/billing.ts](src/services/billing.ts). Şimdilik "yakında" mesajı dönen bir yer tutucu.

### Admin onayıyla Kalo+ (Google Play bağlanana kadar)

"Kilidi aç" → `unlockRequests/{uid}` dokümanına bekleyen istek yazılır. Admin, Ayarlar → **Onay istekleri** ekranından onaylarsa kullanıcıya 30 günlük Kalo+ (`source: "admin"`) verilir ve kilit anında açılır; reddederse kullanıcı yeniden isteyebilir. Admin = Firebase Auth özel yetkisi `admin: true`; Firestore kuralları yalnızca bu yetkiye sahip hesabın onaylamasına ve üyelik yazmasına izin verir.

**Admin hesabı açmak:**

1. Uygulamada normal şekilde üye ol ve onboarding'i bitir (ör. kullanıcı adı `kaan`).
2. Firebase Console → Proje ayarları → **Hizmet hesapları** → **Yeni özel anahtar oluştur** → JSON'u indir. Bu dosya projenin tam yöneticisidir: **proje klasörüne koyma, git'e ekleme, kimseyle paylaşma** (ör. `C:\guvenli\` altına koy; `.gitignore` yine de `*adminsdk*.json` desenini engeller).
3. PowerShell'de:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\guvenli\kalometre-firebase-adminsdk-xxxxx.json"
   npm run admin -- kaan
   ```
4. Uygulamayı yenile; Ayarlar'da **Onay istekleri** görünür. Yetkiyi geri almak için: `npm run admin -- kaan --remove` (en geç 1 saat içinde tamamen düşer).
5. Kuralların gerçek projede güncel olduğundan emin ol: `npm run deploy:rules`.

Emülatörde: `npm run admin -- <kullanıcıadı> --emulator` (anahtar gerekmez).

### Kullanıcı yönetimi (admin)

Proje Spark (ücretsiz) planında olduğu için sunucu fonksiyonu yok; işlemler ikiye ayrılır:

- **Uygulama içinde** (Ayarlar → sağ üstteki profil ikonu, yalnızca admin): onboarding'i bitirmiş kullanıcıları listeler (Kalo+ durumuyla). **Kaldır**: kullanıcının tüm verilerini siler (profil, kilolar, günler, yemek kayıtları, üyelik, istekler, notlar) ve hesabı `disabledUsers/{uid}` ile kilitler; kişi giriş yapınca "Hesabın kaldırıldı" görür ve kurallar yeni profil açmasını engeller. "Kaldırılanlar" listesinden kilit açılabilir (silinen veriler geri gelmez).
- **Bilgisayardan** (Admin SDK, hizmet hesabı anahtarıyla; bkz. yukarıdaki admin adımları):
  ```powershell
  npm run users -- list                                   # tüm giriş hesapları (admin / kaldırıldı / profil yok)
  npm run users -- password <kullanıcıadı> <yeni-şifre>   # şifre değiştir + açık oturumları kapat
  npm run users -- delete <kullanıcıadı>                  # giriş hesabı + tüm veriler (adminler silinemez)
  ```
  Emülatörde sona `--emulator` ekle. Başkasının şifresini değiştirmek ve giriş hesabını tamamen silmek yalnızca bu komutlarla mümkündür.

### Şikayet ve öneri notları

Ayarlar → **Şikayet ve öneri**: kullanıcı günde en fazla 1 not (şikayet/öneri, 3–1000 karakter) gönderir; notlar `notes` koleksiyonuna yazılır ve admin panelinde en yeni 50 not listelenir (admin silebilir). Günde 1 sınırı Firestore kuralında zorunludur: not kimliği `<uid>_<UTC gün numarası>` olmak zorunda ve not güncellenemez; gün Türkiye saatiyle 03:00'te değişir. KaloAI, model/altyapı ya da sağlık dışı sorularda kullanıcıyı buraya yönlendirir.

### Google Play'e bağlarken yapılacaklar

1. Play Console'da `kalo_plus_monthly` aylık abonelik ürünü (200 TL).
2. Capacitor Android sürümünde bir Google Play Billing eklentisiyle `BillingProvider` uygulaması (`getBillingProvider()` bunu döndürmeli).
3. **Cloud Function:** satın alma token'ını Google Play Developer API ile doğrula, aboneliği onayla (acknowledge), Admin SDK ile `entitlements/{uid}` yaz. Yenileme/iptal için Real-time Developer Notifications (Pub/Sub) aynı dokümanı güncellesin.
4. **Sunucu tarafı zorunluluk:** kilit şu an yalnızca arayüzde. Gemini çağrısı istemciden yapıldığı için üye olmayan biri konsoldan yine çağırabilir. Yayından önce KaloAI çağrıları üyeliği kontrol eden bir Cloud Function'ın arkasına alınmalı.

**Emülatörde üye gibi test:** emülatör arayüzünde (http://127.0.0.1:4000/firestore) `entitlements/{kullanıcı uid}` dokümanını elle oluştur: `plan: "kalo_plus"`, `status: "active"`, `expiresAtMs`: gelecekte bir zaman (ms), `source: "google_play"`.

## Avatar

- Tanım: kök dizindeki [avatar/unknown.avatar.json](avatar/unknown.avatar.json) (`@bible-strong/avatar-react`, **AGPL-3.0**). Renkler kodda paletle sabitlenir: gövde Porcelain, gözler Coffee Bean; başarıda gövde Deep Teal ([src/avatar/definition.ts](src/avatar/definition.ts)). JSON'u yeniden dışa aktarırsan dosyanın üzerine yazman yeterli.
- **Kalo sekmesi (KaloAI sohbeti):** alt bardaki sekmenin ikonu avatardır. Sohbet boşken avatar ekranın ortasında durur, yazarken yazı imlecine bakar; ilk mesaj gönderilince kaybolur (sohbet temizlenince ya da mesaj gönderilemezse geri gelir).
- Ana sayfada selamlamanın ("Günaydın, Kaan") sağında görünür. Temel duygusu günün durumuna bağlıdır: kayıt yoksa `idle`, hedef içindeyse `happy`, hedef aşıldıysa `sad`.
- **Tema düğmesi:** avatara tıklayınca (ya da klavyeyle Enter/Boşluk) açık/koyu tema değişir; seçim tarayıcıda saklanır. Açık temada avatar siyah gövde + beyaz göz, koyu temada beyaz gövde + siyah göz. Koyu temada zemin Coffee Bean, yazı Porcelain; yeşil/kırmızı yazılar okunurluk için porselenle açıltılır (kontrast 7:1 ve 4,8:1). Renk tokenları: `--ink` (yazı), `--paper` (zemin), `--positive`, `--negative` ([src/styles.css](src/styles.css), SVG için [src/config/theme.ts](src/config/theme.ts)).
- **İmleç takibi:** fare hareketine ve tıklanan/dokunulan noktaya bakar. Tanıma kodla 45 bakış yönü (`gaze-…` ifadeleri) eklenir, imlecin açısına en yakını seçilir ([src/avatar/gaze.ts](src/avatar/gaze.ts)). İmleç 1,5 sn durursa ekranın duygusuna döner.
- **Giriş tepkisi:** doğru girişten ya da üyelikten sonra ana sayfaya ilk gelişte yeşile dönüp kutlar.
- Duygular = animasyon adları; eşlemeler [src/avatar/moods.ts](src/avatar/moods.ts) içinde. Öncelik: tepki > imleç takibi > ekranın duygusu.
  - Ekranın temel duygusu: `useAvatarMood("happy")`
  - Tıklamaya tepki: `<button {...onTapMood("celebrate")}>`
  - Kod içinden tepki: `useAvatar().react("surprised")`
  - Otomatik: yazı yazarken `listening`, şifre yazarken `shy`, avatara dokununca `laughing`.
- Windows/tarayıcıda "hareketi azalt" açıksa süzülme animasyonu durur (erişilebilirlik).
- Avatar yüklenemezse ya da hata verirse gizlenir; uygulamayı etkilemez. Kodu tembel yüklenir, giriş yapmış kullanıcı indirmez.

## Mimari

```
src/
  config/     firebase.ts (init + App Check + emülatör), ai.ts (model, talimatlar, sınırlar), sports.ts, theme.ts
  services/   auth.ts, db.ts, ai.ts — Firebase'e dokunan TEK katman (Capacitor'a geçişte yalnızca burası değişir)
  lib/        calculations.ts (tüm formüller), username.ts, dates.ts, aiResponse.ts, numbers.ts, validation.ts — saf fonksiyonlar + testler
  hooks/      tüm durum ve mantık (useOnboarding, useAddEntry, useDay, useChat, useSettings, useWeightPage, ...)
  components/ sade, mantıksız görünüm bileşenleri
  pages/      Welcome, Onboarding, Home, AddEntry, Chat, Settings, Weight
```

Görünüm `components/`, `pages/` ve `styles.css`'te; mantık hook'larda.

### Veri modeli notları

- Tarih anahtarları (`yyyy-mm-dd`) kullanıcının yerel saat dilimine göre üretilir.
- Günlük AI istek sayacı `users/{uid}/days/{bugün}.aiRequests` alanında tutulur (istemci tarafı sınır: 50/gün). Kullanıcı kendi dokümanını yazabildiği için bu **kötüye kullanıma karşı gerçek bir koruma değildir**; asıl koruma App Check + AI Logic kotalarıdır.
- `users/{uid}.goal`: `startWeightKg, startDate, targetWeightKg, paceKgPerMonth, targetDate, dailyCalories, mealCalories {breakfast,lunch,dinner} (kcal), lockedUntil`. `profile`: `username, name, sex, birthYear, heightCm, bodyFatPct?, sports [{sportId, daysPerWeek}]`.
- Kayıt toplamı (`totalKcal`) her zaman kodda kalemlerden hesaplanır; Gemini'nin toplamı kullanılmaz. `aiKcal` Gemini kalemlerinin ilk toplamıdır (elle girişte 0).

## Lisanslar ve gizlilik

### Açık kaynak lisansları

- **Avatar:** [`@bible-strong/avatar-react`](https://github.com/smontlouis/bible-strong-avatar-lab) — © Stéphane Montlouis-Calixte, **GNU AGPL-3.0**. Avatar tanımı (`avatar/unknown.avatar.json`) bu projenin araçlarıyla üretildi.
- AGPL-3.0, uygulamayı ağ üzerinden kullanan herkese kaynak koduna erişim sunulmasını gerektirir. Bu yüzden kaynak kod herkese açık tutulur ve uygulamada Ayarlar → **Gizlilik ve açık kaynak** kartından bu depoya bağlantı verilir: https://github.com/kaanklcrsln/Kalometre
- Font: Rubik (SIL Open Font License, `font/OFL.txt`).

### Gizlilik (test sürümü)

Kullanıcılar kilo, boy, yaş ve yemek bilgisi girer; bunlar KVKK kapsamında **özel nitelikli kişisel veri** (sağlık verisi) sayılır.

- Veriler yalnızca kalori planını hesaplamak için kullanılır ve Google Firebase'de, Firestore **eur3 (Avrupa)** bölgesinde saklanır; üçüncü kişilerle paylaşılmaz.
- Yemek ve sohbet metinleri analiz için Firebase AI Logic üzerinden Google Gemini'ye gönderilir.
- Kullanıcıya aydınlatma metni üye olurken kayıt ekranında ve Ayarlar → **Gizlilik ve açık kaynak** kartında gösterilir (metin: [src/config/legal.ts](src/config/legal.ts)).
- Silme talebi: kullanıcı Ayarlar → Şikayet ve Öneri'den ister; admin Firebase Console'dan `users/{uid}` (alt koleksiyonlarıyla), `entitlements/{uid}`, `unlockRequests/{uid}`, kullanıcının `notes` kayıtları ve Authentication'daki hesabı siler.

> Bu bölüm hukuki danışmanlık değildir; herkese açık yayından önce KVKK aydınlatma/açık rıza metinleri bir uzmana gösterilmelidir.
