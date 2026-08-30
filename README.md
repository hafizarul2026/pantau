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

## Deploy ke Cloudflare Workers

App ini menggunakan adapter OpenNext (`@opennextjs/cloudflare`).

### Dari komputer sendiri

```bash
npm install
npx wrangler login
npm run deploy
```

### Dari GitHub (automatik)

1. Di [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages), pilih **Import a repository** dan pilih repo `pantau`.
2. Production branch: `main`.
3. Atau simpan secret GitHub supaya workflow `.github/workflows/deploy-cloudflare.yml` berjalan:
   - `CLOUDFLARE_API_TOKEN` — token dengan kebenaran *Workers Scripts:Edit*, *Account:Read*, dan *Zone:Edit* (supaya Custom Domain `pantau.hafizarul.my` boleh diikat)
   - `CLOUDFLARE_ACCOUNT_ID` — ID akaun Cloudflare

Selepas deploy dari akaun yang memiliki zon `hafizarul.my`, Pantau akan hidup di [https://pantau.hafizarul.my](https://pantau.hafizarul.my).

`wrangler.jsonc` sudah ikat `pantau.hafizarul.my` sebagai Custom Domain. Cloudflare akan cipta rekod DNS dan sijil SSL sendiri — pastikan tiada CNAME lama pada subdomain itu sebelum deploy.
