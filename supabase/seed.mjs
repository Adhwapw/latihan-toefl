// Mengisi tabel `questions` di Supabase dari file /data/*.json.
// Payload yang disimpan SUDAH dinormalisasi dengan bentuk yang sama persis
// seperti keluaran js/data.js (field number diisi saat dibaca, urut sort_order).
// Cara pakai:
//   1. npm i @supabase/supabase-js
//   2. Jalankan supabase/schema.sql dulu di SQL Editor Supabase.
//   3. SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=... node supabase/seed.mjs
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

// Listening — samakan dengan normalizeListening di js/data.js
{
  const raw = load("listening");
  for (const part of raw.parts) {
    for (const item of part.items) {
      const base = { kind: "listening", part: part.part, partTitle: part.title, script: item.script };
      if (item.question) {
        rows.push({ section: "listening", part: part.part, sort_order: order++,
          payload: { ...base, id: item.id, stem: item.question, options: item.options,
                     answer: item.answer, explanation: item.explanation } });
      } else {
        for (const q of item.questions) {
          rows.push({ section: "listening", part: part.part, sort_order: order++,
            payload: { ...base, id: q.id, scriptId: item.id, stem: q.question, options: q.options,
                       answer: q.answer, explanation: q.explanation } });
        }
      }
    }
  }
}
// Structure + Written Expression — samakan dengan normalizeStructure di js/data.js
{
  const s = load("structure");
  for (const q of s.questions) {
    rows.push({ section: "structure", part: "Structure", sort_order: order++,
      payload: { id: q.id, kind: "mcq", part: "Structure", stem: q.stem, options: q.options,
                 answer: q.answer, explanation: q.explanation, topic: q.topic } });
  }
  const w = load("written_expression");
  for (const q of w.questions) {
    rows.push({ section: "structure", part: "Written Expression", sort_order: order++,
      payload: { id: q.id, kind: "we", part: "Written Expression", tokens: q.tokens, marks: q.marks,
                 answer: q.answer, explanation: q.explanation, topic: q.topic } });
  }
}
// Reading — samakan dengan normalizeReading di js/data.js
{
  const raw = load("reading");
  for (const p of raw.passages) {
    for (const q of p.questions) {
      rows.push({ section: "reading", part: "Reading", sort_order: order++,
        payload: { id: q.id, kind: "reading", part: "Reading", passageId: p.id, passageTitle: p.title,
                   passageText: p.text, stem: q.stem, options: q.options,
                   answer: q.answer, explanation: q.explanation, qtype: q.type } });
    }
  }
}

console.log(`Menyiapkan ${rows.length} soal...`);
const { error } = await db.from("questions").insert(rows);
if (error) { console.error("Gagal:", error.message); process.exit(1); }
console.log("Berhasil: bank soal masuk ke Supabase.");
