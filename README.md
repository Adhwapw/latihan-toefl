# TOEFL ITP Practice

Website latihan TOEFL ITP dengan bank soal **orisinal** (ditulis sendiri mengikuti pola TOEFL ITP asli): 140 soal dalam satu paket simulasi penuh.

- **Section 1 — Listening Comprehension**: 50 soal (Part A 30, Part B 8, Part C 12), 35 menit. Audio memakai text-to-speech bawaan browser + transkrip opsional untuk belajar.
- **Section 2 — Structure and Written Expression**: 40 soal (15 Structure + 25 Written Expression), 25 menit.
- **Section 3 — Reading Comprehension**: 50 soal dari 5 teks akademik, 55 menit.

Fitur: timer seperti ujian asli, navigasi soal (palette), mode latihan per section dan simulasi penuh, estimasi skor skala 310–677, pembahasan tiap soal dalam Bahasa Indonesia, dan riwayat latihan di perangkat.

> Skor yang ditampilkan adalah **estimasi kasar** dari jumlah jawaban benar, bukan konversi resmi ETS. Bank soal bersifat orisinal untuk latihan, bukan soal bocoran.

## Struktur proyek

```
index.html            halaman utama (single-page app)
css/style.css         styling
js/
  config.js           konfigurasi (termasuk Supabase)
  data.js             lapisan data (JSON lokal / Supabase)
  quiz.js             mesin kuis: timer, navigasi, penilaian
  results.js          hasil, pembahasan, riwayat
  tts.js              text-to-speech untuk listening
  app.js              router view + beranda
data/
  listening.json      50 soal + naskah
  structure.json      15 soal
  written_expression.json  25 soal
  reading.json        5 teks x 10 soal
supabase/
  schema.sql          tabel questions, attempts, answers (+ RLS)
  supabase-client.js  klien JS untuk mode Supabase
  seed.mjs            skrip impor bank soal ke Supabase
```

## Menjalankan lokal

Butuh HTTP server karena file JSON dimuat via `fetch`:

```bash
cd toefl-itp-practice
python3 -m http.server 8080
# buka http://localhost:8080
```

## Deploy

1. Push folder ini ke repo GitHub (root repo atau subfolder).
2. Hubungkan repo ke Vercel (atau Netlify / GitHub Pages). Ini situs statis, tanpa build step.
3. (Opsional, nanti) hubungkan Supabase, lihat bawah.

## Menghubungkan Supabase

1. Buat proyek gratis di [supabase.com](https://supabase.com).
2. Di SQL Editor, jalankan `supabase/schema.sql` (membuat tabel `questions`, `attempts`, `answers`).
3. Di `js/config.js`, isi `SUPABASE_ANON_KEY` dengan **anon public key** (Project Settings → Data API). Key ini memang dirancang untuk dipakai di kode frontend; RLS yang menjaga datanya.
4. Isi bank soal ke database, pilih salah satu:
   - **Termudah:** buka file `supabase/seed_part1.sql` sampai `seed_part4.sql` di repo, copy isi tiap file, paste ke SQL Editor Supabase, klik Run, berurutan dari part1 ke part4. Tiap part berisi 35 soal.
   - **Via terminal:**
     ```bash
     npm i @supabase/supabase-js
     SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=... node supabase/seed.mjs
     ```
     (`service_role` key ada di halaman Data API yang sama; jangan taruh di kode frontend.)
5. Deploy ulang (otomatis bila repo terhubung ke Vercel).

Catatan: selama `SUPABASE_ANON_KEY` masih kosong atau tabel belum diisi, aplikasi otomatis memakai bank soal lokal di `/data`, jadi tetap jalan.
