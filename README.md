# Pantau

Papan tugasan untuk kerja **harian, mingguan dan bulanan**. Tanda status (belum mula, sedang dibuat, selesai, lewat), terima peringatan setiap hari, dan semak emel belum dibaca.

Peti yang disemak: **`mohd_hafizarul@moh.gov.my` sahaja**. Emel akaun lain ditapis dan tidak dipaparkan.

## Apa yang ada

- Paparan **Hari ini**, **Minggu ini** (jalur 7 hari) dan **Bulan ini** (kalendar)
- Status: belum mula, sedang dibuat, selesai — lewat dikira automatik bila tarikh sudah lalu
- Cadangan langkah untuk selesaikan tugasan yang dipilih
- Panel emel belum dibaca, dengan butang jadikan tugasan
- Peringatan harian: emel belum dibaca + tugasan belum siap + yang lewat
- Data tugasan disimpan dalam pelayar (localStorage)

Emel dalam demo ini ialah sampel peti kerja MOH. Sambungan Gmail sebenar belum diaktifkan dalam persekitaran ini.

## Jalankan secara tempatan

```bash
npm install
npm run dev
```

Buka [http://127.0.0.1:43147](http://127.0.0.1:43147).

```bash
npm run build
npm start
```

## GitHub

Repo: [github.com/hafizarul2026/pantau](https://github.com/hafizarul2026/pantau)

## Deploy ke Vercel

Pantau ialah aplikasi Next.js. Cara paling cepat:

1. Buka [Import ke Vercel](https://vercel.com/new/clone?repository-url=https://github.com/hafizarul2026/pantau)
2. Pilih akaun GitHub `hafizarul2026` dan repo `pantau`
3. Framework Preset: **Next.js** — biarkan Build Command `next build`
4. Deploy

Atau dari komputer sendiri:

```bash
npm install
npx vercel login
npx vercel --prod
```

Selepas deploy, Vercel akan berikan URL seperti `https://pantau.vercel.app`. Domain tersuai (contoh `pantau.hafizarul.my`) boleh ditambah di Project → Settings → Domains.
