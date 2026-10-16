/* Konfigurasi aplikasi.
   Supabase aktif: bank soal dibaca dari tabel `questions`, hasil latihan
   disimpan ke `attempts`/`answers`. Key di bawah adalah publishable key yang
   memang dirancang untuk dipakai di kode frontend (publik); yang menjaga
   data adalah Row Level Security di database.
   Kalau Supabase tidak bisa dijangkau, aplikasi otomatis memakai
   bank soal lokal di /data. */
const CONFIG = {
  USE_SUPABASE: true,
  SUPABASE_URL: "https://gxlbvrpgndvbhibgvjyl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_5xENYtt8ctQbJhD7HWrBkA_2M1qj1U6"
};
