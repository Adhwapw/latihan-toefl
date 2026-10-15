/* Klien Supabase untuk TOEFL ITP Practice.
   Dipakai hanya jika CONFIG.USE_SUPABASE = true di js/config.js.
   Tambahkan di index.html SEBELUM js/data.js:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="supabase/supabase-client.js"></script>
*/
const SupabaseDB = {
  client: null,

  init() {
    if (!window.supabase) throw new Error("Supabase JS belum dimuat. Tambahkan script CDN-nya di index.html.");
    this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  },

  // Mengembalikan { meta, questions[] } dengan format yang sama seperti DataLayer lokal.
  async getSectionBundle(key) {
    if (!this.client) this.init();
    const { data, error } = await this.client
      .from("questions")
      .select("payload")
      .eq("section", key)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const questions = data.map((r, i) => ({ ...r.payload, number: i + 1 }));
    const META = {
      listening: {
        key: "listening",
        title: "Section 1 — Listening Comprehension",
        timeSec: 2100,
        directions: "Directions: In this section you will hear conversations and talks. Each will be followed by questions. Choose the best answer to each question."
      },
      structure: {
        key: "structure",
        title: "Section 2 — Structure and Written Expression",
        timeSec: 1500,
        directions: "Directions: Questions 1-15 are incomplete sentences. Choose the one word or phrase that best completes the sentence. In questions 16-40, identify the one underlined word or phrase that must be changed in order for the sentence to be correct."
      },
      reading: {
        key: "reading",
        title: "Section 3 — Reading Comprehension",
        timeSec: 3300,
        directions: "Directions: In this section you will read several passages. Each one is followed by a number of questions about it. Choose the one best answer to each question."
      }
    };
    return { meta: META[key], questions };
  },

  // Menyimpan hasil latihan. Dipanggil dari Results.saveHistory saat USE_SUPABASE true.
  async saveAttempt(mode, total, sectionResults, perQuestion) {
    if (!this.client) this.init();
    const { data: attempt, error } = await this.client
      .from("attempts")
      .insert({
        mode,
        total_score: total,
        section_scores: sectionResults,
        finished_at: new Date().toISOString()
      })
      .select("id")
      .single();
    if (error) throw error;
    if (perQuestion && perQuestion.length) {
      const rows = perQuestion.map(q => ({
        attempt_id: attempt.id,
        question_ref: q.id,
        selected: q.selected === undefined ? null : q.selected,
        is_correct: q.selected !== undefined && q.selected === q.answer
      }));
      const { error: err2 } = await this.client.from("answers").insert(rows);
      if (err2) throw err2;
    }
    return attempt.id;
  }
};

window.SupabaseDB = SupabaseDB;
