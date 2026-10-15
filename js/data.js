/* Lapisan data: memuat bank soal.
   Saat ini dari JSON lokal. Jika CONFIG.USE_SUPABASE true, baca dari Supabase
   (tabel questions). Lihat supabase/schema.sql dan README.md. */
const DataLayer = {
  async loadJSON(name) {
    const res = await fetch(`data/${name}.json`);
    if (!res.ok) throw new Error(`Gagal memuat data/${name}.json`);
    return res.json();
  },

  async loadSupabase(section) {
    const { data, error } = await SupabaseDB.client
      .from("questions")
      .select("payload, sort_order")
      .eq("section", section)
      .order("sort_order");
    if (error) throw error;
    return data.map(r => r.payload);
  },

  async getSectionBundle(key) {
    // Mengembalikan { meta, questions[] } yang sudah dinormalisasi dan bernomor urut.
    if (CONFIG.USE_SUPABASE && window.SupabaseDB) {
      return SupabaseDB.getSectionBundle(key);
    }
    if (key === "listening") return normalizeListening(await this.loadJSON("listening"));
    if (key === "structure") return normalizeStructure(await this.loadJSON("structure"), await this.loadJSON("written_expression"));
    if (key === "reading") return normalizeReading(await this.loadJSON("reading"));
    throw new Error("Section tidak dikenal: " + key);
  }
};

function normalizeListening(raw) {
  const questions = [];
  let n = 0;
  for (const part of raw.parts) {
    for (const item of part.items) {
      if (item.question) {
        // Part A: satu soal per item
        n++;
        questions.push({
          id: item.id, number: n, kind: "listening", part: part.part,
          partTitle: part.title, script: item.script,
          stem: item.question, options: item.options,
          answer: item.answer, explanation: item.explanation
        });
      } else {
        // Part B/C: beberapa soal berbagi satu naskah
        for (const q of item.questions) {
          n++;
          questions.push({
            id: q.id, number: n, kind: "listening", part: part.part,
            partTitle: part.title, script: item.script, scriptId: item.id,
            stem: q.question, options: q.options,
            answer: q.answer, explanation: q.explanation
          });
        }
      }
    }
  }
  return {
    meta: { key: "listening", title: "Section 1 — Listening Comprehension", timeSec: raw.time_limit_sec || 2100, directions: raw.directions },
    questions
  };
}

function normalizeStructure(structRaw, weRaw) {
  const questions = [];
  let n = 0;
  for (const q of structRaw.questions) {
    n++;
    questions.push({
      id: q.id, number: n, kind: "mcq", part: "Structure",
      stem: q.stem, options: q.options, answer: q.answer,
      explanation: q.explanation, topic: q.topic
    });
  }
  for (const q of weRaw.questions) {
    n++;
    questions.push({
      id: q.id, number: n, kind: "we", part: "Written Expression",
      tokens: q.tokens, marks: q.marks, answer: q.answer,
      explanation: q.explanation, topic: q.topic
    });
  }
  return {
    meta: { key: "structure", title: "Section 2 — Structure and Written Expression", timeSec: structRaw.time_limit_sec || 1500, directions: structRaw.directions + " " + weRaw.directions },
    questions
  };
}

function normalizeReading(raw) {
  const questions = [];
  let n = 0;
  for (const p of raw.passages) {
    for (const q of p.questions) {
      n++;
      questions.push({
        id: q.id, number: n, kind: "reading", part: "Reading",
        passageId: p.id, passageTitle: p.title, passageText: p.text,
        stem: q.stem, options: q.options, answer: q.answer,
        explanation: q.explanation, qtype: q.type
      });
    }
  }
  return {
    meta: { key: "reading", title: "Section 3 — Reading Comprehension", timeSec: raw.time_limit_sec || 3300, directions: raw.directions },
    questions
  };
}
