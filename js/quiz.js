/* Mesin kuis: memuat section, timer, navigasi, penilaian per section. */
const Quiz = {
  mode: null,
  queue: [],
  sectionIndex: 0,
  bundle: null,
  answers: {},
  current: 0,
  timerId: null,
  remaining: 0,
  results: [],
  startedAt: null,
  _bundles: {},
  _allAnswers: {},

  async start(mode) {
    this.mode = mode;
    this.queue = mode === "full" ? ["listening", "structure", "reading"] : [mode];
    this.sectionIndex = 0;
    this.results = [];
    this._bundles = {};
    this._allAnswers = {};
    this.startedAt = Date.now();
    this.showInterstitial();
  },

  async showInterstitial() {
    const key = this.queue[this.sectionIndex];
    App.showView("view-quiz");
    const quizView = document.getElementById("view-quiz");
    quizView.querySelector(".quiz-topbar").classList.add("hidden");
    quizView.querySelector(".progress-track").classList.add("hidden");
    quizView.querySelector(".quiz-layout").classList.add("hidden");

    let inter = document.getElementById("interstitial-wrap");
    if (!inter) {
      inter = document.createElement("div");
      inter.id = "interstitial-wrap";
      quizView.appendChild(inter);
    }
    inter.classList.remove("hidden");

    const META = {
      listening: { title: "Section 1 — Listening Comprehension", desc: "50 soal · 35 menit · dengarkan naskah lewat tombol audio, lalu jawab.", icon: "headphones" },
      structure: { title: "Section 2 — Structure and Written Expression", desc: "40 soal (15 Structure + 25 Written Expression) · 25 menit.", icon: "pen-line" },
      reading: { title: "Section 3 — Reading Comprehension", desc: "50 soal dari 5 teks bacaan · 55 menit.", icon: "book-open" }
    }[key];

    inter.innerHTML = `
      <div class="interstitial">
        <div class="result-icon"><i data-lucide="${META.icon}"></i></div>
        <h2>${META.title}</h2>
        <p>${META.desc}</p>
        ${this.mode === "full" ? `<p class="muted">Section ${this.sectionIndex + 1} dari ${this.queue.length}</p>` : ""}
        <button class="btn btn-primary btn-lg" id="btn-start-section"><i data-lucide="play"></i> Mulai Section</button>
      </div>`;
    lucide.createIcons();
    document.getElementById("btn-start-section").onclick = () => this.startSection(key);
  },

  async startSection(key) {
    const inter = document.getElementById("interstitial-wrap");
    if (inter) inter.classList.add("hidden");
    const quizView = document.getElementById("view-quiz");
    quizView.querySelector(".quiz-topbar").classList.remove("hidden");
    quizView.querySelector(".progress-track").classList.remove("hidden");
    quizView.querySelector(".quiz-layout").classList.remove("hidden");

    document.getElementById("directions-text").textContent = "";
    document.getElementById("directions-box").classList.remove("open");
    document.getElementById("directions-text").classList.add("hidden");

    this.bundle = await DataLayer.getSectionBundle(key);
    this._bundles[key] = this.bundle;
    this.answers = {};
    this.current = 0;
    document.getElementById("quiz-section-label").textContent = this.bundle.meta.title;
    document.getElementById("directions-text").textContent = this.bundle.meta.directions;
    this.remaining = this.bundle.meta.timeSec;
    this.startTimer();
    this.render();
  },

  startTimer() {
    this.stopTimer();
    this.updateTimerUI();
    this.timerId = setInterval(() => {
      this.remaining--;
      this.updateTimerUI();
      if (this.remaining <= 0) this.finishSection(true);
    }, 1000);
  },

  stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  },

  updateTimerUI() {
    const m = Math.floor(Math.max(0, this.remaining) / 60);
    const s = Math.max(0, this.remaining) % 60;
    document.getElementById("timer-text").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    document.getElementById("timer-pill").classList.toggle("danger", this.remaining <= 300);
  },

  esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  },

  render() {
    const qs = this.bundle.questions;
    const q = qs[this.current];
    const total = qs.length;
    const answered = Object.keys(this.answers).length;
    document.getElementById("progress-fill").style.width = `${(answered / total) * 100}%`;

    // --- kartu soal ---
    const card = document.getElementById("question-card");
    let contextHTML = "";
    if (q.kind === "reading") {
      const paras = q.passageText.split(/\n\n+/).map(p => `<p>${this.esc(p)}</p>`).join("");
      contextHTML = `<div class="context-block passage"><h4>${this.esc(q.passageTitle)}</h4>${paras}</div>`;
    } else if (q.kind === "listening") {
      const audioKey = q.id;
      const playing = TTS.currentKey === audioKey;
      contextHTML = `
        <div class="context-block">
          <div class="audio-row">
            <button class="btn ${playing ? "btn-outline" : "btn-primary"} btn-sm" id="btn-audio">
              <i data-lucide="${playing ? "square" : "play"}"></i> ${playing ? "Berhenti" : "Putar audio"}
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-transcript"><i data-lucide="scroll-text"></i> Transkrip</button>
            <span class="audio-hint">Mode latihan: dibacakan oleh suara perangkat.</span>
          </div>
          <div class="transcript hidden" id="transcript-box">
            ${q.script.map(l => `<p><span class="spk">${this.esc(l.s)}:</span>${this.esc(l.t)}</p>`).join("")}
          </div>
        </div>`;
    } else if (q.kind === "we") {
      const labels = ["A", "B", "C", "D"];
      let sent = "";
      q.tokens.forEach((tok, i) => {
        const mi = q.marks.indexOf(i);
        if (mi >= 0) sent += `<u>${this.esc(tok)}</u><span class="we-label">${labels[mi]}</span>`;
        else sent += this.esc(tok);
      });
      contextHTML = `<div class="context-block"><div class="we-sentence">${sent}</div>
        <p class="audio-hint" style="margin-top:10px">Pilih SATU bagian bergaris bawah yang salah dan harus diperbaiki.</p></div>`;
    }

    let optionsHTML = "";
    if (q.kind === "we") {
      const labels = ["A", "B", "C", "D"];
      optionsHTML = labels.map((lab, i) => {
        const sel = this.answers[q.id] === lab ? " selected" : "";
        return `<button class="option${sel}" data-val="${lab}">
          <span class="opt-key">${lab}</span><span>${this.esc(q.tokens[q.marks[i]])}</span></button>`;
      }).join("");
    } else {
      const letters = ["A", "B", "C", "D"];
      optionsHTML = q.options.map((opt, i) => {
        const sel = this.answers[q.id] === i ? " selected" : "";
        return `<button class="option${sel}" data-val="${i}">
          <span class="opt-key">${letters[i]}</span><span>${this.esc(opt)}</span></button>`;
      }).join("");
    }

    card.innerHTML = `
      <div class="qcard">
        <div class="qcard-head">
          <span class="qnum">Soal ${q.number}</span>
          <span class="qpart">${this.esc(q.partTitle || q.part || "")}</span>
        </div>
        ${contextHTML}
        <div class="qstem">${this.esc(q.stem || "")}</div>
        <div class="options">${optionsHTML}</div>
      </div>`;

    card.querySelectorAll(".option").forEach(btn => {
      btn.onclick = () => {
        const v = btn.dataset.val;
        this.answers[q.id] = q.kind === "we" ? v : parseInt(v, 10);
        this.render();
      };
    });

    const btnAudio = document.getElementById("btn-audio");
    if (btnAudio) {
      btnAudio.onclick = () => {
        if (TTS.currentKey === q.id) TTS.stop();
        else TTS.speak(q.id, q.script);
        this.renderAudioState(q.id);
      };
      TTS.onEnd = (key) => { if (key === q.id) this.renderAudioState(null); };
    }
    const btnTr = document.getElementById("btn-transcript");
    if (btnTr) btnTr.onclick = () => document.getElementById("transcript-box").classList.toggle("hidden");

    // --- palette ---
    const pal = document.getElementById("palette");
    pal.innerHTML = qs.map((qq, i) => {
      const cls = ["pal-btn"];
      if (this.answers[qq.id] !== undefined) cls.push("done");
      if (i === this.current) cls.push("current");
      return `<button class="${cls.join(" ")}" data-i="${i}">${qq.number}</button>`;
    }).join("");
    pal.querySelectorAll(".pal-btn").forEach(b => {
      b.onclick = () => { this.current = parseInt(b.dataset.i, 10); this.render(); };
    });

    document.getElementById("btn-prev").disabled = this.current === 0;
    document.getElementById("btn-next").disabled = this.current === total - 1;
    lucide.createIcons();
  },

  renderAudioState() {
    // Render ulang ringan untuk status tombol audio saja
    const btnAudio = document.getElementById("btn-audio");
    if (!btnAudio) return;
    const q = this.bundle.questions[this.current];
    const playing = TTS.currentKey === q.id;
    btnAudio.className = `btn ${playing ? "btn-outline" : "btn-primary"} btn-sm`;
    btnAudio.innerHTML = `<i data-lucide="${playing ? "square" : "play"}"></i> ${playing ? "Berhenti" : "Putar audio"}`;
    lucide.createIcons();
  },

  goto(d) {
    TTS.stop();
    const total = this.bundle.questions.length;
    this.current = Math.min(total - 1, Math.max(0, this.current + d));
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  askSubmit() {
    const total = this.bundle.questions.length;
    const unanswered = total - Object.keys(this.answers).length;
    document.getElementById("modal-text").textContent = unanswered === 0
      ? "Semua soal sudah dijawab. Yakin selesaikan section ini?"
      : `Masih ada ${unanswered} soal belum dijawab. Yakin selesaikan section ini?`;
    document.getElementById("modal-backdrop").classList.remove("hidden");
  },

  finishSection(auto) {
    this.stopTimer();
    TTS.stop();
    document.getElementById("modal-backdrop").classList.add("hidden");
    const qs = this.bundle.questions;
    let correct = 0;
    qs.forEach(q => { if (this.answers[q.id] !== undefined && this.answers[q.id] === q.answer) correct++; });
    const total = qs.length;
    const scaled = Math.round(31 + (37 * correct) / total);
    this._allAnswers[this.bundle.meta.key] = { ...this.answers };
    this.results.push({
      key: this.bundle.meta.key,
      title: this.bundle.meta.title,
      correct, total,
      pct: Math.round((correct / total) * 100),
      scaled
    });
    this.sectionIndex++;
    if (this.sectionIndex < this.queue.length) {
      this.showInterstitial();
    } else {
      Results.show(this.mode, this.results, this._bundles, this._allAnswers);
    }
  },

  quit() {
    if (!confirm("Keluar dari latihan? Progres section ini akan hilang.")) return;
    this.stopTimer();
    TTS.stop();
    document.getElementById("modal-backdrop").classList.add("hidden");
    App.showView("view-home");
  }
};
