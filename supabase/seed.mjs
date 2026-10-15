// Mengisi tabel `questions` di Supabase dari file /data/*.json.
// Cara pakai:
//   1. npm i @supabase/supabase-js
//   2. Jalankan schema.sql dulu di SQL Editor Supabase.
//   3. node supabase/seed.mjs
//      (butuh SUPABASE_URL dan SUPABASE_SERVICE_KEY sebagai env var)
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) {
  console.error("Set SUPABASE_URL dan SUPABASE_SERVICE_KEY dulu.");
  process.exit(1);
}
const db = createClient(URL, KEY);
const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), "utf8"));

const rows = [];
let order = 0;

// Listening: gabungkan part A/B/C menjadi baris per soal
{
  const raw = load("listening");
  for (const part of raw.parts) {
    for (const item of part.items) {
      if (item.question) {
        rows.push({ section: "listening", part: part.part, sort_order: order++, payload: item });
      } else {
        for (const q of item.questions) {
          rows.push({
            section: "listening", part: part.part, sort_order: order++,
            payload: { ...q, script: item.script, scriptId: item.id }
          });
        }
      }
    }
  }
}
// Structure + Written Expression -> section 'structure'
{
  const s = load("structure");
  for (const q of s.questions) rows.push({ section: "structure", part: "Structure", sort_order: order++, payload: q });
  const w = load("written_expression");
  for (const q of w.questions) rows.push({ section: "structure", part: "Written Expression", sort_order: order++, payload: q });
}
// Reading
{
  const raw = load("reading");
  for (const p of raw.passages) {
    for (const q of p.questions) {
      rows.push({
        section: "reading", part: "Reading", sort_order: order++,
        payload: { ...q, passageId: p.id, passageTitle: p.title, passageText: p.text }
      });
    }
  }
}

console.log(`Menyiapkan ${rows.length} soal...`);
const { error } = await db.from("questions").insert(rows);
if (error) { console.error("Gagal:", error.message); process.exit(1); }
console.log("Berhasil: bank soal masuk ke Supabase.");
