/* Konfigurasi aplikasi.
   Supabase: URL sudah diisi. Tempel anon key di bawah (Project Settings → Data API
   → "anon public"). Key ini memang dirancang untuk dipakai di kode frontend
   (publik); yang menjaga data adalah Row Level Security di database.
   Selama ANON_KEY masih kosong atau Supabase belum siap, aplikasi otomatis
   memakai bank soal lokal di /data. */
const CONFIG = {
  USE_SUPABASE: true,
  SUPABASE_URL: "https://gxlbvrpgndvbhibgvjyl.supabase.co",
  SUPABASE_ANON_KEY: ""
};
